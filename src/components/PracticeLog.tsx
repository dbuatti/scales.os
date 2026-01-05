import React from 'react';
import { useScales } from '../context/ScalesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

const PracticeLog = () => {
  const { log, allScales, allDohnanyi, allHanon } = useScales();

  if (log.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Practice History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No sessions logged yet. Start the timer or save a snapshot!</p>
        </CardContent>
      </Card>
    );
  }

  const scaleMap = allScales.reduce((acc, scale) => {
    acc[scale.id] = `${scale.key} ${scale.type}`;
    return acc;
  }, {} as Record<string, string>);
  
  const dohnanyiMap = allDohnanyi.reduce((acc, item) => {
    acc[item.id] = item.name;
    return acc;
  }, {} as Record<string, string>);
  
  const hanonMap = allHanon.reduce((acc, item) => {
    acc[item.id] = item.name;
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
                    {entry.durationMinutes > 0 
                        ? `${entry.durationMinutes} minutes of focused practice`
                        : 'Practice Snapshot Log'}
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

                {entry.itemsPracticed.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.itemsPracticed.map((item, index) => (
                      <Badge key={index} variant="secondary" className="flex flex-col items-start p-2 h-auto text-left">
                        {item.type === 'scale' && item.scaleId && (
                            <>
                                <span className="font-bold">{scaleMap[item.scaleId] || item.scaleId}</span>
                                <span className="text-xs font-normal mt-1">
                                    Art: {item.articulation} | Tempo: {item.tempo?.split(' ')[0]} | Octaves: {item.octaves?.split(' ')[0]}
                                </span>
                                <span className="text-xs font-normal">
                                    Dir: {item.direction} | Hands: {item.handConfig}
                                </span>
                                <span className="text-xs font-normal">
                                    Rhythm: {item.rhythm} | Accent: {item.accent}
                                </span>
                            </>
                        )}
                        {item.type === 'dohnanyi' && item.dohnanyiName && (
                            <>
                                <span className="font-bold text-primary">{item.dohnanyiName}</span>
                                <span className="text-xs font-normal mt-1">
                                    Logged BPM: {item.bpmTarget}
                                </span>
                            </>
                        )}
                        {item.type === 'hanon' && item.hanonName && (
                            <>
                                <span className="font-bold text-primary">{item.hanonName}</span>
                                <span className="text-xs font-normal mt-1">
                                    Logged BPM: {item.hanonBpmTarget}
                                </span>
                            </>
                        )}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    General practice session logged. Specific progress tracked via Mastery Matrix/Grade Tracker.
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