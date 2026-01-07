import React from 'react';
import { useScales } from '../context/ScalesContext';
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
      <Card className="border-4 border-primary/80 shadow-2xl shadow-primary/40 bg-card/95 relative overflow-hidden">
        {/* Subtle CRT glow overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        </div>
        <CardHeader className="p-4 border-b-2 border-primary/50 relative z-10">
          <CardTitle className="font-mono text-primary text-xl text-glow flex items-center">
            <History className="w-6 h-6 mr-2 text-primary/70" /> Practice History
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4 relative z-10">
          <Clock className="w-16 h-16 text-muted-foreground/50 text-glow" />
          <p className="text-lg text-muted-foreground font-mono text-primary/70">No sessions logged yet.</p>
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
    <Card className="border-4 border-primary/80 shadow-2xl shadow-primary/40 bg-card/95 relative overflow-hidden">
      {/* Subtle CRT glow overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      </div>
      <CardHeader className="p-4 border-b-2 border-primary/50 relative z-10">
        <CardTitle className="font-mono text-primary text-xl text-glow flex items-center">
          <History className="w-6 h-6 mr-2 text-primary/70" /> Practice History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 relative z-10">
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-4 pr-4">
            {log.map(entry => (
              <div key={entry.id} className="border-b pb-4 last:border-b-0 last:pb-0 border-primary/20">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-lg text-primary text-glow">
                    {entry.durationMinutes > 0 
                        ? `${entry.durationMinutes} minutes of focused practice`
                        : 'Practice Snapshot Log'}
                  </p>
                  <span className="text-sm text-muted-foreground text-primary/70">
                    {format(entry.timestamp, 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                
                {entry.notes && (
                  <p className="text-sm mt-1 italic text-foreground/80 text-primary/80">
                    Notes: {entry.notes}
                  </p>
                )}

                {entry.itemsPracticed.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.itemsPracticed.map((item, index) => {
                      return (
                      <Badge key={index} variant="secondary" className="flex flex-col items-start p-2 h-auto text-left bg-secondary/70 border-primary/30 shadow-sm">
                        {item.type === 'scale' && item.scaleId && (
                            <>
                                <span className="font-bold text-primary text-glow">{scaleMap[item.scaleId] || item.scaleId}</span>
                                <div className="text-xs font-normal mt-1 text-foreground/80 text-primary/70 space-y-0.5">
                                    <p>BPM: {item.practicedBPM || 'N/A'}</p>
                                    <p>Art: {item.articulation?.split(' ')[0] || 'N/A'} | Oct: {item.octaves?.split(' ')[0] || 'N/A'}</p>
                                    <p>Dir: {item.direction?.split(' ')[0] || 'N/A'} | Hands: {item.handConfig?.split(' ')[0] || 'N/A'}</p>
                                    <p>Rhythm: {item.rhythm?.split(' ')[0] || 'N/A'} | Accent: {item.accent?.split(' ')[0] || 'N/A'}</p>
                                </div>
                            </>
                        )}
                        {item.type === 'dohnanyi' && item.dohnanyiName && (
                            <>
                                <span className="font-bold text-primary text-glow">{item.dohnanyiName}</span>
                                <p className="text-xs font-normal mt-1 text-foreground/80 text-primary/70">
                                    Logged BPM: {item.bpmTarget || 'N/A'}
                                </p>
                            </>
                        )}
                        {item.type === 'hanon' && item.hanonName && (
                            <>
                                <span className="font-bold text-primary text-glow">{item.hanonName}</span>
                                <p className="text-xs font-normal mt-1 text-foreground/80 text-primary/70">
                                    Logged BPM: {item.hanonBpmTarget || 'N/A'}
                                </p>
                            </>
                        )}
                      </Badge>
                    )})}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2 text-primary/70">
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