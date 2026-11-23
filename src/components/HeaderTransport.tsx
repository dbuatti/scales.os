import React from 'react';
import Metronome from './Metronome';
import SessionTimer from './SessionTimer';
import { usePracticeTransport } from '@/context/PracticeTransportContext';

/** Slim second row of the sticky app header, shown on the practice page. */
const HeaderTransport: React.FC = () => {
  const {
    sessionSeconds,
    isTimerRunning,
    isPracticeMode,
    startTimer,
    pauseTimer,
    resetTimer,
  } = usePracticeTransport();

  return (
    <div className="flex min-w-0 flex-1 items-center gap-4">
      <div className="flex min-w-0 flex-1 items-center">
        <SessionTimer
          compact
          seconds={sessionSeconds}
          isRunning={isTimerRunning}
          onStart={startTimer}
          onPause={pauseTimer}
          onReset={resetTimer}
          startLabel={isPracticeMode ? 'Resume timer' : 'Start timer'}
        />
      </div>
      <div className="hidden h-6 w-px shrink-0 bg-border/60 sm:block" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 items-center justify-end">
        <Metronome compact showSettings />
      </div>
    </div>
  );
};

export default HeaderTransport;
