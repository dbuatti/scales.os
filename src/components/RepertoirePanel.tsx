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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Upload,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Music2,
  ListMusic,
  X,
  Cloud,
  HardDrive,
  Loader2,
  Bookmark,
  PanelRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Images,
} from 'lucide-react';
import type { PdfViewerHandle } from './PdfViewer';
const PdfViewer = React.lazy(() => import('./PdfViewer'));
import type { PDFDocumentProxy } from 'pdfjs-dist';
import FloatingTempoIndicator from './FloatingTempoIndicator';
import LibraryDialog from './LibraryDialog';
import ThumbnailRail from './ThumbnailRail';
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
} from '@/lib/repertoire';

const ViewerFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 min-h-[420px] text-center p-8">
    <Loader2 className="w-8 h-8 text-muted-foreground/40 animate-spin mb-3" />
    <p className="text-sm font-medium text-muted-foreground">Loading PDF viewer…</p>
  </div>
);

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.15;

const MappingRow: React.FC<{
  mapping: PageMapping;
  pageCount: number;
  onChange: (id: string, patch: Partial<PageMapping>) => void;
  onDelete: (id: string) => void;
  isCurrent: boolean;
}> = ({ mapping, pageCount, onChange, onDelete, isCurrent }) => {
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
          {isCurrent && <Badge className="text-[9px]">Current</Badge>}
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
    </div>
  );
};

interface ReaderToolbarProps {
  pageNumber: number;
  pageCount: number;
  pageInput: string;
  onPageInputChange: (value: string) => void;
  onCommitPageInput: () => void;
  onPrevious: () => void;
  onNext: () => void;
  quality: 'standard' | 'retina';
  onQualityChange: (value: 'standard' | 'retina') => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  mappings: PageMapping[];
  currentMapping?: PageMapping;
  onJumpPage: (page: number) => void;
  canBookmark: boolean;
  bookmarkOpen: boolean;
  onBookmarkOpenChange: (open: boolean) => void;
  onOpenBookmark: () => void;
  bookmarkExercise: string;
  onBookmarkExerciseChange: (value: string) => void;
  bookmarkLabel: string;
  onBookmarkLabelChange: (value: string) => void;
  onConfirmBookmark: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  showPanelToggle: boolean;
  panelOpen: boolean;
  onPanelToggle: () => void;
}

const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  pageNumber,
  pageCount,
  pageInput,
  onPageInputChange,
  onCommitPageInput,
  onPrevious,
  onNext,
  quality,
  onQualityChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  mappings,
  currentMapping,
  onJumpPage,
  canBookmark,
  bookmarkOpen,
  onBookmarkOpenChange,
  onOpenBookmark,
  bookmarkExercise,
  onBookmarkExerciseChange,
  bookmarkLabel,
  onBookmarkLabelChange,
  onConfirmBookmark,
  fullscreen,
  onToggleFullscreen,
  showPanelToggle,
  panelOpen,
  onPanelToggle,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <Button
      variant="outline"
      size="icon"
      className="h-10 w-10"
      onClick={onPrevious}
      disabled={pageNumber <= 1}
      aria-label="Previous page"
    >
      <ChevronLeft className="w-4 h-4" />
    </Button>

    <div className="flex items-center gap-1.5 text-sm">
      <Input
        value={pageInput}
        onChange={(e) => onPageInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onCommitPageInput();
          }
        }}
        onBlur={onCommitPageInput}
        aria-label="Page number"
        className="w-16 h-10 px-2 text-center text-sm tabular-nums"
      />
      <span className="text-muted-foreground text-xs">/ {pageCount || '—'}</span>
    </div>

    <Button
      variant="outline"
      size="icon"
      className="h-10 w-10"
      onClick={onNext}
      disabled={pageCount > 0 && pageNumber >= pageCount}
      aria-label="Next page"
    >
      <ChevronRight className="w-4 h-4" />
    </Button>

    <Select value={quality} onValueChange={(value) => onQualityChange(value as 'standard' | 'retina')}>
      <SelectTrigger className="h-10 w-[104px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="standard" className="text-xs">Standard</SelectItem>
        <SelectItem value="retina" className="text-xs">Retina</SelectItem>
      </SelectContent>
    </Select>

    <div className="flex items-center rounded-md border">
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-r-none"
        onClick={onZoomOut}
        disabled={zoom <= 0.5}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <button
        type="button"
        onClick={onZoomReset}
        className="h-10 min-w-[56px] border-x px-2 text-xs font-bold tabular-nums text-muted-foreground transition-colors hover:text-foreground"
        title="Reset zoom to 100%"
      >
        {Math.round(zoom * 100)}%
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-l-none"
        onClick={onZoomIn}
        disabled={zoom >= 3}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
    </div>

    {mappings.length > 0 && (
      <div className="flex flex-wrap items-center gap-1.5 min-w-0 ml-1">
        {mappings.map((mapping) => {
          const isCurrent = mapping.id === currentMapping?.id;
          return (
            <Button
              key={mapping.id}
              variant={isCurrent ? 'default' : 'outline'}
              size="sm"
              className="h-9 px-3 text-[11px] font-bold focus-scale"
              onClick={() => onJumpPage(mapping.pageStart)}
              title={`Jump to p.${mapping.pageStart}: ${mapping.label || mapping.exerciseId || 'unlabelled'}`}
            >
              {mapping.label || mapping.exerciseId || `p.${mapping.pageStart}`}
            </Button>
          );
        })}
      </div>
    )}

    <div className="ml-auto flex items-center gap-2">
      <Popover open={bookmarkOpen} onOpenChange={onBookmarkOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            className="h-10 font-bold focus-scale"
            disabled={!canBookmark}
            onClick={onOpenBookmark}
          >
            <Bookmark className="w-3.5 h-3.5 mr-1.5" />
            Bookmark page {pageNumber}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Exercise
            </Label>
            <Select value={bookmarkExercise} onValueChange={onBookmarkExerciseChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Choose exercise (optional)" />
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
              value={bookmarkLabel}
              onChange={(e) => onBookmarkLabelChange(e.target.value)}
              placeholder={bookmarkExercise ? 'Optional custom name' : 'e.g. Hanon No. 7'}
              className="h-8 text-xs"
            />
          </div>
          <Button size="sm" onClick={onConfirmBookmark} className="w-full font-bold focus-scale">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add bookmark on page {pageNumber}
          </Button>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 text-muted-foreground"
        onClick={onToggleFullscreen}
        aria-label={fullscreen ? 'Exit full screen reader' : 'Full screen reader'}
        title={fullscreen ? 'Exit full screen' : 'Full screen'}
      >
        {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </Button>

      {showPanelToggle && (
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground"
          onClick={onPanelToggle}
          aria-label="Toggle bookmarks panel"
          title="Toggle bookmarks panel"
        >
          <PanelRight
            className={cn('w-4 h-4', panelOpen && 'text-primary')}
          />
        </Button>
      )}
    </div>
  </div>
);

const RepertoirePanel: React.FC = () => {
  const { addLogEntry, updateExerciseMasteryBPM, exerciseMasteryBPMMap } = useScales();
  const {
    currentBPM,
    setActivePracticeItem,
    setActiveLogSnapshotFunction,
    activePracticeItem: globalActivePracticeItem,
  } = useGlobalBPM();
  const {
    documents,
    isLoadingDocuments,
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
  const [zoom, setZoom] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [thumbnailsOpen, setThumbnailsOpen] = useState(true);
  const [pdfProxy, setPdfProxy] = useState<PDFDocumentProxy | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [bookmarkExercise, setBookmarkExercise] = useState('');
  const [bookmarkLabel, setBookmarkLabel] = useState('');

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
  const hasAutoResumedRef = useRef(false);

  const activeDocumentId = selectedDocId || localDocumentId;
  const selectedDoc = useMemo(
    () => documents.find((d) => d.id === selectedDocId) ?? null,
    [documents, selectedDocId],
  );
  const activeTitle = selectedDoc?.title ?? localTitle;

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
        setSource(url);
        setPageCount(doc.page_count || 0);
        setCurrentPage(initialPage ?? (doc.last_viewed_page || 1));
        const loaded = await fetchMappings(doc.id);
        setMappings(sortMappings(loaded));
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to open document.');
      }
    },
    [getSignedUrl, fetchMappings, clearTimers],
  );

  const loadLocalFile = useCallback(
    (file: File) => {
      clearTimers();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      const localId = `local:${file.name}-${file.size}`;
      setSelectedDocId(null);
      setLocalDocumentId(localId);
      setLocalTitle(file.name);
      setPendingInitialPage(null);
      setSource(url);
      setPageCount(0);
      setCurrentPage(1);
      setMappings(sortMappings(loadLocalMappings(localId)));
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
    if (mappings.some((m) => currentPage >= m.pageStart && currentPage <= m.pageEnd)) {
      showError(`Page ${currentPage} is already mapped.`);
      return;
    }
    setBookmarkExercise('');
    setBookmarkLabel('');
    setBookmarkOpen(true);
  }, [mappings, currentPage]);

  const confirmBookmark = useCallback(() => {
    if (mappings.some((m) => currentPage >= m.pageStart && currentPage <= m.pageEnd)) {
      setBookmarkOpen(false);
      showError(`Page ${currentPage} is already mapped.`);
      return;
    }
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
    showSuccess(`Bookmarked "${mapping.label}" on page ${currentPage}.`);
  }, [mappings, currentPage, bookmarkExercise, bookmarkLabel, persist]);

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
      }
    },
    [selectedDocId, documents, updatePageCount],
  );

  useEffect(() => {
    if (activeDocumentId) registerMappings(activeDocumentId, mappings);
  }, [activeDocumentId, mappings, registerMappings]);

  useEffect(() => {
    if (hasAutoResumedRef.current) return;
    if (pendingNavigation) {
      hasAutoResumedRef.current = true;
      return;
    }
    if (activeDocumentId) return;
    if (documents.length === 0) return;
    const lastId = getLastOpenedDocumentId();
    if (!lastId) return;
    const doc = documents.find((d) => d.id === lastId);
    if (!doc) return;
    hasAutoResumedRef.current = true;
    void loadDocument(doc);
  }, [activeDocumentId, documents, loadDocument, pendingNavigation]);

  const currentMapping = getMappingForPage(mappings, currentPage);
  const isBookmarkable = !mappings.some(
    (m) => currentPage >= m.pageStart && currentPage <= m.pageEnd,
  );
  const maxPixelRatio = quality === 'retina' ? 3 : 1.5;

  const navigatePage = useCallback(
    (page: number) => {
      const clamped = Math.min(Math.max(1, page), Math.max(1, pageCount || 1));
      viewerRef.current?.scrollToPage(clamped);
    },
    [pageCount],
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
      if (e.key === 'ArrowLeft' || e.key === '[') {
        e.preventDefault();
        navigatePage(currentPage - 1);
      } else if (e.key === 'ArrowRight' || e.key === ']') {
        e.preventDefault();
        navigatePage(currentPage + 1);
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
  }, [source, pageCount, currentPage, navigatePage, zoomIn, zoomOut, zoomReset]);

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

    showSuccess(
      currentBPM > previousHighest && currentMapping.exerciseId
        ? `Mastery updated! ${label} at ${currentBPM} BPM.`
        : `Snapshot logged: ${label} at ${currentBPM} BPM.`,
    );
  }, [
    currentMapping,
    currentPage,
    currentBPM,
    exerciseMasteryBPMMap,
    updateExerciseMasteryBPM,
    addLogEntry,
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
        className="hidden"
        onChange={handleFileInput}
      />

      <LibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        documents={documents}
        isLoading={isLoadingDocuments}
        isCloudEnabled={isCloudEnabled}
        activeDocumentId={activeDocumentId}
        isUploading={isUploading}
        onSelect={(doc) => {
          setLibraryOpen(false);
          handleSelectDocument(doc.id);
        }}
        onDelete={(doc) => void handleDeleteDocument(doc)}
        onUpload={(file) => {
          setLibraryOpen(false);
          void handleUpload(file);
        }}
      />

      <div className="flex flex-col gap-4 rounded-xl border bg-card/50 p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-0.5">
          <Label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
            <Music2 className="w-4 h-4 text-primary" />
            Repertoire &amp; Technical
          </Label>
          <p className="text-xs text-muted-foreground">
            Load a full method book once, then map page ranges to exercises. The floating
            tempo panel follows the page you are viewing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={libraryOpen}
            onClick={() => setLibraryOpen(true)}
            className="w-[260px] h-9 justify-start text-xs font-normal"
          >
            <ListMusic className="w-3.5 h-3.5 mr-2 text-primary shrink-0" />
            <span className="truncate">
              {activeTitle ?? (isLoadingDocuments ? 'Loading…' : 'My library')}
            </span>
          </Button>

          <Button
            variant="outline"
            className="font-bold focus-scale h-9"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload PDF
          </Button>

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
            >
              {selectedDoc ? <Trash2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      {!isCloudEnabled && (
        <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning-foreground">
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
        <Suspense fallback={<ViewerFallback />}>
          <PdfViewer source={null} mappings={[]} />
        </Suspense>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div
            className={cn(
              'min-w-0',
              fullscreen
                ? 'fixed inset-0 z-50 flex flex-col gap-3 bg-background p-4'
                : 'space-y-3',
            )}
          >
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
                zoom={zoom}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onZoomReset={zoomReset}
                mappings={mappings}
                currentMapping={currentMapping}
                onJumpPage={navigatePage}
                canBookmark={isBookmarkable}
                bookmarkOpen={bookmarkOpen}
                onBookmarkOpenChange={setBookmarkOpen}
                onOpenBookmark={addBookmark}
                bookmarkExercise={bookmarkExercise}
                onBookmarkExerciseChange={setBookmarkExercise}
                bookmarkLabel={bookmarkLabel}
                onBookmarkLabelChange={setBookmarkLabel}
                onConfirmBookmark={confirmBookmark}
                fullscreen={fullscreen}
                onToggleFullscreen={() => setFullscreen((prev) => !prev)}
                showPanelToggle={!fullscreen}
                panelOpen={sidebarOpen}
                onPanelToggle={() => setSidebarOpen((prev) => !prev)}
              />
            </div>

            {pageCount > 0 && (
              <div className="flex items-center gap-3">
                <Progress
                  value={Math.min(100, (currentPage / pageCount) * 100)}
                  className="h-1.5"
                />
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground tabular-nums">
                  {currentPage} / {pageCount}
                </span>
              </div>
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
                layout="horizontal"
                zoom={zoom}
                onZoomChange={setZoom}
                onPdfReady={setPdfProxy}
                className={fullscreen ? 'flex-1 min-h-0' : undefined}
                scrollClassName={
                  fullscreen
                    ? 'h-full min-h-0 rounded-none border-0 bg-background'
                    : 'h-[calc(100vh-15rem)] min-h-[520px]'
                }
              />
            </Suspense>

            {!fullscreen && (
              <p className="text-[11px] text-muted-foreground/60">
                <kbd className="px-1 rounded bg-muted border border-border/60 font-mono">←</kbd>
                {' '}
                <kbd className="px-1 rounded bg-muted border border-border/60 font-mono">→</kbd>
                {' '}
                jump pages ·{' '}
                <kbd className="px-1 rounded bg-muted border border-border/60 font-mono">[</kbd>
                <kbd className="px-1 rounded bg-muted border border-border/60 font-mono">]</kbd>
                {' '}
                exercises ·{' '}
                <kbd className="px-1 rounded bg-muted border border-border/60 font-mono">+</kbd>
                <kbd className="px-1 rounded bg-muted border border-border/60 font-mono">−</kbd>
                {' '}
                zoom ·{' '}
                <kbd className="px-1 rounded bg-muted border border-border/60 font-mono">0</kbd>
                {' '}
                reset · bookmark from the page or the panel
              </p>
            )}
          </div>

          {!fullscreen && (
            <aside className="space-y-3 min-w-0">
              <Card>
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

              <Card className="border-primary/20">
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
                            pageCount={pageCount}
                            onChange={updateMapping}
                            onDelete={deleteMapping}
                            isCurrent={
                              currentPage >= mapping.pageStart && currentPage <= mapping.pageEnd
                            }
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
        />
      )}
    </CardContent>
  );
};

export default RepertoirePanel;
