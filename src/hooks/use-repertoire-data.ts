import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import {
  PageMapping,
  RepertoireMode,
  loadMappings as loadLocalMappings,
  saveMappings as saveLocalMappings,
} from '@/lib/repertoire';
import { validatePdfFile } from '@/lib/validation/pdf';
import { parseOrThrow, safeParse } from '@/lib/validation/parse';
import {
  MAX_TITLE_LENGTH,
  documentTitleSchema,
  pageCountSchema,
  pageMappingListSchema,
  pageMappingRowSchema,
  pageNumberSchema,
  repertoireModeSchema,
} from '@/lib/validation/schemas';

export const REPERTOIRE_BUCKET = 'practice-pdfs';

export interface SavedDocument {
  id: string;
  user_id: string;
  title: string;
  mode: RepertoireMode;
  storage_path: string;
  page_count: number;
  last_viewed_page: number;
  created_at: string;
}

interface PageMappingRow {
  id: string;
  page_start: number;
  page_end: number;
  exercise_id: string;
  label: string;
  target_bpm: number;
  time_signature: string;
  mode: string;
}

const rowToMapping = (row: PageMappingRow): PageMapping => ({
  id: row.id,
  pageStart: row.page_start,
  pageEnd: row.page_end,
  exerciseId: row.exercise_id,
  label: row.label,
  targetBpm: row.target_bpm,
  timeSignature: row.time_signature,
  mode: row.mode as RepertoireMode,
});

export const useRepertoireData = () => {
  const { userId } = useSupabaseSession();
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setDocuments([]);
      return;
    }
    setIsLoadingDocuments(true);
    const { data, error } = await supabase
      .from('pdf_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setDocuments(data as SavedDocument[]);
    }
    setIsLoadingDocuments(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const uploadDocument = useCallback(
    async (file: File, mode: RepertoireMode): Promise<SavedDocument> => {
      if (!userId) throw new Error('You must be signed in to upload.');

      const fileCheck = await validatePdfFile(file);
      if (!fileCheck.ok) throw new Error(fileCheck.reason);

      const safeMode = parseOrThrow(
        repertoireModeSchema,
        mode,
        'Invalid document mode',
      );
      const titleResult = safeParse(documentTitleSchema, file.name);
      const title = titleResult.success
        ? titleResult.data
        : file.name.slice(0, MAX_TITLE_LENGTH) || 'Untitled document';

      const documentId = crypto.randomUUID();
      const path = `${userId}/${documentId}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from(REPERTOIRE_BUCKET)
        .upload(path, file, { contentType: 'application/pdf', upsert: false });
      if (uploadError) throw uploadError;

      try {
        const { data, error } = await supabase
          .from('pdf_documents')
          .insert({
            id: documentId,
            user_id: userId,
            title,
            mode: safeMode,
            storage_path: path,
            page_count: 0,
            last_viewed_page: 1,
          })
          .select('*')
          .single();
        if (error) throw error;

        const saved = data as SavedDocument;
        setDocuments((prev) => [saved, ...prev]);
        return saved;
      } catch (err) {
        const { error: removeError } = await supabase.storage
          .from(REPERTOIRE_BUCKET)
          .remove([path]);
        if (removeError) {
          console.error('Failed to clean up orphaned PDF after record insert failed:', removeError.message);
        }
        throw err;
      }
    },
    [userId],
  );

  const deleteDocument = useCallback(
    async (doc: SavedDocument) => {
      if (!userId) return;
      const { error: dbError } = await supabase
        .from('pdf_documents')
        .delete()
        .eq('id', doc.id)
        .eq('user_id', userId);
      if (dbError) {
        console.error('Failed to delete document record:', dbError.message);
        return;
      }
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      const { error: storageError } = await supabase.storage
        .from(REPERTOIRE_BUCKET)
        .remove([doc.storage_path]);
      if (storageError) {
        console.error('Failed to remove PDF from storage:', storageError.message);
      }
    },
    [userId],
  );

  const getSignedUrl = useCallback(async (doc: SavedDocument): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(REPERTOIRE_BUCKET)
      .createSignedUrl(doc.storage_path, 60 * 60);
    if (error) throw error;
    return data.signedUrl;
  }, []);

  const fetchMappings = useCallback(
    async (documentId: string): Promise<PageMapping[]> => {
      if (!userId) return loadLocalMappings(documentId);
      const { data, error } = await supabase
        .from('pdf_page_mappings')
        .select('*')
        .eq('document_id', documentId)
        .eq('user_id', userId)
        .order('page_start', { ascending: true });
      if (error || !data) return loadLocalMappings(documentId);
      return (data as unknown[])
        .map((row) => {
          const parsed = safeParse(pageMappingRowSchema, row);
          return parsed.success ? rowToMapping(parsed.data) : null;
        })
        .filter((mapping): mapping is PageMapping => mapping !== null);
    },
    [userId],
  );

  const saveMappings = useCallback(
    async (documentId: string, next: PageMapping[]): Promise<void> => {
      const validated = parseOrThrow(
        pageMappingListSchema,
        next,
        'Invalid page mappings',
      ) as PageMapping[];
      saveLocalMappings(documentId, validated);
      if (!userId) return;
      await supabase
        .from('pdf_page_mappings')
        .delete()
        .eq('document_id', documentId)
        .eq('user_id', userId);
      if (validated.length === 0) return;
      await supabase.from('pdf_page_mappings').insert(
        validated.map((m) => ({
          user_id: userId,
          document_id: documentId,
          page_start: m.pageStart,
          page_end: m.pageEnd,
          exercise_id: m.exerciseId,
          label: m.label,
          target_bpm: m.targetBpm,
          time_signature: m.timeSignature,
          mode: m.mode,
        })),
      );
    },
    [userId],
  );

  const updateLastViewedPage = useCallback(
    async (documentId: string, page: number): Promise<void> => {
      if (!userId) return;
      const safePage = parseOrThrow(pageNumberSchema, page, 'Invalid page number');
      await supabase
        .from('pdf_documents')
        .update({ last_viewed_page: safePage })
        .eq('id', documentId)
        .eq('user_id', userId);
      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? { ...d, last_viewed_page: safePage } : d)),
      );
    },
    [userId],
  );

  const updatePageCount = useCallback(
    async (documentId: string, pageCount: number): Promise<void> => {
      if (!userId) return;
      const safeCount = parseOrThrow(pageCountSchema, pageCount, 'Invalid page count');
      await supabase
        .from('pdf_documents')
        .update({ page_count: safeCount })
        .eq('id', documentId)
        .eq('user_id', userId);
      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? { ...d, page_count: safeCount } : d)),
      );
    },
    [userId],
  );

  const isCloudEnabled = useMemo(() => Boolean(userId), [userId]);

  return {
    userId,
    documents,
    isLoadingDocuments,
    isCloudEnabled,
    refresh,
    uploadDocument,
    deleteDocument,
    getSignedUrl,
    fetchMappings,
    saveMappings,
    updateLastViewedPage,
    updatePageCount,
  };
};
