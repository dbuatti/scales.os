import React from 'react';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { useScales } from '@/context/ScalesContext';
import { Card, CardContent } from '@/components/ui/card';
import { Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { showSuccess } from '@/utils/toast';

const PracticeSummaryPanel: React.FC = () => {
  const { activePracticeItem, currentBPM, activeLogSnapshotFunction } = useGlobalBPM();
  const { updatePracticeStatus } = useScales();

  if (!activePracticeItem) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-12 text-center space-y-4">
          <p className="text-muted-foreground">Select an exercise to begin tracking your session.</p>
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

  return (
    <Card className="overflow-hidden border-none shadow-md bg-card">
      <CardContent className="p-0">
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">
                {activePracticeItem.type === 'scale'
                  ? `${activePracticeItem.key} ${activePracticeItem.scaleType}`
                  : activePracticeItem.name}
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="capitalize">{activePracticeItem.type}</span>
                <span>•</span>
                <span>{activePracticeItem.type === 'scale' ? activePracticeItem.articulation : 'Standard'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground uppercase">Current Tempo</p>
                <p className="text-3xl font-bold tracking-tighter">{currentBPM} <span className="text-sm font-normal text-muted-foreground">BPM</span></p>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => activeLogSnapshotFunction?.()} 
                  disabled={!activeLogSnapshotFunction}
                  className="h-10 px-6"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Progress
                </Button>
                <Button 
                  variant="outline"
                  onClick={handlePivot}
                  className="h-10 px-6 text-xs text-muted-foreground hover:text-destructive"
                >
                  <AlertCircle className="w-3 h-3 mr-2" />
                  Too Hard / Pivot
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase">
              <span>Progress to next goal</span>
              <span>{masteryPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={masteryPercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Highest</p>
              <p className="text-sm font-semibold">
                {activePracticeItem.type === 'scale' ? activePracticeItem.highestBPM : (activePracticeItem as any).currentHighestBPM} BPM
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Goal</p>
              <p className="text-sm font-semibold">
                {activePracticeItem.type === 'scale' ? activePracticeItem.nextGoalBPM : (activePracticeItem as any).nextTargetBPM} BPM
              </p>
            </div>
            {activePracticeItem.type === 'scale' && (
              <>
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">Octaves</p>
                  <p className="text-sm font-semibold">{activePracticeItem.octaves}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">Hands</p>
                  <p className="text-sm font-semibold">{activePracticeItem.handConfig}</p>
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