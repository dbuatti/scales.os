import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  ListMusic,
  X,
  Cloud,
  HardDrive,
  Loader2,
} from 'lucide-react';
import PdfViewer from './PdfViewer';
import FloatingTempoIndicator from './FloatingTempoIndicator';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { useScales } from '@/context/ScalesContext';
import { shallowEqual } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { useRepertoireData, SavedDocument } from '@/hooks/use-repertoire-data';
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
} from '@/lib/repertoire';

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
  } = useRepertoireData();

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [localDocumentId, setLocalDocumentId] = useState<string | null>(null);
  const [localTitle, setLocalTitle] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [mappings, setMappings] = useState<PageMapping[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
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
    async (doc: SavedDocument) => {
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
        setSource(url);
        setPageCount(doc.page_count || 0);
        setCurrentPage(doc.last_viewed_page || 1);
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
      setSource(null);
      setPageCount(0);
      setCurrentPage(1);
      setMappings([]);
      return;
    }
    const doc = documents.find((d) => d.id === value);
    if (doc) loadDocument(doc);
  };

  const handleDeleteDocument = async () => {
    if (!selectedDoc) return;
    if (!window.confirm(`Delete "${selectedDoc.title}" and its mappings?`)) return;
    await deleteDocument(selectedDoc);
    handleSelectDocument('');
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

  const addMappingForPage = useCallback(() => {
    if (mappings.some((m) => currentPage >= m.pageStart && currentPage <= m.pageEnd)) {
      showError(`Page ${currentPage} is already mapped.`);
      return;
    }
    persist([...mappings, createEmptyMapping(currentPage)]);
    showSuccess(`Added mapping starting at page ${currentPage}.`);
  }, [mappings, currentPage, persist]);

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

  const currentMapping = getMappingForPage(mappings, currentPage);

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

      <div className="flex flex-col gap-4 rounded-lg border border-primary/30 bg-secondary/50 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <Label className="text-lg font-semibold text-primary font-mono text-glow flex items-center gap-2">
            <Music2 className="w-4 h-4" />
            REPERTOIRE &amp; TECHNICAL
          </Label>
          <p className="text-xs text-muted-foreground italic text-primary/70">
            Load a full method book once, then map page ranges to exercises. The floating
            tempo panel follows the page you are viewing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedDocId ?? ''} onValueChange={handleSelectDocument}>
            <SelectTrigger className="w-[240px] h-9 text-xs">
              <SelectValue
                placeholder={activeTitle ?? (isLoadingDocuments ? 'Loading…' : 'My library')}
              />
            </SelectTrigger>
            <SelectContent className="max-h-[320px]">
              {documents.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">No saved PDFs yet.</div>
              )}
              {documents.map((doc) => (
                <SelectItem key={doc.id} value={doc.id} className="text-xs">
                  {doc.title}
                  <span className="ml-2 text-muted-foreground">p.{doc.last_viewed_page}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
        <PdfViewer source={null} mappings={[]} />
      ) : (
        <div className="space-y-6">
          <PdfViewer
            source={source}
            mappings={mappings}
            onPageChange={handlePageChange}
            onDocumentLoaded={handleDocumentLoaded}
            initialPage={selectedDoc?.last_viewed_page ?? 1}
          />

          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ListMusic className="w-4 h-4" />
                  Page Mappings
                </CardTitle>
                <Button size="sm" onClick={addMappingForPage} className="font-bold focus-scale">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Map page {currentPage}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mappings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No mappings yet. Scroll to an exercise's first page and click
                  <span className="font-bold text-primary"> Map page {currentPage}</span>.
                </p>
              ) : (
                <ScrollArea className="max-h-[420px] pr-3">
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
