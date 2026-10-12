import React from 'react';
import { useScales } from '@/context/ScalesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, History } from 'lucide-react';
import { cn, getCategoryColorClasses } from '@/lib/utils';

const PracticeLog = () => {
  const { log, allScales, allDohnanyi, allHanon } = useScales();

  if (log.length === 0) {
    return (
      <Card className="border border-border/60 bg-card/50 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-border/60 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <History className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-bold">Practice History</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Clock className="h-6 w-6" />
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            No sessions logged yet. Your completed practice sessions will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const scaleMap = allScales.reduce((acc, scale) => {
    acc[scale.id] = `${scale.key} ${scale.type}`;
    return acc;
  }, {} as Record<string, string>);
  
  return (
    <Card className="border border-border/60 bg-card/50 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-border/60 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <History className="h-5 w-5" />
        </div>
        <CardTitle className="text-sm font-bold">Practice History</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-6 pr-4">
            {log.map(entry => (
              <div key={entry.id} className="border-b border-border/60 pb-6 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-foreground">
                    {entry.durationMinutes > 0 
                        ? `${entry.durationMinutes}m Focused Session`
                        : 'Practice Snapshot'}
                  </p>
                  <span className="text-xs text-muted-foreground tabular-nums">
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
                    {entry.itemsPracticed.map((item, index) => {
                      const category = item.type === 'scale' 
                        ? (scaleMap[item.scaleId || ''] || 'scale') 
                        : item.type;
                      
                      return (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className={cn(
                            "flex flex-col items-start p-3 h-auto text-left border",
                            getCategoryColorClasses(category)
                          )}
                        >
                          {item.type === 'scale' && item.scaleId && (
                              <>
                                  <span className="font-bold mb-1">{scaleMap[item.scaleId] || item.scaleId}</span>
                                  <div className="text-[10px] tabular-nums opacity-70 space-y-0.5">
                                      <p>{item.practicedBPM} BPM • {item.articulation?.split(' ')[0]}</p>
                                      <p>{item.handConfig?.split(' ')[0]} • {item.octaves?.split(' ')[0]}</p>
                                  </div>
                              </>
                          )}
                          {(item.type === 'dohnanyi' || item.type === 'hanon') && (
                              <>
                                  <span className="font-bold mb-1">{item.dohnanyiName || item.hanonName}</span>
                                  <p className="text-[10px] tabular-nums opacity-70">
                                      {item.bpmTarget || item.hanonBpmTarget} BPM
                                  </p>
                              </>
                          )}
                        </Badge>
                      );
                    })}
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
