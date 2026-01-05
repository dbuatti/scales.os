import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { 
  KEYS, SCALE_TYPES, ARPEGGIO_TYPES, ARTICULATIONS, 
  Key, Articulation, TempoLevel,
  DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS, OCTAVE_CONFIGURATIONS,
  DirectionType, HandConfiguration, RhythmicPermutation, AccentDistribution, OctaveConfiguration, TEMPO_LEVELS,
  getScalePermutationId, parseScalePermutationId
} from '@/lib/scales';
import { useScales, NextFocus } from '../context/ScalesContext';
import { showSuccess, showError } from '@/utils/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn, shallowEqual } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useGlobalBPM, SNAPSHOT_DEBOUNCE_MS, ActivePracticeItem } from '@/context/GlobalBPMContext';

// Helper function to map BPM to TempoLevel string for progress ID compatibility (kept for logging)
const mapBPMToTempoLevel = (bpm: number): TempoLevel => {
  if (bpm < 80) return TEMPO_LEVELS[0]; // Slow
  if (bpm <= 100) return TEMPO_LEVELS[1]; // Moderate
  if (bpm <= 120) return TEMPO_LEVELS[2]; // Fast
  return TEMPO_LEVELS[3]; // Professional
};

interface PermutationSectionProps<T extends string> {
    title: string;
    description: string;
    options: readonly T[];
    selectedValue: T;
    onValueChange: (value: T) => void;
}

