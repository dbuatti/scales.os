import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { useMetronome } from '@/context/MetronomeContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GripVertical, Minimize2, Maximize2, Target, Save, FileText, Play, Pause, ChevronDown, ChevronUp, Settings } from 'lucide-react';
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
}) => {
  const { currentBPM, handleBpmChange } = useGlobalBPM();
  const { isRunning, toggleRun, setBeatsPerMeasure, autoIncrementEnabled, setAutoIncrementEnabled, incrementAmount, setIncrementAmount, incrementEvery, setIncrementEvery } = useMetronome();
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number } | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expanded, setExpanded] = useState(false);

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

  // Color based on metronome state: green when running, muted when stopped
  const ringColor = isRunning ? 'text-emerald-500' : 'text-muted-foreground/40';
  const bgColor = isRunning ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-card/80 border-border/50';

  return (
    <div
      ref={panelRef}
      style={style}
      className={cn(
        'fixed z-[90] overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-200',
        collapsed ? 'w-auto' : 'w-[300px]',
        expanded ? 'w-[420px]' : '',
        bgColor,
      )}
    >
      {/* Drag handle / header */}
      <div
        onPointerDown={onPointerDown}
        className={cn(
          'flex items-center justify-between gap-2 rounded-t-2xl border-b border-border/40 px-3 py-2 cursor-grab active:cursor-grabbing touch-none',
          isRunning ? 'bg-emerald-500/10' : 'bg-primary/10'
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-primary/60 shrink-0" />
          {!collapsed && !expanded && (
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/70 shrink-0">
              Tempo
            </span>
          )}
          {collapsed && (
            <span className="text-xs font-bold tabular-nums text-foreground">{currentBPM} BPM</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Expand/collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={collapsed ? 'Expand tempo panel' : expanded ? 'Collapse to compact' : 'Expand to full menu'}
            className="h-6 w-6 text-primary/70 hover:bg-primary/10 shrink-0"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              if (collapsed) setCollapsed(false);
              else if (expanded) setExpanded(false);
              else setExpanded(true);
            }}
          >
            {collapsed ? <Maximize2 className="w-3.5 h-3.5" /> : expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
          {/* Collapse to minimal */}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Collapse to minimal"
              className="h-6 w-6 text-primary/70 hover:bg-primary/10 shrink-0"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setCollapsed(true)}
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Circular play/stop with BPM in middle - always visible when not collapsed */}
      {!collapsed && (
        <div className="p-4 pb-0">
          <div className="relative flex flex-col items-center gap-3">
            {/* Circular start/stop button with BPM in center */}
            <div className="relative">
              <div className={cn(
                'relative flex items-center justify-center rounded-full border-4 transition-all duration-200',
                isRunning
                  ? 'w-28 h-28 border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]'
                  : 'w-28 h-28 border-border/40 bg-card/50'
              )}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'w-20 h-20 rounded-full transition-all duration-150 focus-scale',
                    isRunning
                      ? 'bg-emerald-500 text-emerald-500-foreground hover:bg-emerald-600 shadow-lg shadow-emerald-500/30'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  )}
                  onClick={toggleRun}
                  aria-label={isRunning ? 'Stop metronome' : 'Start metronome'}
                >
                  {isRunning ? (
                    <Pause className="w-7 h-7" />
                  ) : (
                    <Play className="w-7 h-7 ml-1" />
                  )}
                </Button>
                {/* BPM in the center of the circle */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black tabular-nums tracking-tight text-foreground">
                    {currentBPM}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    BPM
                  </span>
                </div>
              </div>
              {/* Pulse ring when running */}
              {isRunning && (
                <div className="absolute inset-[-8px] rounded-full border-2 border-emerald-500/30 animate-ping pointer-events-none" />
              )}
            </div>

            {/* Target BPM display */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="w-3 h-3 text-primary/70" />
              <span className="font-bold text-foreground">{targetBpm}</span>
              <span className="text-muted-foreground/60">BPM target</span>
            </div>

            {/* Quick BPM adjust buttons */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleBpmChange(-5)}
                aria-label="Decrease by 5 BPM"
              >
                -5
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleBpmChange(-1)}
                aria-label="Decrease by 1 BPM"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleBpmChange(1)}
                aria-label="Increase by 1 BPM"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleBpmChange(5)}
                aria-label="Increase by 5 BPM"
              >
                +5
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded full menu */}
      {expanded && !collapsed && (
        <div className="space-y-4 p-4 border-t border-border/40 bg-background/50 animate-in slide-in-from-top-2 duration-200">
          <div className="h-px bg-border/60" />

          {/* Exercise info */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{exerciseLabel}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {mode}
                </span>
                <span className="tabular-nums">{timeSignature}</span>
                <span className="text-muted-foreground/60">·</span>
                <span className="flex items-center gap-1 tabular-nums">
                  <FileText className="h-3 w-3" />
                  {page}/{pageCount}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Target
              </span>
              <span className="flex items-center gap-1 text-xl font-black leading-none text-primary">
                <Target className="h-4 w-4" />
                {targetBpm}
                <span className="text-[10px] font-bold text-muted-foreground">BPM</span>
              </span>
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* Metronome with settings */}
          <Metronome showSettings={true} />

          <div className="h-px bg-border/60" />

          {/* Log snapshot button */}
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
          <div className="space-y-3 pt-2 border-t border-border/40">
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
        </div>
      )}

      {/* Minimal collapsed state - just the circular button */}
      {collapsed && (
        <div className="p-2">
          <div className="relative flex items-center justify-center">
            <div className={cn(
              'relative flex items-center justify-center rounded-full border-4 transition-all duration-200',
              isRunning
                ? 'w-20 h-20 border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]'
                : 'w-20 h-20 border-border/40 bg-card/50'
            )}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'w-14 h-14 rounded-full transition-all duration-150 focus-scale',
                  isRunning
                    ? 'bg-emerald-500 text-emerald-500-foreground hover:bg-emerald-600 shadow-lg shadow-emerald-500/30'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                )}
                onClick={toggleRun}
                aria-label={isRunning ? 'Stop metronome' : 'Start metronome'}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
              </Button>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black tabular-nums tracking-tight text-foreground">{currentBPM}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">BPM</span>
              </div>
            </div>
            {isRunning && (
              <div className="absolute inset-[-6px] rounded-full border-2 border-emerald-500/30 animate-ping pointer-events-none" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingTempoIndicator;