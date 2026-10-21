import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { useMetronome } from '@/context/MetronomeContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GripVertical, Minimize2, Maximize2, Target, Save, FileText, Play, Pause, ChevronDown, ChevronUp, X } from 'lucide-react';
import Metronome from './Metronome';

interface FloatingTempoIndicatorProps {
  exerciseLabel: string;
  targetBpm: number;
  timeSignature: string;
  page: number;
  pageCount: number;
  mode: string;
  beatsPerMeasure: number;
  onLog: () => void;
  onTargetBpmChange?: (bpm: number) => void;
}

const FloatingTempoIndicator: React.FC<FloatingTempoIndicatorProps> = ({
  exerciseLabel,
  targetBpm,
  timeSignature,
  page,
  pageCount,
  mode,
  beatsPerMeasure,
  onLog,
  onTargetBpmChange,
}) => {
  const { currentBPM, handleBpmChange } = useGlobalBPM();
  const { isRunning, toggleRun, setBeatsPerMeasure, autoIncrementEnabled, setAutoIncrementEnabled, incrementAmount, setIncrementAmount, incrementEvery, setIncrementEvery } = useMetronome();
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number } | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [targetDraft, setTargetDraft] = useState(String(targetBpm));

  useEffect(() => {
    setTargetDraft(String(targetBpm));
  }, [targetBpm]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    setBeatsPerMeasure(beatsPerMeasure);
    return () => setBeatsPerMeasure(4);
  }, [beatsPerMeasure, setBeatsPerMeasure]);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    if (!panelRef.current) return;
    event.preventDefault();
    const rect = panelRef.current.getBoundingClientRect();
    dragOffsetRef.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };

    const handleMove = (moveEvent: PointerEvent) => {
      const offset = dragOffsetRef.current;
      if (!offset) return;
      const width = panelRef.current?.offsetWidth ?? 300;
      const height = panelRef.current?.offsetHeight ?? 120;
      const maxX = window.innerWidth - width - 8;
      const maxY = window.innerHeight - height - 8;
      setPosition({
        x: Math.min(maxX, Math.max(0, moveEvent.clientX - offset.dx)),
        y: Math.min(maxY, Math.max(0, moveEvent.clientY - offset.dy)),
      });
    };

    const handleUp = () => {
      dragOffsetRef.current = null;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        const width = panelRef.current?.offsetWidth ?? 300;
        const height = panelRef.current?.offsetHeight ?? 120;
        return {
          x: Math.min(prev.x, Math.max(0, window.innerWidth - width - 8)),
          y: Math.min(prev.y, Math.max(0, window.innerHeight - height - 8)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const style: React.CSSProperties = position
    ? { left: position.x, top: position.y }
    : { right: 16, bottom: isMobile ? 84 : 24 };

  // Color based on metronome state
  const ringColor = isRunning ? 'border-emerald-500/50' : 'border-border/40';
  const bgColor = isRunning ? 'bg-emerald-500/5' : 'bg-card/90';

  if (collapsed) {
    return (
      <div
        ref={panelRef}
        style={style}
        className={cn(
          'fixed z-[90] flex items-center gap-2 rounded-full border shadow-2xl backdrop-blur-xl px-3 py-2 cursor-grab active:cursor-grabbing',
          bgColor,
          ringColor,
        )}
        onPointerDown={onPointerDown}
      >
        {/* Circular start/stop with BPM inside */}
        <div className={cn(
          'relative flex items-center justify-center rounded-full border-2 transition-all duration-200 w-14 h-14',
          isRunning ? 'border-emerald-500 bg-emerald-500/20' : 'border-border/60 bg-card/50'
        )}>
          <button
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 focus:outline-none',
              isRunning
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            )}
            onClick={toggleRun}
            aria-label={isRunning ? 'Stop metronome' : 'Start metronome'}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          {/* BPM inside circle */}
          <span className="absolute bottom-0.5 text-[8px] font-black tabular-nums text-foreground leading-none pointer-events-none">
            {currentBPM}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setCollapsed(false)}
          aria-label="Expand"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      style={style}
      className={cn(
        'fixed z-[90] overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-200',
        expanded ? 'w-[480px]' : 'w-[340px]',
        bgColor,
      )}
    >
      {/* Header - drag handle */}
      <div
        onPointerDown={onPointerDown}
        className={cn(
          'flex items-center justify-between gap-2 px-3 py-1.5 cursor-grab active:cursor-grabbing touch-none border-b border-border/40',
          isRunning ? 'bg-emerald-500/10' : 'bg-primary/5'
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">
            {exerciseLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setCollapsed(true)}
            aria-label="Minimize"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Main content - horizontal layout */}
      <div className="p-3 space-y-3">
        {/* Top row: Circle + BPM + Target + Controls */}
        <div className="flex items-center gap-3">
          {/* Circular start/stop with BPM inside */}
          <div className={cn(
            'relative flex items-center justify-center rounded-full border-2 transition-all duration-200 shrink-0 w-16 h-16',
            isRunning ? 'border-emerald-500 bg-emerald-500/20' : 'border-border/60 bg-card/50'
          )}>
            <button
              className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 focus:outline-none',
                isRunning
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              )}
              onClick={toggleRun}
              aria-label={isRunning ? 'Stop metronome' : 'Start metronome'}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            {/* BPM inside circle */}
            <span className="absolute bottom-1 text-[9px] font-black tabular-nums text-foreground leading-none pointer-events-none bg-background/80 px-1 rounded">
              {currentBPM}
            </span>
            {isRunning && (
              <div className="absolute inset-[-4px] rounded-full border-2 border-emerald-500/30 animate-ping pointer-events-none" />
            )}
          </div>

          {/* BPM controls column */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            {/* Target BPM - editable */}
            <div className="flex items-center gap-1.5 text-xs" title="Set your goal BPM for this exercise. Auto-nudge caps at this + 2 BPM.">
              <Target className={cn('w-3 h-3 shrink-0', targetBpm > 0 ? 'text-primary/70' : 'text-warning animate-pulse')} />
              <span className="text-muted-foreground/60">Goal</span>
              {targetBpm <= 0 || targetBpm === 60 ? (
                <span className="text-[10px] text-warning font-medium">Set target!</span>
              ) : null}
              {onTargetBpmChange ? (
                <input
                  type="number"
                  value={targetDraft}
                  onChange={(e) => setTargetDraft(e.target.value)}
                  onBlur={() => {
                    const val = parseInt(targetDraft, 10);
                    if (!isNaN(val) && val >= 40 && val <= 250) {
                      onTargetBpmChange(val);
                    } else {
                      setTargetDraft(String(targetBpm));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                  className="w-14 h-6 text-xs font-bold text-foreground tabular-nums bg-background/50 border border-border/60 rounded px-1 text-center focus:ring-1 focus:ring-ring focus:border-primary"
                  min={40}
                  max={250}
                  aria-label="Goal BPM"
                />
              ) : (
                <span className="font-bold text-foreground tabular-nums">{targetBpm}</span>
              )}
              <span className="text-muted-foreground/60 text-[10px]">BPM</span>
            </div>
            
            {/* Quick adjust buttons */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7 text-xs" onClick={() => handleBpmChange(-5)} aria-label="Down 5">
                -5
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleBpmChange(-1)} aria-label="Down 1">
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleBpmChange(1)} aria-label="Up 1">
                <ChevronUp className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 text-xs" onClick={() => handleBpmChange(5)} aria-label="Up 5">
                +5
              </Button>
            </div>
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums flex-wrap">
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            {mode}
          </span>
          <span>{timeSignature}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {page}/{pageCount}
          </span>
        </div>

        {/* Expanded section */}
        {expanded && (
          <>
            <div className="h-px bg-border/60" />
            <Metronome showSettings={true} />
            <div className="h-px bg-border/60" />
            <Button
              variant="secondary"
              size="sm"
              onClick={onLog}
              className="w-full font-bold focus-scale"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Log Snapshot
            </Button>
            {/* Auto-increment settings */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <label className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
                <span>Auto-increment BPM</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setAutoIncrementEnabled(!autoIncrementEnabled)}
                  aria-label={autoIncrementEnabled ? 'Disable auto-increment' : 'Enable auto-increment'}
                >
                  {autoIncrementEnabled ? (
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-border" />
                  )}
                </Button>
              </label>
              {autoIncrementEnabled && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Increment by
                    </label>
                    <select
                      value={incrementAmount}
                      onChange={(e) => setIncrementAmount(parseInt(e.target.value, 10))}
                      className="w-full h-8 rounded-lg border border-border/60 bg-background/50 px-2 text-xs text-foreground focus:ring-2 focus:ring-ring"
                    >
                      {[1, 2, 3, 5].map((v) => (
                        <option key={v} value={v}>{v} BPM</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Every
                    </label>
                    <select
                      value={incrementEvery}
                      onChange={(e) => setIncrementEvery(parseInt(e.target.value, 10))}
                      className="w-full h-8 rounded-lg border border-border/60 bg-background/50 px-2 text-xs text-foreground focus:ring-2 focus:ring-ring"
                    >
                      {[2, 4, 8, 16].map((v) => (
                        <option key={v} value={v}>{v} measures</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FloatingTempoIndicator;