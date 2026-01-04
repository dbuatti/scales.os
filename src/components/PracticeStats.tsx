import React, { useMemo } from 'react';
import { useScales, ScaleStatus } from '../context/ScalesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getPracticeId, ARTICULATIONS, TEMPO_LEVELS, ScaleItem, Articulation, TempoLevel } from '@/lib/scales';
import { Clock, Check, Target } from 'lucide-react';

const PracticeStats = () => {
  const { progress, log, allScales } = useScales();

  const stats = useMemo(() => {
    const totalCombinations = allScales.length * ARTICULATIONS.length * TEMPO_LEVELS.length;
    let masteredCount = 0;
    let practicedCount = 0;
    let untouchedCount = 0;
    let totalDurationMinutes = 0;

    // Calculate progress counts
    Object.values(progress).forEach(status => {
      if (status === 'mastered') {
        masteredCount++;
      } else if (status === 'practiced') {
        practicedCount++;
      } else {
        untouchedCount++;
      }
    });

    // Calculate total practice time
    totalDurationMinutes = log.reduce((sum, entry) => sum + entry.durationMinutes, 0);

    const completionPercentage = Math.round((masteredCount / totalCombinations) * 100);

    return {
      totalCombinations,
      masteredCount,
      practicedCount,
      untouchedCount,
      completionPercentage,
      totalDurationMinutes,
    };
  }, [progress, log, allScales]);

  // Logic to suggest the next scale: prioritize untouched scales
  const suggestedScale = useMemo(() => {
    const untouchedEntries: { scaleId: string, articulation: Articulation, tempo: TempoLevel }[] = [];

    allScales.forEach(scale => {
      ARTICULATIONS.forEach(articulation => {
        TEMPO_LEVELS.forEach(tempo => {
          const practiceId = getPracticeId(scale.id, articulation, tempo);
          if (progress[practiceId] === 'untouched') {
            untouchedEntries.push({ scaleId: scale.id, articulation, tempo });
          }
        });
      });
    });

    if (untouchedEntries.length > 0) {
      // Pick a random untouched combination
      const randomIndex = Math.floor(Math.random() * untouchedEntries.length);
      const suggestion = untouchedEntries[randomIndex];
      
      const scaleItem = allScales.find(s => s.id === suggestion.scaleId);
      if (scaleItem) {
        return {
          key: scaleItem.key,
          type: scaleItem.type,
          articulation: suggestion.articulation,
          tempo: suggestion.tempo,
        };
      }
    }
    
    // If everything is practiced/mastered, suggest a random practiced one for review
    if (stats.practicedCount > 0) {
        const practicedIds = Object.keys(progress).filter(id => progress[id] === 'practiced');
        const randomId = practicedIds[Math.floor(Math.random() * practicedIds.length)];
        
        // Reverse lookup to get details (simplified for brevity, assumes ID structure is reliable)
        const parts = randomId.split('-');
        const tempo = parts.pop() as TempoLevel;
        const articulation = parts.pop() as Articulation;
        const scaleId = parts.join('-');
        
        const scaleItem = allScales.find(s => s.id === scaleId);
        if (scaleItem) {
            return {
                key: scaleItem.key,
                type: scaleItem.type,
                articulation: articulation,
                tempo: tempo,
                review: true
            };
        }
    }

    return null;
  }, [progress, allScales, stats.practicedCount]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: Overall Progress */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Overall Mastery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm font-medium">
            <span>Mastery Progress</span>
            <span>{stats.completionPercentage}%</span>
          </div>
          <Progress value={stats.completionPercentage} className="h-3" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-xl font-bold mt-1">{stats.masteredCount}</span>
              <span className="text-xs text-muted-foreground">Mastered Combos</span>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-xl font-bold mt-1">{stats.practicedCount}</span>
              <span className="text-xs text-muted-foreground">Practiced Combos</span>
            </div>
            <div className="flex flex-col items-center">
              <Target className="w-5 h-5 text-red-600" />
              <span className="text-xl font-bold mt-1">{stats.untouchedCount}</span>
              <span className="text-xs text-muted-foreground">Untouched Combos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Next Focus */}
      <Card>
        <CardHeader>
          <CardTitle>Next Focus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestedScale ? (
            <div className="space-y-2">
              <p className="text-lg font-semibold">
                {suggestedScale.key} {suggestedScale.type}
              </p>
              <p className="text-sm text-muted-foreground">
                Articulation: <span className="font-medium text-foreground">{suggestedScale.articulation}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Tempo: <span className="font-medium text-foreground">{suggestedScale.tempo}</span>
              </p>
              {suggestedScale.review && (
                  <p className="text-xs text-yellow-600">
                      (Review suggested)
                  </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Congratulations! All combinations are mastered.
            </p>
          )}
          <div className="pt-2 border-t mt-4">
            <p className="text-xs text-muted-foreground">
              Total Practice Time: <span className="font-medium text-foreground">{stats.totalDurationMinutes} minutes</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PracticeStats;