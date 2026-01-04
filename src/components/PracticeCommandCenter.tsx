import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { LogIn } from 'lucide-react';
import { 
  KEYS, SCALE_TYPES, ARPEGGIO_TYPES, ARTICULATIONS, TEMPO_LEVELS, getPracticeId, 
  Key, Articulation, TempoLevel, ALL_SCALE_ITEMS,
  DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS,
  DirectionType, HandConfiguration, RhythmicPermutation, AccentDistribution
} from '@/lib/scales';
import { useScales } from '../context/ScalesContext';
import { showSuccess, showError } from '@/utils/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import PracticeTimer from './PracticeTimer';

// Helper to combine scale and arpeggio types for selection
const ALL_TYPES = [...SCALE_TYPES, ...ARPEGGIO_TYPES];

const TEMPO_BPM_MAP: Record<TempoLevel, number> = {
  "Slow (Under 80 BPM)": 70,
  "Moderate (80-100 BPM)": 90,
  "Fast (100-120 BPM)": 110,
  "Professional (120+ BPM)": 130,
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
        <p className="text-xs text-muted-foreground italic">{description}</p>
        <div className="space-y-2">
            {options.map(option => (
                <div key={option} className={cn(
                    "flex items-center space-x-3 p-3 rounded-md transition-colors cursor-pointer",
                    selectedValue === option ? "bg-primary/20 border border-primary" : "hover:bg-accent"
                )}
                onClick={() => onValueChange(option)}>
                    <Checkbox 
                        id={`perm-${title}-${option}`} 
                        checked={selectedValue === option}
                        onCheckedChange={() => onValueChange(option)}
                        className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <Label htmlFor={`perm-${title}-${option}`} className="text-sm font-medium leading-none cursor-pointer text-foreground font-mono">
                        {option}
                    </Label>
                </div>
            ))}
        </div>
    </div>
);


