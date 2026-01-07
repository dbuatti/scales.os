import React from 'react';
import { useGlobalBPM, ActivePracticeItem } from '@/context/GlobalBPMContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Target, Gauge, Hand, Repeat, Music, Piano, AlertTriangle, CheckCircle2, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const PracticeSummaryPanel: React.FC = () => {
  const { activePracticeItem, currentBPM, activeLogSnapshotFunction } = useGlobalBPM();

  if (!activePracticeItem) {
    return (
      <Card className="w-full bg-card/90 border-2 border-primary/60 shadow-2xl shadow-primary/20"> {/* Changed bg-black/90 to bg-card/90 */}
        <CardHeader className="p-4 border-b-2 border-primary/50">
          <CardTitle className="text-center text-xl font-mono tracking-widest text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]">
            ► CURRENT FOCUS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-6">
          <div className="flex justify-center">
            <AlertTriangle className="w-16 h-16 text-warning animate-pulse" />
          </div>
          <p className="text-primary/70 font-mono text-lg tracking-wider">
            NO ACTIVE TARGET ACQUIRED
          </p>
          <p className="text-sm text-primary/50 opacity-70">
            Select an exercise to lock onto a practice vector.
          </p>
          <Button
            disabled
            className="w-full bg-primary/30 border border-primary/70 text-primary/70 font-mono cursor-not-allowed"
          >
            <Radio className="w-5 h-5 mr-2" />
            TRANSMIT DATA (NO SIGNAL)
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusConfig = () => {
    if (activePracticeItem.type === 'scale') {
      const { nextGoalBPM, highestBPM } = activePracticeItem;
      if (currentBPM >= nextGoalBPM)
        return { text: 'GOAL SURPASSED', color: 'text-success', icon: CheckCircle2, pulse: true };
      if (currentBPM > highestBPM)
        return { text: 'NEW RECORD', color: 'text-warning', icon: Zap, pulse: true };
      return { text: 'IN TRAINING', color: 'text-primary/70', icon: Target, pulse: false };
    } else { // Dohnanyi or Hanon
      const { currentHighestBPM, nextTargetBPM } = activePracticeItem as any;
      if (currentBPM >= nextTargetBPM)
        return { text: 'GOAL SURPASSED', color: 'text-success', icon: CheckCircle2, pulse: true };
      if (currentBPM > currentHighestBPM)
        return { text: 'NEW RECORD', color: 'text-warning', icon: Zap, pulse: true };
      return { text: 'IN TRAINING', color: 'text-primary/70', icon: Target, pulse: false };
    }
  };

  const status = getStatusConfig();

  const masteryPercentage = (() => {
    if (activePracticeItem.type === 'scale') {
      const { highestBPM, nextGoalBPM } = activePracticeItem;
      const base = highestBPM;
      const target = nextGoalBPM;
      // Avoid division by zero if target is same as base
      if (target === base) return currentBPM >= target ? 100 : 0;
      return Math.min(100, ((currentBPM - base) / (target - base)) * 100);
    } else { // Dohnanyi or Hanon
      const { currentHighestBPM, nextTargetBPM } = activePracticeItem as any;
      // Avoid division by zero if target is same as base
      if (nextTargetBPM === currentHighestBPM) return currentBPM >= nextTargetBPM ? 100 : 0;
      return Math.min(100, ((currentBPM - currentHighestBPM) / (nextTargetBPM - currentHighestBPM)) * 100);
    }
  })();

  const StatusIcon = status.icon;

  return (
    <Card className="w-full bg-card/95 border-4 border-primary/80 shadow-2xl shadow-primary/40 relative overflow-hidden"> {/* Changed bg-black/95 to bg-card/95 */}
      {/* Subtle CRT glow overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      </div>

      <CardHeader className="p-5 border-b-4 border-primary/70 relative">
        <CardTitle className="text-center text-2xl font-mono tracking-widest text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.8)] flex items-center justify-center gap-4">
          <Radio className="w-6 h-6 animate-pulse" />
          CURRENT FOCUS
          <Radio className="w-6 h-6 ml-3 animate-pulse" />
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6 relative z-10">
        {/* Main Target Display */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold font-mono text-primary tracking-wider drop-shadow-[0_0_15px_hsl(var(--primary)/0.9)]">
            {activePracticeItem.type === 'scale'
              ? `${activePracticeItem.key} ${activePracticeItem.scaleType}`
              : activePracticeItem.name}
          </h2>

          <div className="flex items-center justify-center gap-6 mt-6">
            <div className={cn("flex items-center gap-3 px-5 py-2 rounded-full border-2", 
              status.pulse && "animate-pulse",
              status.color === 'text-success' ? "border-success bg-success/10" :
              status.color === 'text-warning' ? "border-warning bg-warning/10" :
              "border-primary/70 bg-primary/10"
            )}>
              <StatusIcon className={cn("w-6 h-6", status.pulse && "animate-pulse", status.color)} />
              <span className={cn("font-mono text-lg font-bold tracking-wider", status.color)}>
                {status.text}
              </span>
            </div>

            <div className="text-5xl font-mono font-black text-warning tracking-tighter drop-shadow-[0_0_20px_hsl(var(--warning)/0.8)]">
              {currentBPM}
              <span className="text-2xl text-primary ml-1">BPM</span>
            </div>
          </div>
        </div>

        {/* Mastery Progress Bar */}
        <div className="space-y-2">
          <div className="text-xs text-primary/70 uppercase tracking-wider text-center">Performance Vector</div>
          <div className="h-8 bg-background border-2 border-primary/70 rounded overflow-hidden relative"> {/* Changed bg-black to bg-background */}
            <div
              className="h-full bg-gradient-to-r from-primary/90 via-primary/60 to-success transition-all duration-1000 ease-out shadow-[0_0_15px_hsl(var(--primary)/0.6)]"
              style={{ width: `${Math.max(5, masteryPercentage)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-primary/80 font-mono font-bold text-sm">
                {masteryPercentage.toFixed(0)}% TOWARD NEXT MILESTONE
              </span>
            </div>
          </div>
        </div>

        {/* Parameter Readouts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activePracticeItem.type === 'scale' && (
            <>
              <div className="p-3 bg-primary/20 border border-primary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-success" />
                  <div>
                    <p className="text-xs text-primary/70 uppercase">Articulation</p>
                    <p className="font-mono text-lg text-primary/80 font-bold">{activePracticeItem.articulation}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-primary/20 border border-primary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Music className="w-6 h-6 text-success" />
                  <div>
                    <p className="text-xs text-primary/70 uppercase">Octaves</p>
                    <p className="font-mono text-lg text-primary/80 font-bold">{activePracticeItem.octaves}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-primary/20 border border-primary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Hand className="w-6 h-6 text-success" />
                  <div>
                    <p className="text-xs text-primary/70 uppercase">Hands</p>
                    <p className="font-mono text-lg text-primary/80 font-bold">{activePracticeItem.handConfig}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="p-3 bg-warning/20 border border-warning/40 rounded-lg">
            <div className="flex items-center gap-3">
              <Gauge className="w-6 h-6 text-warning animate-pulse" />
              <div>
                <p className="text-xs text-primary/70 uppercase">Highest Recorded</p>
                <p className="font-mono text-xl text-warning font-black">
                  {activePracticeItem.type === 'scale' 
                    ? activePracticeItem.highestBPM 
                    : (activePracticeItem as any).currentHighestBPM} BPM
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-success/20 border border-success/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-success" />
              <div>
                <p className="text-xs text-primary/70 uppercase">Next Milestone</p>
                <p className="font-mono text-xl text-success font-black">
                  {activePracticeItem.type === 'scale' 
                    ? activePracticeItem.nextGoalBPM 
                    : (activePracticeItem as any).nextTargetBPM} BPM
                </p>
              </div>
            </div>
          </div>

          {activePracticeItem.type !== 'scale' && (
            <div className="p-3 bg-primary/20 border border-primary/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Piano className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xs text-primary/70 uppercase">Regime</p>
                  <p className="font-mono text-lg text-primary/80 font-bold capitalize">
                    {activePracticeItem.type === 'dohnanyi' ? 'Dohnányi' : 'Hanon'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Snapshot Transmit Button */}
        <div className="pt-6 border-t-2 border-primary/50">
          <Button
            onClick={() => activeLogSnapshotFunction?.()}
            disabled={!activeLogSnapshotFunction}
            className={cn(
              "w-full h-14 text-lg font-mono tracking-wider transition-all",
              activeLogSnapshotFunction
                ? "bg-primary/80 hover:bg-primary text-primary-foreground border-2 border-primary/80 shadow-[0_0_20px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.8)]"
                : "bg-primary/30 border border-primary/70 text-primary/70 cursor-not-allowed"
            )}
          >
            <Radio className="w-6 h-6 mr-3 animate-pulse" />
            TRANSMIT PERFORMANCE DATA ({currentBPM} BPM)
            <Radio className="w-6 h-6 ml-3 animate-pulse" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PracticeSummaryPanel;