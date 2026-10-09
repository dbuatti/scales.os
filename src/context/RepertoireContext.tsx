import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRepertoireData, SavedDocument } from '@/hooks/use-repertoire-data';
import { PageMapping, findMappingForExercise, sortMappings } from '@/lib/repertoire';

export interface RepertoireNavigation {
  docId: string;
  page: number;
  exerciseId?: string;
  nonce: number;
}

export interface ExerciseLocation {
  document: SavedDocument;
  mapping: PageMapping;
}

interface RepertoireContextValue {
  userId: string | null;
  documents: SavedDocument[];
  isLoadingDocuments: boolean;
  isCloudEnabled: boolean;
  refresh: () => Promise<void>;
  uploadDocument: ReturnType<typeof useRepertoireData>['uploadDocument'];
  deleteDocument: (doc: SavedDocument) => Promise<void>;
  getSignedUrl: (doc: SavedDocument) => Promise<string>;
  fetchMappings: (documentId: string) => Promise<PageMapping[]>;
  saveMappings: (documentId: string, mappings: PageMapping[]) => Promise<void>;
  updateLastViewedPage: (documentId: string, page: number) => Promise<void>;
  updatePageCount: (documentId: string, pageCount: number) => Promise<void>;

  mappingsByDocument: Record<string, PageMapping[]>;
  registerMappings: (documentId: string, mappings: PageMapping[]) => void;
  findExerciseLocation: (exerciseId: string) => ExerciseLocation | null;
  hasMappingForExercise: (exerciseId: string) => boolean;
  hasMappingsForSource: (source: 'hanon' | 'dohnanyi') => boolean;

  pendingNavigation: RepertoireNavigation | null;
  openExercise: (exerciseId: string) => boolean;
  openDocument: (documentId: string, page?: number) => void;
  consumeNavigation: () => void;
}

const RepertoireContext = createContext<RepertoireContextValue | null>(null);

export const RepertoireProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const data = useRepertoireData();
  const { documents, fetchMappings } = data;
  const [mappingsByDocument, setMappingsByDocument] = useState<Record<string, PageMapping[]>>({});
  const [pendingNavigation, setPendingNavigation] = useState<RepertoireNavigation | null>(null);
  const indexedRef = useRef<Set<string>>(new Set());

  const registerMappings = useCallback((documentId: string, mappings: PageMapping[]) => {
    setMappingsByDocument((prev) => ({ ...prev, [documentId]: sortMappings(mappings) }));
  }, []);

  // Build an exercise -> page index across every document so panels can deep-link.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const doc of documents) {
        if (indexedRef.current.has(doc.id)) continue;
        indexedRef.current.add(doc.id);
        const mappings = await fetchMappings(doc.id);
        if (cancelled) return;
        registerMappings(doc.id, mappings);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [documents, fetchMappings, registerMappings]);

  const findExerciseLocation = useCallback(
    (exerciseId: string): ExerciseLocation | null => {
      if (!exerciseId) return null;
      for (const doc of data.documents) {
        const mappings = mappingsByDocument[doc.id];
        if (!mappings) continue;
        const mapping = findMappingForExercise(mappings, exerciseId);
        if (mapping) return { document: doc, mapping };
      }
      return null;
    },
    [data.documents, mappingsByDocument],
  );

  const hasMappingForExercise = useCallback(
    (exerciseId: string) => Boolean(findExerciseLocation(exerciseId)),
    [findExerciseLocation],
  );

  const hasMappingsForSource = useCallback(
    (source: 'hanon' | 'dohnanyi') => {
      const prefix = `${source === 'hanon' ? 'Hanon-' : 'Dohnanyi-'}`;
      return Object.values(mappingsByDocument).some((mappings) =>
        mappings.some((m) => m.exerciseId.startsWith(prefix)),
      );
    },
    [mappingsByDocument],
  );

  const openExercise = useCallback(
    (exerciseId: string) => {
      const location = findExerciseLocation(exerciseId);
      if (!location) return false;
      setPendingNavigation({
        docId: location.document.id,
        page: location.mapping.pageStart,
        exerciseId,
        nonce: Date.now(),
      });
      return true;
    },
    [findExerciseLocation],
  );

  const openDocument = useCallback(
    (documentId: string, page?: number) => {
      const doc = data.documents.find((d) => d.id === documentId);
      setPendingNavigation({
        docId: documentId,
        page: page ?? doc?.last_viewed_page ?? 1,
        nonce: Date.now(),
      });
    },
    [data.documents],
  );

  const consumeNavigation = useCallback(() => setPendingNavigation(null), []);

  const value = useMemo<RepertoireContextValue>(
    () => ({
      userId: data.userId,
      documents: data.documents,
      isLoadingDocuments: data.isLoadingDocuments,
      isCloudEnabled: data.isCloudEnabled,
      refresh: data.refresh,
      uploadDocument: data.uploadDocument,
      deleteDocument: data.deleteDocument,
      getSignedUrl: data.getSignedUrl,
      fetchMappings: data.fetchMappings,
      saveMappings: data.saveMappings,
      updateLastViewedPage: data.updateLastViewedPage,
      updatePageCount: data.updatePageCount,
      mappingsByDocument,
      registerMappings,
      findExerciseLocation,
      hasMappingForExercise,
      hasMappingsForSource,
      pendingNavigation,
      openExercise,
      openDocument,
      consumeNavigation,
    }),
    [
      data.userId,
      data.documents,
      data.isLoadingDocuments,
      data.isCloudEnabled,
      data.refresh,
      data.uploadDocument,
      data.deleteDocument,
      data.getSignedUrl,
      data.fetchMappings,
      data.saveMappings,
      data.updateLastViewedPage,
      data.updatePageCount,
      mappingsByDocument,
      registerMappings,
      findExerciseLocation,
      hasMappingForExercise,
      hasMappingsForSource,
      pendingNavigation,
      openExercise,
      openDocument,
      consumeNavigation,
    ],
  );

  return <RepertoireContext.Provider value={value}>{children}</RepertoireContext.Provider>;
};

export const useRepertoire = (): RepertoireContextValue => {
  const ctx = useContext(RepertoireContext);
  if (!ctx) throw new Error('useRepertoire must be used within a RepertoireProvider');
  return ctx;
};
