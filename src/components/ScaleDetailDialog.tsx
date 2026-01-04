import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  ScaleItem, ARTICULATIONS, TEMPO_LEVELS, getPracticeId, Articulation, TempoLevel,
  DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS
} from '@/lib/scales';
import { useScales, ScaleStatus } from '../context/ScalesContext';
import { cn } from '@/lib/utils';
import { Check, Clock, X, RotateCcw } from 'lucide-react';
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
  const { progressMap, updatePracticeStatus } = useScales();
  const [selectedArticulation, setSelectedArticulation] = React.useState<Articulation>(ARTICULATIONS[0]);
  const [selectedTempo, setSelectedTempo] = React.useState<TempoLevel>(TEMPO_LEVELS[0]);
  
  // Determine the practice ID for the currently selected combination in the dialog
  const currentPracticeId = getPracticeId(
    scaleItem.id, 
    selectedArticulation, 
    selectedTempo,
    DEFAULT_DIRECTION,
    DEFAULT_HAND_CONFIG,
    DEFAULT_RHYTHM,
    DEFAULT_ACCENT
  );
  
  const currentStatus: ScaleStatus = progressMap[currentPracticeId] || 'untouched';


  const handleToggleStatus = (articulation: Articulation, tempo: TempoLevel) => {
    const practiceId = getPracticeId(
      scaleItem.id, 
      articulation, 
      tempo,
      DEFAULT_DIRECTION,
      DEFAULT_HAND_CONFIG,
      DEFAULT_RHYTHM,
      DEFAULT_ACCENT
    );
    
    const status: ScaleStatus = progressMap[practiceId] || 'untouched';
    
    // Cycle logic: untouched -> practiced -> mastered -> untouched
    let nextStatus: ScaleStatus;
    if (status === 'untouched') {
      nextStatus = 'practiced';
    } else if (status === 'practiced') {
      nextStatus = 'mastered';
    } else { // status === 'mastered'
      nextStatus = 'untouched';
    }
      
    updatePracticeStatus(practiceId, nextStatus);
  };
  
  const handleResetStatus = () => {
    if (currentStatus === 'untouched') {
      showError("Status is already Untouched.");
      return;
    }
    
    updatePracticeStatus(currentPracticeId, 'untouched');
    showSuccess(`Status for ${scaleItem.key} ${scaleItem.type} (${selectedArticulation}, ${selectedTempo.split(' ')[0]}) reset to Untouched.`);
  };

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
          Note: This matrix tracks the default permutation: {DEFAULT_DIRECTION}, {DEFAULT_HAND_CONFIG}, {DEFAULT_RHYTHM}, {DEFAULT_ACCENT}.
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
                    // Calculate practiceId using defaults for new dimensions
                    const practiceId = getPracticeId(
                      scaleItem.id, 
                      articulation, 
                      tempo,
                      DEFAULT_DIRECTION,
                      DEFAULT_HAND_CONFIG,
                      DEFAULT_RHYTHM,
                      DEFAULT_ACCENT
                    );
                    const status: ScaleStatus = progressMap[practiceId] || 'untouched';
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
                            "w-full h-10 flex items-center justify-center rounded-md transition-colors duration-150",
                            getStatusClasses(status),
                            // Highlight the currently selected cell for reset button context
                            articulation === selectedArticulation && tempo === selectedTempo && "ring-2 ring-offset-2 ring-primary ring-offset-background"
                          )}
                          size="sm"
                          aria-label={`${articulation} at ${tempo} status: ${statusText}. Click to cycle status.`}
                        >
                          {getStatusIcon(status)}
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
              Click a cell to cycle its status: Untouched → Practiced → Mastered.
            </p>
            <Button 
                onClick={handleResetStatus} 
                variant="destructive" 
                size="sm"
                disabled={currentStatus === 'untouched'}
            >
                <RotateCcw className="w-4 h-4 mr-2" /> Reset Selected Status
            </Button>
        </div>
        <p className="text-xs text-muted-foreground">
            Currently selected combination: <span className="font-mono text-foreground">{selectedArticulation}</span> at <span className="font-mono text-foreground">{selectedTempo.split(' ')[0]}</span>. Status: <span className={cn("font-mono font-bold", currentStatus === 'mastered' ? 'text-green-400' : currentStatus === 'practiced' ? 'text-yellow-400' : 'text-gray-400')}>{currentStatus.toUpperCase()}</span>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ScaleDetailDialog;