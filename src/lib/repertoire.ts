import {
  HANON_EXERCISES,
  ALL_DOHNANYI_ITEMS,
  getHanonExerciseBaseId,
} from '@/lib/scales';

export type RepertoireMode = 'technical' | 'repertoire';

export interface PageMapping {
  id: string;
  pageStart: number;
  pageEnd: number;
  exerciseId: string;
  label: string;
  targetBpm: number;
  timeSignature: string;
  mode: RepertoireMode;
}

export interface ExerciseOption {
  id: string;
  label: string;
  source: 'hanon' | 'dohnanyi' | 'custom';
}

export const TIME_SIGNATURES = ['2/4', '3/4', '4/4', '6/8', '3/8', '12/8'] as const;

export const getBeatsPerMeasure = (timeSignature: string): number => {
  const [beats] = timeSignature.split('/');
  const parsed = parseInt(beats, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 4;
};

export const buildExerciseOptions = (): ExerciseOption[] => {
  const hanon: ExerciseOption[] = HANON_EXERCISES.map((name) => ({
    id: getHanonExerciseBaseId(name),
    label: name,
    source: 'hanon',
  }));
  const dohnanyi: ExerciseOption[] = ALL_DOHNANYI_ITEMS.map((item) => ({
    id: item.id,
    label: item.name,
    source: 'dohnanyi',
  }));
  return [...hanon, ...dohnanyi];
};

export const EXERCISE_OPTIONS = buildExerciseOptions();

export const getMappingForPage = (
  mappings: PageMapping[],
  page: number,
): PageMapping | undefined =>
  mappings.find((m) => page >= m.pageStart && page <= m.pageEnd);

export const findMappingForExercise = (
  mappings: PageMapping[],
  exerciseId: string,
): PageMapping | undefined =>
  exerciseId ? mappings.find((m) => m.exerciseId === exerciseId) : undefined;

export const sortMappings = (mappings: PageMapping[]): PageMapping[] =>
  [...mappings].sort((a, b) => a.pageStart - b.pageStart);

const STORAGE_PREFIX = 'scales.os.repertoire.mappings.';
const LAST_DOCUMENT_KEY = 'scales.os.repertoire.lastDocument';

export const getLastOpenedDocumentId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(LAST_DOCUMENT_KEY);
  } catch {
    return null;
  }
};

export const setLastOpenedDocumentId = (documentId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_DOCUMENT_KEY, documentId);
  } catch {
    // Storage may be unavailable (private mode / quota); ignore.
  }
};

export const clearLastOpenedDocumentId = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LAST_DOCUMENT_KEY);
  } catch {
    // Ignore.
  }
};

export const loadMappings = (documentId: string): PageMapping[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${documentId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PageMapping[]) : [];
  } catch {
    return [];
  }
};

export const saveMappings = (documentId: string, mappings: PageMapping[]): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${documentId}`,
      JSON.stringify(sortMappings(mappings)),
    );
  } catch {
    // Storage may be unavailable (private mode / quota); ignore.
  }
};

export const createMappingId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `map-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const createEmptyMapping = (page: number): PageMapping => ({
  id: createMappingId(),
  pageStart: page,
  pageEnd: page,
  exerciseId: '',
  label: '',
  targetBpm: 60,
  timeSignature: '4/4',
  mode: 'technical',
});

export const MODE_LABELS: Record<RepertoireMode, string> = {
  technical: 'Technical',
  repertoire: 'Repertoire',
};
