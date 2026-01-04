import React, { useMemo } from 'react';
import { useScales, ScaleStatus } from '../context/ScalesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  getPracticeId, ARTICULATIONS, TEMPO_LEVELS, ScaleItem, Articulation, TempoLevel,
  DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS, OCTAVE_CONFIGURATIONS,
  DirectionType, HandConfiguration, RhythmicPermutation, AccentDistribution, OctaveConfiguration,
  PRACTICE_GRADES, DOHNANYI_BPM_TARGETS, DOHNANYI_EXERCISES, getDohnanyiPracticeId, ALL_SCALE_ITEMS,
  KEYS, SCALE_TYPES, ARPEGGIO_TYPES
} from '@/lib/scales';
import { Clock, Check, Target } from 'lucide-react';

// Helper function to determine the required practice IDs for a specific grade (1-9)
const getRequiredPracticeIdsForGrade = (gradeId: number): string[] => {
    const requiredIds: string[] = [];
    
    // Helper to generate scale IDs based on parameters
    const generateScaleIds = (
        keys: readonly string[], 
        types: readonly string[], 
        articulations: readonly string[], 
        tempo: string, 
        octaves: string,
        direction: string,
        handConfig: string,
        rhythm: string,
        accent: string,
    ) => {
        keys.forEach(key => {
            types.forEach(type => {
                if (type === "Chromatic" && key !== "C") return;
                
                const scaleId = `${key}-${type.replace(/\s/g, "")}`;
                
                articulations.forEach(articulation => {
                    requiredIds.push(getPracticeId(
                        scaleId, 
                        articulation as typeof ARTICULATIONS[number], 
                        tempo as typeof TEMPO_LEVELS[number], 
                        direction as typeof DIRECTION_TYPES[number],
                        handConfig as typeof HAND_CONFIGURATIONS[number],
                        rhythm as typeof RHYTHMIC_PERMUTATIONS[number],
                        accent as typeof ACCENT_DISTRIBUTIONS[number],
                        octaves as typeof OCTAVE_CONFIGURATIONS[number]
                    ));
                });
            });
        });
    };

    const ALL_KEYS = KEYS;
    const MAJOR_MINOR_ARP = [ARPEGGIO_TYPES[0], ARPEGGIO_TYPES[1]];
    const MAJOR_MINOR_SCALES = [SCALE_TYPES[0], SCALE_TYPES[1]];
    const ALL_TYPES = [...SCALE_TYPES, ...ARPEGGIO_TYPES];
    
    if (gradeId >= 1) {
        generateScaleIds(
            ["C"], MAJOR_MINOR_ARP, [ARTICULATIONS[0]], TEMPO_LEVELS[0], OCTAVE_CONFIGURATIONS[0],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[1], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3]
        );
    }
    if (gradeId >= 2) {
        generateScaleIds(
            ALL_KEYS, MAJOR_MINOR_ARP, [ARTICULATIONS[0]], TEMPO_LEVELS[0], OCTAVE_CONFIGURATIONS[1],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[1], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3]
        );
    }
    if (gradeId >= 3) {
        generateScaleIds(
            ALL_KEYS, MAJOR_MINOR_ARP, [ARTICULATIONS[0]], TEMPO_LEVELS[1], OCTAVE_CONFIGURATIONS[1],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3]
        );
    }
    if (gradeId >= 4) {
        generateScaleIds(
            ALL_KEYS, MAJOR_MINOR_SCALES, [ARTICULATIONS[0]], TEMPO_LEVELS[1], OCTAVE_CONFIGURATIONS[1],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3]
        );
    }
    if (gradeId >= 5) {
        generateScaleIds(
            ALL_KEYS, MAJOR_MINOR_SCALES, [ARTICULATIONS[1], ARTICULATIONS[2]], TEMPO_LEVELS[1], OCTAVE_CONFIGURATIONS[1],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3]
        );
    }
    if (gradeId >= 6) {
        generateScaleIds(
            ALL_KEYS, MAJOR_MINOR_SCALES, [ARTICULATIONS[0]], TEMPO_LEVELS[2], OCTAVE_CONFIGURATIONS[2],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3]
        );
    }
    if (gradeId >= 7) {
        // Note: We must iterate over rhythmic permutations here, as generateScaleIds expects a single string for rhythm
        [RHYTHMIC_PERMUTATIONS[1], RHYTHMIC_PERMUTATIONS[3]].forEach(rhythm => {
            generateScaleIds(
                ALL_KEYS, MAJOR_MINOR_SCALES, [ARTICULATIONS[0]], TEMPO_LEVELS[1], OCTAVE_CONFIGURATIONS[1],
                DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], rhythm, ACCENT_DISTRIBUTIONS[3]
            );
        });
    } else if (gradeId >= 7) {
        // Fallback for Grade 7 if the loop above is skipped
        generateScaleIds(
            ALL_KEYS, MAJOR_MINOR_SCALES, [ARTICULATIONS[0]], TEMPO_LEVELS[1], OCTAVE_CONFIGURATIONS[1],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3]
        );
    }
    if (gradeId >= 8) {
        generateScaleIds(
            ALL_KEYS, ALL_TYPES, [ARTICULATIONS[0]], TEMPO_LEVELS[2], OCTAVE_CONFIGURATIONS[3],
            DIRECTION_TYPES[3], HAND_CONFIGURATIONS[2], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[1]
        );
    }
    if (gradeId >= 9) {
        generateScaleIds(
            ALL_KEYS, ALL_TYPES, [ARTICULATIONS[0]], TEMPO_LEVELS[3], OCTAVE_CONFIGURATIONS[3],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3]
        );
    }
    
    if (gradeId >= 10) {
        DOHNANYI_EXERCISES.forEach(exercise => {
            DOHNANYI_BPM_TARGETS.forEach(bpm => {
                requiredIds.push(getDohnanyiPracticeId(exercise, bpm));
            });
        });
    }

    return Array.from(new Set(requiredIds));
};


