"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScales, NextFocus } from '@/context/ScalesContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ScalePracticePanel from './ScalePracticePanel';
import DohnanyiPracticePanel from './DohnanyiPracticePanel';
import HanonPracticePanel from './HanonPracticePanel';
import { cn, getCategoryColorClasses } from '@/lib/utils';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { MIN_BPM, MAX_BPM } from '@/lib/scales';
import { formatDistanceToNow } from 'date-fns';
import PracticeSummaryPanel from './PracticeSummaryPanel';
import { Button } from '@/components/ui/button';
import { showSuccess } from '@/utils/toast';
import { RefreshCw, Target, Settings2, Keyboard, Plus, Minus, Save } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import KeyboardShortcuts from './KeyboardShortcuts';

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
    activeLogSnapshotFunction,
  } = useGlobalBPM();

  const [activeTab, setActiveTab] = useState<'scales' | 'dohnanyi' | 'hanon'>('scales');
  const [isTabManuallySelected, setIsTabManuallySelected] = useState(false);
  const [isEngagingSuggestion, setIsEngagingSuggestion] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;
      
      if (e.key === 'ArrowUp') { 
        e.preventDefault(); 
        handleBpmChange(1); 
      } else if (e.key === 'ArrowDown') { 
        e.preventDefault(); 
        handleBpmChange(-1); 
      } else if (e.key.toLowerCase() === 's' || e.key === 'Enter') {
        e.preventDefault();
        activeLogSnapshotFunction?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBpmChange, activeLogSnapshotFunction]);

  useEffect(() => {
    if (nextFocus && !isTabManuallySelected && !isEngagingSuggestion) {
      const targetTab = (nextFocus.type === 'scale' || nextFocus.type === 'arpeggio') ? 'scales' : nextFocus.type;
      setActiveTab(targetTab as any);
    }
  }, [nextFocus, isTabManuallySelected, isEngagingSuggestion]);

  const handleLoadSuggestion = useCallback(async (item: NextFocus) => {
    if (!item) return;
    setIsEngagingSuggestion(true);
    setIsPermutationManuallyAdjusted(false);
    setIsTabManuallySelected(false);
    const targetTab = (item.type === 'scale' || item.type === 'arpeggio') ? 'scales' : item.type;
    setActiveTab(targetTab as any);
    setActivePermutationHighestBPM(0);
    
    const label = (item.type === 'scale' || item.type === 'arpeggio') 
      ? `${item.scaleItem.key} ${item.scaleItem.type}` 
      : (item as any).name;
      
    showSuccess(`Loaded suggestion: ${label}`);
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
    ? (nextFocus.type === 'scale' || nextFocus.type === 'arpeggio')
      ? `${nextFocus.scaleItem.key} ${nextFocus.scaleItem.type}`
      : (nextFocus as any).name
    : 'None';

  return (
    <div className="max-w-7xl mx-auto space-y-10 px-4 md:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">Practice</h1>
            <KeyboardShortcuts />
          </div>
          <p className="text-lg text-muted-foreground">Focus on your technique and track your progress.</p>
        </div>
        {nextFocus && (
          <Card className="bg-primary/5 border-primary/20 shadow-sm">
            <CardContent className="p-5 flex items-center gap-6">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Suggested Focus</p>
                <p className="text-lg font-semibold">{suggestedLabel}</p>
              </div>
              <Button size="lg" onClick={() => handleLoadSuggestion(nextFocus)} disabled={isEngagingSuggestion} className="focus-scale">
                <Target className="w-5 h-5 mr-2" />
                Start Session
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-10">
          <PracticeSummaryPanel />
          
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as any);
            setActivePermutationHighestBPM(0);
            setIsPermutationManuallyAdjusted(false);
            setIsTabManuallySelected(true);
          }}>
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none gap-10">
              <TabsTrigger 
                value="scales" 
                className={cn(
                  "data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent border-b-4 border-transparent rounded-none px-0 pb-4 text-lg font-bold shadow-none transition-all",
                  activeTab === 'scales' && "text-indigo-600 dark:text-indigo-400"
                )}
              >
                Scales
              </TabsTrigger>
              <TabsTrigger 
                value="dohnanyi" 
                className={cn(
                  "data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent border-b-4 border-transparent rounded-none px-0 pb-4 text-lg font-bold shadow-none transition-all",
                  activeTab === 'dohnanyi' && "text-cyan-600 dark:text-cyan-400"
                )}
              >
                Dohnányi
              </TabsTrigger>
              <TabsTrigger 
                value="hanon" 
                className={cn(
                  "data-[state=active]:border-amber-500 data-[state=active]:bg-transparent border-b-4 border-transparent rounded-none px-0 pb-4 text-lg font-bold shadow-none transition-all",
                  activeTab === 'hanon' && "text-amber-600 dark:text-amber-400"
                )}
              >
                Hanon
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scales" className="pt-8">
              <ScalePracticePanel
                suggestedScalePermutation={(nextFocus?.type === 'scale' || nextFocus?.type === 'arpeggio') ? nextFocus : undefined}
                currentBPM={currentBPM}
                addLogEntry={addLogEntry}
                updatePracticeStatus={updatePracticeStatus}
                updateScaleMasteryBPM={updateScaleMasteryBPM}
                scaleMasteryBPMMap={scaleMasteryBPMMap}
                allScales={allScales}
                activeTab={activeTab}
              />
            </TabsContent>
            <TabsContent value="dohnanyi" className="pt-8">
              <DohnanyiPracticePanel
                suggestedDohnanyi={nextFocus?.type === 'dohnanyi' ? nextFocus : undefined}
                currentBPM={currentBPM}
                addLogEntry={addLogEntry}
                updatePracticeStatus={updatePracticeStatus}
                progressMap={progressMap}
                activeTab={activeTab}
              />
            </TabsContent>
            <TabsContent value="hanon" className="pt-8">
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

        <div className="space-y-10">
          <Card className="shadow-md border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Tempo Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center justify-between">
                <span className="text-5xl font-black tracking-tighter text-primary">{currentBPM}</span>
                <span className="text-sm font-bold text-muted-foreground uppercase">BPM</span>
              </div>
              
              <div className="space-y-4">
                <Slider
                  value={[currentBPM]}
                  min={MIN_BPM}
                  max={MAX_BPM}
                  step={1}
                  onValueChange={([v]) => setCurrentBPM(v)}
                  className="py-4"
                />
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>{MIN_BPM}</span>
                  <span>{MAX_BPM}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="lg" onClick={() => handleBpmChange(-5)} className="flex-1 font-bold focus-scale">
                  -5
                </Button>
                <Button variant="outline" size="lg" onClick={() => handleBpmChange(5)} className="flex-1 font-bold focus-scale">
                  +5
                </Button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {BPM_PRESETS.map(preset => (
                  <Button 
                    key={preset} 
                    variant="outline" 
                    size="sm" 
                    className={cn("h-10 text-xs font-bold px-0 focus-scale", currentBPM === preset && "bg-primary text-primary-foreground border-primary")}
                    onClick={() => setCurrentBPM(preset)}
                  >
                    {preset}
                  </Button>
                ))}
              </div>

              <div className="pt-6 border-t space-y-4">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                  <Keyboard className="w-3 h-3" />
                  Shortcuts
                </div>
                <div className="grid grid-cols-1 gap-3 text-[10px]">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
                    <span className="font-medium">Save Progress</span>
                    <span className="font-black bg-background px-1.5 py-0.5 rounded border shadow-sm">Enter / S</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
                      <span className="font-medium">BPM</span>
                      <span className="font-black bg-background px-1.5 py-0.5 rounded border shadow-sm">↑/↓</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
                      <span className="font-medium">Start/Stop</span>
                      <span className="font-black bg-background px-1.5 py-0.5 rounded border shadow-sm">Space</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <Button variant="ghost" size="sm" onClick={refetchData} disabled={isScalesContextLoading} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                  <RefreshCw className={cn("w-3 h-3 mr-2", isScalesContextLoading && "animate-spin")} />
                  Sync Progress
                </Button>
              </div>
            </CardContent>
          </Card>

          {lastLogEntry && (
            <Card className="bg-primary/5 border-none shadow-none">
              <CardContent className="p-5">
                <p className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-2">Last Session</p>
                <p className="text-base font-medium">{formatDistanceToNow(lastLogEntry.timestamp, { addSuffix: true })}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeCommandCenter;