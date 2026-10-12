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
): PageMapping | undefined => {
  // A page can belong to more than one exercise (the tail of one and the start
  // of the next). Prefer the mapping whose start page is closest to `page`, so
  // the exercise that actually begins on this page wins.
  let best: PageMapping | undefined;
  for (const mapping of mappings) {
    if (page >= mapping.pageStart && page <= mapping.pageEnd) {
      if (!best || mapping.pageStart > best.pageStart) best = mapping;
    }
  }
  return best;
};

export const findMappingForExercise = (
  mappings: PageMapping[],
  exerciseId: string,
): PageMapping | undefined =>
  exerciseId ? mappings.find((m) => m.exerciseId === exerciseId) : undefined;

export interface MappingOverlap {
  otherId: string;
  label: string;
  pages: number[];
}

export const getMappingOverlaps = (
  mapping: PageMapping,
  all: PageMapping[],
): MappingOverlap[] => {
  const overlaps: MappingOverlap[] = [];
  for (const other of all) {
    if (other.id === mapping.id) continue;
    const start = Math.max(mapping.pageStart, other.pageStart);
    const end = Math.min(mapping.pageEnd, other.pageEnd);
    if (start > end) continue;
    const pages: number[] = [];
    for (let page = start; page <= end; page += 1) pages.push(page);
    overlaps.push({
      otherId: other.id,
      label: other.label || other.exerciseId || `Page ${other.pageStart}`,
      pages,
    });
  }
  return overlaps;
};

export const sortMappings = (mappings: PageMapping[]): PageMapping[] =>
  [...mappings].sort((a, b) => a.pageStart - b.pageStart);

export const suggestNextExercise = (
  mappings: PageMapping[],
  options: ExerciseOption[],
): ExerciseOption | null => {
  const mappedIds = new Set(mappings.map((m) => m.exerciseId).filter(Boolean));
  const lastMapped = [...mappings].reverse().find((m) => m.exerciseId);
  const source: ExerciseOption['source'] = lastMapped?.exerciseId?.startsWith('Dohnanyi-')
    ? 'dohnanyi'
    : 'hanon';
  return options.find((o) => o.source === source && !mappedIds.has(o.id)) ?? null;
};

const ROMAN: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
};

export const friendlyExerciseLabel = (option: ExerciseOption): string => {
  if (option.source === 'hanon') {
    const num = option.label.match(/\d+/)?.[0];
    return num ? `Hanon No. ${num}` : option.label;
  }
  if (option.source === 'dohnanyi') {
    const match = option.label.match(/exercise\s+([a-z]+)/i);
    const numeral = match?.[1]?.toUpperCase() ?? '';
    const num = ROMAN[numeral];
    return num ? `Dohnányi No. ${num}` : option.label;
  }
  return option.label;
};

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

export type BookSource = 'hanon' | 'dohnanyi';

const BOOK_STORAGE_PREFIX = 'scales.os.repertoire.book.';

export const detectBookSource = (title: string, text?: string): BookSource | null => {
  const haystack = `${title || ''}\n${text || ''}`.toLowerCase();
  if (
    haystack.includes('dohnanyi') ||
    haystack.includes('dohnányi') ||
    haystack.includes('essential finger exercise')
  ) {
    return 'dohnanyi';
  }
  if (haystack.includes('hanon') || haystack.includes('virtuoso pianist')) {
    return 'hanon';
  }
  return null;
};

export const getStoredBookSource = (documentId: string): BookSource | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${BOOK_STORAGE_PREFIX}${documentId}`);
    return raw === 'hanon' || raw === 'dohnanyi' ? raw : null;
  } catch {
    return null;
  }
};

export const setStoredBookSource = (documentId: string, source: BookSource): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${BOOK_STORAGE_PREFIX}${documentId}`, source);
  } catch {
    // Storage may be unavailable (private mode / quota); ignore.
  }
};

export const formatDocumentTitle = (raw: string): string => {
  const withoutExt = raw.replace(/\.pdf$/i, '').trim();
  const cleaned = withoutExt
    .replace(/^imslp\s*\d+\s*-\s*pmlp\s*\d+\s*-/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || withoutExt || 'Untitled';
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