const PracticeStats = () => {
  const { progressMap, log, allScales, allDohnanyiCombinations } = useScales();

  const stats = useMemo(() => {
    
    // We calculate completion percentage based on the total number of required steps for Grade 10.
    const allGrade10Ids = getRequiredPracticeIdsForGrade(10);
    const totalGrade10Required = allGrade10Ids.length;
    
    let masteredGrade10Count = 0;
    let practicedGrade10Count = 0;
    
    allGrade10Ids.forEach(id => {
        const status = progressMap[id] || 'untouched';
        if (status === 'mastered') {
            masteredGrade10Count++;
        } else if (status === 'practiced') {
            practicedGrade10Count++;
        }
    });
    
    const untouchedGrade10Count = totalGrade10Required - masteredGrade10Count - practicedGrade10Count;
    
    // Calculate total practice time
    const totalDurationMinutes = log.reduce((sum, entry) => sum + entry.durationMinutes, 0);

    const completionPercentage = totalGrade10Required > 0 ? Math.round((masteredGrade10Count / totalGrade10Required) * 100) : 0;

    return {
      totalCombinations: totalGrade10Required, // Use Grade 10 required steps as the total goal
      masteredCount: masteredGrade10Count,
      practicedCount: practicedGrade10Count,
      untouchedCount: untouchedGrade10Count,
      completionPercentage,
      totalDurationMinutes,
    };
  }, [progressMap, log, allScales, allDohnanyiCombinations]);

  // Logic to suggest the next focus based on the lowest incomplete grade
  const nextFocus = useMemo(() => {
    const nextGrade = PRACTICE_GRADES.find(grade => {
        const requiredIds = getRequiredPracticeIdsForGrade(grade.id);
        return requiredIds.some(id => progressMap[id] !== 'mastered');
    });

    if (!nextGrade) {
        return null; // All grades mastered
    }
    
    const requiredIds = getRequiredPracticeIdsForGrade(nextGrade.id);
    
    // Find the first ID in this grade that is not mastered
    const nextId = requiredIds.find(id => progressMap[id] !== 'mastered');
    
    if (!nextId) return null; // Should not happen if nextGrade is found

    // Determine if it's a Scale or Dohnányi exercise
    if (nextId.startsWith('DOHNANYI')) {
        const dohItem = allDohnanyiCombinations.find(c => c.id === nextId);
        if (dohItem) {
            return {
                type: 'Dohnanyi',
                name: dohItem.name,
                goal: `Master ${dohItem.name} at ${dohItem.bpm} BPM.`,
                grade: nextGrade.id,
            };
        }
    } else {
        // Scale combination
        // We need to parse the ID back into its components
        const parts = nextId.split('-');
        if (parts.length >= 8) {
            const scaleId = parts.slice(0, 2).join('-');
            const scaleItem = allScales.find(s => s.id === scaleId);
            
            if (scaleItem) {
                // Reconstruct parameters (this is fragile but necessary given the ID structure)
                const articulation = ARTICULATIONS.find(a => a.replace(/[\s\/\(\)]/g, "") === parts[2]);
                const tempo = TEMPO_LEVELS.find(t => t.replace(/[\s\/\(\)]/g, "") === parts[3]);
                const direction = DIRECTION_TYPES.find(d => d.replace(/[\s\/\(\)]/g, "") === parts[4]);
                const handConfig = HAND_CONFIGURATIONS.find(h => h.replace(/[\s\/\(\)]/g, "") === parts[5]);
                const rhythm = RHYTHMIC_PERMUTATIONS.find(r => r.replace(/[\s\/\(\)]/g, "") === parts[6]);
                const accent = ACCENT_DISTRIBUTIONS.find(a => a.replace(/[\s\/\(\)]/g, "") === parts[7]);
                const octaves = OCTAVE_CONFIGURATIONS.find(o => o.replace(/[\s\/\(\)]/g, "") === parts[8]);

                return {
                    type: 'Scale',
                    key: scaleItem.key,
                    scaleType: scaleItem.type,
                    articulation,
                    tempo,
                    direction,
                    handConfig,
                    rhythm,
                    accent,
                    octaves,
                    goal: `Achieve Mastery status for this combination.`,
                    grade: nextGrade.id,
                };
            }
        }
    }
    
    return { type: 'General', goal: `Continue working on Grade ${nextGrade.id}: ${nextGrade.description}`, grade: nextGrade.id };

  }, [progressMap, allScales, allDohnanyiCombinations]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: Overall Progress */}
      <Card className="md:col-span-2 border-primary/50 shadow-lg shadow-primary/20">
        <CardHeader>
          <CardTitle className="font-mono text-primary">Overall Mastery (Grade 10 Goal)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm font-mono font-medium">
            <span>Grade 10 Completion</span>
            <span className="text-primary">{stats.completionPercentage}%</span>
          </div>
          <Progress value={stats.completionPercentage} className="h-3 [&>div]:bg-primary" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-xl font-bold mt-1 font-mono">{stats.masteredCount}</span>
              <span className="text-xs text-muted-foreground font-mono">Mastered Steps</span>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-xl font-bold mt-1 font-mono">{stats.practicedCount}</span>
              <span className="text-xs text-muted-foreground font-mono">Practiced Steps</span>
            </div>
            <div className="flex flex-col items-center">
              <Target className="w-5 h-5 text-destructive" />
              <span className="text-xl font-bold mt-1 font-mono">{stats.untouchedCount}</span>
              <span className="text-xs text-muted-foreground font-mono">Remaining Steps</span>
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
          {nextFocus ? (
            <div className="space-y-2 font-mono text-sm">
              <p className="text-lg font-semibold text-primary">
                {nextFocus.type === 'Scale' ? `${nextFocus.key} ${nextFocus.scaleType}` : nextFocus.name}
              </p>
              <p className="text-sm font-bold text-yellow-400 mb-2">
                GRADE {nextFocus.grade} GOAL: {nextFocus.goal}
              </p>
              
              {nextFocus.type === 'Scale' && (
                <>
                  <p className="text-muted-foreground">
                    Articulation: <span className="font-medium text-foreground">{nextFocus.articulation}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Tempo Category: <span className="font-medium text-foreground">{nextFocus.tempo}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Octaves: <span className="font-medium text-foreground">{nextFocus.octaves}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Hands: <span className="font-medium text-foreground">{nextFocus.handConfig}</span>
                  </p>
                </>
              )}
              {nextFocus.type === 'General' && (
                <p className="text-muted-foreground italic">{nextFocus.goal}</p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground font-mono">
              Congratulations! All graded steps are mastered.
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