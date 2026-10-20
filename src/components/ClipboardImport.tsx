import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Music2, Loader2, CheckCircle, AlertCircle, MinusCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { PageMapping, createMappingId, createEmptyMapping, sortMappings } from '@/lib/repertoire';

export interface ImportedFile {
  name: string;
  type: 'pdf' | 'audio' | 'other';
  size: number;
  bpm?: number;
  bpmCandidates: number[];
  data?: ArrayBuffer;
  file?: File;
}

interface ParsedBPMInfo {
  bpms: number[];
  highestBPM: number;
  suggestedGoalBPM: number;
  suggestedMilestones: number[];
}

export function parseBPMsFromFilename(filename: string): ParsedBPMInfo {
  // Common patterns for BPMs in filenames:
  // - "Song_120bpm.pdf"
  // - "Piece_100_120_140.mp3"
  // - "Etude @ 110 BPM.pdf"
  // - "Exercise (120bpm).pdf"
  // - "120-140-160 Song Name.pdf"
  // - "Song [120 BPM].pdf"
  
  const patterns = [
    /(\d{2,3})\s*(?:bpm|BPM)/gi,           // 120bpm, 120 BPM
    /(\d{2,3})\s*(?:@|-)\s*(?:bpm|BPM)?/gi, // @ 120, - 120bpm
    /\[(\d{2,3})\s*(?:bpm|BPM)?\]/gi,      // [120], [120 BPM]
    /\((\d{2,3})\s*(?:bpm|BPM)?\)/gi,      // (120), (120 BPM)
    /_(\d{2,3})_/g,                         // _120_
    /^(\d{2,3})[\s_-]/g,                    // 120 Song
    /[\s_-](\d{2,3})[\s_-]/g,               // - 120 -, _ 120 _
  ];
  
  const allBPMs: number[] = [];
  
  for (const pattern of patterns) {
    const matches = filename.matchAll(pattern);
    for (const match of matches) {
      const bpm = parseInt(match[1], 10);
      if (bpm >= 30 && bpm <= 300) {
        allBPMs.push(bpm);
      }
    }
  }
  
  // Deduplicate and sort
  const uniqueBPMs = [...new Set(allBPMs)].sort((a, b) => a - b);
  
  if (uniqueBPMs.length === 0) {
    return { bpms: [], highestBPM: 0, suggestedGoalBPM: 0, suggestedMilestones: [] };
  }
  
  const highestBPM = uniqueBPMs[uniqueBPMs.length - 1];
  const suggestedGoalBPM = highestBPM;
  const suggestedMilestones = uniqueBPMs.slice(0, -1); // All but the highest
  
  return {
    bpms: uniqueBPMs,
    highestBPM,
    suggestedGoalBPM,
    suggestedMilestones,
  };
}

export function parseFilesFromClipboard(items: DataTransferItemList): Promise<ImportedFile[]> {
  const promises: Promise<ImportedFile>[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) {
        promises.push(
          (async () => {
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
          })()
        );
      }
    }
  }
  
  return Promise.all(promises);
}

