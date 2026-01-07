import React from 'react';
import { useGlobalBPM, ActivePracticeItem } from '@/context/GlobalBPMContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Clock, Target, LogIn, Gauge, Hand, Repeat, Zap, Drumstick, Music, Piano } from 'lucide-react'; // Added Piano icon
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
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
          <p className="text-3xl md:text-4xl font-extrabold text-primary font-mono text-center sm:text-left">
            {item.key} {item.scaleType}
          </p>
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <span className={cn("text-sm font-mono font-semibold px-3 py-1 rounded-full", statusColor, "bg-primary/10 border border-primary/30")}>
              {statusText}
            </span>
            <div className="text-3xl font-mono font-extrabold text-primary tracking-tighter">
              {currentBPM} BPM
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm font-mono">
          <div className="flex items-center p-2 bg-secondary/50 rounded-md border border-border">
            <Zap className="w-5 h-5 mr-3 text-primary" />
            <div>
              <span className="text-muted-foreground block text-xs">Articulation</span> 
              <span className="text-foreground font-semibold">{item.articulation}</span>
            </div>
          </div>
          <div className="flex items-center p-2 bg-secondary/50 rounded-md border border-border">
            <Music className="w-5 h-5 mr-3 text-primary" />
            <div>
              <span className="text-muted-foreground block text-xs">Octaves</span> 
              <span className="text-foreground font-semibold">{item.octaves}</span>
            </div>
          </div>
          <div className="flex items-center p-2 bg-secondary/50 rounded-md border border-border">
            <Hand className="w-5 h-5 mr-3 text-primary" />
            <div>
              <span className="text-muted-foreground block text-xs">Hands</span> 
              <span className="text-foreground font-semibold">{item.handConfig}</span>
            </div>
          </div>
          <div className="flex items-center p-2 bg-secondary/50 rounded-md border border-border">
            <Gauge className="w-5 h-5 mr-3 text-yellow-400" />
            <div>
              <span className="text-muted-foreground block text-xs">Highest Mastered</span> 
              <span className="font-bold text-yellow-400">{item.highestBPM} BPM</span>
            </div>
          </div>
          <div className="flex items-center p-2 bg-secondary/50 rounded-md border border-border">
            <Target className="w-5 h-5 mr-3 text-green-400" />
            <div>
              <span className="text-muted-foreground block text-xs">Next Goal</span> 
              <span className="font-bold text-green-400">{item.nextGoalBPM} BPM</span>
            </div>
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
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
          <p className="text-3xl md:text-4xl font-extrabold text-primary font-mono text-center sm:text-left">
            {item.name}
          </p>
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <span className={cn("text-sm font-mono font-semibold px-3 py-1 rounded-full", statusColor, "bg-primary/10 border border-primary/30")}>
              {statusText}
            </span>
            <div className="text-3xl font-mono font-extrabold text-primary tracking-tighter">
              {currentBPM} BPM
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm font-mono">
          <div className="flex items-center p-2 bg-secondary/50 rounded-md border border-border">
            <Piano className="w-5 h-5 mr-3 text-primary" />
            <div>
              <span className="text-muted-foreground block text-xs">Exercise Type</span> 
              <span className="text-foreground font-semibold">{item.type === 'dohnanyi' ? 'Dohnányi' : 'Hanon'}</span>
            </div>
          </div>
          <div className="flex items-center p-2 bg-secondary/50 rounded-md border border-border">
            <Gauge className="w-5 h-5 mr-3 text-yellow-400" />
            <div>
              <span className="text-muted-foreground block text-xs">Highest Mastered</span> 
              <span className="font-bold text-yellow-400">{item.currentHighestBPM} BPM</span>
            </div>
          </div>
          <div className="flex items-center p-2 bg-secondary/50 rounded-md border border-border">
            <Target className="w-5 h-5 mr-3 text-green-400" />
            <div>
              <span className="text-muted-foreground block text-xs">Next Goal</span> 
              <span className="font-bold text-green-400">{item.nextTargetBPM} BPM</span>
            </div>
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