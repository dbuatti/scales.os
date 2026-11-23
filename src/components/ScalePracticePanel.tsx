import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, Music, Gauge, Repeat, Hand, Target, Zap, Palette, Shuffle, ChevronDown } from 'lucide-react';
import { 
  KEYS, SCALE_TYPES, ARPEGGIO_TYPES, ARTICULATIONS, 
  Key, Articulation, 
  DirectionType, HandConfiguration, RhythmicPermutation, AccentDistribution, OctaveConfiguration,
  DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS, OCTAVE_CONFIGURATIONS,
  getScalePermutationId, parseScalePermutationId, cleanString
} from '@/lib/scales';
import { useScales, NextFocus } from '@/context/ScalesContext';
import { showSuccess, showError } from '@/utils/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn, shallowEqual, getHandColorClasses } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useGlobalBPM, SNAPSHOT_DEBOUNCE_MS, ActivePracticeItem } from '@/context/GlobalBPMContext';
import { nextGoalBPM } from '@/lib/tempo';

interface PermutationSectionProps<T extends string> {
    title: string;
    description: string;
    options: readonly T[];
    selectedValue: T;
    onValueChange: (value: T) => void;
    icon: React.ReactNode;
    getItemClasses?: (option: T) => string;
}

const PermutationSection = <T extends string>({ title, description, options, selectedValue, onValueChange, icon, getItemClasses }: PermutationSectionProps<T>) => (
    <div className="flex flex-col gap-4 py-2 transition-all duration-200">
        <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {icon}
            </div>
            <div className="flex flex-col gap-0.5">
                <Label className="text-sm font-bold tracking-tight text-foreground">{title}</Label>
                <p className="text-xs leading-snug text-muted-foreground">{description}</p>
            </div>
        </div>
        <ToggleGroup 
            type="single" 
            value={selectedValue} 
            onValueChange={(value) => value && onValueChange(value as T)}
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
            {options.map(option => (
                <ToggleGroupItem 
                    key={option}
                    value={option} 
                    className={cn(
                        "h-10 w-full justify-center rounded-lg border border-transparent bg-muted/40 px-3 text-center text-xs font-bold text-foreground/80 transition-all hover:bg-muted hover:text-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm data-[state=on]:shadow-primary/25 focus-scale",
                        getItemClasses?.(option)
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
    updateScaleMasteryBPM: ReturnType<typeof useScales>['updateScaleMasteryBPM']; 
    scaleMasteryBPMMap: ReturnType<typeof useScales>['scaleMasteryBPMMap']; 
    allScales: ReturnType<typeof useScales>['allScales'];
    activeTab: 'scales' | 'dohnanyi' | 'hanon' | 'repertoire';
    family: 'scale' | 'arpeggio';
    suggestedScalePermutation: (NextFocus & { type: 'scale' | 'arpeggio' }) | undefined;
    quickPick?: { kind: 'scale' | 'arpeggio'; nonce: number } | null;
    /** Elapsed session seconds, lifted to the page so the timer can live in the tools rail. */
    sessionSeconds: number;
}

const ScalePracticePanel: React.FC<ScalePracticePanelProps> = ({ 
  currentBPM, addLogEntry, updateScaleMasteryBPM, scaleMasteryBPMMap, allScales, 
  activeTab, family, suggestedScalePermutation, quickPick, sessionSeconds
}) => {
  
  const { 
    setActivePermutationHighestBPM, 
    setActivePracticeItem, 
    setActiveLogSnapshotFunction,
    activePermutationHighestBPM: globalActivePermutationHighestBPM,
    activePracticeItem: globalActivePracticeItem,
    isPermutationManuallyAdjusted,
    setIsPermutationManuallyAdjusted,
    autoNudgeBPMOnSnapshot
  } = useGlobalBPM();
  
  const lastSnapshotAtRef = useRef<number>(0);
  
  const ALL_COMBINED_TYPES = useMemo(() => [...SCALE_TYPES, ...ARPEGGIO_TYPES], []);
  
  const [selectedKey, setSelectedKey] = useState<Key>(KEYS[0]);
  const [selectedType, setSelectedType] = useState<string>(SCALE_TYPES[0]); 
  const [selectedArticulation, setSelectedArticulation] = useState<Articulation>(ARTICULATIONS[0]);
  const [selectedDirection, setSelectedDirection] = useState<DirectionType>(DIRECTION_TYPES[2]);
  const [selectedHandConfig, setSelectedHandConfig] = useState<HandConfiguration>(HAND_CONFIGURATIONS[0]);
  const [selectedRhythm, setSelectedRhythm] = useState<RhythmicPermutation>(RHYTHMIC_PERMUTATIONS[0]);
  const [selectedAccent, setSelectedAccent] = useState<AccentDistribution>(ACCENT_DISTRIBUTIONS[3]);
  const [selectedOctaves, setSelectedOctaves] = useState<OctaveConfiguration>(OCTAVE_CONFIGURATIONS[1]);
  const [advancedOpen, setAdvancedOpen] = useState(false);

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

  const handleRandomize = () => {
    const randomKey = KEYS[Math.floor(Math.random() * KEYS.length)];
    const randomType = ALL_COMBINED_TYPES[Math.floor(Math.random() * ALL_COMBINED_TYPES.length)];
    const randomArticulation = ARTICULATIONS[Math.floor(Math.random() * ARTICULATIONS.length)];
    const randomDirection = DIRECTION_TYPES[Math.floor(Math.random() * DIRECTION_TYPES.length)];
    const randomHand = HAND_CONFIGURATIONS[Math.floor(Math.random() * HAND_CONFIGURATIONS.length)];
    const randomRhythm = RHYTHMIC_PERMUTATIONS[Math.floor(Math.random() * RHYTHMIC_PERMUTATIONS.length)];
    const randomAccent = ACCENT_DISTRIBUTIONS[Math.floor(Math.random() * ACCENT_DISTRIBUTIONS.length)];
    const randomOctave = OCTAVE_CONFIGURATIONS[Math.floor(Math.random() * OCTAVE_CONFIGURATIONS.length)];

    setSelectedKey(randomKey);
    setSelectedType(randomType);
    setSelectedArticulation(randomArticulation);
    setSelectedDirection(randomDirection);
    setSelectedHandConfig(randomHand);
    setSelectedRhythm(randomRhythm);
    setSelectedAccent(randomAccent);
    setSelectedOctaves(randomOctave);
    setIsPermutationManuallyAdjusted(true);
    showSuccess(`Randomized: ${randomKey} ${randomType}!`);
  };

  useEffect(() => {
    if (activeTab !== 'scales' || !quickPick) return;
    const options = quickPick.kind === 'arpeggio' ? ARPEGGIO_TYPES : SCALE_TYPES;
    if (selectedType !== options[0]) {
      setSelectedType(options[0]);
    }
    setIsPermutationManuallyAdjusted(true);
  }, [quickPick, activeTab, selectedType, setIsPermutationManuallyAdjusted]);

  useEffect(() => {
    if (activeTab === 'scales' && suggestedScalePermutation && !isPermutationManuallyAdjusted) {
        const parsed = parseScalePermutationId(suggestedScalePermutation.scalePermutationId);
        if (parsed) {
            const [key, typeId] = parsed.scaleId.split('-');
            const fullType = ALL_COMBINED_TYPES.find(t => t.replace(/\s/g, "") === typeId) || SCALE_TYPES[0];
            
            const newHandConfig: HandConfiguration = parsed.handConfig === 'Hands separately' 
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
  const nextBPMGoal = nextGoalBPM(highestMasteredBPM);

  const shortHandLabel = selectedHandConfig
    .replace('Hands together', 'Together')
    .replace(' hand only', '')
    .replace('Hands in contrary motion', 'Contrary')
    .replace('Hands in similar motion, staggered entry', 'Staggered');

  const activeAdvancedSettings = [
    {
      active: selectedDirection !== DIRECTION_TYPES[2],
      label: selectedDirection.replace(' (standard)', ''),
    },
    { active: selectedHandConfig !== HAND_CONFIGURATIONS[0], label: shortHandLabel },
    { active: selectedRhythm !== RHYTHMIC_PERMUTATIONS[0], label: selectedRhythm },
    {
      active: selectedAccent !== ACCENT_DISTRIBUTIONS[3],
      label: selectedAccent.replace(' (neutral evenness)', ''),
    },
  ];
  const modifiedAdvancedCount = activeAdvancedSettings.filter((setting) => setting.active).length;
  const advancedSummary = modifiedAdvancedCount
    ? activeAdvancedSettings.filter((setting) => setting.active).map((setting) => setting.label).join(' · ')
    : 'Standard direction, hands, rhythm and accent';

  const handleSaveSnapshot = useCallback(() => {
    if (!result) {
        showError("Please select a valid scale/arpeggio combination.");
        return;
    }
    const { scaleItem, scalePermutationId } = result;
    const now = Date.now();

    // Guard accidental double-taps (the BPM auto-nudges right after a save),
    // but always tell the user instead of silently dropping the tap.
    if (now - lastSnapshotAtRef.current < SNAPSHOT_DEBOUNCE_MS) {
        showSuccess("Snapshot already saved just now.");
        return;
    }
    lastSnapshotAtRef.current = now;

    const goalBpm = nextBPMGoal;
    const reachedGoal = currentBPM >= goalBpm;

    if (currentBPM > highestMasteredBPM) {
        updateScaleMasteryBPM(scalePermutationId, currentBPM);
        if (reachedGoal) {
            showSuccess(`Goal reached! ${scaleItem.key} ${scaleItem.type} mastered at ${currentBPM} BPM.`);
        } else {
            showSuccess(`Mastery updated to ${currentBPM} BPM! ${goalBpm - currentBPM} BPM to goal.`);
        }
    } else {
        if (reachedGoal) {
            showSuccess(`Snapshot logged at ${currentBPM} BPM. Goal reached!`);
        } else {
            showSuccess(`Snapshot logged at ${currentBPM} BPM. ${goalBpm - currentBPM} BPM to goal.`);
        }
    }

    addLogEntry({
      durationMinutes: Math.round(sessionSeconds / 60) || 0,
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

    // Auto-nudge BPM after snapshot: use snapshot BPM as base, nudge towards goal
    autoNudgeBPMOnSnapshot({ increment: 3, overshootAllowance: 2, snapshotBpm: currentBPM });
  }, [currentBPM, result, highestMasteredBPM, sessionSeconds, updateScaleMasteryBPM, addLogEntry, selectedArticulation, selectedDirection, selectedHandConfig, selectedRhythm, selectedAccent, selectedOctaves, autoNudgeBPMOnSnapshot, nextBPMGoal]);

  useEffect(() => {
    const currentHighestBPMForActivePermutation = getHighestBPMForCurrentPermutation();
    if (globalActivePermutationHighestBPM !== currentHighestBPMForActivePermutation) {
        setActivePermutationHighestBPM(currentHighestBPMForActivePermutation);
    }
    
    const newActivePracticeItem: ActivePracticeItem = result ? {
        type: 'scale',
        scalePermutationId: result.scalePermutationId,
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
    <CardContent className="flex flex-col gap-8 p-0">

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 surface p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Music className="size-5" />
                            </div>
                            <Label className="text-sm font-bold tracking-tight text-foreground">Key Selection</Label>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRandomize}
                            className="h-8 shrink-0 px-2 text-xs font-bold text-muted-foreground transition-colors hover:text-primary focus-scale"
                            title="Randomize the permutation"
                          >
                            <Shuffle className="mr-1.5 h-3.5 w-3.5" />
                            Randomize
                        </Button>
                    </div>

                    <ToggleGroup 
                        type="single" 
                        value={selectedKey} 
                        onValueChange={(v) => v && setKeyAndAdjust(v as Key)}
                        className="grid grid-cols-6 gap-2"
                        disabled={isChromatic}
                    >
                        {availableKeys.map(key => (
                            <ToggleGroupItem key={key} value={key} className="h-11 w-full min-w-0 rounded-lg border border-transparent bg-muted/40 p-0 text-sm font-bold text-foreground/80 transition-all hover:bg-muted hover:text-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm data-[state=on]:shadow-primary/25 focus-scale">
                                {key.split('/')[0]}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>

                <div className="flex flex-col gap-4 surface p-5">
                    <div className="flex items-center gap-3">
                        <div className={cn('flex size-9 items-center justify-center rounded-lg', family === 'arpeggio' ? 'bg-folder-arpeggio/10 text-folder-arpeggio' : 'bg-folder-scale/10 text-folder-scale')}>
                            <Zap className="size-5" />
                        </div>
                        <Label className="text-sm font-bold tracking-tight text-foreground">
                            {family === 'arpeggio' ? 'Arpeggio type' : 'Scale type'}
                        </Label>
                    </div>
                    <ToggleGroup type="single" value={selectedType} onValueChange={(v) => v && setTypeAndAdjust(v)} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {(family === 'arpeggio' ? ARPEGGIO_TYPES : SCALE_TYPES).map(t => (
                            <ToggleGroupItem key={t} value={t} className="h-10 justify-start rounded-lg border border-transparent bg-muted/40 px-4 text-xs font-semibold text-foreground/80 transition-all hover:bg-muted hover:text-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground focus-scale">
                                {family === 'arpeggio' ? t.replace(' Arpeggio', '') : t}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <PermutationSection 
                    title="Articulation" 
                    description="Focus on touch and sound quality."
                    options={ARTICULATIONS} 
                    selectedValue={selectedArticulation} 
                    onValueChange={setArticulationAndAdjust}
                    icon={<Palette className="size-5" />}
                />
                <PermutationSection 
                    title="Octaves" 
                    description="Test consistency and endurance."
                    options={OCTAVE_CONFIGURATIONS} 
                    selectedValue={selectedOctaves} 
                    onValueChange={setOctavesAndAdjust}
                    icon={<Music className="size-5" />}
                />
            </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-border/60 pt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold tracking-tight">Advanced practice settings</h3>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        {modifiedAdvancedCount > 0 ? `${modifiedAdvancedCount} custom` : 'Standard'}
                      </span>
                    </div>
                    {!advancedOpen && (
                      <p className="truncate text-xs font-medium text-muted-foreground">
                        {advancedSummary}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Direction, hands, rhythm and accents — the details that break muscle memory.
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAdvancedOpen((prev) => !prev)}
                    aria-expanded={advancedOpen}
                    className="text-xs font-bold focus-scale"
                  >
                    <ChevronDown className={cn('w-4 h-4 mr-1 transition-transform', !advancedOpen && '-rotate-90')} />
                    {advancedOpen ? 'Hide' : 'Show'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleResetToStandard} className="text-xs font-bold focus-scale text-muted-foreground hover:text-destructive">
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      Reset
                  </Button>
                </div>
            </div>
            
            {advancedOpen && (
        <>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Presets:</span>
          <Button size="sm" variant="outline" className="h-8 text-xs font-bold focus-scale" onClick={() => { setArticulationAndAdjust('Legato'); setSelectedDirection(DIRECTION_TYPES[2]); setSelectedHandConfig(HAND_CONFIGURATIONS[0]); setSelectedRhythm(RHYTHMIC_PERMUTATIONS[0]); setSelectedAccent(ACCENT_DISTRIBUTIONS[3]); setIsPermutationManuallyAdjusted(true); }}>Standard</Button>
          <Button size="sm" variant="outline" className="h-8 text-xs font-bold focus-scale" onClick={() => { setArticulationAndAdjust('Legato'); setIsPermutationManuallyAdjusted(true); }}>Legato</Button>
          <Button size="sm" variant="outline" className="h-8 text-xs font-bold focus-scale" onClick={() => { setArticulationAndAdjust('Staccato'); setIsPermutationManuallyAdjusted(true); }}>Staccato</Button>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <PermutationSection 
                    title="Direction" 
                    description="Removes muscle-memory autopilot."
                    options={DIRECTION_TYPES} 
                    selectedValue={selectedDirection} 
                    onValueChange={setDirectionAndAdjust}
                    icon={<Repeat className="size-5" />}
                />
                <PermutationSection 
                    title="Hands" 
                    description="Tests coordination and LH/RH independence."
                    options={HAND_CONFIGURATIONS} 
                    selectedValue={selectedHandConfig} 
                    onValueChange={setHandConfigAndAdjust}
                    icon={<Hand className="size-5" />}
                    getItemClasses={getHandColorClasses}
                />
                <PermutationSection 
                    title="Rhythm" 
                    description="Reveals weak fingers and hidden tension."
                    options={RHYTHMIC_PERMUTATIONS} 
                    selectedValue={selectedRhythm} 
                    onValueChange={setRhythmAndAdjust}
                    icon={<Gauge className="size-5" />}
                />
                <PermutationSection 
                    title="Accent" 
                    description="Ensures neutral evenness and control."
                    options={ACCENT_DISTRIBUTIONS} 
                    selectedValue={selectedAccent} 
                    onValueChange={setAccentAndAdjust}
                    icon={<Target className="size-5" />}
                />
            </div>
        </>
            )}
        </div>
    </CardContent>
  );
};

export default ScalePracticePanel;
