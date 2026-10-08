import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import {
  PageMapping,
  RepertoireMode,
  loadMappings as loadLocalMappings,
  saveMappings as saveLocalMappings,
} from '@/lib/repertoire';

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
            title: file.name,
            mode,
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
      return (data as PageMappingRow[]).map(rowToMapping);
    },
    [userId],
  );

  const saveMappings = useCallback(
    async (documentId: string, next: PageMapping[]): Promise<void> => {
      saveLocalMappings(documentId, next);
      if (!userId) return;
      await supabase
        .from('pdf_page_mappings')
        .delete()
        .eq('document_id', documentId)
        .eq('user_id', userId);
      if (next.length === 0) return;
      await supabase.from('pdf_page_mappings').insert(
        next.map((m) => ({
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
      await supabase
        .from('pdf_documents')
        .update({ last_viewed_page: page })
        .eq('id', documentId)
        .eq('user_id', userId);
      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? { ...d, last_viewed_page: page } : d)),
      );
    },
    [userId],
  );

  const updatePageCount = useCallback(
    async (documentId: string, pageCount: number): Promise<void> => {
      if (!userId) return;
      await supabase
        .from('pdf_documents')
        .update({ page_count: pageCount })
        .eq('id', documentId)
        .eq('user_id', userId);
      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? { ...d, page_count: pageCount } : d)),
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
