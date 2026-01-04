import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const INITIAL_TIME_SECONDS = 5 * 60; // 5 minutes

const PracticeTimer: React.FC = () => {
  const [time, setTime] = useState(INITIAL_TIME_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsFinished(false);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(INITIAL_TIME_SECONDS);
    setIsFinished(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0 && isRunning) {
      setIsRunning(false);
      setIsFinished(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, time]);

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-center">5-Minute Focus Timer</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="text-7xl font-mono font-bold text-primary">
          {formatTime(time)}
        </div>
        {isFinished && (
            <p className="text-lg font-semibold text-green-600">Time's up! Focus session complete.</p>
        )}
        <div className="flex space-x-4">
          {isRunning ? (
            <Button onClick={handlePause} variant="outline" size="lg">
              <Pause className="w-5 h-5 mr-2" /> Pause
            </Button>
          ) : (
            <Button onClick={handleStart} size="lg" disabled={isFinished}>
              <Play className="w-5 h-5 mr-2" /> Start
            </Button>
          )}
          <Button onClick={handleReset} variant="ghost" size="lg">
            <RotateCcw className="w-5 h-5 mr-2" /> Reset
          </Button>
        </div>
        <p className="text-xs text-muted-foreground pt-2">Use this timer for focused practice blocks.</p>
      </CardContent>
    </Card>
  );
};

export default PracticeTimer;