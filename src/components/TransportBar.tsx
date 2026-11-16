import React from 'react';
import { cn } from '@/lib/utils';
import Metronome from './Metronome';

interface TransportBarProps {
  className?: string;
}

const TransportBar: React.FC<TransportBarProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 px-3 py-2  ',
        className,
      )}
    >
      <span className="hidden text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:inline">
        Transport
      </span>
      <div className="flex-1">
        <Metronome showSettings={true} layout="horizontal" />
      </div>
    </div>
  );
};

export default TransportBar;