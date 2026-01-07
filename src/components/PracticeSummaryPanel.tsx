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
      <Card className="w-full bg-black/90 border-2 border-green-600/60 shadow-2xl shadow-green-500/20">
        <CardHeader className="p-4 border-b-2 border-green-700/50">
          <CardTitle className="text-center text-xl font-mono tracking-widest text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]">
            ► CURRENT FOCUS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-6">
          <div className="flex justify-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 animate-pulse" />
          </div>
          <p className="text-green-600 font-mono text-lg tracking-wider">
            NO ACTIVE TARGET ACQUIRED
          </p>
          <p className="text-sm text-green-800 opacity-70">
            Select an exercise to lock onto a practice vector.
          </p>
          <Button
            disabled
            className="w-full bg-green-900/30 border border-green-700 text-green-600 font-mono cursor-not-allowed"
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
        return { text: 'GOAL SURPASSED', color: 'text-cyan-400', icon: CheckCircle2, pulse: true };
      if (currentBPM > highestBPM)
        return { text: 'NEW RECORD', color: 'text-yellow-400', icon: Zap, pulse: true };
      return { text: 'IN TRAINING', color: 'text-green-500', icon: Target, pulse: false };
    } else {
      const isMastered = (activePracticeItem as any).isMastered;
      return isMastered
        ? { text: 'EXERCISE MASTERED', color: 'text-cyan-400', icon: CheckCircle2, pulse: true }
        : { text: 'TARGET LOCKED', color: 'text-yellow-400', icon: Target, pulse: false };
    }
  };

  const status = getStatusConfig();

  const masteryPercentage = (() => {
    if (activePracticeItem.type === 'scale') {
      const { highestBPM, nextGoalBPM } = activePracticeItem;
      const base = highestBPM;
      const target = nextGoalBPM;
      return Math.min(100, ((currentBPM - base) / (target - base)) * 100);
    } else {
      const { currentHighestBPM, nextTargetBPM } = activePracticeItem as any;
      return Math.min(100, ((currentBPM - currentHighestBPM) / (nextTargetBPM - currentHighestBPM)) * 100);
    }
  })();

  const StatusIcon = status.icon;

  return (
    <Card className="w-full bg-black/95 border-4 border-green-500/80 shadow-2xl shadow-green-500/40 relative overflow-hidden">
      {/* Subtle CRT glow overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-green-500/5 to-transparent" />
      </div>

      <CardHeader className="p-5 border-b-4 border-green-600/70 relative">
        <CardTitle className="text-center text-2xl font-mono tracking-widest text-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.8)] flex items-center justify-center gap-4">
          <Radio className="w-6 h-6 animate-pulse" />
          CURRENT FOCUS
          <Radio className="w-6 h-6 animate-pulse" />
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6 relative z-10">
        {/* Main Target Display */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold font-mono text-green-400 tracking-wider drop-shadow-[0_0_15px_rgba(74,222,128,0.9)]">
            {activePracticeItem.type === 'scale'
              ? `${activePracticeItem.key} ${activePracticeItem.scaleType}`
              : activePracticeItem.name}
          </h2>

          <div className="flex items-center justify-center gap-6 mt-6">
            <div className={cn("flex items-center gap-3 px-5 py-2 rounded-full border-2", 
              status.pulse && "animate-pulse",
              status.color === 'text-cyan-400' ? "border-cyan-500 bg-cyan-500/10" :
              status.color === 'text-yellow-400' ? "border-yellow-500 bg-yellow-500/10" :
              "border-green-500 bg-green-500/10"
            )}>
              <StatusIcon className={cn("w-6 h-6", status.pulse && "animate-pulse", status.color)} />
              <span className={cn("font-mono text-lg font-bold tracking-wider", status.color)}>
                {status.text}
              </span>
            </div>

            <div className="text-5xl font-mono font-black text-yellow-300 tracking-tighter drop-shadow-[0_0_20px_rgba(253,224,71,0.8)]">
              {currentBPM}
              <span className="text-2xl text-green-400 ml-1">BPM</span>
            </div>
          </div>
        </div>

        {/* Mastery Progress Bar */}
        <div className="space-y-2">
          <div className="text-xs text-green-600 uppercase tracking-wider text-center">Performance Vector</div>
          <div className="h-8 bg-black border-2 border-green-700 rounded overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-green-900 via-green-600 to-cyan-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(34,197,94,0.6)]"
              style={{ width: `${Math.max(5, masteryPercentage)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-green-300 font-mono font-bold text-sm">
                {masteryPercentage.toFixed(0)}% TOWARD NEXT MILESTONE
              </span>
            </div>
          </div>
        </div>

        {/* Parameter Readouts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activePracticeItem.type === 'scale' && (
            <>
              <div className="p-3 bg-green-900/20 border border-green-600/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-cyan-400" />
                  <div>
                    <p className="text-xs text-green-600 uppercase">Articulation</p>
                    <p className="font-mono text-lg text-green-300 font-bold">{activePracticeItem.articulation}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-green-900/20 border border-green-600/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Music className="w-6 h-6 text-cyan-400" />
                  <div>
                    <p className="text-xs text-green-600 uppercase">Octaves</p>
                    <p className="font-mono text-lg text-green-300 font-bold">{activePracticeItem.octaves}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-green-900/20 border border-green-600/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Hand className="w-6 h-6 text-cyan-400" />
                  <div>
                    <p className="text-xs text-green-600 uppercase">Hands</p>
                    <p className="font-mono text-lg text-green-300 font-bold">{activePracticeItem.handConfig}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="p-3 bg-yellow-900/20 border border-yellow-600/40 rounded-lg">
            <div className="flex items-center gap-3">
              <Gauge className="w-6 h-6 text-yellow-400 animate-pulse" />
              <div>
                <p className="text-xs text-green-600 uppercase">Highest Recorded</p>
                <p className="font-mono text-xl text-yellow-300 font-black">
                  {activePracticeItem.type === 'scale' 
                    ? activePracticeItem.highestBPM 
                    : (activePracticeItem as any).currentHighestBPM} BPM
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-cyan-900/20 border border-cyan-600/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-cyan-400" />
              <div>
                <p className="text-xs text-green-600 uppercase">Next Milestone</p>
                <p className="font-mono text-xl text-cyan-300 font-black">
                  {activePracticeItem.type === 'scale' 
                    ? activePracticeItem.nextGoalBPM 
                    : (activePracticeItem as any).nextTargetBPM} BPM
                </p>
              </div>
            </div>
          </div>

          {activePracticeItem.type !== 'scale' && (
            <div className="p-3 bg-green-900/20 border border-green-600/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Piano className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-xs text-green-600 uppercase">Regime</p>
                  <p className="font-mono text-lg text-green-300 font-bold capitalize">
                    {activePracticeItem.type === 'dohnanyi' ? 'Dohnányi' : 'Hanon'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Snapshot Transmit Button */}
        <div className="pt-6 border-t-2 border-green-800/50">
          <Button
            onClick={() => activeLogSnapshotFunction?.()}
            disabled={!activeLogSnapshotFunction}
            className={cn(
              "w-full h-14 text-lg font-mono tracking-wider transition-all",
              activeLogSnapshotFunction
                ? "bg-green-600/80 hover:bg-green-500 text-black border-2 border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.6)] hover:shadow-[0_0_30px_rgba(74,222,128,0.8)]"
                : "bg-green-900/30 border border-green-700 text-green-700 cursor-not-allowed"
            )}
          >
            <Radio className="w-6 h-6 mr-3 animate-pulse" />
            TRANSMIT PERFORMANCE DATA ({currentBPM} BPM)
            <Radio className="w-6 h-6 ml-3 animate-pulse" />
          </Button>
        </div>
      </CardContent>

      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.4); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }
      `}</style>
    </Card>
  );
};

export default PracticeSummaryPanel;