export function parseFilesFromDropboxText(text: string): ImportedFile[] {
  // Parse Dropbox folder listing text format
  // Typical format: "filename.pdf (size) - modified date"
  const lines = text.split('\n').filter(l => l.trim());
  const files: ImportedFile[] = [];
  
  for (const line of lines) {
    // Try to extract filename from various Dropbox export formats
    let filename = line.trim();
    
    // Remove size/date suffixes like " (1.2 MB) - Jan 15, 2024"
    filename = filename.replace(/\s+\([\d.]+\s*(?:KB|MB|GB)\)\s*[-–—]\s*.*$/, '');
    filename = filename.replace(/\s+[-–—]\s*\d{1,2}\s+\w+\s+\d{4}.*$/, '');
    
    if (filename && (filename.endsWith('.pdf') || filename.match(/\.(mp3|wav|m4a|flac|ogg)$/i))) {
      const bpmInfo = parseBPMsFromFilename(filename);
      files.push({
        name: filename,
        type: filename.endsWith('.pdf') ? 'pdf' : 'audio',
        size: 0,
        bpm: bpmInfo.highestBPM || undefined,
        bpmCandidates: bpmInfo.bpms,
      });
    }
  }
  
  return files;
}

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
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="w-4 h-4 text-primary" />
          Import from Clipboard / Dropbox
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Paste area */}
        <div
          className={cn(
            'relative rounded-xl border-2 border-dashed p-6 text-center transition-colors',
            importedFiles.length > 0 ? 'border-border/60 bg-card/50' : 'border-primary/40 bg-primary/5'
          )}
          onPaste={handlePaste}
        >
          <input
            type="file"
            multiple
            accept=".pdf,audio/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileInput}
            disabled={isProcessing}
          />
          
          {importedFiles.length === 0 && !isProcessing ? (
            <div className="space-y-3">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                Paste clipboard content or click to select files
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDFs, audio files, and Dropbox folder listings.
                BPMs in filenames will be auto-detected.
              </p>
            </div>
          ) : (
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
          )}
          
          {/* Or paste text fallback */}
          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-xs text-muted-foreground mb-2">Or paste Dropbox folder listing as text:</p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              onPaste={(e) => {
                // Allow paste to go to parent handler
                e.stopPropagation();
              }}
              className="w-full min-h-[80px] rounded-md border border-border/60 bg-background px-3 py-2 text-xs font-mono resize-none focus:ring-2 focus:ring-ring"
              placeholder="Paste Dropbox folder listing here..."
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleTextPaste}
              disabled={!pasteText.trim() || isProcessing}
            >
              Parse Text
            </Button>
          </div>
        </div>

        {/* Imported files list */}
        {importedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Detected Files ({importedFiles.length})
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setImportedFiles([])}>
                Clear All
              </Button>
            </div>

            {pdfFiles.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-widest text-primary">PDFs ({pdfFiles.length})</h5>
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
                        <p className="text-[11px] text-muted-foreground">
                          {Math.round(file.size / 1024)} KB
                          {file.bpmCandidates.length > 0 && (
                            <>
                              {' · '}
                              <span className={cn(
                                'font-bold',
                                file.bpmCandidates.length > 1 && !bpmDecisions[file.name]
                                  ? 'text-warning'
                                  : 'text-emerald-500'
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
                <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Audio Files ({audioFiles.length})
                </h5>
                {audioFiles.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Music2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {file.bpmCandidates.length > 0 && (
                            <span className="font-bold text-emerald-500">
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
            {showBPMDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="w-full max-w-md rounded-xl border bg-card p-5 shadow-2xl animate-in slide-in-from-top-4">
                  <h4 className="text-sm font-bold mb-3">Set BPMs for "{showBPMDialog.name}"</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Detected BPMs: <span className="font-bold text-foreground">{showBPMDialog.bpmCandidates.join(', ')}</span>
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Goal BPM (highest)
                      </Label>
                      <select
                        defaultValue={showBPMDialog.bpmCandidates[showBPMDialog.bpmCandidates.length - 1]}
                        className="mt-1 w-full h-8 rounded-lg border border-border/60 bg-background px-2 text-sm focus:ring-2 focus:ring-ring"
                        onChange={(e) => {
                          const goal = parseInt(e.target.value, 10);
                          const milestones = showBPMDialog.bpmCandidates.filter(b => b !== goal);
                          handleBPMDecision(showBPMDialog.name, goal, milestones);
                        }}
                      >
                        {showBPMDialog.bpmCandidates.map((bpm) => (
                          <option key={bpm} value={bpm}>
                            {bpm} BPM {bpm === showBPMDialog.bpmCandidates[showBPMDialog.bpmCandidates.length - 1] ? '(highest)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Milestone BPMs (optional)
                      </Label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {showBPMDialog.bpmCandidates.filter(b => b !== showBPMDialog.bpmCandidates[showBPMDialog.bpmCandidates.length - 1]).map((bpm) => (
                          <button
                            key={bpm}
                            type="button"
                            className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary hover:bg-primary/20"
                            onClick={() => {
                              const goal = showBPMDialog.bpmCandidates[showBPMDialog.bpmCandidates.length - 1];
                              const milestones = showBPMDialog.bpmCandidates.filter(b => b !== goal && b !== bpm);
                              handleBPMDecision(showBPMDialog.name, goal, milestones);
                            }}
                          >
                            {bpm} BPM
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button variant="secondary" className="mt-4 w-full" onClick={() => setShowBPMDialog(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
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
      </CardContent>
    </Card>
  );
};

export default ClipboardImport;