import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  ScaleItem, ARTICULATIONS, TEMPO_LEVELS, Articulation, TempoLevel,
  DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS, OCTAVE_CONFIGURATIONS,
  getScalePermutationId, getTempoLevelBPMThreshold, parseScalePermutationId, cleanString,
  DirectionType, HandConfiguration, RhythmicPermutation, AccentDistribution, OctaveConfiguration
} from '@/lib/scales';
import { useScales, ScaleStatus } from '../context/ScalesContext';
import { cn } from '@/lib/utils';
import { Check, Clock, X, Music, Gauge, Repeat, Hand, Target, Zap, Palette } from 'lucide-react';
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
    icon: React.ReactNode;
}

const PermutationSection = <T extends string>({ title, description, options, selectedValue, onValueChange, icon }: PermutationSectionProps<T>) => (
    <div className="space-y-3 p-3 rounded-lg border border-primary/30 bg-secondary/50">
        <div className="flex items-center gap-2 mb-2">
            {icon}
            <Label className="text-md font-semibold text-primary block font-mono text-glow">{title}</Label>
        </div>
        <p className="text-xs text-muted-foreground italic mb-2 text-primary/70">{description}</p>
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
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto bg-card/95 border-4 border-primary/80 shadow-2xl shadow-primary/40 relative overflow-hidden">
        {/* Subtle CRT glow overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        </div>
        <DialogHeader className="p-4 border-b-2 border-primary/50 relative z-10">
          <DialogTitle className="text-primary font-mono text-2xl text-glow">
            {scaleItem.key} {scaleItem.type} - Detailed Mastery
          </DialogTitle>
        </DialogHeader>
        
        {/* Permutation Selection Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 relative z-10">
            <PermutationSection
                title="OCTAVE RANGE"
                description="Increase range to test consistency and endurance."
                options={OCTAVE_CONFIGURATIONS}
                selectedValue={selectedOctaves}
                onValueChange={setSelectedOctaves as (value: OctaveConfiguration) => void}
                icon={<Music className="w-5 h-5 text-primary/70" />}
            />
            <PermutationSection
                title="DIRECTION & STARTING POINT"
                description="Removes 'muscle-memory autopilot' and tests mental mapping."
                options={DIRECTION_TYPES}
                selectedValue={selectedDirection}
                onValueChange={setSelectedDirection as (value: DirectionType) => void}
                icon={<Repeat className="w-5 h-5 text-primary/70" />}
            />
            <PermutationSection
                title="HAND CONFIGURATION"
                description="Professional expectation: tests coordination and integration."
                options={HAND_CONFIGURATIONS}
                selectedValue={selectedHandConfig}
                onValueChange={setSelectedHandConfig as (value: HandConfiguration) => void}
                icon={<Hand className="w-5 h-5 text-primary/70" />}
            />
            <PermutationSection
                title="RHYTHMIC PERMUTATIONS"
                description="High value, low time: reveals weak fingers and hidden tension."
                options={RHYTHMIC_PERMUTATIONS}
                selectedValue={selectedRhythm}
                onValueChange={setSelectedRhythm as (value: RhythmicPermutation) => void}
                icon={<Gauge className="w-5 h-5 text-primary/70" />}
            />
            <PermutationSection
                title="ACCENT & WEIGHT DISTRIBUTION"
                description="Quietly professional: ensures neutral evenness and control."
                options={ACCENT_DISTRIBUTIONS}
                selectedValue={selectedAccent}
                onValueChange={setSelectedAccent as (value: AccentDistribution) => void}
                icon={<Target className="w-5 h-5 text-primary/70" />}
            />
            <PermutationSection
                title="ARTICULATION"
                description="Focus on different touch and sound qualities."
                options={ARTICULATIONS}
                selectedValue={selectedArticulation}
                onValueChange={setSelectedArticulation as (value: Articulation) => void}
                icon={<Palette className="w-5 h-5 text-primary/70" />}
            />
        </div>

        <div className="overflow-x-auto mt-6 relative z-10">
          <table className="w-full divide-y divide-border">
            <thead>
              <tr className="bg-secondary/50">
                <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 min-w-[150px] text-primary/80">Tempo Level</th>
                {TEMPO_LEVELS.map(tempo => (
                  <th key={tempo} className="px-4 py-2 text-center text-xs font-medium text-foreground/70 min-w-[100px] text-primary/80">
                    {tempo.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Articulation is now selected via the PermutationSection above, 
                  so the rows here represent Tempo Levels for the *selected* articulation.
                  However, the original design had Articulations as rows and Tempo Levels as columns.
                  To maintain the matrix, we'll keep Articulations as rows and Tempo Levels as columns,
                  but the other permutations are now selected globally for this dialog. */}
              {ARTICULATIONS.map(articulation => (
                <tr key={articulation} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-primary/90">
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
                            setSelectedArticulation(articulation); // Keep this to highlight the cell
                            setSelectedTempo(tempo); // Keep this to highlight the cell
                          }}
                          className={cn(
                            "w-full h-10 flex flex-col items-center justify-center rounded-md transition-colors duration-150 border border-primary/30",
                            status === 'mastered' ? 'bg-success hover:bg-success/90 shadow-md shadow-success/30' : status === 'practiced' ? 'bg-warning hover:bg-warning/90 shadow-md shadow-warning/30' : getStatusClasses(status),
                            // Highlight the currently selected cell for reset button context
                            articulation === selectedArticulation && tempo === selectedTempo && "ring-2 ring-offset-2 ring-primary ring-offset-background"
                          )}
                          size="sm"
                          aria-label={`${articulation} at ${tempo} status: ${statusText}. Click to cycle status.`}
                        >
                          {getStatusIcon(status)}
                          <span className="text-xs font-mono mt-1 text-foreground/80 text-primary/70">
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
        
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-primary/30 relative z-10">
            <p className="text-sm text-muted-foreground text-primary/70">
              Click a cell to toggle its mastery: Untouched/Practiced → Mastered ({getTempoLevelBPMThreshold(selectedTempo)} BPM) / Mastered → Untouched.
            </p>
            <p className="text-xs text-muted-foreground text-primary/70">
                Currently selected permutation: <span className="font-mono text-foreground text-primary/90">{selectedArticulation}, {selectedDirection}, {selectedHandConfig}, {selectedRhythm}, {selectedAccent}, {selectedOctaves}</span>. Highest BPM: <span className={cn("font-mono font-bold", currentHighestBPMForSelectedPermutation >= getTempoLevelBPMThreshold(TEMPO_LEVELS[3]) ? 'text-success text-glow' : currentHighestBPMForSelectedPermutation > 0 ? 'text-warning text-glow' : 'text-muted-foreground')}>{currentHighestBPMForSelectedPermutation} BPM</span>
            </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScaleDetailDialog;