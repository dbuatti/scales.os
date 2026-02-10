import React from 'react';
import { useScales } from '@/context/ScalesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Target, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const PracticeLog = () => {
  const { log, allScales, allDohnanyi, allHanon } = useScales();

  if (log.length === 0) {
    return (
      <Card className="border-2 border-primary/10 shadow-lg bg-card relative overflow-hidden">
        <div className="crt-overlay" />
        <CardHeader className="p-4 border-b border-primary/10 relative z-10">
          <CardTitle className="font-mono text-primary text-lg flex items-center">
            <History className="w-5 h-5 mr-2 text-primary/70" /> Practice History
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4 relative z-10">
          <Clock className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground font-mono">No sessions logged yet.</p>
        </CardContent>
      </Card>
    );
  }

  const scaleMap = allScales.reduce((acc, scale) => {
    acc[scale.id] = `${scale.key} ${scale.type}`;
    return acc;
  }, {} as Record<string, string>);
  
  return (
    <Card className="border-2 border-primary/10 shadow-lg bg-card relative overflow-hidden">
      <div className="crt-overlay" />
      <CardHeader className="p-4 border-b border-primary/10 relative z-10">
        <CardTitle className="font-mono text-primary text-lg flex items-center">
          <History className="w-5 h-5 mr-2 text-primary/70" /> Practice History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 relative z-10">
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-6 pr-4">
            {log.map(entry => (
              <div key={entry.id} className="border-b pb-6 last:border-b-0 last:pb-0 border-primary/5">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-primary">
                    {entry.durationMinutes > 0 
                        ? `${entry.durationMinutes}m Focused Session`
                        : 'Practice Snapshot'}
                  </p>
                  <span className="text-xs text-muted-foreground font-mono">
                    {format(entry.timestamp, 'MMM dd, HH:mm')}
                  </span>
                </div>
                
                {entry.notes && (
                  <p className="text-sm mb-3 text-muted-foreground italic">
                    "{entry.notes}"
                  </p>
                )}

                {entry.itemsPracticed.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {entry.itemsPracticed.map((item, index) => (
                      <Badge key={index} variant="secondary" className="flex flex-col items-start p-3 h-auto text-left bg-secondary/50 border-primary/5">
                        {item.type === 'scale' && item.scaleId && (
                            <>
                                <span className="font-bold text-primary mb-1">{scaleMap[item.scaleId] || item.scaleId}</span>
                                <div className="text-[10px] font-mono text-muted-foreground space-y-0.5">
                                    <p>{item.practicedBPM} BPM • {item.articulation?.split(' ')[0]}</p>
                                    <p>{item.handConfig?.split(' ')[0]} • {item.octaves?.split(' ')[0]}</p>
                                </div>
                            </>
                        )}
                        {(item.type === 'dohnanyi' || item.type === 'hanon') && (
                            <>
                                <span className="font-bold text-primary mb-1">{item.dohnanyiName || item.hanonName}</span>
                                <p className="text-[10px] font-mono text-muted-foreground">
                                    {item.bpmTarget || item.hanonBpmTarget} BPM
                                </p>
                            </>
                        )}
                      </Badge>
                    ))}
                  </div>
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