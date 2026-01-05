import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useScales } from '../context/ScalesContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ScalePracticePanel from './ScalePracticePanel';
import DohnanyiPracticePanel from './DohnanyiPracticePanel';
import HanonPracticePanel from './HanonPracticePanel';
import GradeTracker from './GradeTracker';
import { cn } from '@/lib/utils';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { MIN_BPM, MAX_BPM } from '@/lib/scales';
import { formatDistanceToNow } from 'date-fns';
import PracticeSummaryPanel from './PracticeSummaryPanel';

const PracticeCommandCenter: React.FC = () => {
  const { addLogEntry, allScales, log, progressMap, updatePracticeStatus, updateScaleMasteryBPM, scaleMasteryBPMMap, nextFocus } = useScales();
  const { currentBPM, activePermutationHighestBPM, setCurrentBPM, setActivePermutationHighestBPM } = useGlobalBPM();
  
  // Determine initial tab based on nextFocus
  const initialTab = nextFocus?.type === 'dohnanyi' ? 'dohnanyi' : nextFocus?.type === 'hanon' ? 'hanon' : 'scales';
  const [activeTab, setActiveTab] = useState<'scales' | 'dohnanyi' | 'hanon'>(initialTab);
  
  // Set initial BPM and active tab based on nextFocus when data loads
  useEffect(() => {
    if (nextFocus) {
        if (nextFocus.type === 'scale') {
            // Set BPM to the next suggested goal (highest mastered + 3, or 40)
            // Only update if the BPM is actually different
            if (currentBPM !== nextFocus.nextBPMGoal) {
                setCurrentBPM(nextFocus.nextBPMGoal);
                console.log(`[PracticeCommandCenter] Next focus is scale. Setting BPM to ${nextFocus.nextBPMGoal}`);
            }
            setActiveTab('scales');
        } else if (nextFocus.type === 'dohnanyi' || nextFocus.type === 'hanon') {
            // Set BPM to the target BPM for the next mastery step
            // Only update if the BPM is actually different
            if (currentBPM !== nextFocus.bpmTarget) {
                setCurrentBPM(nextFocus.bpmTarget);
                console.log(`[PracticeCommandCenter] Next focus is ${nextFocus.type}. Setting BPM to ${nextFocus.bpmTarget}`);
            }
            setActiveTab(nextFocus.type);
        }
    }
  }, [nextFocus, setCurrentBPM, currentBPM]); 

  
  // Find the most recent log entry that includes BPM information
  const lastLogEntry = useMemo(() => {
    const entry = log.find(logEntry => logEntry.notes.includes("BPM:"));
    
    if (entry) {
        const bpmMatch = entry.notes.match(/BPM: (\d+)/);
        const lastBPM = bpmMatch ? parseInt(bpmMatch[1], 10) : null;
        
        return {
            timestamp: entry.timestamp,
            lastBPM: lastBPM,
            duration: entry.durationMinutes,
        };
    }
    return null;
  }, [log]);
  
  // Calculate the percentage for the mastered range visualization
  const masteredRangePercentage = useMemo(() => {
    if (activePermutationHighestBPM === 0) return 0;
    // Map the highest mastered BPM to a percentage of the MAX_BPM range (40 to 250)
    const range = MAX_BPM - MIN_BPM;
    const masteredBPMAdjusted = activePermutationHighestBPM - MIN_BPM;
    return Math.min(100, (masteredBPMAdjusted / range) * 100);
  }, [activePermutationHighestBPM]);

  return (
    <div className="p-4 md:p-8 min-h-[calc(100vh-64px)] flex flex-col items-center justify-start bg-background">
      <Card className="w-full max-w-6xl bg-card border-2 border-primary shadow-2xl shadow-primary/50 transition-all duration-500">
        <CardHeader className="p-4 border-b border-primary/50">
          <CardTitle className="text-2xl font-mono tracking-widest text-primary text-center">
            PRACTICE CONTROL PANEL
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* Top Row: BPM Display & Summary Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Column 1: Tempo Display */}
            <div className="lg:col-span-1 space-y-2">
                {/* Last Practiced Message */}
                <div className="h-10 flex items-center justify-center lg:justify-start">
                    {lastLogEntry ? (
                        <p className="text-sm text-yellow-400 font-mono text-center lg:text-left">
                            LAST LOG ({formatDistanceToNow(lastLogEntry.timestamp, { addSuffix: true })}): 
                            {lastLogEntry.lastBPM ? (
                                <span className="font-bold ml-1">Targeted {lastLogEntry.lastBPM} BPM.</span>
                            ) : (
                                <span className="font-bold ml-1">Logged {lastLogEntry.duration} min.</span>
                            )}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground font-mono text-center lg:text-left">
                            No recent practice log found.
                        </p>
                    )}
                </div>
                
                <Label className="text-lg font-semibold text-primary block font-mono text-center lg:text-left">
                    CURRENT TEMPO (BPM)
                </Label>
                <div className="flex items-center justify-center lg:justify-start space-x-4">
                    <div className="text-7xl font-mono font-extrabold text-primary tracking-tighter min-w-[120px] text-center">
                        {currentBPM}
                    </div>
                </div>
                <p className="text-sm text-muted-foreground font-mono text-center lg:text-left">
                    Use controls in the header or the slider below to set BPM.
                </p>
            </div>

            {/* Column 2 & 3: Practice Summary Panel */}
            <div className="lg:col-span-2">
                <PracticeSummaryPanel />
            </div>
          </div>
          
          {/* BPM Slider (Fine-tuned control) */}
          <div className="space-y-4 pt-4 border-t border-border">
            <Label className="text-sm font-semibold text-muted-foreground block font-mono">BPM Fine Control</Label>
            <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground font-mono">{MIN_BPM}</span>
                <div className="flex-1 relative">
                    {/* Visual indicator for mastered range */}
                    <div 
                        className={cn(
                            "absolute top-1/2 -translate-y-1/2 h-2 rounded-lg bg-green-600/50 transition-all duration-300 pointer-events-none",
                            activePermutationHighestBPM > 0 ? "opacity-100" : "opacity-0"
                        )}
                        style={{ width: `${masteredRangePercentage}%` }}
                    />
                    <input
                        type="range"
                        min={MIN_BPM}
                        max={MAX_BPM}
                        step={1}
                        value={currentBPM}
                        onChange={(e) => setCurrentBPM(parseInt(e.target.value))}
                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer range-lg dark:bg-muted relative z-10"
                    />
                </div>
                <span className="text-sm text-muted-foreground font-mono">{MAX_BPM}</span>
            </div>
            {activePermutationHighestBPM > 0 && (
                <p className="text-xs text-green-400 font-mono text-center">
                    Mastered up to {activePermutationHighestBPM} BPM for the current selection.
                </p>
            )}
          </div>

          {/* Grade Tracker */}
          <GradeTracker />

          {/* Tabbed Practice Panels */}
          <Tabs 
            defaultValue="scales" 
            value={activeTab} 
            onValueChange={(v) => {
                console.log(`[PracticeCommandCenter] Tab changed to: ${v}`);
                setActiveTab(v as 'scales' | 'dohnanyi' | 'hanon');
                setActivePermutationHighestBPM(0); // Reset BPM visualization when switching tabs
            }} 
            className="w-full pt-4"
          >
            <TabsList className="grid w-full grid-cols-3 bg-secondary/50 border border-primary/30">
              <TabsTrigger 
                value="scales" 
                className="font-mono text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Scales
              </TabsTrigger>
              <TabsTrigger 
                value="dohnanyi" 
                className="font-mono text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Dohnányi
              </TabsTrigger>
            <TabsTrigger 
                value="hanon" 
                className="font-mono text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Hanon
              </TabsTrigger>
            </TabsList>
            <TabsContent value="scales" className="mt-4">
              <ScalePracticePanel 
                initialFocus={nextFocus?.type === 'scale' ? nextFocus : undefined}
                currentBPM={currentBPM} 
                addLogEntry={addLogEntry} 
                updatePracticeStatus={updatePracticeStatus} 
                updateScaleMasteryBPM={updateScaleMasteryBPM}
                scaleMasteryBPMMap={scaleMasteryBPMMap}
                allScales={allScales} 
              />
            </TabsContent>
            <TabsContent value="dohnanyi" className="mt-4">
              <DohnanyiPracticePanel 
                initialFocus={nextFocus?.type === 'dohnanyi' ? nextFocus : undefined}
                currentBPM={currentBPM} 
                addLogEntry={addLogEntry} 
                updatePracticeStatus={updatePracticeStatus} 
                progressMap={progressMap}
              />
            </TabsContent>
            <TabsContent value="hanon" className="mt-4">
              <HanonPracticePanel 
                initialFocus={nextFocus?.type === 'hanon' ? nextFocus : undefined}
                currentBPM={currentBPM} 
                addLogEntry={addLogEntry} 
                updatePracticeStatus={updatePracticeStatus} 
                progressMap={progressMap}
              />
            </TabsContent>
          </Tabs>
          
        </CardContent>
      </Card>
    </div>
  );
};

export default PracticeCommandCenter;