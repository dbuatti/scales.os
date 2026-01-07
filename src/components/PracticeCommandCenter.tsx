import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useScales, NextFocus } from '../context/ScalesContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ScalePracticePanel from './ScalePracticePanel';
import DohnanyiPracticePanel from './DohnanyiPracticePanel';
import HanonPracticePanel from './HanonPracticePanel';
import { cn } from '@/lib/utils';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { MIN_BPM, MAX_BPM } from '@/lib/scales';
import { formatDistanceToNow } from 'date-fns';
import PracticeSummaryPanel from './PracticeSummaryPanel';
import { Button } from '@/components/ui/button';
import { showSuccess } from '@/utils/toast';
import { RefreshCw, Zap, Target, Terminal } from 'lucide-react';

const PracticeCommandCenter: React.FC = () => {
  const {
    addLogEntry,
    allScales,
    log,
    progressMap,
    updatePracticeStatus,
    updateScaleMasteryBPM,
    scaleMasteryBPMMap,
    nextFocus,
    refetchData,
  } = useScales();

  const {
    currentBPM,
    activePermutationHighestBPM,
    setCurrentBPM,
    setActivePermutationHighestBPM,
    setIsPermutationManuallyAdjusted,
  } = useGlobalBPM();

  const [activeTab, setActiveTab] = useState<'scales' | 'dohnanyi' | 'hanon'>('scales');
  const [isTabManuallySelected, setIsTabManuallySelected] = useState(false);

  // Auto-load suggested focus on mount or when nextFocus changes
  useEffect(() => {
    if (nextFocus && !isTabManuallySelected) {
      const targetTab = nextFocus.type === 'scale' ? 'scales' : nextFocus.type;
      setActiveTab(targetTab as any);
    }
  }, [nextFocus, isTabManuallySelected]);

  const handleLoadSuggestion = useCallback(
    (item: NextFocus) => {
      if (!item) return;

      setIsPermutationManuallyAdjusted(false);
      setIsTabManuallySelected(false);

      const targetTab = item.type === 'scale' ? 'scales' : item.type;
      setActiveTab(targetTab as any);
      setActivePermutationHighestBPM(0); // Reset for fresh load feel

      showSuccess(
        `► LOADED PRIORITY TARGET: ${
          item.type === 'scale'
            ? `${item.scaleItem.key} ${item.scaleItem.type}`
            : item.name
        }`
      );
    },
    [setIsPermutationManuallyAdjusted]
  );

  const lastLogEntry = useMemo(() => {
    const entry = log.find((e) => e.notes.includes('BPM:'));
    if (!entry) return null;

    const bpmMatch = entry.notes.match(/BPM: (\d+)/);
    const bpm = bpmMatch ? parseInt(bpmMatch[1], 10) : null;

    return {
      timestamp: entry.timestamp,
      lastBPM: bpm,
      duration: entry.durationMinutes,
    };
  }, [log]);

  const masteredRangePercentage = useMemo(() => {
    if (activePermutationHighestBPM <= MIN_BPM) return 0;
    const range = MAX_BPM - MIN_BPM;
    const adjusted = Math.max(0, activePermutationHighestBPM - MIN_BPM);
    return Math.min(100, (adjusted / range) * 100);
  }, [activePermutationHighestBPM]);

  const suggestedLabel = nextFocus
    ? nextFocus.type === 'scale'
      ? `${nextFocus.scaleItem.key} ${nextFocus.scaleItem.type}`
      : nextFocus.name
    : 'None';

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center p-4 overflow-hidden relative">
      {/* CRT Scanlines Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="h-full w-full bg-repeat-y" style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(0,255,0,0.05) 50%)', backgroundSize: '100% 4px' }} />
      </div>

      <div className="w-full max-w-6xl relative">
        {/* Terminal Glow Border */}
        <div className="absolute -inset-4 bg-green-500/20 blur-3xl animate-pulse" />

        <Card className="relative border-4 border-green-500/80 bg-black/95 shadow-2xl">
          <CardHeader className="border-b-2 border-green-600/50 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="w-8 h-8 text-green-400" />
                <CardTitle className="text-3xl tracking-widest text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]">
                  PRACTICE COMMAND CENTER
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Zap className="w-4 h-4 animate-pulse" />
                <span>ONLINE</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-8 space-y-8 pb-10">
            {/* Status Readout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-xs text-green-600 uppercase">Last Transmission</div>
                {lastLogEntry ? (
                  <p className="text-sm">
                    {formatDistanceToNow(lastLogEntry.timestamp, { addSuffix: true })} →{' '}
                    {lastLogEntry.lastBPM ? (
                      <span className="text-yellow-400 font-bold">TARGET BPM: {lastLogEntry.lastBPM}</span>
                    ) : (
                      <span className="text-cyan-400">SESSION: {lastLogEntry.duration} min</span>
                    )}
                  </p>
                ) : (
                  <p className="text-gray-600">No recent activity detected.</p>
                )}
              </div>

              <div className="space-y-2 text-right md:text-left">
                <div className="text-xs text-green-600 uppercase">Priority Target</div>
                {nextFocus ? (
                  <div className="flex items-center justify-end md:justify-start gap-3">
                    <span className="font-bold text-yellow-300 blinking">► {suggestedLabel}</span>
                    <Button
                      onClick={() => handleLoadSuggestion(nextFocus)}
                      size="sm"
                      variant="outline"
                      className="border-green-500 text-green-400 hover:bg-green-500/20 hover:text-white transition-all"
                    >
                      <Target className="w-4 h-4 mr-1" />
                      ENGAGE
                    </Button>
                  </div>
                ) : (
                  <span className="text-gray-600">Awaiting directive...</span>
                )}
              </div>
            </div>

            {/* Practice Summary */}
            <div className="border-t border-green-900/50 pt-6">
              <PracticeSummaryPanel />
            </div>

            {/* BPM Mastery Control */}
            <div className="space-y-4 border border-green-800/50 rounded-lg p-6 bg-black/40">
              <div className="flex items-center justify-between">
                <Label className="text-green-400 text-lg tracking-wider">METRONOME OVERRIDE</Label>
                <span className="text-2xl font-bold text-yellow-300">{currentBPM}</span>
              </div>

              <div className="relative">
                {/* Retro Progress Bar Background */}
                <div className="h-10 bg-gradient-to-r from-black via-green-900/30 to-black border border-green-700/70 rounded overflow-hidden">
                  {/* Mastered Zone */}
                  <div
                    className="h-full bg-gradient-to-r from-transparent via-green-600/40 to-green-500/60 transition-all duration-1000 ease-out"
                    style={{ width: `${masteredRangePercentage}%` }}
                  />
                  {/* Current BPM Marker */}
                  <div
                    className="absolute top-0 h-full w-1 bg-yellow-400 shadow-[0_0_10px_#fff] animate-pulse"
                    style={{ left: `${((currentBPM - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 100}%` }}
                  />
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={MIN_BPM}
                  max={MAX_BPM}
                  step={1}
                  value={currentBPM}
                  onChange={(e) => setCurrentBPM(parseInt(e.target.value))}
                  className="absolute inset-x-0 -top-1 h-12 opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex justify-between text-xs text-green-600">
                <span>{MIN_BPM} BPM</span>
                {activePermutationHighestBPM > MIN_BPM && (
                  <span className="text-cyan-400 animate-pulse">
                    MASTERED → {activePermutationHighestBPM} BPM
                  </span>
                )}
                <span>{MAX_BPM} BPM</span>
              </div>
            </div>

            {/* Main Practice Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v as any);
                setActivePermutationHighestBPM(0);
                setIsPermutationManuallyAdjusted(false);
                setIsTabManuallySelected(true);
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 bg-black/60 border-2 border-green-700/70 h-14">
                <TabsTrigger
                  value="scales"
                  className="text-green-400 data-[state=active]:bg-green-600 data-[state=active]:text-black data-[state=active]:shadow-[0_0_15px_rgba(74,222,128,0.8)] transition-all text-lg tracking-wider"
                >
                  SCALES
                </TabsTrigger>
                <TabsTrigger
                  value="dohnanyi"
                  className="text-green-400 data-[state=active]:bg-green-600 data-[state=active]:text-black data-[state=active]:shadow-[0_0_15px_rgba(74,222,128,0.8)] transition-all text-lg tracking-wider"
                >
                  DOHNÁNYI
                </TabsTrigger>
                <TabsTrigger
                  value="hanon"
                  className="text-green-400 data-[state=active]:bg-green-600 data-[state=active]:text-black data-[state=active]:shadow-[0_0_15px_rgba(74,222,128,0.8)] transition-all text-lg tracking-wider"
                >
                  HANON
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scales" className="mt-8">
                <ScalePracticePanel
                  suggestedScalePermutation={nextFocus?.type === 'scale' ? nextFocus : undefined}
                  currentBPM={currentBPM}
                  addLogEntry={addLogEntry}
                  updatePracticeStatus={updatePracticeStatus}
                  updateScaleMasteryBPM={updateScaleMasteryBPM}
                  scaleMasteryBPMMap={scaleMasteryBPMMap}
                  allScales={allScales}
                  activeTab={activeTab}
                />
              </TabsContent>

              <TabsContent value="dohnanyi" className="mt-8">
                <DohnanyiPracticePanel
                  suggestedDohnanyi={nextFocus?.type === 'dohnanyi' ? nextFocus : undefined}
                  currentBPM={currentBPM}
                  addLogEntry={addLogEntry}
                  updatePracticeStatus={updatePracticeStatus}
                  progressMap={progressMap}
                  activeTab={activeTab}
                />
              </TabsContent>

              <TabsContent value="hanon" className="mt-8">
                <HanonPracticePanel
                  suggestedHanon={nextFocus?.type === 'hanon' ? nextFocus : undefined}
                  currentBPM={currentBPM}
                  addLogEntry={addLogEntry}
                  updatePracticeStatus={updatePracticeStatus}
                  progressMap={progressMap}
                  activeTab={activeTab}
                />
              </TabsContent>
            </Tabs>

            {/* Refresh Control */}
            <div className="flex justify-center pt-6 border-t border-green-900/50">
              <Button
                onClick={refetchData}
                variant="outline"
                className="border-green-600 text-green-400 hover:bg-green-600/20 hover:text-white transition-all"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                SYNC DATA CORE
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Status */}
        <div className="text-center mt-6 text-xs text-green-800 opacity-70">
          SYSTEM READY • {new Date().toLocaleDateString()} • v4.0 "RETRO COMMAND"
        </div>
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .blinking {
          animation: blink 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default PracticeCommandCenter;