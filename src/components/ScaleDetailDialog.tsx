import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  ScaleItem, ARTICULATIONS, TEMPO_LEVELS, Articulation, TempoLevel,
  DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS, OCTAVE_CONFIGURATIONS,
  getScalePermutationId, getTempoLevelBPMThreshold, parseScalePermutationId, cleanString,
  DirectionType, HandConfiguration, RhythmicPermutation, AccentDistribution, OctaveConfiguration
} from '@/lib/scales';
import { useScales, ScaleStatus } from '@/context/ScalesContext';
import { cn, getHandColorClasses } from '@/lib/utils';
import { Check, Clock, X, Music, Gauge, Repeat, Hand, Target, Palette } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';

interface ScaleDetailDialogProps {
  scaleItem: ScaleItem;
  children: React.ReactNode;
}

// Define default permutations for the 2D matrix view
const DEFAULT_DIRECTION = DIRECTION_TYPES[2]; // "Asc + Desc (standard)"
const DEFAULT_HAND_CONFIG = HAND_CONFIGURATIONS[0]; // "Hands together"
const DEFAULT_RHYTHM = RHYTHMIC_PERMUTATIONS[0]; // "Straight"
const DEFAULT_ACCENT = ACCENT_DISTRIBUTIONS[3]; // "No accent (neutral evenness)"
const DEFAULT_OCTAVES = OCTAVE_CONFIGURATIONS[1]; // "2 Octaves (Standard)"


const getStatusIcon = (status: ScaleStatus) => {
  switch (status) {
    case 'mastered':
      return <Check className="h-4 w-4" />;
    case 'practiced':
      return <Clock className="h-4 w-4" />;
    case 'untouched':
    default:
      return <X className="h-4 w-4" />;
  }
};

