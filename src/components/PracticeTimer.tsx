import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const INITIAL_TIME_SECONDS = 5 * 60; // 5 minutes

interface PracticeTimerProps {
  onTimerEnd: (durationMinutes: number) => void;
}

const PracticeTimer: React.FC<PracticeTimerProps> = ({ onTimerEnd }) => {
  const [time, setTime] = useState(INITIAL_TIME_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!isRunning) {
      setIsRunning(true);
      if (startTime === null) {
        setStartTime(Date.now());
      }
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(INITIAL_TIME_SECONDS);
    setStartTime(null);
  };

  const handleEnd = useCallback(() => {
    setIsRunning(false);
    setTime(INITIAL_TIME_SECONDS);
    if (startTime !== null) {
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
      onTimerEnd(Math.round(durationSeconds / 60)); // Report duration in minutes
    }
    setStartTime(null);
  }, [startTime, onTimerEnd]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0 && isRunning) {
      handleEnd();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, time, handleEnd]);

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-center">5-Minute Focus Timer</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="text-7xl font-mono font-bold text-primary">
          {formatTime(time)}
        </div>
        <div className="flex space-x-4">
          {isRunning ? (
            <Button onClick={handlePause} variant="outline" size="lg">
              <Pause className="w-5 h-5 mr-2" /> Pause
            </Button>
          ) : (
            <Button onClick={handleStart} size="lg">
              <Play className="w-5 h-5 mr-2" /> Start
            </Button>
          )}
          <Button onClick={handleReset} variant="ghost" size="lg">
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
        <Button 
          onClick={handleEnd} 
          variant="destructive" 
          className="w-full"
          disabled={startTime === null}
        >
          Stop & Log Session
        </Button>
      </CardContent>
    </Card>
  );
};

export default PracticeTimer;