const PermutationSection = <T extends string>({ title, description, options, selectedValue, onValueChange }: PermutationSectionProps<T>) => (
    <div className="space-y-3 border p-4 rounded-lg border-primary/30 bg-secondary/50">
        <Label className="text-lg font-semibold text-primary block mb-2 font-mono">{title}</Label>
        <p className="text-xs text-muted-foreground italic mb-4">{description}</p>
        <ToggleGroup 
            type="single" 
            value={selectedValue} 
            onValueChange={(value) => value && onValueChange(value as T)}
            className="flex flex-col space-y-2 w-full"
        >
            {options.map(option => (
                <ToggleGroupItem 
                    key={option} 
                    value={option} 
                    aria-label={`Select ${option}`}
                    className={cn(
                        "w-full justify-start data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:border-primary/80 border border-border text-sm px-4 py-2 h-auto font-mono transition-all duration-150",
                        "hover:bg-accent/50",
                        selectedValue === option ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                    )}
                >
                    {option}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    </div>
);


interface ScalePracticePanelProps {
    currentBPM: number;
    addLogEntry: ReturnType<typeof useScales>['addLogEntry'];
    updatePracticeStatus: ReturnType<typeof useScales>['updatePracticeStatus']; 
    updateScaleMasteryBPM: ReturnType<typeof useScales>['updateScaleMasteryBPM']; 
    scaleMasteryBPMMap: ReturnType<typeof useScales>['scaleMasteryBPMMap']; 
    allScales: ReturnType<typeof useScales>['allScales'];
    activeTab: 'scales' | 'dohnanyi' | 'hanon';
    suggestedScalePermutation: (NextFocus & { type: 'scale' }) | undefined;
}

const ScalePracticePanel: React.FC<ScalePracticePanelProps> = ({ 
  currentBPM, addLogEntry, updatePracticeStatus, updateScaleMasteryBPM, scaleMasteryBPMMap, allScales, 
  activeTab, suggestedScalePermutation
}) => {
  
  const { 
    setActivePermutationHighestBPM, 
    setActivePracticeItem, 
    setActiveLogSnapshotFunction,
    activePermutationHighestBPM: globalActivePermutationHighestBPM,
    activePracticeItem: globalActivePracticeItem,
    setCurrentBPM
  } = useGlobalBPM();
  
  const lastSnapshotTimestampRef = useRef<number>(0); 
  const lastSuccessfulCallKeyRef = useRef<string>(''); 
  
  const ALL_COMBINED_TYPES = [...SCALE_TYPES, ...ARPEGGIO_TYPES];
  const [selectedKey, setSelectedKey] = useState<Key>(KEYS[0]);
  const [selectedType, setSelectedType] = useState<string>(SCALE_TYPES[0]); 
  const [selectedArticulation, setSelectedArticulation] = useState<Articulation>(ARTICULATIONS[0]);
  const [selectedDirection, setSelectedDirection] = useState<DirectionType>(DIRECTION_TYPES[2]);
  const [selectedHandConfig, setSelectedHandConfig] = useState<HandConfiguration>(HAND_CONFIGURATIONS[0]);
  const [selectedRhythm, setSelectedRhythm] = useState<RhythmicPermutation>(RHYTHMIC_PERMUTATIONS[0]);
  const [selectedAccent, setSelectedAccent] = useState<AccentDistribution>(ACCENT_DISTRIBUTIONS[3]);
  const [selectedOctaves, setSelectedOctaves] = useState<OctaveConfiguration>(OCTAVE_CONFIGURATIONS[1]);

  // Effect to apply the suggested permutation when it changes and the tab is active
  useEffect(() => {
    if (activeTab === 'scales' && suggestedScalePermutation) {
        const parsed = parseScalePermutationId(suggestedScalePermutation.scalePermutationId);
        if (parsed) {
            const [key, typeId] = parsed.scaleId.split('-');
            const fullType = ALL_COMBINED_TYPES.find(t => t.replace(/\s/g, "") === typeId) || SCALE_TYPES[0];
            
            // Only update if the current selection is different from the suggestion
            if (
                selectedKey !== (key as Key) ||
                selectedType !== fullType ||
                selectedArticulation !== parsed.articulation ||
                selectedDirection !== parsed.direction ||
                selectedHandConfig !== parsed.handConfig ||
                selectedRhythm !== parsed.rhythm ||
                selectedAccent !== parsed.accent ||
                selectedOctaves !== parsed.octaves
            ) {
                setSelectedKey(key as Key);
                setSelectedType(fullType);
                setSelectedArticulation(parsed.articulation);
                setSelectedDirection(parsed.direction);
                setSelectedHandConfig(parsed.handConfig);
                setSelectedRhythm(parsed.rhythm);
                setSelectedAccent(parsed.accent);
                setSelectedOctaves(parsed.octaves);
                
                lastSuccessfulCallKeyRef.current = ''; // Reset last successful call key to allow new snapshot
            }
        }
    }
  }, [suggestedScalePermutation, activeTab, ALL_COMBINED_TYPES, selectedKey, selectedType, selectedArticulation, selectedDirection, selectedHandConfig, selectedRhythm, selectedAccent, selectedOctaves]);


  const selectedTempoLevel = useMemo(() => mapBPMToTempoLevel(currentBPM), [currentBPM]);

  const getScaleItemAndPermutationId = useCallback(() => {
    let scaleItem;
    const isChromatic = selectedType === "Chromatic";
    const selectedTypeId = selectedType.replace(/\s/g, "");

    if (isChromatic) {
        scaleItem = allScales.find(s => s.id === "C-Chromatic");
    } else {
        scaleItem = allScales.find(s => s.key === selectedKey && s.id === `${selectedKey}-${selectedTypeId}`);
    }

    if (!scaleItem) {
      return null;
    }

    const scalePermutationId = getScalePermutationId(
      scaleItem.id, 
      selectedArticulation, 
      selectedDirection, 
      selectedHandConfig, 
      selectedRhythm, 
      selectedAccent,
      selectedOctaves
    );
    
    return { scaleItem, scalePermutationId };
  }, [
    selectedKey,
    selectedType,
    allScales,
    selectedArticulation,
    selectedDirection,
    selectedHandConfig,
    selectedRhythm,
    selectedAccent,
    selectedOctaves
  ]);
  
  const result = useMemo(() => getScaleItemAndPermutationId(), [getScaleItemAndPermutationId]);
  const currentPermutationId = result?.scalePermutationId;
  
  const highestMasteredBPM = currentPermutationId ? scaleMasteryBPMMap[currentPermutationId] || 0 : 0;
  const nextBPMGoal = highestMasteredBPM > 0 ? highestMasteredBPM + 3 : 40;

  const handleSaveSnapshot = useCallback(() => {
    const now = Date.now();
    if (now - lastSnapshotTimestampRef.current < SNAPSHOT_DEBOUNCE_MS) {
      return;
    }
    
    if (!result) {
        showError("Please select a valid scale/arpeggio combination.");
        return;
    }
    const { scaleItem, scalePermutationId } = result;

    const currentCallKey = `${scalePermutationId}-${currentBPM}`;
    if (lastSuccessfulCallKeyRef.current === currentCallKey) {
        return;
    }

    lastSnapshotTimestampRef.current = now;
    lastSuccessfulCallKeyRef.current = currentCallKey;

    let message = `Snapshot logged at ${currentBPM} BPM.`;
    
    if (currentBPM > highestMasteredBPM) {
        updateScaleMasteryBPM(scalePermutationId, currentBPM);
        message = `Mastery updated! Highest BPM for this permutation is now ${currentBPM}. Next goal: ${currentBPM + 3} BPM.`;
    } else {
        message = `Snapshot logged at ${currentBPM} BPM. Highest mastered BPM remains ${highestMasteredBPM}.`;
    }

    addLogEntry({
      durationMinutes: 0, 
      itemsPracticed: [{
        type: 'scale',
        scaleId: scaleItem.id,
        articulation: selectedArticulation,
        direction: selectedDirection,
        handConfig: selectedHandConfig,
        rhythm: selectedRhythm,
        accent: selectedAccent,
        octaves: selectedOctaves,
        practicedBPM: currentBPM,
        scalePermutationId: scalePermutationId,
      }],
      notes: `Snapshot: ${scaleItem.key} ${scaleItem.type} (${selectedArticulation}, ${selectedDirection}, ${selectedHandConfig}, ${selectedRhythm}, ${selectedAccent}, ${selectedOctaves}). Logged BPM: ${currentBPM}`,
    });

    showSuccess(message);
  }, [currentBPM, result, highestMasteredBPM, updateScaleMasteryBPM, addLogEntry, selectedKey, selectedType, selectedArticulation, selectedDirection, selectedHandConfig, selectedRhythm, selectedAccent, selectedOctaves]);

  useEffect(() => {
    if (globalActivePermutationHighestBPM !== highestMasteredBPM) {
        setActivePermutationHighestBPM(highestMasteredBPM);
    }
    
    const newActivePracticeItem: ActivePracticeItem = result ? {
        type: 'scale',
        key: result.scaleItem.key,
        scaleType: result.scaleItem.type,
        articulation: selectedArticulation,
        octaves: selectedOctaves,
        highestBPM: highestMasteredBPM,
        nextGoalBPM: nextBPMGoal,
    } : null;

    if (!shallowEqual(globalActivePracticeItem, newActivePracticeItem)) {
        setActivePracticeItem(newActivePracticeItem);
    }
  }, [
    highestMasteredBPM, 
    globalActivePermutationHighestBPM,
    setActivePermutationHighestBPM, 
    setActivePracticeItem, 
    result, 
    selectedArticulation, 
    selectedOctaves, 
    nextBPMGoal,
    globalActivePracticeItem
  ]);

  useEffect(() => {
    setActiveLogSnapshotFunction(() => handleSaveSnapshot);
    
    return () => {
        setActiveLogSnapshotFunction(null);
    };
  }, [setActiveLogSnapshotFunction, handleSaveSnapshot]);

  const isChromatic = selectedType === "Chromatic";
  const availableKeys = isChromatic ? ["C"] : KEYS;


  return (
    <CardContent className="p-0 space-y-6">
        {/* Primary Selections: Key, Type, Articulation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Key Selection */}
            <div className="space-y-3 border p-4 rounded-lg border-primary/30 bg-secondary/50 md:col-span-1">
              <Label className="text-lg font-semibold text-primary block mb-2 font-mono">KEY</Label>
              <ToggleGroup 
                type="single" 
                value={selectedKey} 
                onValueChange={(value) => {
                    if (value) setSelectedKey(value as Key);
                }}
                className="flex flex-wrap justify-center gap-2 w-full"
                disabled={isChromatic}
              >
                {availableKeys.map(key => (
                  <ToggleGroupItem 
                    key={key} 
                    value={key} 
                    aria-label={`Select key ${key}`}
                    className={cn(
                      "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:border-primary/80 border border-border text-sm px-3 py-3 h-10 w-10 rounded-full font-mono flex items-center justify-center",
                      isChromatic && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {key.replace(/\/.*/, '')}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {isChromatic && <p className="text-xs text-yellow-400 mt-2 text-center">Chromatic scale is key-independent (C selected).</p>}
            </div>

            {/* Scale/Arpeggio Type Selection */}
            <div className="space-y-3 border p-4 rounded-lg border-primary/30 bg-secondary/50 md:col-span-1">
              <Label className="text-lg font-semibold text-primary block mb-2 font-mono">TYPE</Label>
              <div className="space-y-4">
                {/* Scales Section */}
                <div>
                  <p className="text-sm font-semibold text-foreground/80 mb-2 font-mono">Scales</p>
                  <ToggleGroup 
                    type="single" 
                    value={selectedType} 
                    onValueChange={(value) => {
                      console.log("[ScalePracticePanel] ToggleGroup onValueChange:", value); // Added log
                      if (value) {
                        setSelectedType(value);
                        if (value === "Chromatic") {
                            setSelectedKey("C");
                        }
                      }
                    }}
                    className="flex flex-wrap justify-center gap-2 w-full"
                  >
                    {SCALE_TYPES.map(type => (
                      <ToggleGroupItem 
                        key={type} 
                        value={type} 
                        aria-label={`Select type ${type}`}
                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:border-primary/80 border border-border text-xs px-2 py-1 h-auto font-mono flex-1 min-w-[80px]"
                      >
                        {type.replace(' Minor', ' Min').replace(' Major', ' Maj')}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                {/* Arpeggios Section */}
                <div>
                  <p className="text-sm font-semibold text-foreground/80 mb-2 font-mono">Arpeggios</p>
                  <ToggleGroup 
                    type="single" 
                    value={selectedType} 
                    onValueChange={(value) => {
                      console.log("[ScalePracticePanel] ToggleGroup onValueChange (Arpeggios):", value); // Added log
                      if (value) setSelectedType(value);
                    }}
                    className="flex flex-wrap justify-center gap-2 w-full"
                  >
                    {ARPEGGIO_TYPES.map(type => (
                      <ToggleGroupItem 
                        key={type} 
                        value={type} 
                        aria-label={`Select type ${type}`}
                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:border-primary/80 border border-border text-xs px-2 py-1 h-auto font-mono flex-1 min-w-[80px]"
                      >
                        {type.replace(' Arpeggio', '')}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </div>
            </div>
            
            {/* Articulation Selection */}
            <div className="space-y-3 border p-4 rounded-lg border-primary/30 bg-secondary/50 md:col-span-1">
              <Label className="text-lg font-semibold text-primary block mb-2 font-mono">ARTICULATION</Label>
              <ToggleGroup 
                type="single" 
                value={selectedArticulation} 
                onValueChange={(value) => value && setSelectedArticulation(value as Articulation)}
                className="flex flex-wrap justify-center gap-2 w-full"
              >
                {ARTICULATIONS.map(articulation => (
                  <ToggleGroupItem 
                    key={articulation} 
                    value={articulation} 
                    aria-label={`Select articulation ${articulation}`}
                    className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:border-primary/80 border border-border text-xs px-2 py-1 h-auto font-mono flex-1 min-w-[80px]"
                  >
                    {articulation.split(' ')[0]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
        </div>
        
        {/* Extra Special Edition Permutations */}
        <div className="pt-8 space-y-6">
            <div className="flex items-center">
                <div className="flex-grow border-t border-dashed border-primary/50"></div>
                <span className="flex-shrink mx-4 text-xl font-mono font-bold text-primary">
                    SCALE PERMUTATIONS
                </span>
                <div className="flex-grow border-t border-dashed border-primary/50"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PermutationSection
                    title="1. OCTAVE RANGE"
                    description="Increase range to test consistency and endurance."
                    options={OCTAVE_CONFIGURATIONS}
                    selectedValue={selectedOctaves}
                    onValueChange={(value) => setSelectedOctaves(value)}
                />
                <PermutationSection
                    title="2. DIRECTION & STARTING POINT"
                    description="Removes 'muscle-memory autopilot' and tests mental mapping."
                    options={DIRECTION_TYPES}
                    selectedValue={selectedDirection}
                    onValueChange={(value) => setSelectedDirection(value)}
                />
                <PermutationSection
                    title="3. HAND CONFIGURATION"
                    description="Professional expectation: tests coordination and integration."
                    options={HAND_CONFIGURATIONS}
                    selectedValue={selectedHandConfig}
                    onValueChange={(value) => setSelectedHandConfig(value)}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PermutationSection
                    title="4. RHYTHMIC PERMUTATIONS"
                    description="High value, low time: reveals weak fingers and hidden tension."
                    options={RHYTHMIC_PERMUTATIONS}
                    selectedValue={selectedRhythm}
                    onValueChange={(value) => setSelectedRhythm(value)}
                />
                <PermutationSection
                    title="5. ACCENT & WEIGHT DISTRIBUTION"
                    description="Quietly professional: ensures neutral evenness and control."
                    options={ACCENT_DISTRIBUTIONS}
                    selectedValue={selectedAccent}
                    onValueChange={(value) => setSelectedAccent(value)}
                />
            </div>
        </div>
    </CardContent>
  );
};

export default ScalePracticePanel;