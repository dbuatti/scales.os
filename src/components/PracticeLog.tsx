import React from 'react';
import { useScales } from '../context/ScalesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Target } from 'lucide-react';

const PracticeLog = () => {
  const { log, allScales, allDohnanyi, allHanon } = useScales();

  if (log.length === 0) {
    return (
      <Card className="border-primary/50 shadow-lg shadow-primary/20 bg-card/70">
        <CardHeader>
          <CardTitle className="font-mono text-primary">Practice History</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <Clock className="w-16 h-16 text-muted-foreground/50" />
          <p className="text-lg text-muted-foreground font-mono">No sessions logged yet.</p>
          <p className="text-sm text-primary/70">Start the timer or save a snapshot from the Command Centre to see your history here!</p>
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
    <Card className="border-primary/50 shadow-lg shadow-primary/20 bg-card/70">
      <CardHeader>
        <CardTitle className="font-mono text-primary">Practice History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-4 pr-4">
            {log.map(entry => (
              <div key={entry.id} className="border-b pb-4 last:border-b-0 last:pb-0 border-primary/20">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-lg text-primary">
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
                    {entry.itemsPracticed.map((item, index) => {
                      return (
                      <Badge key={index} variant="secondary" className="flex flex-col items-start p-2 h-auto text-left bg-secondary/70 border-primary/30">
                        {item.type === 'scale' && item.scaleId && (
                            <>
                                <span className="font-bold text-primary">{scaleMap[item.scaleId] || item.scaleId}</span>
                                <span className="text-xs font-normal mt-1 text-foreground/80">
                                    BPM: {item.practicedBPM || 'N/A'} | Art: {item.articulation} | Octaves: {item.octaves?.split(' ')[0]}
                                </span>
                                <span className="text-xs font-normal text-foreground/80">
                                    Dir: {item.direction} | Hands: {item.handConfig}
                                </span>
                                <span className="text-xs font-normal text-foreground/80">
                                    Rhythm: {item.rhythm} | Accent: {item.accent}
                                </span>
                            </>
                        )}
                        {item.type === 'dohnanyi' && item.dohnanyiName && (
                            <>
                                <span className="font-bold text-primary">{item.dohnanyiName}</span>
                                <span className="text-xs font-normal mt-1 text-foreground/80">
                                    Logged BPM: {item.bpmTarget || 'N/A'}
                                </span>
                            </>
                        )}
                        {item.type === 'hanon' && item.hanonName && (
                            <>
                                <span className="font-bold text-primary">{item.hanonName}</span>
                                <span className="text-xs font-normal mt-1 text-foreground/80">
                                    Logged BPM: {item.hanonBpmTarget || 'N/A'}
                                </span>
                            </>
                        )}
                      </Badge>
                    )})}
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