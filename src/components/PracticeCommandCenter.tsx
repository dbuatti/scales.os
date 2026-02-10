"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScales, NextFocus } from '@/context/ScalesContext';
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
import { RefreshCw, Target, Settings2, Keyboard, Plus, Minus } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const BPM_PRESETS = [60, 80, 100, 120, 140];

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
    handleBpmChange,
  } = useGlobalBPM();

  const [activeTab, setActiveTab] = useState<'scales' | 'dohnanyi' | 'hanon'>('scales');
  const [isTabManuallySelected, setIsTabManuallySelected] = useState(false);
  const [isEngagingSuggestion, setIsEngagingSuggestion] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;
      if (e.key === 'ArrowUp') { e.preventDefault(); handleBpmChange(1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); handleBpmChange(-1); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBpmChange]);

  useEffect(() => {
    if (nextFocus && !isTabManuallySelected && !isEngagingSuggestion) {
      const targetTab = nextFocus.type === 'scale' ? 'scales' : nextFocus.type;
      setActiveTab(targetTab as any);
    }
  }, [nextFocus, isTabManuallySelected, isEngagingSuggestion]);

  const handleLoadSuggestion = useCallback(async (item: NextFocus) => {
    if (!item) return;
    setIsEngagingSuggestion(true);
    setIsPermutationManuallyAdjusted(false);
    setIsTabManuallySelected(false);
    const targetTab = item.type === 'scale' ? 'scales' : item.type;
    setActiveTab(targetTab as any);
    setActivePermutationHighestBPM(0);
    showSuccess(`Loaded suggestion: ${item.type === 'scale' ? `${item.scaleItem.key} ${item.scaleItem.type}` : item.name}`);
    await new Promise(resolve => setTimeout(resolve, 300)); 
    setIsEngagingSuggestion(false);
  }, [setIsPermutationManuallyAdjusted, setActivePermutationHighestBPM]);

  const lastLogEntry = useMemo(() => {
    const entry = log[0];
    if (!entry) return null;
    return {
      timestamp: entry.timestamp,
      duration: entry.durationMinutes,
    };
  }, [log]);

  const suggestedLabel = nextFocus
    ? nextFocus.type === 'scale'
      ? `${nextFocus.scaleItem.key} ${nextFocus.scaleItem.type}`
      : nextFocus.name
    : 'None';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Practice</h1>
          <p className="text-muted-foreground">Focus on your technique and track your progress.</p>
        </div>
        {nextFocus && (
          <Card className="bg-muted/50 border-none shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-muted-foreground">Suggested Focus</p>
                <p className="text-sm font-semibold">{suggestedLabel}</p>
              </div>
              <Button size="sm" onClick={() => handleLoadSuggestion(nextFocus)} disabled={isEngagingSuggestion}>
                <Target className="w-4 h-4 mr-2" />
                Start
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PracticeSummaryPanel />
          
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as any);
            setActivePermutationHighestBPM(0);
            setIsPermutationManuallyAdjusted(false);
            setIsTabManuallySelected(true);
          }}>
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none gap-6">
              <TabsTrigger value="scales" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-0 pb-2 text-base font-semibold shadow-none">Scales</TabsTrigger>
              <TabsTrigger value="dohnanyi" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-0 pb-2 text-base font-semibold shadow-none">Dohnányi</TabsTrigger>
              <TabsTrigger value="hanon" className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-0 pb-2 text-base font-semibold shadow-none">Hanon</TabsTrigger>
            </TabsList>

            <TabsContent value="scales" className="pt-6">
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
            <TabsContent value="dohnanyi" className="pt-6">
              <DohnanyiPracticePanel
                suggestedDohnanyi={nextFocus?.type === 'dohnanyi' ? nextFocus : undefined}
                currentBPM={currentBPM}
                addLogEntry={addLogEntry}
                updatePracticeStatus={updatePracticeStatus}
                progressMap={progressMap}
                activeTab={activeTab}
              />
            </TabsContent>
            <TabsContent value="hanon" className="pt-6">
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
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Tempo Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold tracking-tighter">{currentBPM}</span>
                <span className="text-sm font-medium text-muted-foreground uppercase">BPM</span>
              </div>
              
              <div className="space-y-4">
                <Slider
                  value={[currentBPM]}
                  min={MIN_BPM}
                  max={MAX_BPM}
                  step={1}
                  onValueChange={([v]) => setCurrentBPM(v)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{MIN_BPM}</span>
                  <span>{MAX_BPM}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBpmChange(-5)} className="flex-1">
                  -5
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBpmChange(5)} className="flex-1">
                  +5
                </Button>
              </div>

              <div className="grid grid-cols-5 gap-1">
                {BPM_PRESETS.map(preset => (
                  <Button 
                    key={preset} 
                    variant="outline" 
                    size="sm" 
                    className={cn("h-8 text-[10px] px-0", currentBPM === preset && "bg-primary text-primary-foreground")}
                    onClick={() => setCurrentBPM(preset)}
                  >
                    {preset}
                  </Button>
                ))}
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-medium">
                  <Keyboard className="w-3 h-3" />
                  Shortcuts
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span>BPM</span>
                    <span className="font-bold">↑/↓</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span>Start/Stop</span>
                    <span className="font-bold">Space</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-center">
                <Button variant="ghost" size="sm" onClick={refetchData} disabled={isScalesContextLoading} className="text-xs text-muted-foreground">
                  <RefreshCw className={cn("w-3 h-3 mr-2", isScalesContextLoading && "animate-spin")} />
                  Sync Progress
                </Button>
              </div>
            </CardContent>
          </Card>

          {lastLogEntry && (
            <Card className="bg-muted/30 border-none shadow-none">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Last Session</p>
                <p className="text-sm">{formatDistanceToNow(lastLogEntry.timestamp, { addSuffix: true })}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeCommandCenter;