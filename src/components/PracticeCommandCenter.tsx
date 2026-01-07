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
    isLoading: isScalesContextLoading,
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
  const [isEngagingSuggestion, setIsEngagingSuggestion] = useState(false);

  // Auto-load suggested focus on mount or when nextFocus changes
  useEffect(() => {
    if (nextFocus && !isTabManuallySelected && !isEngagingSuggestion) {
      const targetTab = nextFocus.type === 'scale' ? 'scales' : nextFocus.type;
      setActiveTab(targetTab as any);
    }
  }, [nextFocus, isTabManuallySelected, isEngagingSuggestion]);

  const handleLoadSuggestion = useCallback(
    async (item: NextFocus) => {
      if (!item) return;

      setIsEngagingSuggestion(true);
      setIsPermutationManuallyAdjusted(false);
      setIsTabManuallySelected(false);

      const targetTab = item.type === 'scale' ? 'scales' : item.type;
      setActiveTab(targetTab as any);
      setActivePermutationHighestBPM(0);

      showSuccess(
        `► LOADED PRIORITY TARGET: ${
          item.type === 'scale'
            ? `${item.scaleItem.key} ${item.scaleItem.type}`
            : item.name
        }`
      );
      // Simulate a small delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 500)); 
      setIsEngagingSuggestion(false);
    },
    [setIsPermutationManuallyAdjusted, setActivePermutationHighestBPM]
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
    <div className="min-h-screen text-foreground font-mono flex items-center justify-center p-4 overflow-hidden relative">
      {/* Removed inline scanlines, now handled by AppLayout */}

      <div className="w-full max-w-6xl relative">
        {/* Terminal Glow Border */}
        <div className="absolute -inset-4 bg-primary/20 blur-3xl animate-pulse" />

        <Card className="relative border-4 border-primary/80 bg-card/95 shadow-2xl">
          <CardHeader className="border-b-2 border-primary/50 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="w-8 h-8 text-primary" />
                <CardTitle className="text-3xl tracking-widest text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.8)]">
                  PRACTICE COMMAND CENTER
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Zap className="w-4 h-4 animate-pulse text-primary" />
                <span>ONLINE</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-8 space-y-8 pb-10">
            {/* Status Readout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-xs text-primary/70 uppercase">Last Transmission</div>
                {lastLogEntry ? (
                  <p className="text-sm">
                    {formatDistanceToNow(lastLogEntry.timestamp, { addSuffix: true })} →{' '}
                    {lastLogEntry.lastBPM ? (
                      <span className="text-warning font-bold">TARGET BPM: {lastLogEntry.lastBPM}</span>
                    ) : (
                      <span className="text-success">SESSION: {lastLogEntry.duration} min</span>
                    )}
                  </p>
                ) : (
                  <p className="text-muted-foreground">No recent activity detected.</p>
                )}
              </div>

              <div className="space-y-2 text-right md:text-left">
                <div className="text-xs text-primary/70 uppercase">Priority Target</div>
                {nextFocus ? (
                  <div className="flex items-center justify-end md:justify-start gap-3">
                    <span className="font-bold text-warning blinking">► {suggestedLabel}</span>
                    <Button
                      onClick={() => handleLoadSuggestion(nextFocus)}
                      size="sm"
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/20 hover:text-foreground transition-all"
                      disabled={isEngagingSuggestion || isScalesContextLoading}
                    >
                      {isEngagingSuggestion ? (
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Target className="w-4 h-4 mr-1" />
                      )}
                      ENGAGE
                    </Button>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Awaiting directive...</span>
                )}
              </div>
            </div>

            {/* Practice Summary */}
            <div className="border-t border-primary/50 pt-6">
              <PracticeSummaryPanel />
            </div>

            {/* BPM Mastery Control */}
            <div className="space-y-4 border border-primary/50 rounded-lg p-6 bg-card/40">
              <div className="flex items-center justify-between">
                <Label className="text-primary text-lg tracking-wider">METRONOME OVERRIDE</Label>
                <span className="text-2xl font-bold text-warning">{currentBPM}</span>
              </div>

              <div className="relative">
                {/* Retro Progress Bar Background */}
                <div className="h-10 bg-gradient-to-r from-background via-primary/30 to-background border border-primary/70 rounded overflow-hidden">
                  {/* Mastered Zone */}
                  <div
                    className="h-full bg-gradient-to-r from-transparent via-primary/40 to-primary/60 transition-all duration-1000 ease-out"
                    style={{ width: `${masteredRangePercentage}%` }}
                  />
                  {/* Current BPM Marker */}
                  <div
                    className="absolute top-0 h-full w-1 bg-warning shadow-[0_0_10px_hsl(var(--warning))] animate-pulse"
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
                  className="absolute inset-x-0 -top-1 h-12 opacity-0 cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_hsl(var(--primary))] [&::-webkit-slider-thumb]:cursor-grab
                             [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-[0_0_10px_hsl(var(--primary))] [&::-moz-range-thumb]:cursor-grab"
                />
              </div>

              <div className="flex justify-between text-xs text-primary/70">
                <span>{MIN_BPM} BPM</span>
                {activePermutationHighestBPM > MIN_BPM && (
                  <span className="text-success animate-pulse">
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
              <TabsList className="grid grid-cols-3 bg-card/60 border-2 border-primary/70 h-14">
                <TabsTrigger
                  value="scales"
                  className="text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_15px_hsl(var(--primary)/0.8)] transition-all text-lg tracking-wider"
                >
                  SCALES
                </TabsTrigger>
                <TabsTrigger
                  value="dohnanyi"
                  className="text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_15px_hsl(var(--primary)/0.8)] transition-all text-lg tracking-wider"
                >
                  DOHNÁNYI
                </TabsTrigger>
                <TabsTrigger
                  value="hanon"
                  className="text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_15px_hsl(var(--primary)/0.8)] transition-all text-lg tracking-wider"
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
            <div className="flex justify-center pt-6 border-t border-primary/50">
              <Button
                onClick={refetchData}
                variant="outline"
                className="border-primary/70 text-primary hover:bg-primary/20 hover:text-foreground transition-all"
                disabled={isScalesContextLoading}
              >
                {isScalesContextLoading ? (
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5 mr-2" />
                )}
                SYNC DATA CORE
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Status */}
        <div className="text-center mt-6 text-primary/70 opacity-70">
          SYSTEM READY • {new Date().toLocaleDateString()} • v4.0 "RETRO COMMAND"
        </div>
      </div>
    </div>
  );
};

export default PracticeCommandCenter;