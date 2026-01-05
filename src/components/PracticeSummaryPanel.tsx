import React from 'react';
import { useGlobalBPM, ActivePracticeItem } from '@/context/GlobalBPMContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Clock, Target, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const PracticeSummaryPanel: React.FC = () => {
  const { activePracticeItem, currentBPM, activeLogSnapshotFunction } = useGlobalBPM();

  // Add logging when component renders
  // React.useEffect(() => { // Removed log
  //   console.log('[PracticeSummaryPanel] Rendered with:', {
  //     activePracticeItem,
  //     currentBPM,
  //     hasSnapshotFunction: !!activeLogSnapshotFunction
  //   });
  // }, [activePracticeItem, currentBPM, activeLogSnapshotFunction]);

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
    const status = currentBPM >= item.nextGoalBPM ? 'Exceeding Goal' : currentBPM > item.highestBPM ? 'New High Score' : 'Practicing';
    
    return (
      <div className="space-y-2">
        <p className="text-xl font-bold text-primary font-mono">
          {item.key} {item.scaleType}
        </p>
        <div className="text-sm text-muted-foreground font-mono space-y-1">
          <p>Articulation: <span className="text-foreground font-semibold">{item.articulation}</span></p>
          <p>Octaves: <span className="text-foreground font-semibold">{item.octaves}</span></p>
        </div>
        <div className="pt-2 border-t border-border mt-2">
          <p className="text-xs text-yellow-400 font-mono">
            Highest Mastered: <span className="font-bold text-primary">{item.highestBPM} BPM</span>
          </p>
          <p className="text-xs text-green-400 font-mono">
            Next Goal: <span className="font-bold text-primary">{item.nextGoalBPM} BPM</span>
          </p>
        </div>
      </div>
    );
  };

  const renderExerciseSummary = (item: ActivePracticeItem & ({ type: 'dohnanyi' | 'hanon' })) => {
    const isMastered = item.isMastered;
    
    return (
      <div className="space-y-2">
        <p className="text-xl font-bold text-primary font-mono">
          {item.name}
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm font-mono">
          {isMastered ? (
            <span className="text-green-400 flex items-center">
              <Check className="w-4 h-4 mr-1" /> MASTERED
            </span>
          ) : (
            <span className="text-yellow-400 flex items-center">
              <Target className="w-4 h-4 mr-1" /> TARGETING
            </span>
          )}
        </div>
        <div className="pt-2 border-t border-border mt-2">
          <p className="text-xs text-muted-foreground font-mono">
            Next Mastery Target: <span className="font-bold text-primary">{item.nextTargetBPM} BPM</span>
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            Current Tempo: <span className="font-bold text-primary">{currentBPM} BPM</span>
          </p>
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
      <CardContent className="p-4 text-center space-y-4">
        {activePracticeItem.type === 'scale' && renderScaleSummary(activePracticeItem)}
        {(activePracticeItem.type === 'dohnanyi' || activePracticeItem.type === 'hanon') && renderExerciseSummary(activePracticeItem)}
        
        {/* Snapshot Capture Button */}
        <div className="pt-4 border-t border-border mt-4">
            <Button 
                onClick={() => {
                    // console.log('[PracticeSummaryPanel] Snapshot button clicked'); // Removed log
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