const getStatusClasses = (status: ScaleStatus) => {
  switch (status) {
    case 'mastered':
      return 'border-success/40 bg-success/10 text-success hover:bg-success/15';
    case 'practiced':
      return 'border-warning/40 bg-warning/10 text-warning hover:bg-warning/15';
    case 'untouched':
    default:
      return 'border-border/60 text-muted-foreground hover:bg-muted/50';
  }
};

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
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4">
        <div className="mb-2 flex items-center gap-2">
            {icon}
            <Label className="text-sm font-bold">{title}</Label>
        </div>
        <p className="mb-2 text-xs text-muted-foreground">{description}</p>
        <ToggleGroup 
            type="single" 
            value={selectedValue} 
            onValueChange={(value) => value && onValueChange(value as T)}
            className="flex w-full flex-wrap justify-start gap-2"
        >
            {options.map(option => (
                <ToggleGroupItem 
                    key={option} 
                    value={option} 
                    aria-label={`Select ${option}`}
                    className={cn(
                        "border border-border/60 text-xs px-2 py-1 h-auto data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary",
                        getItemClasses?.(option)
                    )}
                >
                    {option}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    </div>
);


const ScaleDetailDialog = React.forwardRef<HTMLButtonElement, ScaleDetailDialogProps>(({ scaleItem, children }, ref) => {
  const { scaleMasteryBPMMap, updateScaleMasteryBPM } = useScales();
  const [selectedArticulation, setSelectedArticulation] = React.useState<Articulation>(ARTICULATIONS[0]);
  const [selectedTempo, setSelectedTempo] = React.useState<TempoLevel>(TEMPO_LEVELS[0]); // This is for the matrix view
  
  // New states for other permutation parameters
  const [selectedDirection, setSelectedDirection] = React.useState<DirectionType>(DEFAULT_DIRECTION);
  const [selectedHandConfig, setSelectedHandConfig] = React.useState<HandConfiguration>(DEFAULT_HAND_CONFIG);
  const [selectedRhythm, setSelectedRhythm] = React.useState<RhythmicPermutation>(DEFAULT_RHYTHM);
  const [selectedAccent, setSelectedAccent] = React.useState<AccentDistribution>(DEFAULT_ACCENT);
  const [selectedOctaves, setSelectedOctaves] = React.useState<OctaveConfiguration>(DEFAULT_OCTAVES);

  // Function to get the highest BPM for a given permutation, considering legacy "Hands separately"
  const getHighestBPMForPermutation = (
    scaleId: string, 
    articulation: Articulation, 
    direction: DirectionType,
    handConfig: HandConfiguration,
    rhythm: RhythmicPermutation,
    accent: AccentDistribution,
    octaves: OctaveConfiguration
  ): number => {
    const currentId = getScalePermutationId(scaleId, articulation, direction, handConfig, rhythm, accent, octaves);
    let highestBPM = scaleMasteryBPMMap[currentId] || 0;

    // If the current handConfig is 'Left hand only' or 'Right hand only',
    // also check for legacy 'Hands separately' and use its BPM if higher.
    if (handConfig === "Left hand only" || handConfig === "Right hand only") {
      const legacyHandConfig = "Hands separately";
      const legacyId = `${scaleId}-${cleanString(articulation)}-${cleanString(direction)}-${cleanString(legacyHandConfig)}-${cleanString(rhythm)}-${cleanString(accent)}-${cleanString(octaves)}`;
      const legacyBPM = scaleMasteryBPMMap[legacyId] || 0;
      highestBPM = Math.max(highestBPM, legacyBPM);
    }
    return highestBPM;
  };

  const currentHighestBPMForSelectedPermutation = getHighestBPMForPermutation(
    scaleItem.id, 
    selectedArticulation, 
    selectedDirection,
    selectedHandConfig,
    selectedRhythm,
    selectedAccent,
    selectedOctaves
  );

  const handleToggleStatus = (articulation: Articulation, tempo: TempoLevel) => {
    const permutationId = getScalePermutationId(
      scaleItem.id, 
      articulation, 
      selectedDirection, // Use selected direction
      selectedHandConfig, // Use selected hand config
      selectedRhythm, // Use selected rhythm
      selectedAccent, // Use selected accent
      selectedOctaves // Use selected octaves
    );
    
    const requiredBPM = getTempoLevelBPMThreshold(tempo);
    const currentHighestBPM = getHighestBPMForPermutation(
      scaleItem.id, 
      articulation, 
      selectedDirection,
      selectedHandConfig,
      selectedRhythm,
      selectedAccent,
      selectedOctaves
    );
    
    let nextBPM: number;
    let nextStatusText: string;
    
    if (currentHighestBPM >= requiredBPM) {
      // Currently mastered for this category -> Reset to untouched
      nextBPM = 0;
      nextStatusText = 'Untouched';
    } else {
      // Not yet mastered for this category -> Set to required BPM to mark as mastered
      nextBPM = requiredBPM;
      nextStatusText = 'Mastered';
    }
      
    updateScaleMasteryBPM(permutationId, nextBPM);
    showSuccess(`Status for ${scaleItem.key} ${scaleItem.type} (${articulation}, ${tempo.split(' ')[0]}) set to ${nextStatusText}. Highest BPM: ${nextBPM}`);
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild ref={ref}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 bg-card/80 shadow-2xl backdrop-blur-2xl sm:max-w-[1000px]">
        <DialogHeader className="border-b border-border/60 pb-4">
          <DialogTitle className="text-xl font-black tracking-tight">
            {scaleItem.key} {scaleItem.type} - Detailed Mastery
          </DialogTitle>
        </DialogHeader>
        
        {/* Permutation Selection Sections */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PermutationSection
                title="OCTAVE RANGE"
                description="Increase range to test consistency and endurance."
                options={OCTAVE_CONFIGURATIONS}
                selectedValue={selectedOctaves}
                onValueChange={setSelectedOctaves as (value: OctaveConfiguration) => void}
                icon={<Music className="h-4 w-4 text-primary" />}
            />
            <PermutationSection
                title="DIRECTION & STARTING POINT"
                description="Removes 'muscle-memory autopilot' and tests mental mapping."
                options={DIRECTION_TYPES}
                selectedValue={selectedDirection}
                onValueChange={setSelectedDirection as (value: DirectionType) => void}
                icon={<Repeat className="h-4 w-4 text-primary" />}
            />
            <PermutationSection
                title="HAND CONFIGURATION"
                description="Professional expectation: tests coordination and integration."
                options={HAND_CONFIGURATIONS}
                selectedValue={selectedHandConfig}
                onValueChange={setSelectedHandConfig as (value: HandConfiguration) => void}
                icon={<Hand className="h-4 w-4 text-primary" />}
                getItemClasses={getHandColorClasses}
            />
            <PermutationSection
                title="RHYTHMIC PERMUTATIONS"
                description="High value, low time: reveals weak fingers and hidden tension."
                options={RHYTHMIC_PERMUTATIONS}
                selectedValue={selectedRhythm}
                onValueChange={setSelectedRhythm as (value: RhythmicPermutation) => void}
                icon={<Gauge className="h-4 w-4 text-primary" />}
            />
            <PermutationSection
                title="ACCENT & WEIGHT DISTRIBUTION"
                description="Quietly professional: ensures neutral evenness and control."
                options={ACCENT_DISTRIBUTIONS}
                selectedValue={selectedAccent}
                onValueChange={setSelectedAccent as (value: AccentDistribution) => void}
                icon={<Target className="h-4 w-4 text-primary" />}
            />
            <PermutationSection
                title="ARTICULATION"
                description="Focus on different touch and sound qualities."
                options={ARTICULATIONS}
                selectedValue={selectedArticulation}
                onValueChange={setSelectedArticulation as (value: Articulation) => void}
                icon={<Palette className="h-4 w-4 text-primary" />}
            />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full divide-y divide-border/60">
            <thead>
              <tr className="bg-muted/40">
                <th className="min-w-[150px] px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Tempo Level</th>
                {TEMPO_LEVELS.map(tempo => (
                  <th key={tempo} className="min-w-[100px] px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {tempo.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {ARTICULATIONS.map(articulation => (
                <tr key={articulation} className="transition-colors hover:bg-muted/40">
                  <td className="whitespace-nowrap px-4 py-2 text-sm font-medium">
                    {articulation}
                  </td>
                  {TEMPO_LEVELS.map(tempo => {
                    const requiredBPM = getTempoLevelBPMThreshold(tempo);
                    const currentHighestBPM = getHighestBPMForPermutation(
                      scaleItem.id, 
                      articulation, 
                      selectedDirection,
                      selectedHandConfig,
                      selectedRhythm,
                      selectedAccent,
                      selectedOctaves
                    );
                    
                    const status: ScaleStatus = currentHighestBPM >= requiredBPM ? 'mastered' : (currentHighestBPM > 0 ? 'practiced' : 'untouched');
                    const statusText = status === 'mastered' ? 'Mastered' : status === 'practiced' ? 'Practiced' : 'Untouched';

                    return (
                      <td key={tempo} className="px-4 py-2">
                        <Button
                          onClick={() => {
                            handleToggleStatus(articulation, tempo);
                            setSelectedArticulation(articulation);
                            setSelectedTempo(tempo);
                          }}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-9 w-full gap-1 border px-3 text-xs font-bold tabular-nums transition-all duration-200",
                            getStatusClasses(status),
                            articulation === selectedArticulation && tempo === selectedTempo && "ring-2 ring-ring ring-offset-2 ring-offset-background"
                          )}
                          aria-label={`${articulation} at ${tempo} status: ${statusText}. Click to cycle status.`}
                        >
                          {getStatusIcon(status)}
                          <span>{currentHighestBPM > 0 ? `${currentHighestBPM} BPM` : ''}</span>
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
            <p className="text-sm text-muted-foreground">
              Click a cell to toggle mastery: Untouched/Practiced → Mastered ({getTempoLevelBPMThreshold(selectedTempo)} BPM), or Mastered → Untouched.
            </p>
            <p className="text-xs text-muted-foreground">
                Selected permutation: <span className="font-medium text-foreground">{selectedArticulation}, {selectedDirection}, {selectedHandConfig}, {selectedRhythm}, {selectedAccent}, {selectedOctaves}</span>. Highest BPM: <span className={cn("font-bold tabular-nums", currentHighestBPMForSelectedPermutation >= getTempoLevelBPMThreshold(TEMPO_LEVELS[3]) ? 'text-success' : currentHighestBPMForSelectedPermutation > 0 ? 'text-warning' : 'text-muted-foreground')}>{currentHighestBPMForSelectedPermutation} BPM</span>
            </p>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ScaleDetailDialog.displayName = "ScaleDetailDialog";

export default ScaleDetailDialog;