import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { 
  KEYS, SCALE_TYPES, ARPEGGIO_TYPES, ARTICULATIONS, 
  Key, Articulation, TempoLevel,
  DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS, OCTAVE_CONFIGURATIONS,
  DirectionType, HandConfiguration, RhythmicPermutation, AccentDistribution, OctaveConfiguration, TEMPO_LEVELS,
  getScalePermutationId, parseScalePermutationId, cleanString
} from '@/lib/scales';
import { useScales, NextFocus } from '@/context/ScalesContext';
import { showSuccess, showError } from '@/utils/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn, shallowEqual } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useGlobalBPM, SNAPSHOT_DEBOUNCE_MS, ActivePracticeItem } from '@/context/GlobalBPMContext';

const mapBPMToTempoLevel = (bpm: number): TempoLevel => {
  if (bpm < 80) return TEMPO_LEVELS[0];
  if (bpm <= 100) return TEMPO_LEVELS[1];
  if (bpm <= 120) return TEMPO_LEVELS[2];
  return TEMPO_LEVELS[3];
};

interface PermutationSectionProps<T extends string> {
    title: string;
    description: string;
    options: readonly T[];
    selectedValue: T;
    onValueChange: (value: T) => void;
}

const PermutationSection = <T extends string>({ title, description, options, selectedValue, onValueChange }: PermutationSectionProps<T>) => (
    <div className="space-y-3">
        <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</Label>
        <ToggleGroup 
            type="single" 
            value={selectedValue} 
            onValueChange={(value) => value && onValueChange(value as T)}
            className="flex flex-wrap gap-2"
        >
            {options.map(option => (
                <ToggleGroupItem 
                    key={option} 
                    value={option} 
                    className="h-8 px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
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
    setCurrentBPM,
    isPermutationManuallyAdjusted,
    setIsPermutationManuallyAdjusted
  } = useGlobalBPM();
  
  const lastSnapshotTimestampRef = useRef<number>(0); 
  const lastSuccessfulCallKeyRef = useRef<string>(''); 
  
  const ALL_COMBINED_TYPES = useMemo(() => [...SCALE_TYPES, ...ARPEGGIO_TYPES], []);
  
  const [selectedKey, setSelectedKey] = useState<Key>(KEYS[0]);
  const [selectedType, setSelectedType] = useState<string>(SCALE_TYPES[0]); 
  const [selectedArticulation, setSelectedArticulation] = useState<Articulation>(ARTICULATIONS[0]);
  const [selectedDirection, setSelectedDirection] = useState<DirectionType>(DIRECTION_TYPES[2]);
  const [selectedHandConfig, setSelectedHandConfig] = useState<HandConfiguration>(HAND_CONFIGURATIONS[0]);
  const [selectedRhythm, setSelectedRhythm] = useState<RhythmicPermutation>(RHYTHMIC_PERMUTATIONS[0]);
  const [selectedAccent, setSelectedAccent] = useState<AccentDistribution>(ACCENT_DISTRIBUTIONS[3]);
  const [selectedOctaves, setSelectedOctaves] = useState<OctaveConfiguration>(OCTAVE_CONFIGURATIONS[1]);

  const handleResetToStandard = () => {
    setSelectedArticulation(ARTICULATIONS[0]);
    setSelectedDirection(DIRECTION_TYPES[2]);
    setSelectedHandConfig(HAND_CONFIGURATIONS[0]);
    setSelectedRhythm(RHYTHMIC_PERMUTATIONS[0]);
    setSelectedAccent(ACCENT_DISTRIBUTIONS[3]);
    setSelectedOctaves(OCTAVE_CONFIGURATIONS[1]);
    setIsPermutationManuallyAdjusted(false);
    showSuccess("Reset to standard permutations.");
  };

  useEffect(() => {
    if (activeTab === 'scales' && suggestedScalePermutation && !isPermutationManuallyAdjusted) {
        const parsed = parseScalePermutationId(suggestedScalePermutation.scalePermutationId);
        if (parsed) {
            const [key, typeId] = parsed.scaleId.split('-');
            const fullType = ALL_COMBINED_TYPES.find(t => t.replace(/\s/g, "") === typeId) || SCALE_TYPES[0];
            
            let newHandConfig: HandConfiguration = parsed.handConfig === 'Hands separately' 
                ? HAND_CONFIGURATIONS[0] 
                : parsed.handConfig as HandConfiguration;

            if (
                selectedKey !== (key as Key) ||
                selectedType !== fullType ||
                selectedArticulation !== parsed.articulation ||
                selectedDirection !== parsed.direction ||
                selectedHandConfig !== newHandConfig ||
                selectedRhythm !== parsed.rhythm ||
                selectedAccent !== parsed.accent ||
                selectedOctaves !== parsed.octaves
            ) {
                setSelectedKey(key as Key);
                setSelectedType(fullType);
                setSelectedArticulation(parsed.articulation);
                setSelectedDirection(parsed.direction);
                setSelectedHandConfig(newHandConfig);
                setSelectedRhythm(parsed.rhythm);
                setSelectedAccent(parsed.accent);
                setSelectedOctaves(parsed.octaves);
                lastSuccessfulCallKeyRef.current = '';
            }
        }
    }
  }, [
    suggestedScalePermutation, activeTab, isPermutationManuallyAdjusted, ALL_COMBINED_TYPES,
    selectedKey, selectedType, selectedArticulation, selectedDirection, selectedHandConfig, 
    selectedRhythm, selectedAccent, selectedOctaves
  ]);

  const getScaleItemAndPermutationId = useCallback(() => {
    let scaleItem;
    const isChromatic = selectedType === "Chromatic";
    const selectedTypeId = selectedType.replace(/\s/g, "");

    if (isChromatic) {
        scaleItem = allScales.find(s => s.id === "C-Chromatic");
    } else {
        scaleItem = allScales.find(s => s.key === selectedKey && s.id === `${selectedKey}-${selectedTypeId}`);
    }

    if (!scaleItem) return null;

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
  }, [selectedKey, selectedType, allScales, selectedArticulation, selectedDirection, selectedHandConfig, selectedRhythm, selectedAccent, selectedOctaves]);
  
  const result = useMemo(() => getScaleItemAndPermutationId(), [getScaleItemAndPermutationId]);
  
  const getHighestBPMForCurrentPermutation = useCallback((): number => {
    if (!result) return 0;
    const { scaleItem, scalePermutationId } = result;
    let highestBPM = scaleMasteryBPMMap[scalePermutationId] || 0;

    if (selectedHandConfig === "Left hand only" || selectedHandConfig === "Right hand only") {
      const legacyHandConfig = "Hands separately";
      const legacyId = `${scaleItem.id}-${cleanString(selectedArticulation)}-${cleanString(selectedDirection)}-${cleanString(legacyHandConfig)}-${cleanString(selectedRhythm)}-${cleanString(selectedAccent)}-${cleanString(selectedOctaves)}`;
      const legacyBPM = scaleMasteryBPMMap[legacyId] || 0;
      highestBPM = Math.max(highestBPM, legacyBPM);
    }
    return highestBPM;
  }, [result, scaleMasteryBPMMap, selectedArticulation, selectedDirection, selectedHandConfig, selectedRhythm, selectedAccent, selectedOctaves]);

  const highestMasteredBPM = getHighestBPMForCurrentPermutation();
  const nextBPMGoal = highestMasteredBPM > 0 ? highestMasteredBPM + 3 : 40;

  const handleSaveSnapshot = useCallback(() => {
    const now = Date.now();
    if (now - lastSnapshotTimestampRef.current < SNAPSHOT_DEBOUNCE_MS) return;
    if (!result) {
        showError("Please select a valid scale/arpeggio combination.");
        return;
    }
    const { scaleItem, scalePermutationId } = result;
    const currentCallKey = `${scalePermutationId}-${currentBPM}`;
    if (lastSuccessfulCallKeyRef.current === currentCallKey) return;

    lastSnapshotTimestampRef.current = now;
    lastSuccessfulCallKeyRef.current = currentCallKey;

    if (currentBPM > highestMasteredBPM) {
        updateScaleMasteryBPM(scalePermutationId, currentBPM);
        showSuccess(`Mastery updated to ${currentBPM} BPM!`);
    } else {
        showSuccess(`Snapshot logged at ${currentBPM} BPM.`);
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
      notes: `Snapshot: ${scaleItem.key} ${scaleItem.type} at ${currentBPM} BPM`,
    });
  }, [currentBPM, result, highestMasteredBPM, updateScaleMasteryBPM, addLogEntry, selectedArticulation, selectedDirection, selectedHandConfig, selectedRhythm, selectedAccent, selectedOctaves]);

  useEffect(() => {
    const currentHighestBPMForActivePermutation = getHighestBPMForCurrentPermutation();
    if (globalActivePermutationHighestBPM !== currentHighestBPMForActivePermutation) {
        setActivePermutationHighestBPM(currentHighestBPMForActivePermutation);
    }
    
    const newActivePracticeItem: ActivePracticeItem = result ? {
        type: 'scale',
        key: result.scaleItem.key,
        scaleType: result.scaleItem.type,
        articulation: selectedArticulation,
        octaves: selectedOctaves,
        handConfig: selectedHandConfig,
        highestBPM: currentHighestBPMForActivePermutation,
        nextGoalBPM: nextBPMGoal,
    } : null;

    if (!shallowEqual(globalActivePracticeItem, newActivePracticeItem)) {
        setActivePracticeItem(newActivePracticeItem);
    }
  }, [highestMasteredBPM, globalActivePermutationHighestBPM, setActivePermutationHighestBPM, setActivePracticeItem, result, selectedArticulation, selectedOctaves, selectedHandConfig, nextBPMGoal, globalActivePracticeItem, getHighestBPMForCurrentPermutation]);

  useEffect(() => {
    setActiveLogSnapshotFunction(() => handleSaveSnapshot);
    return () => setActiveLogSnapshotFunction(null);
  }, [setActiveLogSnapshotFunction, handleSaveSnapshot]);

  const isChromatic = selectedType === "Chromatic";
  const availableKeys = isChromatic ? ["C"] : KEYS;

  const setKeyAndAdjust = (key: Key) => { setSelectedKey(key); setIsPermutationManuallyAdjusted(true); };
  const setTypeAndAdjust = (type: string) => { setSelectedType(type); if (type === "Chromatic") setSelectedKey("C"); setIsPermutationManuallyAdjusted(true); };
  const setArticulationAndAdjust = (articulation: Articulation) => { setSelectedArticulation(articulation); setIsPermutationManuallyAdjusted(true); };
  const setDirectionAndAdjust = (direction: DirectionType) => { setSelectedDirection(direction); setIsPermutationManuallyAdjusted(true); };
  const setHandConfigAndAdjust = (handConfig: HandConfiguration) => { setSelectedHandConfig(handConfig); setIsPermutationManuallyAdjusted(true); };
  const setRhythmAndAdjust = (rhythm: RhythmicPermutation) => { setSelectedRhythm(rhythm); setIsPermutationManuallyAdjusted(true); };
  const setAccentAndAdjust = (accent: AccentDistribution) => { setSelectedAccent(accent); setIsPermutationManuallyAdjusted(true); };
  const setOctavesAndAdjust = (octaves: OctaveConfiguration) => { setSelectedOctaves(octaves); setIsPermutationManuallyAdjusted(true); };

  return (
    <CardContent className="p-0 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="space-y-3">
                    <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Key</Label>
                    <ToggleGroup 
                        type="single" 
                        value={selectedKey} 
                        onValueChange={(v) => v && setKeyAndAdjust(v as Key)}
                        className="flex flex-wrap gap-1"
                        disabled={isChromatic}
                    >
                        {availableKeys.map(key => (
                            <ToggleGroupItem key={key} value={key} className="w-10 h-10 p-0 text-xs">
                                {key.split('/')[0]}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>

                <div className="space-y-3">
                    <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Type</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <ToggleGroup type="single" value={selectedType} onValueChange={(v) => v && setTypeAndAdjust(v)} className="flex flex-col items-stretch gap-1">
                            {SCALE_TYPES.map(t => <ToggleGroupItem key={t} value={t} className="justify-start h-8 px-3 text-xs">{t}</ToggleGroupItem>)}
                        </ToggleGroup>
                        <ToggleGroup type="single" value={selectedType} onValueChange={(v) => v && setTypeAndAdjust(v)} className="flex flex-col items-stretch gap-1">
                            {ARPEGGIO_TYPES.map(t => <ToggleGroupItem key={t} value={t} className="justify-start h-8 px-3 text-xs">{t.replace(' Arpeggio', '')}</ToggleGroupItem>)}
                        </ToggleGroup>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <PermutationSection title="Articulation" options={ARTICULATIONS} selectedValue={selectedArticulation} onValueChange={setArticulationAndAdjust} />
                <PermutationSection title="Octaves" options={OCTAVE_CONFIGURATIONS} selectedValue={selectedOctaves} onValueChange={setOctavesAndAdjust} />
            </div>
        </div>

        <div className="pt-8 border-t space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Advanced Permutations</h3>
                <Button variant="ghost" size="sm" onClick={handleResetToStandard} className="text-xs text-muted-foreground">
                    <RotateCcw className="w-3 h-3 mr-2" />
                    Reset to Standard
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <PermutationSection title="Direction" options={DIRECTION_TYPES} selectedValue={selectedDirection} onValueChange={setDirectionAndAdjust} />
                <PermutationSection title="Hands" options={HAND_CONFIGURATIONS} selectedValue={selectedHandConfig} onValueChange={setHandConfigAndAdjust} />
                <PermutationSection title="Rhythm" options={RHYTHMIC_PERMUTATIONS} selectedValue={selectedRhythm} onValueChange={setRhythmAndAdjust} />
                <PermutationSection title="Accent" options={ACCENT_DISTRIBUTIONS} selectedValue={selectedAccent} onValueChange={setAccentAndAdjust} />
            </div>
        </div>
    </CardContent>
  );
};

export default ScalePracticePanel;