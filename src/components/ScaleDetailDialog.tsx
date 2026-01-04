import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScaleItem, ARTICULATIONS, TEMPO_LEVELS, getPracticeId, Articulation, TempoLevel } from '@/lib/scales';
import { useScales, ScaleStatus } from '../context/ScalesContext';
import { cn } from '@/lib/utils';
import { Check, Clock, X } from 'lucide-react';

interface ScaleDetailDialogProps {
  scaleItem: ScaleItem;
  children: React.ReactNode;
}

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
  const { progress, updatePracticeStatus } = useScales();

  const handleToggleStatus = (articulation: Articulation, tempo: TempoLevel) => {
    const practiceId = getPracticeId(scaleItem.id, articulation, tempo);
    const currentStatus = progress[practiceId] || 'untouched';
    
    // Toggle logic: untouched/practiced -> mastered -> untouched
    const nextStatus: ScaleStatus = (currentStatus === 'untouched' || currentStatus === 'practiced') 
      ? 'mastered' 
      : 'untouched';
      
    updatePracticeStatus(practiceId, nextStatus);
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
                    const practiceId = getPracticeId(scaleItem.id, articulation, tempo);
                    const status = progress[practiceId] || 'untouched';
                    const statusText = status === 'mastered' ? 'Mastered' : status === 'practiced' ? 'Practiced' : 'Untouched';

                    return (
                      <td key={tempo} className="px-4 py-2">
                        <Button
                          onClick={() => handleToggleStatus(articulation, tempo)}
                          className={cn(
                            "w-full h-10 flex items-center justify-center rounded-md transition-colors duration-150",
                            getStatusClasses(status)
                          )}
                          size="sm"
                          aria-label={`${articulation} at ${tempo} status: ${statusText}. Click to toggle Mastered.`}
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
        <p className="text-sm text-muted-foreground mt-4">
          Click a cell to toggle its status between Mastered and Untouched. Statuses are automatically set to Practiced when logged via the timer.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ScaleDetailDialog;