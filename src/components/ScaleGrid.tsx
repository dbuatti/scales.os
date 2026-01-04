import React from 'react';
import { useScales, ScaleStatus } from '../context/ScalesContext';
import { 
  KEYS, SCALE_TYPES, ARPEGGIO_TYPES, ScaleItem, ARTICULATIONS, TEMPO_LEVELS, getPracticeId,
  DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS
} from '@/lib/scales';
import { cn } from '@/lib/utils';
import { Check, X, Clock, Eye } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import ScaleDetailDialog from './ScaleDetailDialog';

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

// Helper function to determine the overall status of a scale item
const getOverallStatus = (scaleItem: ScaleItem, progressMap: Record<string, 'practiced' | 'mastered'>): ScaleStatus => {
  let masteredCount = 0;
  let practicedCount = 0;
  let totalCombinations = 0;

  ARTICULATIONS.forEach(articulation => {
    TEMPO_LEVELS.forEach(tempo => {
      DIRECTION_TYPES.forEach(direction => {
        HAND_CONFIGURATIONS.forEach(handConfig => {
          RHYTHMIC_PERMUTATIONS.forEach(rhythm => {
            ACCENT_DISTRIBUTIONS.forEach(accent => {
              const practiceId = getPracticeId(
                scaleItem.id, 
                articulation, 
                tempo, 
                direction, 
                handConfig, 
                rhythm, 
                accent
              );
              const status: ScaleStatus = progressMap[practiceId] || 'untouched';
              totalCombinations++;
              
              if (status === 'mastered') {
                masteredCount++;
              } else if (status === 'practiced') {
                practicedCount++;
              }
            });
          });
        });
      });
    });
  });

  if (totalCombinations === 0) return 'untouched';

  if (masteredCount === totalCombinations) {
    return 'mastered'; // Fully mastered
  }
  if (masteredCount > 0 || practicedCount > 0) {
    return 'practiced'; // Partially mastered or practiced
  }
  return 'untouched';
};


const ScaleCell = React.forwardRef<HTMLButtonElement, { item: ScaleItem; status: ScaleStatus }>(({ item, status }, ref) => {
  const statusText = status === 'mastered' ? 'Fully Mastered' : status === 'practiced' ? 'In Progress' : 'Untouched';

  return (
    <Button
      ref={ref}
      variant="outline"
      className={cn(
        "w-full h-10 flex items-center justify-center rounded-md transition-colors duration-150",
        getStatusClasses(status)
      )}
      aria-label={`${item.key} ${item.type} status: ${statusText}. Click for details.`}
    >
      <Eye className="w-4 h-4 mr-2 text-white" />
      <span className="text-xs font-medium text-white hidden sm:inline">{statusText.split(' ')[0]}</span>
    </Button>
  );
});

ScaleCell.displayName = "ScaleCell";


const ScaleGrid = () => {
  const { allScales, progressMap } = useScales();

  // Include all scale types for the header row
  const scaleTypes = [...SCALE_TYPES, ...ARPEGGIO_TYPES];

  const getScaleItem = (key: string, type: string): ScaleItem | undefined => {
    if (type === "Chromatic") {
      // Chromatic scale is only keyed on 'C' in the data, but we only want to show it in the 'Any Key' row
      return key === "C" ? allScales.find(s => s.type === "Chromatic") : undefined;
    }
    return allScales.find(s => s.key === key && s.type === type);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead>
          <tr className="bg-secondary/50">
            <th className="sticky left-0 z-10 px-4 py-2 text-left text-xs font-medium text-foreground/70 bg-secondary/50">Key</th>
            {scaleTypes.map(type => (
              <th key={type} className="px-4 py-2 text-center text-xs font-medium text-foreground/70 min-w-[120px]">
                {type}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {KEYS.map(key => (
            <tr key={key} className="hover:bg-accent/50 transition-colors">
              <td className="sticky left-0 z-10 px-4 py-2 whitespace-nowrap text-sm font-medium bg-background dark:bg-card/50">
                {key}
              </td>
              {scaleTypes.map(type => {
                const item = getScaleItem(key, type);
                
                // If the item is Chromatic and we are not in the 'C' key row, skip rendering a cell.
                if (type === "Chromatic" && key !== "C") {
                    return <td key={type} className="px-4 py-2"></td>;
                }
                
                // If item is not found (e.g., Chromatic in non-C key), render empty cell
                if (!item) return <td key={type} className="px-4 py-2"></td>;

                const status = getOverallStatus(item, progressMap);
                const statusText = status === 'mastered' ? 'Fully Mastered' : status === 'practiced' ? 'In Progress' : 'Untouched';

                return (
                  <td key={type} className="px-4 py-2">
                    <ScaleDetailDialog scaleItem={item}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ScaleCell
                            item={item}
                            status={status}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{item.key} {item.type}</p>
                          <p>Overall Status: {statusText}</p>
                          <p className="text-xs text-muted-foreground">Click to view/edit Articulation & Tempo details.</p>
                        </TooltipContent>
                      </Tooltip>
                    </ScaleDetailDialog>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScaleGrid;