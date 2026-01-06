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
      return <Check className="w-4 h-4 text-white" />;
    case 'practiced':
      return <Clock className="w-4 h-4 text-white" />;
    case 'untouched':
    default:
      return <X className="w-4 h-4 text-gray-400" />;
  }
};

const getStatusClasses = (status: ScaleStatus) => {
  switch (status) {
    case 'mastered':
      return 'bg-green-600 hover:bg-green-700';
    case 'practiced':
      return 'bg-yellow-600 hover:bg-yellow-700';
    case 'untouched':
    default:
      return 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600';
  }
};

const ScaleDetailDialog: React.FC<ScaleDetailDialogProps> = ({ scaleItem, children }) => {
  const { scaleMasteryBPMMap, updateScaleMasteryBPM } = useScales();
  const [selectedArticulation, setSelectedArticulation] = React.useState<Articulation>(ARTICULATIONS[0]);
  const [selectedTempo, setSelectedTempo] = React.useState<TempoLevel>(TEMPO_LEVELS[0]);
  
  // Determine the permutation ID for the currently selected combination in the dialog
  const currentPermutationId = getScalePermutationId(
    scaleItem.id, 
    selectedArticulation, 
    DEFAULT_DIRECTION,
    DEFAULT_HAND_CONFIG,
    DEFAULT_RHYTHM,
    DEFAULT_ACCENT,
    DEFAULT_OCTAVES
  );
  
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

  const highestBPM = getHighestBPMForPermutation(
    scaleItem.id, 
    selectedArticulation, 
    DEFAULT_DIRECTION,
    DEFAULT_HAND_CONFIG,
    DEFAULT_RHYTHM,
    DEFAULT_ACCENT,
    DEFAULT_OCTAVES
  );

  const requiredBPM = getTempoLevelBPMThreshold(selectedTempo);
  
  const currentStatus: ScaleStatus = highestBPM >= requiredBPM ? 'mastered' : (highestBPM > 0 ? 'practiced' : 'untouched');


  const handleToggleStatus = (articulation: Articulation, tempo: TempoLevel) => {
    const permutationId = getScalePermutationId(
      scaleItem.id, 
      articulation, 
      DEFAULT_DIRECTION,
      DEFAULT_HAND_CONFIG,
      DEFAULT_RHYTHM,
      DEFAULT_ACCENT,
      DEFAULT_OCTAVES
    );
    
    const requiredBPM = getTempoLevelBPMThreshold(tempo);
    const currentHighestBPM = getHighestBPMForPermutation(
      scaleItem.id, 
      articulation, 
      DEFAULT_DIRECTION,
      DEFAULT_HAND_CONFIG,
      DEFAULT_RHYTHM,
      DEFAULT_ACCENT,
      DEFAULT_OCTAVES
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
  
  // Removed handleResetStatus as toggle now handles reset

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{scaleItem.key} {scaleItem.type} - Detailed Mastery</DialogTitle>
        </DialogHeader>
        
        <p className="text-sm text-yellow-500 mb-4">
          Note: This matrix tracks the default permutation: {DEFAULT_DIRECTION}, {DEFAULT_HAND_CONFIG}, {DEFAULT_RHYTHM}, {DEFAULT_ACCENT}, {DEFAULT_OCTAVES}.
        </p>

        <div className="overflow-x-auto">
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
                    // Calculate permutationId (excluding tempo)
                    const permutationId = getScalePermutationId(
                      scaleItem.id, 
                      articulation, 
                      DEFAULT_DIRECTION,
                      DEFAULT_HAND_CONFIG,
                      DEFAULT_RHYTHM,
                      DEFAULT_ACCENT,
                      DEFAULT_OCTAVES
                    );
                    
                    const requiredBPM = getTempoLevelBPMThreshold(tempo);
                    const currentHighestBPM = getHighestBPMForPermutation(
                      scaleItem.id, 
                      articulation, 
                      DEFAULT_DIRECTION,
                      DEFAULT_HAND_CONFIG,
                      DEFAULT_RHYTHM,
                      DEFAULT_ACCENT,
                      DEFAULT_OCTAVES
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
                            status === 'mastered' ? 'bg-green-600 hover:bg-green-700' : status === 'practiced' ? 'bg-yellow-600 hover:bg-yellow-700' : getStatusClasses(status),
                            // Highlight the currently selected cell for reset button context
                            articulation === selectedArticulation && tempo === selectedTempo && "ring-2 ring-offset-2 ring-primary ring-offset-background"
                          )}
                          size="sm"
                          aria-label={`${articulation} at ${tempo} status: ${statusText}. Click to cycle status.`}
                        >
                          {getStatusIcon(status)}
                          <span className="text-xs font-mono mt-1 text-white/80">
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
            {/* Removed Reset Permutation Status button */}
        </div>
        <p className="text-xs text-muted-foreground">
            Currently selected permutation: <span className="font-mono text-foreground">{selectedArticulation}</span>. Highest BPM: <span className={cn("font-mono font-bold", highestBPM >= getTempoLevelBPMThreshold(TEMPO_LEVELS[3]) ? 'text-green-400' : highestBPM > 0 ? 'text-yellow-400' : 'text-gray-400')}>{highestBPM} BPM</span>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ScaleDetailDialog;