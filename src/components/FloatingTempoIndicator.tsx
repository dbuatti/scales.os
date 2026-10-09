import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { useMetronome } from '@/context/MetronomeContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GripVertical, Minimize2, Maximize2, Target, Save, FileText } from 'lucide-react';
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
  const { currentBPM } = useGlobalBPM();
  const { setBeatsPerMeasure } = useMetronome();
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number } | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  return (
    <div
      ref={panelRef}
      style={style}
      className={cn(
        'fixed z-[90] w-[300px] rounded-xl border border-primary/30 bg-card/95 shadow-2xl backdrop-blur',
        collapsed ? 'w-auto' : '',
      )}
    >
      <div
        onPointerDown={onPointerDown}
        className="flex items-center justify-between gap-2 rounded-t-xl bg-primary/10 px-3 py-1.5 cursor-grab active:cursor-grabbing touch-none"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-primary/60 shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/70 shrink-0">
            Tempo
          </span>
          {collapsed && (
            <span className="text-xs font-bold truncate">{currentBPM} BPM</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-primary/70 hover:bg-primary/10 shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{exerciseLabel}</p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                <span className="rounded bg-primary/10 text-primary px-1 py-0.5 font-bold uppercase tracking-wider">
                  {mode}
                </span>
                <span>{timeSignature}</span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {page}/{pageCount}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Target
              </p>
              <p className="text-lg font-black text-primary leading-none flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                {targetBpm}
              </p>
            </div>
          </div>

          <Metronome showSettings={false} />

          <Button
            variant="outline"
            size="sm"
            onClick={onLog}
            className="w-full text-xs font-bold focus-scale"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Log Snapshot
          </Button>
        </div>
      )}
    </div>
  );
};

export default FloatingTempoIndicator;
