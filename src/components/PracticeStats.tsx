import React, { useMemo } from 'react';
import { useScales, ScaleStatus } from '../context/ScalesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  getPracticeId, ARTICULATIONS, TEMPO_LEVELS, ScaleItem, Articulation, TempoLevel,
  DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS, OCTAVE_CONFIGURATIONS,
  DirectionType, HandConfiguration, RhythmicPermutation, AccentDistribution, OctaveConfiguration
} from '@/lib/scales';
import { Clock, Check, Target } from 'lucide-react';

const PracticeStats = () => {
  const { progressMap, log, allScales } = useScales();

  const stats = useMemo(() => {
    const totalCombinations = allScales.length * ARTICULATIONS.length * TEMPO_LEVELS.length * DIRECTION_TYPES.length * HAND_CONFIGURATIONS.length * RHYTHMIC_PERMUTATIONS.length * ACCENT_DISTRIBUTIONS.length * OCTAVE_CONFIGURATIONS.length;
    let masteredCount = 0;
    let practicedCount = 0;
    let totalDurationMinutes = 0;

    // Calculate progress counts by iterating over the sparse map
    Object.values(progressMap).forEach(status => {
      if (status === 'mastered') {
        masteredCount++;
      } else if (status === 'practiced') {
        practicedCount++;
      }
    });
    
    // Calculate untouched count based on total combinations
    const untouchedCount = totalCombinations - masteredCount - practicedCount;

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
  }, [progressMap, log, allScales]);

  // Logic to suggest the next scale: prioritize progression
  const suggestedScale = useMemo(() => {
    const allCombinations: { 
        scaleId: string, 
        articulation: Articulation, 
        tempo: TempoLevel,
        direction: DirectionType,
        handConfig: HandConfiguration,
        rhythm: RhythmicPermutation,
        accent: AccentDistribution,
        octaves: OctaveConfiguration,
        status: ScaleStatus,
        practiceId: string
    }[] = [];

    // 1. Generate ALL possible combinations and their current status
    allScales.forEach(scale => {
      ARTICULATIONS.forEach(articulation => {
        TEMPO_LEVELS.forEach(tempo => {
          DIRECTION_TYPES.forEach(direction => {
            HAND_CONFIGURATIONS.forEach(handConfig => {
              RHYTHMIC_PERMUTATIONS.forEach(rhythm => {
                ACCENT_DISTRIBUTIONS.forEach(accent => {
                  OCTAVE_CONFIGURATIONS.forEach(octaves => {
                    const practiceId = getPracticeId(scale.id, articulation, tempo, direction, handConfig, rhythm, accent, octaves);
                    const status: ScaleStatus = progressMap[practiceId] || 'untouched';
                    allCombinations.push({ scaleId: scale.id, articulation, tempo, direction, handConfig, rhythm, accent, octaves, status, practiceId });
                  });
                });
              });
            });
          });
        });
      });
    });

    // 2. Prioritize: Practiced -> Mastered (Focus on existing work)
    const practicedButNotMastered = allCombinations.filter(c => c.status === 'practiced');
    if (practicedButNotMastered.length > 0) {
      // Pick a random practiced combination to push for mastery
      const randomIndex = Math.floor(Math.random() * practicedButNotMastered.length);
      const suggestion = practicedButNotMastered[randomIndex];
      
      const scaleItem = allScales.find(s => s.id === suggestion.scaleId);
      if (scaleItem) {
        return {
          key: scaleItem.key,
          type: scaleItem.type,
          articulation: suggestion.articulation,
          tempo: suggestion.tempo,
          direction: suggestion.direction,
          handConfig: suggestion.handConfig,
          rhythm: suggestion.rhythm,
          accent: suggestion.accent,
          octaves: suggestion.octaves,
          review: true,
          goal: "Achieve Mastery (Mastered status)",
        };
      }
    }

    // 3. Secondary Priority: Untouched, focusing on core elements (Key, Tempo, Legato, 2 Octaves)
    const untouchedEntries = allCombinations.filter(c => c.status === 'untouched');
    if (untouchedEntries.length > 0) {
      // Filter for Legato, Slowest Tempo, 2 Octaves (Standard)
      const coreFocusEntries = untouchedEntries.filter(c => 
        c.articulation === ARTICULATIONS[0] && // Legato
        c.tempo === TEMPO_LEVELS[0] && // Slow
        c.octaves === OCTAVE_CONFIGURATIONS[1] // 2 Octaves
      );
      
      let suggestion;
      if (coreFocusEntries.length > 0) {
        // Pick a random core focus entry
        const randomIndex = Math.floor(Math.random() * coreFocusEntries.length);
        suggestion = coreFocusEntries[randomIndex];
      } else {
        // Fallback: Pick a random untouched entry
        const randomIndex = Math.floor(Math.random() * untouchedEntries.length);
        suggestion = untouchedEntries[randomIndex];
      }
      
      const scaleItem = allScales.find(s => s.id === suggestion.scaleId);
      if (scaleItem) {
        return {
          key: scaleItem.key,
          type: scaleItem.type,
          articulation: suggestion.articulation,
          tempo: suggestion.tempo,
          direction: suggestion.direction,
          handConfig: suggestion.handConfig,
          rhythm: suggestion.rhythm,
          accent: suggestion.accent,
          octaves: suggestion.octaves,
          review: false,
          goal: "Initial Practice (Practiced status)",
        };
      }
    }
    
    // If everything is mastered, return null
    return null;
  }, [progressMap, allScales]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: Overall Progress */}
      <Card className="md:col-span-2 border-primary/50 shadow-lg shadow-primary/20">
        <CardHeader>
          <CardTitle className="font-mono text-primary">Overall Mastery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm font-mono font-medium">
            <span>Mastery Completion</span>
            <span className="text-primary">{stats.completionPercentage}%</span>
          </div>
          <Progress value={stats.completionPercentage} className="h-3 [&>div]:bg-primary" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-xl font-bold mt-1 font-mono">{stats.masteredCount}</span>
              <span className="text-xs text-muted-foreground font-mono">Mastered Combos</span>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-xl font-bold mt-1 font-mono">{stats.practicedCount}</span>
              <span className="text-xs text-muted-foreground font-mono">Practiced Combos</span>
            </div>
            <div className="flex flex-col items-center">
              <Target className="w-5 h-5 text-destructive" />
              <span className="text-xl font-bold mt-1 font-mono">{stats.untouchedCount}</span>
              <span className="text-xs text-muted-foreground font-mono">Untouched Combos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Next Focus */}
      <Card className="border-primary/50 shadow-lg shadow-primary/20">
        <CardHeader>
          <CardTitle className="font-mono text-primary">Next Focus Target</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestedScale ? (
            <div className="space-y-2 font-mono text-sm">
              <p className="text-lg font-semibold text-primary">
                {suggestedScale.key} {suggestedScale.type}
              </p>
              <p className="text-sm font-bold text-yellow-400 mb-2">
                GOAL: {suggestedScale.goal}
              </p>
              <p className="text-muted-foreground">
                Articulation: <span className="font-medium text-foreground">{suggestedScale.articulation}</span>
              </p>
              <p className="text-muted-foreground">
                Tempo: <span className="font-medium text-foreground">{suggestedScale.tempo}</span>
              </p>
              <p className="text-muted-foreground">
                Octaves: <span className="font-medium text-foreground">{suggestedScale.octaves}</span>
              </p>
              <p className="text-muted-foreground">
                Direction: <span className="font-medium text-foreground">{suggestedScale.direction}</span>
              </p>
              <p className="text-muted-foreground">
                Hands: <span className="font-medium text-foreground">{suggestedScale.handConfig}</span>
              </p>
              <p className="text-muted-foreground">
                Rhythm: <span className="font-medium text-foreground">{suggestedScale.rhythm}</span>
              </p>
              <p className="text-muted-foreground">
                Accent: <span className="font-medium text-foreground">{suggestedScale.accent}</span>
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground font-mono">
              Congratulations! All combinations are mastered.
            </p>
          )}
          <div className="pt-2 border-t border-border mt-4">
            <p className="text-xs text-muted-foreground font-mono">
              Total Practice Time: <span className="font-medium text-primary">{stats.totalDurationMinutes} minutes</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PracticeStats;