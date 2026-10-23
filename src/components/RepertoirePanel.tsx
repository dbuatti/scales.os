import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  Plus,
  Trash2,
  FileText,
  Music2,
  BookOpen,
  ListMusic,
  X,
  Cloud,
  HardDrive,
  Loader2,
  Bookmark,
  Images,
  Library,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';
import type { PdfViewerHandle } from './PdfViewer';
const PdfViewer = React.lazy(() => import('./PdfViewer'));
import type { PDFDocumentProxy } from 'pdfjs-dist';
import FloatingTempoIndicator from './FloatingTempoIndicator';
import ReaderToolbar from './ReaderToolbar';
import ThumbnailRail from './ThumbnailRail';
import DocumentCover from './DocumentCover';
import ClipboardImport from './ClipboardImport';
import ExerciseIndexDialog from './ExerciseIndexDialog';
import Kbd from './Kbd';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { useScales } from '@/context/ScalesContext';
import { cn, shallowEqual } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { SavedDocument } from '@/hooks/use-repertoire-data';
import { useRepertoire } from '@/context/RepertoireContext';
import {
  PageMapping,
  RepertoireMode,
  EXERCISE_OPTIONS,
  TIME_SIGNATURES,
  MODE_LABELS,
  getMappingForPage,
  getBeatsPerMeasure,
  loadMappings as loadLocalMappings,
  saveMappings as saveLocalMappings,
  sortMappings,
  createEmptyMapping,
  getLastOpenedDocumentId,
  setLastOpenedDocumentId,
  clearLastOpenedDocumentId,
  detectBookSource,
  formatDocumentTitle,
  getStoredBookSource,
  setStoredBookSource,
  suggestNextExercise,
  friendlyExerciseLabel,
  getMappingOverlaps,
} from '@/lib/repertoire';
import { generateCacheId, loadPDFCached, updateCachedPageCount, cachePDF, getCachedPDF } from '@/lib/pdf-cache';
import { ImportedFile } from '@/lib/clipboard-import';

const ViewerFallback: React.FC = () => (
  <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 p-8 text-center">
    <Loader2 className="mb-3 h-7 w-7 animate-spin text-muted-foreground/40" />
    <p className="text-sm font-medium text-muted-foreground">Loading PDF viewer…</p>
  </div>
);

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.15;

