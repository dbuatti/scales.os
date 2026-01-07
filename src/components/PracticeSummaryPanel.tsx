import React from 'react';
import { useGlobalBPM, ActivePracticeItem } from '@/context/GlobalBPMContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Clock, Target, LogIn, Gauge, Hand, Repeat, Zap, Drumstick, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const PracticeSummaryPanel: React.FC = () => {
  const { activePracticeItem, currentBPM, activeLogSnapshotFunction } = useGlobalBPM();

  if (!activePracticeItem) {
    return (
      <Card className="w-full bg-card/70 border-primary/30 shadow-lg">
        <CardHeader className="p-3 border-b border-primary/20">
          <CardTitle className="text-center text-lg font-mono tracking-widest text-primary">
            CURRENT FOCUS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center space-y-4">
          <p className="text-sm text-muted-foreground font-mono">
            Select an exercise below to set your focus.
          </p>
          <Button 
            disabled={true}
            className="w-full bg-accent/50 text-accent-foreground font-mono"
            size="sm"
          >
            <LogIn className="w-4 h-4 mr-2" /> Log Snapshot (N/A BPM)
          </Button>
        </CardContent>
      </Card>
    );
  }

  const renderScaleSummary = (item: ActivePracticeItem & { type: 'scale' }) => {
    const statusText = currentBPM >= item.nextGoalBPM ? 'Exceeding Goal' : currentBPM > item.highestBPM ? 'New High Score' : 'Practicing';
    const statusColor = currentBPM >= item.nextGoalBPM ? 'text-green-400' : currentBPM > item.highestBPM ? 'text-yellow-400' : 'text-muted-foreground';

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-primary font-mono">
            {item.key} {item.scaleType}
          </p>
          <span className={cn("text-sm font-mono font-semibold px-2 py-1 rounded-full", statusColor)}>
            {statusText}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-mono">
          <div className="flex items-center">
            <Zap className="w-4 h-4 mr-2 text-primary/70" />
            <span className="text-muted-foreground">Articulation:</span> <span className="ml-1 text-foreground font-semibold">{item.articulation}</span>
          </div>
          <div className="flex items-center">
            <Music className="w-4 h-4 mr-2 text-primary/70" />
            <span className="text-muted-foreground">Octaves:</span> <span className="ml-1 text-foreground font-semibold">{item.octaves}</span>
          </div>
          <div className="flex items-center">
            <Gauge className="w-4 h-4 mr-2 text-primary/70" />
            <span className="text-muted-foreground">Highest BPM:</span> <span className="ml-1 font-bold text-yellow-400">{item.highestBPM}</span>
          </div>
          <div className="flex items-center">
            <Target className="w-4 h-4 mr-2 text-primary/70" />
            <span className="text-muted-foreground">Next Goal:</span> <span className="ml-1 font-bold text-green-400">{item.nextGoalBPM} BPM</span>
          </div>
        </div>
      </div>
    );
  };

  const renderExerciseSummary = (item: ActivePracticeItem & ({ type: 'dohnanyi' | 'hanon' })) => {
    const isMastered = item.isMastered;
    const statusText = isMastered ? 'Mastered' : 'Targeting';
    const statusColor = isMastered ? 'text-green-400' : 'text-yellow-400';

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-primary font-mono">
            {item.name}
          </p>
          <span className={cn("text-sm font-mono font-semibold px-2 py-1 rounded-full", statusColor)}>
            {statusText}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-mono">
          <div className="flex items-center">
            <Gauge className="w-4 h-4 mr-2 text-primary/70" />
            <span className="text-muted-foreground">Highest BPM:</span> <span className="ml-1 font-bold text-yellow-400">{item.currentHighestBPM}</span>
          </div>
          <div className="flex items-center">
            <Target className="w-4 h-4 mr-2 text-primary/70" />
            <span className="text-muted-foreground">Next Goal:</span> <span className="ml-1 font-bold text-green-400">{item.nextTargetBPM} BPM</span>
          </div>
          <div className="flex items-center col-span-2">
            <Clock className="w-4 h-4 mr-2 text-primary/70" />
            <span className="text-muted-foreground">Current Tempo:</span> <span className="ml-1 font-bold text-primary">{currentBPM} BPM</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full bg-card/70 border-primary/30 shadow-lg">
      <CardHeader className="p-3 border-b border-primary/20">
        <CardTitle className="text-center text-lg font-mono tracking-widest text-primary">
          CURRENT FOCUS
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {activePracticeItem.type === 'scale' && renderScaleSummary(activePracticeItem)}
        {(activePracticeItem.type === 'dohnanyi' || activePracticeItem.type === 'hanon') && renderExerciseSummary(activePracticeItem)}
        
        {/* Snapshot Capture Button */}
        <div className="pt-4 border-t border-border mt-4">
            <Button 
                onClick={() => {
                    if (activeLogSnapshotFunction) {
                        activeLogSnapshotFunction();
                    } else {
                        // console.log('[PracticeSummaryPanel] No snapshot function available'); // Removed log
                    }
                }} 
                disabled={!activeLogSnapshotFunction}
                className="w-full bg-accent hover:bg-accent/80 text-accent-foreground font-mono"
                size="sm"
            >
                <LogIn className="w-4 h-4 mr-2" /> LOG SNAPSHOT ({currentBPM} BPM)
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PracticeSummaryPanel;