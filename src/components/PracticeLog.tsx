import React from 'react';
import { useScales } from '../context/ScalesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

const PracticeLog = () => {
  const { log, allScales } = useScales();

  if (log.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Practice History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No sessions logged yet. Start the timer!</p>
        </CardContent>
      </Card>
    );
  }

  const scaleMap = allScales.reduce((acc, scale) => {
    acc[scale.id] = `${scale.key} ${scale.type}`;
    return acc;
  }, {} as Record<string, string>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Practice History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-4 pr-4">
            {log.map(entry => (
              <div key={entry.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-lg">
                    {entry.durationMinutes} minutes of focused practice
                  </p>
                  <span className="text-sm text-muted-foreground">
                    {format(entry.timestamp, 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                
                {entry.notes && (
                  <p className="text-sm mt-1 italic text-foreground/80">
                    Notes: {entry.notes}
                  </p>
                )}

                {entry.scalesPracticed.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.scalesPracticed.map((item, index) => (
                      <Badge key={index} variant="secondary" className="flex flex-col items-start p-2 h-auto">
                        <span className="font-bold">{scaleMap[item.scaleId] || item.scaleId}</span>
                        <span className="text-xs font-normal">{item.articulation} @ {item.tempo}</span>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    General practice session logged. Specific scale progress tracked via Mastery Matrix.
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PracticeLog;