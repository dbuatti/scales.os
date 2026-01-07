import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  ScaleItem, ARTICULATIONS, TEMPO_LEVELS, Articulation, TempoLevel,
  DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS, OCTAVE_CONFIGURATIONS,
  getScalePermutationId, getTempoLevelBPMThreshold, parseScalePermutationId,
  DirectionType, HandConfiguration, RhythmicPermutation, AccentDistribution, OctaveConfiguration, cleanString // Added cleanString and missing types
} from '@/lib/scales';
import { useScales, ScaleStatus } from '../context/ScalesContext';
import { cn } from '@/lib/utils';
import { Check, Clock, X } from 'lucide-react'; // Removed RotateCcw
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
      return <Check className="w-4 h-4 text-success-foreground" />;
    case 'practiced':
      return <Clock className="w-4 h-4 text-warning-foreground" />;
    case 'untouched':
    default:
      return <X className="w-4 h-4 text-muted-foreground" />;
  }
};

const getStatusClasses = (status: ScaleStatus) => {
  switch (status) {
    case 'mastered':
      return 'bg-success hover:bg-success/90';
    case 'practiced':
      return 'bg-warning hover:bg-warning/90';
    case 'untouched':
    default:
      return 'bg-muted/20 hover:bg-muted/40';
  }
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
        <Label className="text-md font-semibold text-primary block font-mono">{title}</Label>
        <p className="text-xs text-muted-foreground italic mb-2">{description}</p>
        <ToggleGroup 
            type="single" 
            value={selectedValue} 
            onValueChange={(value) => value && onValueChange(value as T)}
            className="flex flex-wrap justify-start gap-2 w-full"
        >
            {options.map(option => (
                <ToggleGroupItem 
                    key={option} 
                    value={option} 
                    aria-label={`Select ${option}`}
                    className={cn(
                        "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:border-primary/80 border border-border text-xs px-2 py-1 h-auto font-mono",
                        selectedValue === option ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                    )}
                >
                    {option.split(' ')[0]}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    </div>
);


const ScaleDetailDialog: React.FC<ScaleDetailDialogProps> = ({ scaleItem, children }) => {
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
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary font-mono text-2xl">
            {scaleItem.key} {scaleItem.type} - Detailed Mastery
          </DialogTitle>
        </DialogHeader>
        
        {/* Permutation Selection Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg border-primary/30 bg-secondary/50">
            <PermutationSection
                title="OCTAVE RANGE"
                description="Increase range to test consistency and endurance."
                options={OCTAVE_CONFIGURATIONS}
                selectedValue={selectedOctaves}
                onValueChange={setSelectedOctaves as (value: OctaveConfiguration) => void}
            />
            <PermutationSection
                title="DIRECTION & STARTING POINT"
                description="Removes 'muscle-memory autopilot' and tests mental mapping."
                options={DIRECTION_TYPES}
                selectedValue={selectedDirection}
                onValueChange={setSelectedDirection as (value: DirectionType) => void}
            />
            <PermutationSection
                title="HAND CONFIGURATION"
                description="Professional expectation: tests coordination and integration."
                options={HAND_CONFIGURATIONS}
                selectedValue={selectedHandConfig}
                onValueChange={setSelectedHandConfig as (value: HandConfiguration) => void}
            />
            <PermutationSection
                title="RHYTHMIC PERMUTATIONS"
                description="High value, low time: reveals weak fingers and hidden tension."
                options={RHYTHMIC_PERMUTATIONS}
                selectedValue={selectedRhythm}
                onValueChange={setSelectedRhythm as (value: RhythmicPermutation) => void}
            />
            <PermutationSection
                title="ACCENT & WEIGHT DISTRIBUTION"
                description="Quietly professional: ensures neutral evenness and control."
                options={ACCENT_DISTRIBUTIONS}
                selectedValue={selectedAccent}
                onValueChange={setSelectedAccent as (value: AccentDistribution) => void}
            />
        </div>

        <div className="overflow-x-auto mt-6">
          <table className="w-full divide-y divide-border">
            <thead>
              <tr className="bg-secondary/50">
                <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 min-w-[150px]">Articulation</th>
                {TEMPO_LEVELS.map(tempo => (
                  <th key={tempo} className="px-4 py-2 text-center text-xs font-medium text-foreground/70 min-w-[100px]">
                    {tempo.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ARTICULATIONS.map(articulation => (
                <tr key={articulation} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
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
                          className={cn(
                            "w-full h-10 flex flex-col items-center justify-center rounded-md transition-colors duration-150",
                            status === 'mastered' ? 'bg-success hover:bg-success/90' : status === 'practiced' ? 'bg-warning hover:bg-warning/90' : getStatusClasses(status),
                            // Highlight the currently selected cell for reset button context
                            articulation === selectedArticulation && tempo === selectedTempo && "ring-2 ring-offset-2 ring-primary ring-offset-background"
                          )}
                          size="sm"
                          aria-label={`${articulation} at ${tempo} status: ${statusText}. Click to cycle status.`}
                        >
                          {getStatusIcon(status)}
                          <span className="text-xs font-mono mt-1 text-foreground/80">
                            {currentHighestBPM > 0 ? `${currentHighestBPM} BPM` : ''}
                          </span>
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Click a cell to toggle its mastery: Untouched/Practiced → Mastered ({getTempoLevelBPMThreshold(selectedTempo)} BPM) / Mastered → Untouched.
            </p>
        </div>
        <p className="text-xs text-muted-foreground">
            Currently selected permutation: <span className="font-mono text-foreground">{selectedArticulation}, {selectedDirection}, {selectedHandConfig}, {selectedRhythm}, {selectedAccent}, {selectedOctaves}</span>. Highest BPM: <span className={cn("font-mono font-bold", currentHighestBPMForSelectedPermutation >= getTempoLevelBPMThreshold(TEMPO_LEVELS[3]) ? 'text-success' : currentHighestBPMForSelectedPermutation > 0 ? 'text-warning' : 'text-muted-foreground')}>{currentHighestBPMForSelectedPermutation} BPM</span>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ScaleDetailDialog;