import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, LogIn } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface PracticeTimerProps {
  onLogSession: (durationMinutes: number) => void;
  isCondensed?: boolean;
}

const PracticeTimer: React.FC<PracticeTimerProps> = ({ onLogSession, isCondensed = false }) => {
  const [time, setTime] = useState(0); // Time in seconds, counting up
  const [isRunning, setIsRunning] = useState(false);

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

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

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);
  
  if (isCondensed) {
    return (
        <div className="flex items-center space-x-2">
            <div className="text-lg font-mono font-extrabold text-primary tracking-tighter min-w-[60px] text-center">
                {formatTime(time)}
            </div>
            
            {isRunning ? (
                <Button onClick={handlePause} variant="secondary" size="icon" className="w-8 h-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    <Pause className="w-4 h-4" />
                </Button>
            ) : (
                <Button onClick={handleStart} size="icon" className="w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={time > 0}>
                    <Play className="w-4 h-4" />
                </Button>
            )}
            
            <Button onClick={handleLog} size="icon" className="w-8 h-8 bg-accent hover:bg-accent/80 text-accent-foreground" disabled={time === 0 || isRunning}>
                <LogIn className="w-4 h-4" />
            </Button>
            
            <Button onClick={handleReset} variant="outline" size="icon" className="w-8 h-8 border-muted-foreground text-muted-foreground hover:bg-accent" disabled={time === 0}>
                <RotateCcw className="w-4 h-4" />
            </Button>
        </div>
    );
  }

  // Full Card View (for PracticeCommandCenter)
  return (
    <Card className="w-full bg-card/70 border-primary/30 shadow-2xl">
      <CardHeader className="p-3 border-b border-primary/20">
        <CardTitle className="text-center text-lg font-mono tracking-widest text-primary">SESSION TIMER</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-3 p-4">
        <div className="text-6xl font-mono font-extrabold text-primary">
          {formatTime(time)}
        </div>
        <div className="flex space-x-2 w-full">
          {isRunning ? (
            <Button onClick={handlePause} variant="secondary" size="sm" className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              <Pause className="w-4 h-4 mr-1" /> PAUSE
            </Button>
          ) : (
            <Button onClick={handleStart} size="sm" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Play className="w-4 h-4 mr-1" /> START
            </Button>
          )}
          <Button onClick={handleReset} variant="outline" size="sm" className="border-muted-foreground text-muted-foreground hover:bg-accent">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        <Button 
            onClick={handleLog} 
            disabled={time === 0 || isRunning}
            className="w-full text-md py-2 bg-accent hover:bg-accent/80 transition-all duration-300 text-accent-foreground"
        >
            <LogIn className="w-5 h-5 mr-2" /> LOG DURATION
        </Button>
      </CardContent>
    </Card>
  );
};

export default PracticeTimer;