const MappingRow: React.FC<{
  mapping: PageMapping;
  allMappings: PageMapping[];
  pageCount: number;
  onChange: (id: string, patch: Partial<PageMapping>) => void;
  onDelete: (id: string) => void;
  isCurrent: boolean;
}> = ({ mapping, allMappings, pageCount, onChange, onDelete, isCurrent }) => {
  const overlaps = getMappingOverlaps(mapping, allMappings);
  const handleExercise = (value: string) => {
    const option = EXERCISE_OPTIONS.find((opt) => opt.id === value);
    if (option) {
      onChange(mapping.id, { exerciseId: option.id, label: option.label });
    }
  };

  return (
    <div
      className={`rounded-lg border p-3 space-y-3 ${
        isCurrent ? 'border-primary/50 bg-primary/5' : 'border-border/60 bg-card'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ListMusic className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Pages {mapping.pageStart}
            {mapping.pageEnd !== mapping.pageStart ? `–${mapping.pageEnd}` : ''}
          </span>
          {isCurrent && <Badge className="text-[10px]">Current</Badge>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(mapping.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Exercise
          </Label>
          <Select value={mapping.exerciseId || undefined} onValueChange={handleExercise}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Choose exercise" />
            </SelectTrigger>
            <SelectContent className="max-h-[280px]">
              {EXERCISE_OPTIONS.map((option) => (
                <SelectItem key={option.id} value={option.id} className="text-xs">
                  {option.label}
                  <span className="ml-2 text-muted-foreground capitalize">{option.source}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Label
          </Label>
          <Input
            value={mapping.label}
            onChange={(e) => onChange(mapping.id, { label: e.target.value })}
            placeholder="e.g. Czerny No. 1"
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            From page
          </Label>
          <Input
            type="number"
            min={1}
            max={pageCount || undefined}
            value={mapping.pageStart}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10) || 1;
              onChange(mapping.id, {
                pageStart: value,
                pageEnd: Math.max(value, mapping.pageEnd),
              });
            }}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            To page
          </Label>
          <Input
            type="number"
            min={mapping.pageStart}
            max={pageCount || undefined}
            value={mapping.pageEnd}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10) || mapping.pageStart;
              onChange(mapping.id, { pageEnd: Math.max(mapping.pageStart, value) });
            }}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Target BPM
          </Label>
          <Input
            type="number"
            min={40}
            max={250}
            value={mapping.targetBpm}
            onChange={(e) => onChange(mapping.id, { targetBpm: parseInt(e.target.value, 10) || 0 })}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Time signature
          </Label>
          <Select
            value={mapping.timeSignature}
            onValueChange={(value) => onChange(mapping.id, { timeSignature: value })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_SIGNATURES.map((sig) => (
                <SelectItem key={sig} value={sig} className="text-xs">
                  {sig}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 col-span-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Mode
          </Label>
          <Select
            value={mapping.mode}
            onValueChange={(value) => onChange(mapping.id, { mode: value as RepertoireMode })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(MODE_LABELS) as RepertoireMode[]).map((mode) => (
                <SelectItem key={mode} value={mode} className="text-xs">
                  {MODE_LABELS[mode]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {overlaps.length > 0 && (
        <div className="space-y-1">
          {overlaps.map((overlap) => (
            <p
              key={overlap.otherId}
              className="rounded-md bg-muted/60 px-2 py-1 text-xs leading-snug text-muted-foreground"
            >
              Shares page{overlap.pages.length > 1 ? 's' : ''}{' '}
              <span className="font-semibold text-foreground">{overlap.pages.join(', ')}</span> with{' '}
              <span className="font-semibold text-foreground">{overlap.label}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

const RepertoirePanel: React.FC = () => {
  const { addLogEntry, updateExerciseMasteryBPM, exerciseMasteryBPMMap, log } = useScales();
  const { currentBPM, activePracticeItem: globalActivePracticeItem, setActivePracticeItem, setActiveLogSnapshotFunction, autoNudgeBPMOnSnapshot } = useGlobalBPM();
  const {
    documents,
    isCloudEnabled,
    uploadDocument,
    deleteDocument,
    getSignedUrl,
    fetchMappings,
    saveMappings,
    updateLastViewedPage,
    updatePageCount,
    registerMappings,
    pendingNavigation,
    consumeNavigation,
  } = useRepertoire();

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [localDocumentId, setLocalDocumentId] = useState<string | null>(null);
  const [localTitle, setLocalTitle] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingInitialPage, setPendingInitialPage] = useState<number | null>(null);
  const [pageInput, setPageInput] = useState('1');
  const [mappings, setMappings] = useState<PageMapping[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [quality, setQuality] = useState<'standard' | 'retina'>('standard');
  const [layout, setLayout] = useState<'vertical' | 'horizontal'>('horizontal');
  const [zoom, setZoom] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [thumbnailsOpen, setThumbnailsOpen] = useState(true);
  const [pdfProxy, setPdfProxy] = useState<PDFDocumentProxy | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showIndex, setShowIndex] = useState(false);
  const [pdfFilter, setPdfFilter] = useState('');
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [bookmarkExercise, setBookmarkExercise] = useState('');
  const [bookmarkSuggested, setBookmarkSuggested] = useState(false);
  const [bookmarkLabel, setBookmarkLabel] = useState('');
  const [clipboardImportOpen, setClipboardImportOpen] = useState(false);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = fullscreen ? 'hidden' : previous;
    return () => {
      document.body.style.overflow = previous;
    };
  }, [fullscreen]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewerRef = useRef<PdfViewerHandle>(null);
  const objectUrlRef = useRef<string | null>(null);
  const mappingSaveTimer = useRef<number | null>(null);
  const lastViewedTimer = useRef<number | null>(null);
  const masteryRef = useRef(exerciseMasteryBPMMap);
  masteryRef.current = exerciseMasteryBPMMap;

  const activeDocumentId = selectedDocId || localDocumentId;
  const selectedDoc = useMemo(
    () => documents.find((d) => d.id === selectedDocId) ?? null,
    [documents, selectedDocId],
  );

  const clearTimers = useCallback(() => {
    if (mappingSaveTimer.current) window.clearTimeout(mappingSaveTimer.current);
    if (lastViewedTimer.current) window.clearTimeout(lastViewedTimer.current);
    mappingSaveTimer.current = null;
    lastViewedTimer.current = null;
  }, []);

  useEffect(
    () => () => {
      clearTimers();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [clearTimers],
  );

  const loadDocument = useCallback(
    async (doc: SavedDocument, initialPage?: number) => {
      try {
        const url = await getSignedUrl(doc);
        clearTimers();
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        setSelectedDocId(doc.id);
        setLocalDocumentId(null);
        setLocalTitle(null);
        setPendingInitialPage(initialPage ?? null);
        setLastOpenedDocumentId(doc.id);
        
// Try cache first for instant loading (use stable doc ID as cache key)
        const cacheId = 'doc-' + doc.id;
        const cached = await getCachedPDF(cacheId);
        if (cached && cached.data && cached.data.byteLength > 0) {
          const blob = new Blob([cached.data], { type: 'application/pdf' });
          const objectUrl = URL.createObjectURL(blob);
          objectUrlRef.current = objectUrl;
          setSource(objectUrl);
          showSuccess(`Loaded "${doc.title}" from cache.`);
        } else {
          // Use direct URL for immediate display
          setSource(url);
          
          // Background: fetch and cache for next time (using stable cache key)
          fetch(url)
            .then(res => {
              if (!res.ok) throw new Error('Fetch failed');
              return res.arrayBuffer();
            })
            .then(data => {
              return cachePDF(cacheId, url, data, doc.page_count || 0, doc.title);
            })
            .catch(err => console.warn('Background cache failed:', err));
        }
        
        setPageCount(doc.page_count || 0);
        setCurrentPage(initialPage ?? (doc.last_viewed_page || 1));
        setFullscreen(true);
        const loaded = await fetchMappings(doc.id);
        setMappings(sortMappings(loaded));
        setShowIndex(loaded.length > 0);
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to open document.');
      }
    },
    [getSignedUrl, fetchMappings, clearTimers],
  );

  const loadLocalFile = useCallback(
    async (file: File) => {
      clearTimers();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      
      // Read file as ArrayBuffer for caching
      const arrayBuffer = await file.arrayBuffer();
      const cacheId = generateCacheId(`local:${file.name}`, file.name);
      
      // Cache the file
      await cachePDF(cacheId, `local:${file.name}`, arrayBuffer, 0, file.name);
      
      // Create object URL
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      
      const localId = `local:${file.name}-${file.size}`;
      setSelectedDocId(null);
      setLocalDocumentId(localId);
      setLocalTitle(file.name);
      setPendingInitialPage(null);
      setSource(url);
      setPageCount(0);
      setCurrentPage(1);
      setFullscreen(true);
      const localMappings = sortMappings(loadLocalMappings(localId));
      setMappings(localMappings);
      setShowIndex(localMappings.length > 0);
    },
    [clearTimers],
  );

  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const doc = await uploadDocument(file, 'technical');
        await loadDocument(doc);
        showSuccess(`Uploaded ${file.name}.`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed.';
        showError(`${message} Continuing in local (unsynced) mode.`);
        loadLocalFile(file);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadDocument, loadDocument, loadLocalFile],
  );

  const handleClipboardImport = useCallback(
    (files: ImportedFile[], mappings: PageMapping[]) => {
      // For each PDF file, create a local entry and cache it
      files.forEach(async (file) => {
        if (file.type === 'pdf' && file.data && file.file) {
          const localId = `local:${file.name}-${file.size}`;
          // Cache the PDF
          const cacheId = generateCacheId(`local:${file.name}`, file.name);
          await cachePDF(cacheId, `local:${file.name}`, file.data, 0, file.name);
          
          // Create object URL for immediate viewing
          const blob = new Blob([file.data], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          
          // If no document is currently open, load this one
          if (!activeDocumentId) {
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = url;
            setSelectedDocId(null);
            setLocalDocumentId(localId);
            setLocalTitle(file.name);
            setSource(url);
            setPageCount(0);
            setCurrentPage(1);
            setFullscreen(true);
            setMappings(sortMappings(mappings));
          } else {
            // Add mappings to current document
            const nextPageStart = pageCount > 0 ? pageCount + 1 : 1;
            const adjustedMappings = mappings.map((m, i) => ({
              ...m,
              pageStart: m.pageStart + nextPageStart - 1,
              pageEnd: m.pageEnd + nextPageStart - 1,
            }));
            setMappings(prev => sortMappings([...prev, ...adjustedMappings]));
            // Update page count will happen when PDF loads
          }
        }
      });
      showSuccess(`Imported ${files.filter(f => f.type === 'pdf').length} PDF placeholders.`);
    },
    [activeDocumentId, pageCount],
  );

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleUpload(file);
    event.target.value = '';
  };

  const handleSelectDocument = (value: string) => {
    if (!value) {
      clearTimers();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
      setSelectedDocId(null);
      setLocalDocumentId(null);
      setLocalTitle(null);
      setPendingInitialPage(null);
      setSource(null);
      setPageCount(0);
      setCurrentPage(1);
      setMappings([]);
      return;
    }
    const doc = documents.find((d) => d.id === value);
    if (doc) loadDocument(doc);
  };

  const handleDeleteDocument = async (doc?: SavedDocument) => {
    const target = doc ?? selectedDoc;
    if (!target) return;
    if (!window.confirm(`Delete "${target.title}" and its mappings?`)) return;
    await deleteDocument(target);
    if (getLastOpenedDocumentId() === target.id) clearLastOpenedDocumentId();
    if (target.id === selectedDoc?.id) handleSelectDocument('');
    showSuccess('Document deleted.');
  };

  const persist = useCallback(
    (next: PageMapping[]) => {
      const sorted = sortMappings(next);
      setMappings(sorted);
      if (selectedDocId) {
        if (mappingSaveTimer.current) window.clearTimeout(mappingSaveTimer.current);
        mappingSaveTimer.current = window.setTimeout(() => {
          void saveMappings(selectedDocId, sorted);
        }, 700);
      } else if (localDocumentId) {
        saveLocalMappings(localDocumentId, sorted);
      }
    },
    [selectedDocId, localDocumentId, saveMappings],
  );

  const updateMapping = useCallback(
    (id: string, patch: Partial<PageMapping>) => {
      persist(mappings.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    },
    [mappings, persist],
  );

  const deleteMapping = useCallback(
    (id: string) => {
      persist(mappings.filter((m) => m.id !== id));
    },
    [mappings, persist],
  );

  const addBookmark = useCallback(() => {
    const suggestion = suggestNextExercise(mappings, EXERCISE_OPTIONS);
    setBookmarkExercise(suggestion?.id ?? '');
    setBookmarkSuggested(Boolean(suggestion));
    setBookmarkLabel(suggestion ? friendlyExerciseLabel(suggestion) : '');
    setBookmarkOpen(true);
  }, [mappings]);

  const handleBookmarkExerciseChange = useCallback((value: string) => {
    setBookmarkExercise(value);
    setBookmarkSuggested(false);
  }, []);

  const confirmBookmark = useCallback(() => {
    const mapping = createEmptyMapping(currentPage);
    if (bookmarkExercise) {
      const option = EXERCISE_OPTIONS.find((opt) => opt.id === bookmarkExercise);
      mapping.exerciseId = option?.id ?? '';
      mapping.label = option ? option.label : bookmarkLabel.trim();
    }
    if (bookmarkLabel.trim()) mapping.label = bookmarkLabel.trim();
    if (!mapping.label) mapping.label = `Page ${currentPage}`;
    persist([...mappings, mapping]);
    setBookmarkOpen(false);
    setBookmarkSuggested(false);
    showSuccess(`Bookmarked "${mapping.label}" on page ${currentPage}.`);
    if (pageCount > currentPage) {
      viewerRef.current?.scrollToPage(currentPage + 1);
    }
  }, [mappings, currentPage, bookmarkExercise, bookmarkLabel, persist, pageCount]);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      if (selectedDocId) {
        if (lastViewedTimer.current) window.clearTimeout(lastViewedTimer.current);
        lastViewedTimer.current = window.setTimeout(() => {
          void updateLastViewedPage(selectedDocId, page);
        }, 1000);
      }
    },
    [selectedDocId, updateLastViewedPage],
  );

  const handleDocumentLoaded = useCallback(
    (count: number) => {
      setPageCount(count);
      if (selectedDocId) {
        const doc = documents.find((d) => d.id === selectedDocId);
        if (doc && doc.page_count !== count) {
          void updatePageCount(selectedDocId, count);
        }
        // Update cached page count (use stable doc ID as cache key)
        if (doc) {
          updateCachedPageCount('doc-' + doc.id, count);
        }
      }
    },
    [selectedDocId, documents, updatePageCount],
  );

  useEffect(() => {
    if (activeDocumentId) registerMappings(activeDocumentId, mappings);
  }, [activeDocumentId, mappings, registerMappings]);

  useEffect(() => {
    if (!pdfProxy || !selectedDoc) return;
    if (getStoredBookSource(selectedDoc.id)) return;
    let cancelled = false;
    (async () => {
      try {
        const page = await pdfProxy.getPage(1);
        const content = await page.getTextContent();
        const text = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ');
        const detected = detectBookSource(selectedDoc.title, text);
        if (!cancelled && detected) {
          setStoredBookSource(selectedDoc.id, detected);
        }
      } catch {
        // non-critical; the filename-based tag still applies
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfProxy, selectedDoc]);

  const currentMapping = getMappingForPage(mappings, currentPage);
  // A page can carry more than one exercise (the tail of one and the start of
  // the next), so every page stays bookmarkable; duplicates are prevented by
  // the "next exercise" suggestion rather than by blocking the page.
  const isBookmarkable = true;
  const overlappingLabels = mappings
    .filter((m) => currentPage >= m.pageStart && currentPage <= m.pageEnd)
    .map((m) => m.label)
    .filter(Boolean);
  const maxPixelRatio = quality === 'retina' ? 3 : 1.5;

  const navigatePage = useCallback(
    (page: number) => {
      const clamped = Math.min(Math.max(1, page), Math.max(1, pageCount || 1));
      viewerRef.current?.scrollToPage(clamped);
    },
    [pageCount],
  );

  const filteredDocuments = useMemo(() => {
    const term = pdfFilter.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter((d) => d.title.toLowerCase().includes(term));
  }, [documents, pdfFilter]);

  const sortedMappings = useMemo(() => sortMappings(mappings), [mappings]);

  const jumpToAdjacentMapping = useCallback(
    (direction: -1 | 1) => {
      if (sortedMappings.length === 0) return;
      const pages = sortedMappings.map((m) => m.pageStart);
      const target =
        direction === -1
          ? [...pages].reverse().find((p) => p < currentPage)
          : pages.find((p) => p > currentPage);
      navigatePage(target ?? pages[0]);
    },
    [sortedMappings, currentPage, navigatePage],
  );

  useEffect(() => {
    if (!pendingNavigation) return;
    const { docId, page } = pendingNavigation;
    if (docId === activeDocumentId) {
      setPendingInitialPage(page);
      navigatePage(page);
      consumeNavigation();
      return;
    }
    const doc = documents.find((d) => d.id === docId);
    if (!doc) {
      consumeNavigation();
      return;
    }
    void loadDocument(doc, page);
    consumeNavigation();
  }, [
    pendingNavigation,
    activeDocumentId,
    documents,
    navigatePage,
    loadDocument,
    consumeNavigation,
  ]);

  const commitPageInput = useCallback(() => {
    const page = parseInt(pageInput, 10);
    if (!Number.isNaN(page)) navigatePage(page);
    else setPageInput(String(currentPage));
  }, [pageInput, currentPage, navigatePage]);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100));
  }, []);
  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100));
  }, []);
  const zoomReset = useCallback(() => setZoom(1), []);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    if (!source || pageCount <= 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
        return;
      }
      if (e.key === 'Escape') {
        setShowIndex(false);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setLayout((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigatePage(currentPage - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigatePage(currentPage + 1);
      } else if (e.key === '[') {
        e.preventDefault();
        jumpToAdjacentMapping(-1);
      } else if (e.key === ']') {
        e.preventDefault();
        jumpToAdjacentMapping(1);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        zoomReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [source, pageCount, currentPage, navigatePage, jumpToAdjacentMapping, zoomIn, zoomOut, zoomReset]);

  const activeLabel = currentMapping?.label || currentMapping?.exerciseId || 'No exercise mapped';
  const activeTargetBpm = currentMapping?.targetBpm ?? currentBPM;
  const activeTimeSignature = currentMapping?.timeSignature ?? '4/4';
  const activeMode = currentMapping?.mode ?? 'technical';
  const beatsPerMeasure = getBeatsPerMeasure(activeTimeSignature);

  useEffect(() => {
    if (!currentMapping) return;
    const item = {
      type: 'repertoire' as const,
      name: currentMapping.label || currentMapping.exerciseId || `Page ${currentPage}`,
      exerciseId: currentMapping.exerciseId,
      nextTargetBPM: currentMapping.targetBpm,
      currentHighestBPM: masteryRef.current[currentMapping.exerciseId] || 0,
      isMastered: false,
    };
    if (!shallowEqual(globalActivePracticeItem, item)) {
      setActivePracticeItem(item);
    }
  }, [currentMapping, currentPage, globalActivePracticeItem, setActivePracticeItem]);

  const handleLogSnapshot = useCallback(() => {
    if (!currentMapping) {
      showError('No exercise is mapped to this page.');
      return;
    }
    const label = currentMapping.label || currentMapping.exerciseId;
    const previousHighest = exerciseMasteryBPMMap[currentMapping.exerciseId] || 0;

    if (currentMapping.exerciseId && currentBPM > previousHighest) {
      updateExerciseMasteryBPM(currentMapping.exerciseId, currentBPM);
    }

    addLogEntry({
      durationMinutes: 0,
      itemsPracticed: [
        {
          type: 'repertoire',
          repertoireName: label,
          repertoireBpmTarget: currentBPM,
          repertoirePage: currentPage,
        },
      ],
      notes: `Repertoire Snapshot: ${label} (page ${currentPage}) at ${currentBPM} BPM.`,
    });

    const goalBpm = currentMapping.targetBpm;
    const reachedGoal = goalBpm > 0 && currentBPM >= goalBpm;

    // Auto-nudge BPM after snapshot: use snapshot BPM as base, nudge towards goal
    autoNudgeBPMOnSnapshot({ increment: 3, overshootAllowance: 2, snapshotBpm: currentBPM });

    if (reachedGoal) {
      showSuccess(
        currentBPM > previousHighest && currentMapping.exerciseId
          ? `Goal reached! ${label} mastered at ${currentBPM} BPM (target: ${goalBpm}).`
          : `Snapshot logged: ${label} at ${currentBPM} BPM. Goal reached!`,
      );
    } else {
      const remaining = goalBpm > 0 ? goalBpm - currentBPM : 0;
      showSuccess(
        currentBPM > previousHighest && currentMapping.exerciseId
          ? `Mastery updated! ${label} at ${currentBPM} BPM.${remaining > 0 ? ' ' + remaining + ' BPM to goal.' : ''}`
          : `Snapshot logged: ${label} at ${currentBPM} BPM.${remaining > 0 ? ' ' + remaining + ' BPM to goal.' : ''}`,
      );
    }
  }, [
    currentMapping,
    currentPage,
    currentBPM,
    exerciseMasteryBPMMap,
    updateExerciseMasteryBPM,
    addLogEntry,
    autoNudgeBPMOnSnapshot,
  ]);

  useEffect(() => {
    setActiveLogSnapshotFunction(() => handleLogSnapshot);
    return () => setActiveLogSnapshotFunction(null);
  }, [setActiveLogSnapshotFunction, handleLogSnapshot]);

  return (
    <CardContent className="p-0 space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        hidden
        className="hidden"
        onChange={handleFileInput}
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Music2 className="h-4 w-4" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your PDFs
            </h2>
            {documents.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                {documents.length}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {documents.length > 0 && (
              <Input
                value={pdfFilter}
                onChange={(e) => setPdfFilter(e.target.value)}
                placeholder="Search PDFs…"
                aria-label="Search PDFs"
                className="h-9 w-full text-sm sm:w-48"
              />
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-9 font-bold focus-scale"
              onClick={() => setClipboardImportOpen(true)}
              title="Import from clipboard or Dropbox (parses BPMs from filenames)"
            >
              <ClipboardList className="mr-1.5 h-4 w-4" />
              Import
            </Button>
            {mappings.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 font-bold focus-scale"
                onClick={() => setShowIndex(true)}
                title="Show exercise index"
              >
                <ListMusic className="mr-1.5 h-4 w-4" />
                Index
              </Button>
            )}
            {activeDocumentId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (selectedDoc) handleDeleteDocument();
                  else handleSelectDocument('');
                }}
                title={selectedDoc ? 'Delete document' : 'Close'}
                aria-label={selectedDoc ? 'Delete document' : 'Close document'}
              >
                {selectedDoc ? <Trash2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/60 bg-card/50 px-6 py-12 text-center shadow-sm sm:py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-7 w-7" />
            </div>
            <div className="space-y-2 max-w-md">
              <p className="text-lg font-bold text-foreground">Add your first method book</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload a PDF — Hanon, Dohnányi, Czerny — then map its pages to exercises.
                The floating tempo panel follows the page you are viewing.
              </p>
            </div>
            <div className="mt-2 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="font-bold focus-scale"
                size="lg"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => setClipboardImportOpen(true)}
                className="font-bold focus-scale"
                size="lg"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Import from clipboard
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tip: Paste a Dropbox folder listing to bulk-import PDFs with auto-detected BPMs
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredDocuments.map((doc) => {
              const isOpen = doc.id === activeDocumentId;
              const book = getStoredBookSource(doc.id) ?? detectBookSource(doc.title);
              return (
                <div
                  key={doc.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectDocument(doc.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleSelectDocument(doc.id);
                  }}
                  className={cn(
                    'group relative flex cursor-pointer flex-col gap-3 rounded-xl border bg-card/70 p-3 text-left shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isOpen
                      ? 'border-primary/50 shadow-md ring-1 ring-primary/20'
                      : 'border-border/60 hover:border-primary/40',
                  )}
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border bg-muted/40">
                    <DocumentCover doc={doc} getSignedUrl={getSignedUrl} />
                    {isOpen && (
                      <div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-inset ring-primary" />
                    )}
                    {book && (
                      <Badge className="absolute left-2 top-2 text-[10px]">
                        {book === 'hanon' ? 'Hanon' : 'Dohnányi'}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1.5 top-1.5 h-7 w-7 bg-background/80 text-muted-foreground opacity-100 shadow-sm backdrop-blur transition-all duration-150 hover:bg-background hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteDocument(doc);
                      }}
                      title="Delete"
                      aria-label={`Delete ${formatDocumentTitle(doc.title)}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold leading-tight">
                      {formatDocumentTitle(doc.title)}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {doc.page_count}p · p.{doc.last_viewed_page}
                    </p>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/30 p-4 text-center text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-[0.98]"
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              <span className="text-xs font-bold">Upload PDF</span>
            </button>
          </div>
        )}
      </section>

      {!isCloudEnabled && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs font-medium text-warning">
          <HardDrive className="w-3.5 h-3.5" />
          Not signed in — documents are stored locally in this browser only.
        </div>
      )}

      {source && selectedDoc && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Cloud className="w-3.5 h-3.5 text-primary" />
          Synced document • last on page {selectedDoc.last_viewed_page}
        </div>
      )}

      {source && !selectedDoc && localTitle && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <HardDrive className="w-3.5 h-3.5" />
          Local (unsynced): {localTitle}
        </div>
      )}

      {!source ? (
        documents.length > 0 && (
          <Suspense fallback={<ViewerFallback />}>
            <PdfViewer source={null} mappings={[]} />
          </Suspense>
        )
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div
            className={cn(
              'min-w-0',
              fullscreen
                ? 'fixed inset-0 z-50 flex flex-col gap-3 bg-background/80 p-4 backdrop-blur-2xl'
                : 'space-y-3',
            )}
          >
            {fullscreen && (
              <div className="surface flex shrink-0 items-center justify-between gap-3 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-sm font-bold">
                    {selectedDoc?.title ?? localTitle}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setFullscreen(false)}
                  className="shrink-0 font-bold focus-scale"
                >
                  <Library className="mr-1.5 h-3.5 w-3.5" />
                  Library
                </Button>
              </div>
            )}
            <div className={fullscreen ? 'shrink-0' : undefined}>
              <ReaderToolbar
                pageNumber={currentPage}
                pageCount={pageCount}
                pageInput={pageInput}
                onPageInputChange={setPageInput}
                onCommitPageInput={commitPageInput}
                onPrevious={() => navigatePage(currentPage - 1)}
                onNext={() => navigatePage(currentPage + 1)}
                quality={quality}
                onQualityChange={setQuality}
                layout={layout}
                onLayoutChange={setLayout}
                zoom={zoom}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onZoomReset={zoomReset}
                onFitWidth={() => viewerRef.current?.fitWidth()}
                onFitPage={() => viewerRef.current?.fitPage()}
                mappings={mappings}
                currentMapping={currentMapping}
                onJumpPage={navigatePage}
                onPreviousExercise={() => jumpToAdjacentMapping(-1)}
                onNextExercise={() => jumpToAdjacentMapping(1)}
                canBookmark={isBookmarkable}
                bookmarkOpen={bookmarkOpen}
                onBookmarkOpenChange={setBookmarkOpen}
                onOpenBookmark={addBookmark}
                bookmarkExercise={bookmarkExercise}
                onBookmarkExerciseChange={handleBookmarkExerciseChange}
                bookmarkSuggested={bookmarkSuggested}
                bookmarkLabel={bookmarkLabel}
                onBookmarkLabelChange={setBookmarkLabel}
                onConfirmBookmark={confirmBookmark}
                overlappingLabels={overlappingLabels}
                fullscreen={fullscreen}
                onToggleFullscreen={() => setFullscreen((prev) => !prev)}
                showPanelToggle={!fullscreen}
                panelOpen={sidebarOpen}
                onPanelToggle={() => setSidebarOpen((prev) => !prev)}
              />
            </div>

            {pageCount > 0 && (
              <Progress
                value={Math.min(100, (currentPage / pageCount) * 100)}
                className="h-1 shrink-0"
              />
            )}

            <Suspense fallback={<ViewerFallback />}>
              <PdfViewer
                ref={viewerRef}
                source={source}
                mappings={mappings}
                onPageChange={handlePageChange}
                onDocumentLoaded={handleDocumentLoaded}
                initialPage={pendingInitialPage ?? selectedDoc?.last_viewed_page ?? 1}
                maxPixelRatio={maxPixelRatio}
                onBookmark={addBookmark}
                layout={layout}
                initialFit={fullscreen ? 'page' : 'width'}
                zoom={zoom}
                onZoomChange={setZoom}
                onPdfReady={setPdfProxy}
                className={fullscreen ? 'flex-1 min-h-0' : undefined}
                scrollClassName={
                  fullscreen
                    ? 'h-full min-h-0 rounded-none border-0 bg-transparent'
                    : 'h-[calc(100vh-15rem)] min-h-[520px]'
                }
              />
            </Suspense>

            {!fullscreen && (
              <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                <Kbd>←</Kbd>
                {' '}
                <Kbd>→</Kbd>
                {' '}
                jump pages ·{' '}
                <Kbd>[</Kbd>
                <Kbd>]</Kbd>
                {' '}
                exercises ·{' '}
                <Kbd>+</Kbd>
                <Kbd>−</Kbd>
                {' '}
                zoom ·{' '}
                <Kbd>0</Kbd>
                {' '}
                reset · bookmark from the page or the panel · L layout
              </p>
            )}
          </div>

          {!fullscreen && (
            <aside className="space-y-3 min-w-0">
              <Card className="surface">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Images className="w-4 h-4" />
                      Pages
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setThumbnailsOpen((prev) => !prev)}
                      className="font-bold focus-scale"
                    >
                      {thumbnailsOpen ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </CardHeader>
                {thumbnailsOpen && (
                  <CardContent className="pt-0">
                    <ThumbnailRail
                      pdf={pdfProxy}
                      pageCount={pageCount}
                      currentPage={currentPage}
                      onSelect={navigatePage}
                    />
                  </CardContent>
                )}
              </Card>

              <Card className="surface border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <ListMusic className="w-4 h-4" />
                      Exercises &amp; Bookmarks
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={addBookmark}
                      disabled={!isBookmarkable}
                      className="font-bold focus-scale"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Bookmark page {currentPage}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {mappings.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No bookmarks yet. Flip through the book and hit{' '}
                      <span className="font-bold text-primary">Bookmark page {currentPage}</span>.
                    </p>
                  ) : (
                    <ScrollArea
                      className={sidebarOpen ? 'max-h-[calc(100vh-22rem)] pr-3' : 'max-h-[420px] pr-3'}
                    >
                      <div className="space-y-3">
                        {mappings.map((mapping) => (
                          <MappingRow
                            key={mapping.id}
                            mapping={mapping}
                            allMappings={mappings}
                            pageCount={pageCount}
                            onChange={updateMapping}
                            onDelete={deleteMapping}
                            isCurrent={currentMapping?.id === mapping.id}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </aside>
          )}
        </div>
      )}

      {source && mappings.length > 0 && (
        <ExerciseIndexDialog
          open={showIndex}
          onOpenChange={setShowIndex}
          mappings={mappings}
          currentPage={currentPage}
          onSelect={(mapping) => {
            setPendingInitialPage(mapping.pageStart);
            setShowIndex(false);
            // Delay navigation to ensure DOM is ready after index closes
            setTimeout(() => {
              viewerRef.current?.scrollToPage(mapping.pageStart);
              setCurrentPage(mapping.pageStart);
            }, 100);
          }}
        />
      )}

      {source && (
        <FloatingTempoIndicator
          exerciseLabel={activeLabel}
          targetBpm={activeTargetBpm}
          timeSignature={activeTimeSignature}
          page={currentPage}
          pageCount={pageCount}
          mode={MODE_LABELS[activeMode]}
          beatsPerMeasure={beatsPerMeasure}
          onLog={handleLogSnapshot}
          snapshotCount={log.filter(e => e.itemsPracticed.some(i => i.type === 'repertoire' && i.repertoireName === (currentMapping?.label || currentMapping?.exerciseId))).length}
          onTargetBpmChange={(bpm) => {
            if (currentMapping) {
              updateMapping(currentMapping.id, { targetBpm: bpm });
            }
          }}
        />
      )}

      <Dialog open={clipboardImportOpen} onOpenChange={setClipboardImportOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-2xl">
          {clipboardImportOpen && (
            <ClipboardImport
              onImport={handleClipboardImport}
              onClose={() => setClipboardImportOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </CardContent>
  );
};

export default RepertoirePanel;
