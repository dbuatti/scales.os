import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Music2, Loader2, CheckCircle, AlertCircle, MinusCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { PageMapping, createMappingId, createEmptyMapping, sortMappings } from '@/lib/repertoire';
import { ImportedFile, parseBPMsFromFilename, parseFilesFromClipboard, parseFilesFromDropboxText } from '@/lib/clipboard-import';

interface ClipboardImportProps {
  onImport: (files: ImportedFile[], mappings: PageMapping[]) => void;
  onClose: () => void;
}

export const ClipboardImport: React.FC<ClipboardImportProps> = ({ onImport, onClose }) => {
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bpmDecisions, setBpmDecisions] = useState<Record<string, { goalBPM: number; milestones: number[] }>>({});
  const [showBPMDialog, setShowBPMDialog] = useState<ImportedFile | null>(null);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // Try to get files from clipboard
      const items = e.clipboardData.items;
      if (items.length > 0) {
        const files = await parseFilesFromClipboard(items);
        setImportedFiles(files.filter(f => f.type === 'pdf' || f.type === 'audio'));
        setIsProcessing(false);
        return;
      }
      
      // Fallback: try to get text (for Dropbox folder listings)
      const text = e.clipboardData.getData('text');
      if (text) {
        const files = parseFilesFromDropboxText(text);
        setImportedFiles(files);
      }
    } catch (err) {
      showError('Failed to parse clipboard content');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleTextPaste = useCallback(() => {
    if (!pasteText.trim()) return;
    const files = parseFilesFromDropboxText(pasteText);
    setImportedFiles(files);
    setPasteText('');
  }, [pasteText]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setIsProcessing(true);
    try {
      const imported: ImportedFile[] = await Promise.all(
        files.map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          const bpmInfo = parseBPMsFromFilename(file.name);
          return {
            name: file.name,
            type: file.type === 'application/pdf' ? 'pdf' : file.type.startsWith('audio/') ? 'audio' : 'other',
            size: file.size,
            bpm: bpmInfo.highestBPM || undefined,
            bpmCandidates: bpmInfo.bpms,
            data: arrayBuffer,
            file,
          };
        })
      );
      setImportedFiles(imported.filter(f => f.type === 'pdf' || f.type === 'audio'));
    } catch (err) {
      showError('Failed to read files');
    } finally {
      setIsProcessing(false);
    }
    e.target.value = '';
  }, []);

  const handleBPMDecision = useCallback((fileName: string, goalBPM: number, milestones: number[]) => {
    setBpmDecisions(prev => ({
      ...prev,
      [fileName]: { goalBPM, milestones },
    }));
    setShowBPMDialog(null);
  }, []);

  const openBPMDialog = useCallback((file: ImportedFile) => {
    if (file.bpmCandidates.length > 1) {
      setShowBPMDialog(file);
    }
  }, []);

  const confirmImport = useCallback(() => {
    // Create placeholder mappings for PDFs
    const mappings: PageMapping[] = [];
    let pageOffset = 1;
    
    for (const file of importedFiles) {
      if (file.type === 'pdf' && file.data) {
        const decision = bpmDecisions[file.name] || { 
          goalBPM: file.bpm || 100, 
          milestones: file.bpmCandidates.filter(b => b !== file.bpm) 
        };
        
        const mapping: PageMapping = {
          ...createEmptyMapping(pageOffset),
          id: createMappingId(),
          pageStart: pageOffset,
          pageEnd: pageOffset,
          exerciseId: '',
          label: file.name.replace(/\.pdf$/i, ''),
          targetBpm: decision.goalBPM,
          timeSignature: '4/4',
          mode: 'technical',
        };
        mappings.push(mapping);
        pageOffset += 1; // Assume 1 page per PDF for placeholders
      }
    }
    
    onImport(importedFiles, sortMappings(mappings));
    onClose();
  }, [importedFiles, bpmDecisions, onImport, onClose]);

  const pdfFiles = importedFiles.filter(f => f.type === 'pdf');
  const audioFiles = importedFiles.filter(f => f.type === 'audio');
  const hasBPMDecisionsPending = pdfFiles.some(f => f.bpmCandidates.length > 1 && !bpmDecisions[f.name]);

  return (
    <div className="w-full space-y-5">
      <DialogHeader className="text-left">
        <DialogTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
          <span className="rounded-lg bg-primary/10 p-1.5 text-primary">
            <Upload className="h-4 w-4" />
          </span>
          Import from clipboard or Dropbox
        </DialogTitle>
        <DialogDescription className="text-xs">
          BPMs in filenames are detected automatically and become exercise targets.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {/* Paste area */}
        <div
          className={cn(
            'relative rounded-xl border border-dashed p-8 text-center transition-all duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            importedFiles.length > 0 ? 'border-border/60 bg-card/50' : 'border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10'
          )}
          onPaste={handlePaste}
        >
          <input
            type="file"
            multiple
            accept=".pdf,audio/*"
            aria-label="Choose PDF or audio files"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={handleFileInput}
            disabled={isProcessing}
          />
          
          {isProcessing ? (
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          ) : importedFiles.length > 0 ? (
            <p className="text-sm font-medium text-muted-foreground">
              Paste or click to add more files
            </p>
          ) : (
            <div className="space-y-3">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">
                Paste clipboard content or click to select files
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDFs, audio files, and Dropbox folder listings.
                BPMs in filenames will be auto-detected.
              </p>
            </div>
          )}
        </div>

        {/* Or paste text fallback */}
        <div className="space-y-2">
          <Label htmlFor="dropbox-listing" className="text-xs font-medium text-muted-foreground">
            Or paste a Dropbox folder listing as text
          </Label>
          <Textarea
            id="dropbox-listing"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="min-h-[80px] resize-none text-xs"
            placeholder="Paste Dropbox folder listing here…"
          />
          <Button
            variant="outline"
            size="sm"
            className="font-bold"
            onClick={handleTextPaste}
            disabled={!pasteText.trim() || isProcessing}
          >
            Parse text
          </Button>
        </div>

        {/* Imported files list */}
        {importedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Detected Files ({importedFiles.length})
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setImportedFiles([])}>
                Clear all
              </Button>
            </div>

            {pdfFiles.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-primary">PDFs ({pdfFiles.length})</h5>
                {pdfFiles.map((file) => (
                  <div
                    key={file.name}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-lg border p-3',
                      file.bpmCandidates.length > 1 && !bpmDecisions[file.name]
                        ? 'border-warning/50 bg-warning/5'
                        : 'border-border/60 bg-card'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(file.size / 1024)} KB
                          {file.bpmCandidates.length > 0 && (
                            <>
                              {' · '}
                              <span className={cn(
                                'font-bold',
                                file.bpmCandidates.length > 1 && !bpmDecisions[file.name]
                                  ? 'text-warning'
                                  : 'text-success'
                              )}>
                                {file.bpmCandidates.join(', ')} BPM
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {file.bpmCandidates.length > 1 && !bpmDecisions[file.name] && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => openBPMDialog(file)}
                        >
                          Set BPMs
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setImportedFiles(prev => prev.filter(f => f.name !== file.name))}
                      >
                        <MinusCircle className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {audioFiles.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Audio Files ({audioFiles.length})
                </h5>
                {audioFiles.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Music2 className="w-5 h-5 text-success shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.bpmCandidates.length > 0 && (
                            <span className="font-bold text-success">
                              {file.bpmCandidates.join(', ')} BPM
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setImportedFiles(prev => prev.filter(f => f.name !== file.name))}
                    >
                      <MinusCircle className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* BPM decision dialog */}
            <Dialog open={!!showBPMDialog} onOpenChange={(open) => !open && setShowBPMDialog(null)}>
              <DialogContent className="rounded-xl sm:max-w-md">
                {showBPMDialog && (() => {
                  const candidates = showBPMDialog.bpmCandidates;
                  const highest = candidates[candidates.length - 1];
                  return (
                    <>
                      <DialogHeader className="text-left">
                        <DialogTitle className="text-base font-bold tracking-tight">
                          Set BPMs for &ldquo;{showBPMDialog.name}&rdquo;
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                          Detected BPMs: <span className="font-bold text-foreground">{candidates.join(', ')}</span>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Goal BPM (highest)
                          </Label>
                          <Select
                            onValueChange={(value) => {
                              const goal = parseInt(value, 10);
                              const milestones = candidates.filter(b => b !== goal);
                              handleBPMDecision(showBPMDialog.name, goal, milestones);
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={`${highest} BPM (highest)`} />
                            </SelectTrigger>
                            <SelectContent>
                              {candidates.map((bpm) => (
                                <SelectItem key={bpm} value={String(bpm)}>
                                  {bpm} BPM {bpm === highest ? '(highest)' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Milestone BPMs (optional)
                          </Label>
                          <div className="flex flex-wrap gap-1.5">
                            {candidates.filter(b => b !== highest).map((bpm) => (
                              <Button
                                key={bpm}
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="h-8 bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20"
                                onClick={() => {
                                  const milestones = candidates.filter(b => b !== highest && b !== bpm);
                                  handleBPMDecision(showBPMDialog.name, highest, milestones);
                                }}
                              >
                                {bpm} BPM
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button variant="secondary" className="w-full" onClick={() => setShowBPMDialog(null)}>
                        Cancel
                      </Button>
                    </>
                  );
                })()}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Confirm button */}
        {importedFiles.length > 0 && (
          <Button
            className="w-full"
            size="lg"
            onClick={confirmImport}
            disabled={isProcessing || hasBPMDecisionsPending}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : hasBPMDecisionsPending ? (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Set BPMs for all files
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Create Placeholders & Import ({pdfFiles.length} PDFs)
              </>
            )}
          </Button>
        )}

        {importedFiles.length === 0 && !isProcessing && (
          <p className="text-center text-xs text-muted-foreground">
            PDF placeholders will be created with detected BPMs as targets.
            Drag them into your practice reader to load the actual files.
          </p>
        )}
      </div>
    </div>
  );
};

export default ClipboardImport;