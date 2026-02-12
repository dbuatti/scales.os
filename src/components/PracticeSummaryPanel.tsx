import React from 'react';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { useScales } from '@/context/ScalesContext';
import { Card, CardContent } from '@/components/ui/card';
import { Save, AlertCircle, Music, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { showSuccess } from '@/utils/toast';

const PracticeSummaryPanel: React.FC = () => {
  const { activePracticeItem, currentBPM, activeLogSnapshotFunction } = useGlobalBPM();
  const { updatePracticeStatus } = useScales();

  if (!activePracticeItem) {
    return (
      <Card className="bg-muted/20 border-dashed border-2">
        <CardContent className="p-16 text-center space-y-4">
          <p className="text-xl font-medium text-muted-foreground">Select an exercise to begin tracking your session.</p>
          <p className="text-sm text-muted-foreground/60">Your progress will be automatically calculated as you practice.</p>
        </CardContent>
      </Card>
    );
  }

  const handlePivot = () => {
    let id = '';
    if (activePracticeItem.type === 'scale') {
      const { key, scaleType, articulation, octaves, handConfig } = activePracticeItem;
      // Reconstruct ID for stasis
      id = `${key}-${scaleType.replace(/\s/g, "")}-${articulation.replace(/\s/g, "")}-Asc+Descstandard-${handConfig.replace(/\s/g, "")}-Straight-Noaccentneutralevenness-${octaves.replace(/\s/g, "")}`;
    } else {
      id = activePracticeItem.exerciseId;
    }
    
    updatePracticeStatus(id, 'stasis');
    showSuccess("Item moved to stasis. The app will pivot to other tasks.");
    window.location.reload(); // Refresh to trigger new nextFocus
  };

  const masteryPercentage = (() => {
    if (activePracticeItem.type === 'scale') {
      const { highestBPM, nextGoalBPM } = activePracticeItem;
      if (nextGoalBPM === highestBPM) return currentBPM >= nextGoalBPM ? 100 : 0;
      return Math.min(100, Math.max(0, ((currentBPM - highestBPM) / (nextGoalBPM - highestBPM)) * 100));
    } else {
      const { currentHighestBPM, nextTargetBPM } = activePracticeItem as any;
      if (nextTargetBPM === currentHighestBPM) return currentBPM >= nextTargetBPM ? 100 : 0;
      return Math.min(100, Math.max(0, ((currentBPM - currentHighestBPM) / (nextTargetBPM - currentHighestBPM)) * 100));
    }
  })();

  // Helper to extract octave number
  const getOctaveNumber = (octaves: string) => {
    const match = octaves.match(/\d+/);
    return match ? match[0] : octaves;
  };

  // Helper to simplify hand config
  const getHandLabel = (handConfig: string) => {
    const lower = handConfig.toLowerCase();
    if (lower.includes('together')) return 'BOTH';
    if (lower.includes('left')) return 'LEFT';
    if (lower.includes('right')) return 'RIGHT';
    if (lower.includes('contrary')) return 'CONTRARY';
    if (lower.includes('staggered')) return 'STAGGERED';
    return handConfig.toUpperCase();
  };

  const getDisplayType = () => {
    if (activePracticeItem.type !== 'scale') return activePracticeItem.type;
    const type = activePracticeItem.scaleType.toLowerCase();
    if (type.includes('arpeggio') || type.includes('7th')) return 'arpeggio';
    return 'scale';
  };

  return (
    <Card className="overflow-hidden border-none shadow-lg bg-card ring-1 ring-primary/5">
      <CardContent className="p-0">
        <div className="p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight text-primary">
                {activePracticeItem.type === 'scale'
                  ? `${activePracticeItem.key} ${activePracticeItem.scaleType}`
                  : activePracticeItem.name}
              </h2>
              <div className="flex items-center gap-3 text-base font-medium text-muted-foreground">
                <span className="capitalize bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold tracking-widest">{getDisplayType()}</span>
                <span>•</span>
                <span>{activePracticeItem.type === 'scale' ? activePracticeItem.articulation : 'Standard'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Current Tempo</p>
                <p className="text-5xl font-black tracking-tighter text-primary">{currentBPM} <span className="text-lg font-bold text-muted-foreground">BPM</span></p>
              </div>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => activeLogSnapshotFunction?.()} 
                  disabled={!activeLogSnapshotFunction}
                  size="lg"
                  className="h-12 px-8 font-bold shadow-md focus-scale"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Progress
                </Button>
                <Button 
                  variant="ghost"
                  onClick={handlePivot}
                  className="h-10 px-8 text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Too Hard / Pivot
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <span>Progress to next goal</span>
              <span className="text-primary">{masteryPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={masteryPercentage} className="h-3 shadow-sm" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-primary/5">
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Highest</p>
              <p className="text-lg font-bold text-primary">
                {activePracticeItem.type === 'scale' ? activePracticeItem.highestBPM : (activePracticeItem as any).currentHighestBPM} BPM
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Goal</p>
              <p className="text-lg font-bold text-primary">
                {activePracticeItem.type === 'scale' ? activePracticeItem.nextGoalBPM : (activePracticeItem as any).nextTargetBPM} BPM
              </p>
            </div>
            {activePracticeItem.type === 'scale' && (
              <>
                <div className="flex items-center gap-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                    <Music className="w-4 h-4 mb-0.5 opacity-50" />
                    <span className="text-xl font-black leading-none">{getOctaveNumber(activePracticeItem.octaves)}</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Octaves</p>
                    <p className="text-xs font-bold text-primary/70 truncate max-w-[80px]">{activePracticeItem.octaves.split(' ')[0]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                    <Hand className="w-4 h-4 mb-0.5 opacity-50" />
                    <span className="text-[10px] font-black leading-none">{getHandLabel(activePracticeItem.handConfig)}</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Hands</p>
                    <p className="text-xs font-bold text-primary/70 truncate max-w-[80px]">{activePracticeItem.handConfig.split(' ')[0]}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PracticeSummaryPanel;