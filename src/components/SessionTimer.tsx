import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Timer, Play, Pause, RotateCcw, Check } from 'lucide-react';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { useScales } from '@/context/ScalesContext';
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface SessionTimerProps {
  seconds: number;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const formatTimer = (total: number) => {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const SessionTimer: React.FC<SessionTimerProps> = ({ seconds, isRunning, onStart, onPause, onReset }) => {
  const { currentBPM } = useGlobalBPM();
  const { addLogEntry } = useScales();
  const [lastLogged, setLastLogged] = useState<number | null>(null);

  const handleStart = () => {
    setLastLogged(null);
    onStart();
  };

  const handleLog = () => {
    const minutes = Math.round(seconds / 60);
    if (minutes > 0) {
      addLogEntry({
        durationMinutes: minutes,
        itemsPracticed: [],
        notes: `General timed practice session logged. Focused BPM: ${currentBPM}`,
      });
      showSuccess(`Logged ${minutes} minutes of practice.`);
      setLastLogged(minutes);
    }
    onPause();
  };

  const handleReset = () => {
    setLastLogged(null);
    onReset();
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          Session
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="tnum text-xl font-black tabular-nums leading-none tracking-tight text-foreground">
            {formatTimer(seconds)}
          </span>
          {seconds > 0 && (
            <span className="text-[10px] font-bold text-muted-foreground">
              {Math.round(seconds / 60)}m
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {isRunning ? (
          <Button variant="secondary" size="sm" onClick={onPause} className="h-8 flex-1 font-bold focus-scale">
            <Pause className="mr-1.5 h-3.5 w-3.5" /> Pause
          </Button>
        ) : (
          <Button size="sm" onClick={handleStart} className="h-8 flex-1 font-bold focus-scale">
            <Play className="mr-1.5 h-3.5 w-3.5" /> Start
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={seconds === 0}
          onClick={handleLog}
          title="Log this timed session"
          className={cn(
            'h-8 px-2.5 text-xs font-bold focus-scale',
            lastLogged !== null
              ? 'border-success/20 bg-success/10 text-success'
              : 'text-muted-foreground',
          )}
        >
          {lastLogged !== null ? (
            <>
              <Check className="mr-1 h-3.5 w-3.5" />
              {lastLogged}m
            </>
          ) : (
            <>
              <RotateCcw className="mr-1 h-3 w-3" />
              Log
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={seconds === 0 && !isRunning}
          title="Reset timer"
          aria-label="Reset session timer"
          className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive focus-scale"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default SessionTimer;