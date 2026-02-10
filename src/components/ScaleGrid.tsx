import React, { useState, useMemo } from 'react';
import { useScales, ScaleStatus } from '@/context/ScalesContext';
import { 
  KEYS, SCALE_TYPES, ARPEGGIO_TYPES, ScaleItem, ARTICULATIONS, TEMPO_LEVELS, 
  DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS, OCTAVE_CONFIGURATIONS,
  getScalePermutationId, getTempoLevelBPMThreshold, cleanString
} from '@/lib/scales';
import { cn } from '@/lib/utils';
import { Check, X, Clock, Search } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ScaleDetailDialog from './ScaleDetailDialog';

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

const getOverallStatus = (scaleItem: ScaleItem, scaleMasteryBPMMap: Record<string, number>): ScaleStatus => {
  let masteredCount = 0;
  let practicedCount = 0;
  let totalCombinations = 0;
  
  const PROFESSIONAL_TEMPO = TEMPO_LEVELS[3];
  const REQUIRED_BPM_FOR_FULL_MASTERY = getTempoLevelBPMThreshold(PROFESSIONAL_TEMPO);

  ARTICULATIONS.forEach(articulation => {
    DIRECTION_TYPES.forEach(direction => {
      HAND_CONFIGURATIONS.forEach(handConfig => {
        RHYTHMIC_PERMUTATIONS.forEach(rhythm => {
          ACCENT_DISTRIBUTIONS.forEach(accent => {
            OCTAVE_CONFIGURATIONS.forEach(octaves => {
              const permutationId = getScalePermutationId(
                scaleItem.id, 
                articulation, 
                direction, 
                handConfig,
                rhythm, 
                accent,
                octaves
              );
              
              let highestBPM = scaleMasteryBPMMap[permutationId] || 0;

              if (handConfig === "Left hand only" || handConfig === "Right hand only") {
                const legacyHandConfig = "Hands separately";
                const legacyId = `${scaleItem.id}-${cleanString(articulation)}-${cleanString(direction)}-${cleanString(legacyHandConfig)}-${cleanString(rhythm)}-${cleanString(accent)}-${cleanString(octaves)}`;
                const legacyBPM = scaleMasteryBPMMap[legacyId] || 0;
                highestBPM = Math.max(highestBPM, legacyBPM);
              }

              totalCombinations++;
              
              if (highestBPM >= REQUIRED_BPM_FOR_FULL_MASTERY) {
                masteredCount++;
              } else if (highestBPM > 0) {
                practicedCount++;
              }
            });
          });
        });
      });
    });
  });

  if (totalCombinations === 0) return 'untouched';
  if (masteredCount === totalCombinations) return 'mastered';
  if (masteredCount > 0 || practicedCount > 0) return 'practiced';
  return 'untouched';
};

const ScaleCell = React.forwardRef<HTMLButtonElement, { item: ScaleItem; status: ScaleStatus }>(({ item, status }, ref) => {
  const statusText = status === 'mastered' ? 'Fully Mastered' : status === 'practiced' ? 'In Progress' : 'Untouched';

  return (
    <Button
      ref={ref}
      variant="outline"
      className={cn(
        "w-full h-10 flex items-center justify-center rounded-md transition-colors duration-150 border border-primary/30",
        getStatusClasses(status)
      )}
      aria-label={`${item.key} ${item.type} status: ${statusText}. Click for details.`}
    >
      {getStatusIcon(status)}
      <span className="text-xs font-medium text-foreground hidden sm:inline ml-2">{statusText.split(' ')[0]}</span>
    </Button>
  );
});

ScaleCell.displayName = "ScaleCell";

const ScaleGrid = () => {
  const { allScales, scaleMasteryBPMMap } = useScales();
  const [searchQuery, setSearchQuery] = useState('');

  const scaleTypes = useMemo(() => [...SCALE_TYPES, ...ARPEGGIO_TYPES], []);

  const filteredKeys = useMemo(() => {
    if (!searchQuery) return KEYS;
    return KEYS.filter(key => key.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const filteredTypes = useMemo(() => {
    if (!searchQuery) return scaleTypes;
    // If the search query matches a key, show all types. Otherwise, filter types.
    const matchesKey = KEYS.some(key => key.toLowerCase().includes(searchQuery.toLowerCase()));
    if (matchesKey) return scaleTypes;
    return scaleTypes.filter(type => type.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, scaleTypes]);

  const getScaleItem = (key: string, type: string): ScaleItem | undefined => {
    if (type === "Chromatic") {
      return key === "C" ? allScales.find(s => s.type === "Chromatic") : undefined;
    }
    return allScales.find(s => s.key === key && s.type === type);
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search keys or scale types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr className="bg-muted/50">
              <th className="sticky left-0 z-10 px-4 py-2 text-left text-xs font-medium text-muted-foreground bg-muted/50 border-r">Key</th>
              {filteredTypes.map(type => (
                <th key={type} className="px-4 py-2 text-center text-xs font-medium text-muted-foreground min-w-[120px]">
                  {type.replace(' Minor', ' Min').replace(' Major', ' Maj').replace(' Arpeggio', ' Arp')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredKeys.map(key => (
              <tr key={key} className="hover:bg-accent/50 transition-colors">
                <td className="sticky left-0 z-10 px-4 py-2 whitespace-nowrap text-sm font-medium bg-card border-r">
                  {key}
                </td>
                {filteredTypes.map(type => {
                  const item = getScaleItem(key, type);
                  if (type === "Chromatic" && key !== "C") return <td key={type} className="px-4 py-2"></td>;
                  if (!item) return <td key={type} className="px-4 py-2"></td>;

                  const status = getOverallStatus(item, scaleMasteryBPMMap);
                  const statusText = status === 'mastered' ? 'Fully Mastered' : status === 'practiced' ? 'In Progress' : 'Untouched';

                  return (
                    <td key={type} className="px-4 py-2">
                      <ScaleDetailDialog scaleItem={item}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <ScaleCell item={item} status={status} />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-bold">{item.key} {item.type}</p>
                            <p>Status: <span className={cn(status === 'mastered' ? 'text-success' : status === 'practiced' ? 'text-warning' : 'text-muted-foreground')}>{statusText}</span></p>
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
      {filteredKeys.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">No results found for "{searchQuery}"</p>
      )}
    </div>
  );
};

export default ScaleGrid;