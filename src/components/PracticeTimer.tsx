import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, LogIn, Target } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface PracticeTimerProps {
  onLogSession: (durationMinutes: number) => void;
  isCondensed?: boolean;
}

const GOAL_OPTIONS = [15, 30, 45, 60];

const PracticeTimer: React.FC<PracticeTimerProps> = ({ onLogSession, isCondensed = false }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionGoal, setSessionGoal] = useState<number | null>(null);

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
  };

  const handleLog = () => {
    if (time === 0) return;
    const durationMinutes = Math.round(time / 60);
    onLogSession(durationMinutes);
    showSuccess(`Logged ${durationMinutes} minutes of practice.`);
    handleReset();
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning]);

  const progress = sessionGoal ? Math.min(100, (time / (sessionGoal * 60)) * 100) : 0;

  if (isCondensed) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
                <div className="min-w-[60px] text-center text-lg font-bold tabular-nums tracking-tight">
                    {formatTime(time)}
                </div>
                {sessionGoal && (
                    <Progress value={progress} className="mt-0.5 h-1 w-full" />
                )}
            </div>

            {isRunning ? (
                <Button onClick={handlePause} variant="secondary" size="icon" className="h-9 w-9 focus-scale">
                    <Pause className="h-4 w-4" />
                </Button>
            ) : (
                <Button onClick={handleStart} size="icon" className="h-9 w-9 focus-scale" disabled={time > 0}>
                    <Play className="h-4 w-4" />
                </Button>
            )}

            <Button onClick={handleLog} size="icon" className="h-9 w-9 focus-scale" disabled={time === 0 || isRunning}>
                <LogIn className="h-4 w-4" />
            </Button>

            <Button onClick={handleReset} variant="outline" size="icon" className="h-9 w-9 focus-scale" disabled={time === 0}>
                <RotateCcw className="h-4 w-4" />
            </Button>
        </div>
    );
  }

  return (
    <Card className="w-full border border-border/60 bg-card/50 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 border-b border-border/60 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Target className="h-4 w-4" />
        </div>
        <CardTitle className="text-sm font-bold">Session Timer</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6 p-8">
        <div className="w-full space-y-2 text-center">
            <div className="text-6xl font-black tabular-nums tracking-tight">
                {formatTime(time)}
            </div>
            {sessionGoal && (
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span>Goal: {sessionGoal}m</span>
                        <span className="tabular-nums">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            )}
        </div>

        <div className="w-full space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <Target className="h-3 w-3" /> Set session goal (minutes)
            </div>
            <ToggleGroup
                type="single"
                value={sessionGoal?.toString()}
                onValueChange={(v) => setSessionGoal(v ? parseInt(v) : null)}
                className="justify-start gap-2"
            >
                {GOAL_OPTIONS.map(goal => (
                    <ToggleGroupItem key={goal} value={goal.toString()} className="h-8 px-3 text-xs font-bold">
                        {goal}m
                    </ToggleGroupItem>
                ))}
                <ToggleGroupItem value="none" onClick={() => setSessionGoal(null)} className="h-8 px-3 text-xs font-bold">
                    None
                </ToggleGroupItem>
            </ToggleGroup>
        </div>

        <div className="flex w-full gap-3">
          {isRunning ? (
            <Button onClick={handlePause} variant="secondary" size="lg" className="flex-1 font-bold focus-scale">
              <Pause className="mr-2 h-5 w-5" /> Pause
            </Button>
          ) : (
            <Button onClick={handleStart} size="lg" className="flex-1 font-bold focus-scale">
              <Play className="mr-2 h-5 w-5" /> Start
            </Button>
          )}
          <Button onClick={handleReset} variant="outline" size="lg" className="focus-scale">
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
        <Button
            onClick={handleLog}
            disabled={time === 0 || isRunning}
            size="lg"
            className="w-full font-bold focus-scale"
        >
            <LogIn className="mr-2 h-5 w-5" /> Log duration
        </Button>
      </CardContent>
    </Card>
  );
};

export default PracticeTimer;
