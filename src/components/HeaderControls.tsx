"use client";

import React from 'react';
import PracticeTimer from './PracticeTimer';
import Metronome from './Metronome';

interface HeaderControlsProps {
  onLogSession: (durationMinutes: number) => void;
  showMetronome?: boolean;
}

const HeaderControls: React.FC<HeaderControlsProps> = ({ onLogSession, showMetronome = true }) => {
  return (
    <div className="flex items-center space-x-2 sm:space-x-4">
      {/* 1. Metronome (with integrated BPM control) */}
      {showMetronome && <Metronome />}

      {/* 2. Timer (Condensed) */}
      <div className="hidden md:block">
        <PracticeTimer onLogSession={onLogSession} isCondensed={true} />
      </div>
    </div>
  );
};

export default HeaderControls;
