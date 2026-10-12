import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Minus, Plus, Target } from 'lucide-react';
import { MIN_BPM, MAX_BPM } from '@/lib/scales';
import { clampBpm, TEMPO_PRESETS } from '@/lib/tempo';

interface TempoControlProps {
  value: number;
  onChange: (bpm: number) => void;
  onStep: (delta: number) => void;
  target?: number | null;
  compact?: boolean;
}

const TempoControl: React.FC<TempoControlProps> = ({
  value,
  onChange,
  onStep,
  target,
  compact = false,
}) => {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commitDraft = () => {
    const parsed = parseInt(draft, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    onChange(clampBpm(parsed));
  };

  const numberInput = (
    <Input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commitDraft}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      type="number"
      min={MIN_BPM}
      max={MAX_BPM}
      className={
        compact
          ? 'h-9 w-12 border-0 bg-transparent px-1 text-center text-base font-black tabular-nums'
          : 'h-14 w-full text-center text-3xl font-black tabular-nums'
      }
      aria-label="Tempo in BPM"
    />
  );

  if (compact) {
    return (
      <div className="flex shrink-0 items-center rounded-lg border bg-card/50 p-0.5">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 font-bold tabular-nums"
          onClick={() => onStep(-5)}
          aria-label="Decrease by 5 BPM"
        >
          -5
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => onStep(-1)}
          aria-label="Decrease by 1 BPM"
        >
          <Minus className="h-4 w-4" />
        </Button>
        {numberInput}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => onStep(1)}
          aria-label="Increase by 1 BPM"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 font-bold tabular-nums"
          onClick={() => onStep(5)}
          aria-label="Increase by 5 BPM"
        >
          +5
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <div className="w-full max-w-[150px]">{numberInput}</div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            BPM
          </span>
        </div>
        {typeof target === 'number' && target > 0 && (
          <div className="flex shrink-0 flex-col items-end text-right">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Target
            </span>
            <span className="flex items-center gap-1 text-sm font-bold text-primary">
              <Target className="h-3.5 w-3.5" />
              {target} BPM
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-10 font-bold tabular-nums"
          onClick={() => onStep(-5)}
          aria-label="Decrease by 5 BPM"
        >
          -5
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-10"
          onClick={() => onStep(-1)}
          aria-label="Decrease by 1 BPM"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-10"
          onClick={() => onStep(1)}
          aria-label="Increase by 1 BPM"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-10 font-bold tabular-nums"
          onClick={() => onStep(5)}
          aria-label="Increase by 5 BPM"
        >
          +5
        </Button>
      </div>

      <Slider
        value={[clampBpm(value)]}
        onValueChange={([next]) => onChange(clampBpm(next))}
        min={MIN_BPM}
        max={MAX_BPM}
        step={1}
        aria-label="Tempo slider"
      />

      <div className="grid grid-cols-5 gap-1.5">
        {TEMPO_PRESETS.map((preset) => (
          <Button
            key={preset}
            variant={value === preset ? 'default' : 'outline'}
            size="sm"
            className="h-8 px-0 text-[11px] font-bold tabular-nums"
            onClick={() => onChange(preset)}
          >
            {preset}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TempoControl;
