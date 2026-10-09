import React, { useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Clock,
  FileText,
  HardDrive,
  Loader2,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { SavedDocument } from '@/hooks/use-repertoire-data';
import { getLastOpenedDocumentId } from '@/lib/repertoire';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface LibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: SavedDocument[];
  isLoading: boolean;
  isCloudEnabled: boolean;
  activeDocumentId: string | null;
  isUploading: boolean;
  onSelect: (doc: SavedDocument) => void;
  onDelete: (doc: SavedDocument) => void;
  onUpload: (file: File) => void;
}

const LibraryDialog: React.FC<LibraryDialogProps> = ({
  open,
  onOpenChange,
  documents,
  isLoading,
  isCloudEnabled,
  activeDocumentId,
  isUploading,
  onSelect,
  onDelete,
  onUpload,
}) => {
  const [filter, setFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const lastId = getLastOpenedDocumentId();

  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter((d) => d.title.toLowerCase().includes(term));
  }, [documents, filter]);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onUpload(file);
    event.target.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Your Library
          </DialogTitle>
          <DialogDescription>
            Open, upload, or remove your method-book PDFs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search library…"
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {!isCloudEnabled && (
            <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning-foreground">
              <HardDrive className="h-3.5 w-3.5" />
              Not signed in — PDFs stay in this browser only.
            </div>
          )}

          <ScrollArea className="max-h-[60vh] pr-3">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading library…
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {filter ? `No documents match "${filter}".` : 'No PDFs yet.'}
                </p>
                {!filter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload your first PDF
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((doc) => {
                  const isActive = doc.id === activeDocumentId;
                  const isLast = doc.id === lastId;
                  return (
                    <div
                      key={doc.id}
                      className={cn(
                        'group flex items-center gap-2 rounded-lg border p-3 transition-colors',
                        isActive
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border/60 hover:border-primary/30',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(doc)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold">
                              {doc.title}
                            </span>
                            {isLast && (
                              <Badge className="text-[9px]">Continue</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                            <span className="tabular-nums">{doc.page_count}p</span>
                            <span>·</span>
                            <span className="tabular-nums">
                              p.{doc.last_viewed_page}
                            </span>
                            {doc.created_at && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(doc.created_at), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(doc)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LibraryDialog;
