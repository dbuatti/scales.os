import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, Music, Gauge, Repeat, Hand, Target, Zap, Palette, LayoutGrid } from 'lucide-react';
import { 
  KEYS, SCALE_TYPES, ARPEGGIO_TYPES, ARTICULATIONS, 
  Key, Articulation, TempoLevel,
  DirectionType, HandConfiguration, RhythmicPermutation, AccentDistribution, OctaveConfiguration,
  DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS, OCTAVE_CONFIGURATIONS,
  getScalePermutationId, parseScalePermutationId, cleanString
} from '@/lib/scales';
import { useScales, NextFocus } from '@/context/ScalesContext';
import { showSuccess, showError } from '@/utils/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn, shallowEqual } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useGlobalBPM, SNAPSHOT_DEBOUNCE_MS, ActivePracticeItem } from '@/context/GlobalBPMContext';
import PracticePresets from './PracticePresets';

interface PermutationSectionProps<T extends string> {
    title: string;
    description: string;
    options: readonly T[];
    selectedValue: T;
    onValueChange: (value: T) => void;
    icon: React.ReactNode;
}

const PermutationSection = <T extends string>({ title, description, options, selectedValue, onValueChange, icon }: PermutationSectionProps<T>) => (
    <div className="space-y-4 p-5 rounded-xl border bg-card/50 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {icon}
            </div>
            <div className="space-y-0.5">
                <Label className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</Label>
                <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>
            </div>
        </div>
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
                    className="h-9 px-4 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground focus-scale"
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

  const handleApplyPreset = (config: any) => {
    setSelectedArticulation(config.articulation);
    setSelectedDirection(config.direction);
    setSelectedHandConfig(config.handConfig);
    setSelectedRhythm(config.rhythm);
    setSelectedAccent(config.accent);
    setSelectedOctaves(config.octaves);
    setIsPermutationManuallyAdjusted(true);
    showSuccess("Preset applied!");
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
    <CardContent className="p-0 space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/60">
              <LayoutGrid className="w-3 h-3" />
              Quick Presets
            </div>
            <p className="text-[10px] text-muted-foreground">Instantly apply common practice configurations.</p>
          </div>
          <PracticePresets onSelect={handleApplyPreset} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
                <div className="space-y-4 p-5 rounded-xl border bg-card/50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Music className="w-5 h-5" />
                        </div>
                        <Label className="text-sm font-bold uppercase tracking-wider text-foreground">Key Selection</Label>
                    </div>
                    <ToggleGroup 
                        type="single" 
                        value={selectedKey} 
                        onValueChange={(v) => v && setKeyAndAdjust(v as Key)}
                        className="flex flex-wrap gap-2"
                        disabled={isChromatic}
                    >
                        {availableKeys.map(key => (
                            <ToggleGroupItem key={key} value={key} className="w-12 h-12 p-0 text-xs font-bold focus-scale">
                                {key.split('/')[0]}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>

                <div className="space-y-4 p-5 rounded-xl border bg-card/50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Zap className="w-5 h-5" />
                        </div>
                        <Label className="text-sm font-bold uppercase tracking-wider text-foreground">Type Selection</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b pb-1">Scales</p>
                            <ToggleGroup type="single" value={selectedType} onValueChange={(v) => v && setTypeAndAdjust(v)} className="flex flex-col items-stretch gap-2">
                                {SCALE_TYPES.map(t => <ToggleGroupItem key={t} value={t} className="justify-start h-10 px-4 text-xs font-medium focus-scale">{t}</ToggleGroupItem>)}
                            </ToggleGroup>
                        </div>
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b pb-1">Arpeggios</p>
                            <ToggleGroup type="single" value={selectedType} onValueChange={(v) => v && setTypeAndAdjust(v)} className="flex flex-col items-stretch gap-2">
                                {ARPEGGIO_TYPES.map(t => <ToggleGroupItem key={t} value={t} className="justify-start h-10 px-4 text-xs font-medium focus-scale">{t.replace(' Arpeggio', '')}</ToggleGroupItem>)}
                            </ToggleGroup>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <PermutationSection 
                    title="Articulation" 
                    description="Focus on touch and sound quality."
                    options={ARTICULATIONS} 
                    selectedValue={selectedArticulation} 
                    onValueChange={setArticulationAndAdjust}
                    icon={<Palette className="w-5 h-5" />}
                />
                <PermutationSection 
                    title="Octaves" 
                    description="Test consistency and endurance."
                    options={OCTAVE_CONFIGURATIONS} 
                    selectedValue={selectedOctaves} 
                    onValueChange={setOctavesAndAdjust}
                    icon={<Music className="w-5 h-5" />}
                />
            </div>
        </div>

        <div className="pt-10 border-t space-y-10">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight">Advanced Permutations</h3>
                    <p className="text-sm text-muted-foreground">Break muscle memory and build true mastery.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleResetToStandard} className="text-xs font-bold focus-scale">
                    <RotateCcw className="w-3 h-3 mr-2" />
                    Reset to Standard
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <PermutationSection 
                    title="Direction" 
                    description="Removes muscle-memory autopilot."
                    options={DIRECTION_TYPES} 
                    selectedValue={selectedDirection} 
                    onValueChange={setDirectionAndAdjust}
                    icon={<Repeat className="w-5 h-5" />}
                />
                <PermutationSection 
                    title="Hands" 
                    description="Tests coordination and LH/RH independence."
                    options={HAND_CONFIGURATIONS} 
                    selectedValue={selectedHandConfig} 
                    onValueChange={setHandConfigAndAdjust}
                    icon={<Hand className="w-5 h-5" />}
                />
                <PermutationSection 
                    title="Rhythm" 
                    description="Reveals weak fingers and hidden tension."
                    options={RHYTHMIC_PERMUTATIONS} 
                    selectedValue={selectedRhythm} 
                    onValueChange={setRhythmAndAdjust}
                    icon={<Gauge className="w-5 h-5" />}
                />
                <PermutationSection 
                    title="Accent" 
                    description="Ensures neutral evenness and control."
                    options={ACCENT_DISTRIBUTIONS} 
                    selectedValue={selectedAccent} 
                    onValueChange={setAccentAndAdjust}
                    icon={<Target className="w-5 h-5" />}
                />
            </div>
        </div>
    </CardContent>
  );
};

export default ScalePracticePanel;