const PracticeCommandCenter: React.FC = () => {
  const { addLogEntry, updatePracticeStatus, allScales } = useScales();
  
  // State for selected parameters
  const [selectedKey, setSelectedKey] = useState<Key>(KEYS[0]);
  const [selectedType, setSelectedType] = useState<string>(ALL_TYPES[0]); 
  const [selectedArticulation, setSelectedArticulation] = useState<Articulation>(ARTICULATIONS[0]);
  const [selectedTempoIndex, setSelectedTempoIndex] = useState<number>(0); 

  // New states
  const [selectedDirection, setSelectedDirection] = useState<DirectionType>(DIRECTION_TYPES[2]);
  const [selectedHandConfig, setSelectedHandConfig] = useState<HandConfiguration>(HAND_CONFIGURATIONS[0]);
  const [selectedRhythm, setSelectedRhythm] = useState<RhythmicPermutation>(RHYTHMIC_PERMUTATIONS[0]);
  const [selectedAccent, setSelectedAccent] = useState<AccentDistribution>(ACCENT_DISTRIBUTIONS[3]);

  const selectedTempo = TEMPO_LEVELS[selectedTempoIndex];
  
  // State for fine-tuned BPM (Metronome feature)
  const initialBPM = TEMPO_BPM_MAP[TEMPO_LEVELS[0]];
  const [currentBPM, setCurrentBPM] = useState(initialBPM);

  // Sync currentBPM when selectedTempoIndex changes (from slider)
  useEffect(() => {
      setCurrentBPM(TEMPO_BPM_MAP[TEMPO_LEVELS[selectedTempoIndex]]);
  }, [selectedTempoIndex]);
  
  // Handler for +/- 1 BPM adjustment
  const handleBpmChange = (delta: number) => {
      setCurrentBPM(prev => Math.max(1, prev + delta)); // Ensure BPM doesn't go below 1
  };


  const getScaleItemAndPracticeId = () => {
    let scaleItem;
    const isChromatic = selectedType === "Chromatic";

    if (isChromatic) {
        scaleItem = allScales.find(s => s.type === "Chromatic");
    } else {
        scaleItem = allScales.find(s => s.key === selectedKey && s.type === selectedType);
    }

    if (!scaleItem) {
      showError("Could not identify the scale/arpeggio combination.");
      return null;
    }

    const practiceId = getPracticeId(
      scaleItem.id, 
      selectedArticulation, 
      selectedTempo,
      selectedDirection, 
      selectedHandConfig, 
      selectedRhythm, 
      selectedAccent
    );
    
    return { scaleItem, practiceId };
  }

  const handleSaveSnapshot = () => {
    const result = getScaleItemAndPracticeId();
    if (!result) return;
    const { scaleItem, practiceId } = result;

    // 2. Log the snapshot (durationMinutes: 0 indicates a snapshot log)
    addLogEntry({
      durationMinutes: 0, 
      scalesPracticed: [{
        scaleId: scaleItem.id,
        articulation: selectedArticulation,
        tempo: selectedTempo,
        direction: selectedDirection,
        handConfig: selectedHandConfig,
        rhythm: selectedRhythm,
        accent: selectedAccent,
      }],
      notes: `Snapshot: ${scaleItem.key} ${scaleItem.type} (${selectedArticulation}, ${selectedTempo}, ${selectedDirection}, ${selectedHandConfig}, ${selectedRhythm}, ${selectedAccent}). Target BPM: ${currentBPM}`,
    });

    // 3. Update the status to 'practiced'
    updatePracticeStatus(practiceId, 'practiced');

    showSuccess(`Snapshot saved! Combination marked as practiced.`);
  };
  
  const handleLogSession = (durationMinutes: number) => {
    const result = getScaleItemAndPracticeId();
    if (!result) return;
    const { scaleItem, practiceId } = result;

    // 2. Log the session duration
    addLogEntry({
      durationMinutes: durationMinutes, 
      scalesPracticed: [{
        scaleId: scaleItem.id,
        articulation: selectedArticulation,
        tempo: selectedTempo,
        direction: selectedDirection,
        handConfig: selectedHandConfig,
        rhythm: selectedRhythm,
        accent: selectedAccent,
      }],
      notes: `Timed session focused on: ${scaleItem.key} ${scaleItem.type} (${selectedArticulation}, ${selectedTempo}). Actual BPM used: ${currentBPM}`,
    });

    // 3. Update the status to 'practiced'
    updatePracticeStatus(practiceId, 'practiced');
  };


  // Determine available keys based on selected type
  const isChromatic = selectedType === "Chromatic";
  const availableKeys = isChromatic ? ["C"] : KEYS;


  return (
    <div className="p-4 md:p-8 min-h-[calc(100vh-64px)] flex items-center justify-center bg-background">
      <Card className="w-full max-w-6xl bg-card border-2 border-primary shadow-2xl shadow-primary/50 transition-all duration-500">
        <CardHeader className="p-4 border-b border-primary/50">
          <CardTitle className="text-2xl font-mono tracking-widest text-primary text-center">
            PRACTICE CONTROL PANEL
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* Top Row: BPM and Timer */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-8">
            
            {/* Tempo Display / Metronome Control */}
            <div className="flex-1 space-y-2">
                <Label className="text-lg font-semibold text-primary block font-mono text-center lg:text-left">
                    TARGET TEMPO (BPM)
                </Label>
                <div className="flex items-center justify-center lg:justify-start space-x-4">
                    <Button 
                        onClick={() => handleBpmChange(-1)} 
                        variant="outline" 
                        size="icon" 
                        className="w-12 h-12 text-primary border-primary/50 text-2xl font-bold hover:bg-accent"
                    >
                        -
                    </Button>
                    <div className="text-7xl font-mono font-extrabold text-primary tracking-tighter min-w-[120px] text-center">
                        {currentBPM}
                    </div>
                    <Button 
                        onClick={() => handleBpmChange(1)} 
                        variant="outline" 
                        size="icon" 
                        className="w-12 h-12 text-primary border-primary/50 text-2xl font-bold hover:bg-accent"
                    >
                        +
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground font-mono text-center lg:text-left">
                    Tempo Category: {selectedTempo}
                </p>
            </div>

            {/* Timer Integration (Top Right) */}
            <div className="w-full lg:w-1/3">
                <PracticeTimer onLogSession={handleLogSession} />
            </div>
          </div>
          
          {/* Tempo Slider */}
          <div className="space-y-4 pt-4 border-t border-border">
            <Slider
              min={0}
              max={TEMPO_LEVELS.length - 1}
              step={1}
              value={[selectedTempoIndex]}
              onValueChange={(value) => setSelectedTempoIndex(value[0])}
              className="w-full [&>span:first-child]:bg-primary [&>span:first-child]:h-2 [&>span:first-child]:rounded-full [&>span:nth-child(2)]:bg-primary [&>span:nth-child(2)]:border-2 [&>span:nth-child(2)]:border-primary-foreground [&>span:nth-child(2)]:w-5 [&>span:nth-child(2)]:h-5"
            />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>{TEMPO_LEVELS[0].split(' ')[0]}</span>
              <span>{TEMPO_LEVELS[TEMPO_LEVELS.length - 1].split(' ')[0]}</span>
            </div>
          </div>

          {/* Key Selection (Full Width, Circular) */}
          <div className="space-y-3 border p-4 rounded-lg border-primary/30 bg-secondary/50">
            <Label className="text-lg font-semibold text-primary block mb-2 font-mono">KEY SELECTION</Label>
            <ToggleGroup 
              type="single" 
              value={selectedKey} 
              onValueChange={(value) => value && setSelectedKey(value as Key)}
              className="flex flex-wrap justify-center gap-3 w-full"
              disabled={isChromatic}
            >
              {availableKeys.map(key => (
                <ToggleGroupItem 
                  key={key} 
                  value={key} 
                  aria-label={`Select key ${key}`}
                  className={cn(
                    "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:border-primary/80 border border-border text-sm px-3 py-3 h-12 w-12 rounded-full font-mono flex items-center justify-center",
                    isChromatic && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {key.replace(/\/.*/, '')} {/* Display C instead of C/Db for brevity */}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {isChromatic && <p className="text-xs text-yellow-400 mt-2 text-center">Chromatic scale is key-independent (C selected by default).</p>}
          </div>

          {/* Scale/Arpeggio Type Selection (Horizontal Full Row) */}
          <div className="space-y-3 border p-4 rounded-lg border-primary/30 bg-secondary/50">
            <Label className="text-lg font-semibold text-primary block mb-2 font-mono">SCALE/ARPEGGIO TYPE</Label>
            <ToggleGroup 
              type="single" 
              value={selectedType} 
              onValueChange={(value) => {
                if (value) {
                  setSelectedType(value);
                  if (value === "Chromatic") {
                      setSelectedKey("C");
                  }
                }
              }}
              className="flex flex-wrap justify-center gap-2 w-full"
            >
              {ALL_TYPES.map(type => (
                <ToggleGroupItem 
                  key={type} 
                  value={type} 
                  aria-label={`Select type ${type}`}
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:border-primary/80 border border-border text-sm px-4 py-2 h-auto font-mono flex-1 min-w-[100px]"
                >
                  {type}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          
          {/* Articulation Selection (Horizontal Full Row) */}
          <div className="space-y-3 border p-4 rounded-lg border-primary/30 bg-secondary/50">
            <Label className="text-lg font-semibold text-primary block mb-2 font-mono">ARTICULATION MODE</Label>
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
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:border-primary/80 border border-border text-sm px-4 py-2 h-auto font-mono flex-1 min-w-[100px]"
                >
                  {articulation.split(' ')[0]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Log Snapshot Button */}
          <Button 
            onClick={handleSaveSnapshot} 
            className="w-full text-xl py-6 bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/50 text-primary-foreground"
          >
            <LogIn className="w-6 h-6 mr-3" /> LOG PRACTICE SNAPSHOT
          </Button>
          
          {/* Extra Special Edition Permutations */}
          <div className="pt-8 space-y-6">
            <div className="flex items-center">
                <div className="flex-grow border-t border-dashed border-primary/50"></div>
                <span className="flex-shrink mx-4 text-xl font-mono font-bold text-primary">
                    EXTRA SPECIAL EDITION PERMUTATIONS
                </span>
                <div className="flex-grow border-t border-dashed border-primary/50"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PermutationSection
                    title="1. DIRECTION & STARTING POINT"
                    description="Removes 'muscle-memory autopilot' and tests mental mapping."
                    options={DIRECTION_TYPES}
                    selectedValue={selectedDirection}
                    onValueChange={(value) => setSelectedDirection(value)}
                />
                <PermutationSection
                    title="2. HAND CONFIGURATION"
                    description="Professional expectation: tests coordination and integration."
                    options={HAND_CONFIGURATIONS}
                    selectedValue={selectedHandConfig}
                    onValueChange={(value) => setSelectedHandConfig(value)}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PermutationSection
                    title="3. RHYTHMIC PERMUTATIONS"
                    description="High value, low time: reveals weak fingers and hidden tension."
                    options={RHYTHMIC_PERMUTATIONS}
                    selectedValue={selectedRhythm}
                    onValueChange={(value) => setSelectedRhythm(value)}
                />
                <PermutationSection
                    title="4. ACCENT & WEIGHT DISTRIBUTION"
                    description="Quietly professional: ensures neutral evenness and control."
                    options={ACCENT_DISTRIBUTIONS}
                    selectedValue={selectedAccent}
                    onValueChange={(value) => setSelectedAccent(value)}
                />
            </div>
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
};

export default PracticeCommandCenter;