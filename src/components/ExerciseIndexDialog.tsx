import React from 'react';
import { ChevronRight, ListMusic } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PageMapping, sortMappings } from '@/lib/repertoire';

interface ExerciseIndexDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mappings: PageMapping[];
  currentPage: number;
  onSelect: (mapping: PageMapping) => void;
}

/** Table of contents for the mapped exercises in the open method book. */
const ExerciseIndexDialog: React.FC<ExerciseIndexDialogProps> = ({
  open,
  onOpenChange,
  mappings,
  currentPage,
  onSelect,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex max-h-[80vh] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-lg">
      <DialogHeader className="border-b border-border/60 px-5 py-4 text-left">
        <DialogTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
          <span className="rounded-lg bg-primary/10 p-1.5 text-primary">
            <ListMusic className="h-4 w-4" />
          </span>
          Exercise index
        </DialogTitle>
        <DialogDescription className="text-xs">
          Choose an exercise to jump to its first page.
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {sortMappings(mappings).map((mapping) => {
          const isCurrent = currentPage >= mapping.pageStart && currentPage <= mapping.pageEnd;
          return (
            <button
              key={mapping.id}
              type="button"
              onClick={() => onSelect(mapping)}
              aria-current={isCurrent ? 'true' : undefined}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isCurrent
                  ? 'border-primary/50 bg-primary/10 shadow-sm'
                  : 'border-border/60 bg-card/50 hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm',
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-black tabular-nums text-primary">
                  {mapping.pageStart}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">
                    {mapping.label || mapping.exerciseId || `Page ${mapping.pageStart}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mapping.mode === 'technical' ? 'Technical' : 'Repertoire'}
                    {mapping.targetBpm > 0 && (
                      <span className="ml-1.5 font-medium text-primary">· {mapping.targetBpm} BPM goal</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {isCurrent && <Badge variant="secondary" className="text-[10px] text-primary">Current</Badge>}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          );
        })}
      </div>
    </DialogContent>
  </Dialog>
);

export default ExerciseIndexDialog;
