import React from 'react';
import { useScales, ScaleStatus } from '../context/ScalesContext';
import { KEYS, SCALE_TYPES, ARPEGGIO_TYPES, ScaleItem } from '@/lib/scales';
import { cn } from '@/lib/utils';
import { Check, X, Clock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const ScaleCell: React.FC<{ item: ScaleItem; status: ScaleStatus; updateStatus: (status: ScaleStatus) => void }> = ({ item, status, updateStatus }) => {
  const nextStatus = (current: ScaleStatus): ScaleStatus => {
    if (current === 'untouched' || current === 'practiced') return 'mastered';
    return 'untouched';
  };

  const handleClick = () => {
    updateStatus(nextStatus(status));
  };

  const statusText = status === 'mastered' ? 'Mastered' : status === 'practiced' ? 'Practiced' : 'Untouched';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className={cn(
            "w-full h-10 flex items-center justify-center rounded-md transition-colors duration-150",
            getStatusClasses(status)
          )}
          aria-label={`${item.key} ${item.type} status: ${statusText}. Click to toggle.`}
        >
          {getStatusIcon(status)}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{item.key} {item.type}</p>
        <p>Status: {statusText}</p>
        <p className="text-xs text-muted-foreground">Click to toggle Mastered/Untouched</p>
      </TooltipContent>
    </Tooltip>
  );
};

const ScaleGrid = () => {
  const { allScales, progress, updateScaleStatus } = useScales();

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

                const status = progress[item.id] || 'untouched';

                return (
                  <td key={type} className="px-4 py-2">
                    <ScaleCell
                      item={item}
                      status={status}
                      updateStatus={(newStatus) => updateScaleStatus(item.id, newStatus)}
                    />
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