import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListMusic, Trash2 } from 'lucide-react';
import { PageMapping, EXERCISE_OPTIONS, TIME_SIGNATURES, MODE_LABELS, RepertoireMode, getMappingOverlaps } from '@/lib/repertoire';

interface MappingRowProps {
  mapping: PageMapping;
  allMappings: PageMapping[];
  pageCount: number;
  onChange: (id: string, patch: Partial<PageMapping>) => void;
  onDelete: (id: string) => void;
  isCurrent: boolean;
}

const MappingRow: React.FC<MappingRowProps> = ({ mapping, allMappings, pageCount, onChange, onDelete, isCurrent }) => {
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
          title="Delete bookmark"
          aria-label={`Delete bookmark for pages ${mapping.pageStart}${mapping.pageEnd !== mapping.pageStart ? `–${mapping.pageEnd}` : ''}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
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

        {overlaps.length > 0 && (
          <div className="col-span-2 space-y-1">
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
    </div>
  );
};

export default MappingRow;