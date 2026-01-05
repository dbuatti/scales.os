import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
    PRACTICE_GRADES, getPracticeId, KEYS, SCALE_TYPES, ARPEGGIO_TYPES, ARTICULATIONS, TEMPO_LEVELS, 
    OCTAVE_CONFIGURATIONS, DIRECTION_TYPES, HAND_CONFIGURATIONS, RHYTHMIC_PERMUTATIONS, ACCENT_DISTRIBUTIONS, 
    DOHNANYI_EXERCISES, DOHNANYI_BPM_TARGETS, getDohnanyiPracticeId,
    HANON_EXERCISES, HANON_BPM_TARGETS, getHanonPracticeId
} from '@/lib/scales';
import { useScales } from '../context/ScalesContext';
import { cn } from '@/lib/utils';

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
                // Handle Chromatic scale exception (only C key)
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
    const MAJOR_MINOR_ARP = [ARPEGGIO_TYPES[0], ARPEGGIO_TYPES[1]]; // Major Arpeggio, Minor Arpeggio
    const MAJOR_MINOR_SCALES = [SCALE_TYPES[0], SCALE_TYPES[1]]; // Major, Harmonic Minor
    const ALL_TYPES = [...SCALE_TYPES, ...ARPEGGIO_TYPES];
    
    // Grade 1 requirements (C Major/Minor Arpeggios, 1 Octave, Slow, Legato, Hands Separately)
    if (gradeId >= 1) {
        generateScaleIds(
            ["C"], MAJOR_MINOR_ARP, [ARTICULATIONS[0]], TEMPO_LEVELS[0], OCTAVE_CONFIGURATIONS[0],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[1], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3]
        );
    }
    
    // Grade 2 requirements (All Keys Major/Minor Arpeggios, 2 Octaves, Slow, Legato, Hands Separately)
    if (gradeId >= 2) {
        generateScaleIds(
            ALL_KEYS, MAJOR_MINOR_ARP, [ARTICULATIONS[0]], TEMPO_LEVELS[0], OCTAVE_CONFIGURATIONS[1],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[1], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3]
        );
    }

    // Grade 3 requirements (Hands Together, Moderate Tempo)
    if (gradeId >= 3) {
        generateScaleIds(
            ALL_KEYS, MAJOR_MINOR_ARP, [ARTICULATIONS[0]], TEMPO_LEVELS[1], OCTAVE_CONFIGURATIONS[1],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3]
        );
    }

    // Grade 4 requirements (Introducing Scales)
    if (gradeId >= 4) {
        generateScaleIds(
            ALL_KEYS, MAJOR_MINOR_SCALES, [ARTICULATIONS[0]], TEMPO_LEVELS[1], OCTAVE_CONFIGURATIONS[1],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3]
        );
    }

    // Grade 5 requirements (Articulation Focus: Staccato/Portato)
    if (gradeId >= 5) {
        generateScaleIds(
            ALL_KEYS, MAJOR_MINOR_SCALES, [ARTICULATIONS[1], ARTICULATIONS[2]], TEMPO_LEVELS[1], OCTAVE_CONFIGURATIONS[1],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3]
        );
    }

    // Grade 6 requirements (Tempo & Range: Fast, 3 Octaves)
    if (gradeId >= 6) {
        generateScaleIds(
            ALL_KEYS, MAJOR_MINOR_SCALES, [ARTICULATIONS[0]], TEMPO_LEVELS[2], OCTAVE_CONFIGURATIONS[2],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3]
        );
    }

    // Grade 7 requirements (Rhythmic Complexity: Dotted/Grouped 3s)
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

    // Grade 8 requirements (Advanced Permutations: Contrary Motion, Accent every 3, 4 Octaves)
    if (gradeId >= 8) {
        generateScaleIds(
            ALL_KEYS, ALL_TYPES, [ARTICULATIONS[0]], TEMPO_LEVELS[2], OCTAVE_CONFIGURATIONS[3],
            DIRECTION_TYPES[3], HAND_CONFIGURATIONS[2], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[1]
        );
    }

    // Grade 9 requirements (Professional Speed: 130 BPM equivalent)
    if (gradeId >= 9) {
        generateScaleIds(
            ALL_KEYS, ALL_TYPES, [ARTICULATIONS[0]], TEMPO_LEVELS[3], OCTAVE_CONFIGURATIONS[3],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3]
        );
    }
    
    // Grade 10 includes all Dohnányi mastery steps AND Hanon mastery steps
    if (gradeId >= 10) {
        DOHNANYI_EXERCISES.forEach(exercise => {
            DOHNANYI_BPM_TARGETS.forEach(bpm => {
                requiredIds.push(getDohnanyiPracticeId(exercise, bpm));
            });
        });
        
        HANON_EXERCISES.forEach(exercise => {
            HANON_BPM_TARGETS.forEach(bpm => {
                requiredIds.push(getHanonPracticeId(exercise, bpm));
            });
        });
    }

    // Filter out duplicates and return
    return Array.from(new Set(requiredIds));
};

const GradeTracker: React.FC = () => {
    const { progressMap, allDohnanyiCombinations } = useScales();

    const gradeStats = useMemo(() => {
        const stats = PRACTICE_GRADES.map(grade => {
            
            // For Grade 10, we calculate based on the union of all required IDs from Grades 1-9 + Dohnanyi/Hanon mastery steps.
            if (grade.id === 10) {
                const allRequiredIds = new Set<string>();
                PRACTICE_GRADES.slice(0, 9).forEach(g => {
                    getRequiredPracticeIdsForGrade(g.id).forEach(id => allRequiredIds.add(id));
                });
                DOHNANYI_EXERCISES.forEach(exercise => {
                    DOHNANYI_BPM_TARGETS.forEach(bpm => {
                        allRequiredIds.add(getDohnanyiPracticeId(exercise, bpm));
                    });
                });
                HANON_EXERCISES.forEach(exercise => {
                    HANON_BPM_TARGETS.forEach(bpm => {
                        allRequiredIds.add(getHanonPracticeId(exercise, bpm));
                    });
                });
                
                const totalGrade10Required = allRequiredIds.size;
                let masteredCount10 = 0;
                allRequiredIds.forEach(id => {
                    if (progressMap[id] === 'mastered') {
                        masteredCount10++;
                    }
                });
                
                const completion = totalGrade10Required > 0 ? Math.round((masteredCount10 / totalGrade10Required) * 100) : 0;
                
                return {
                    ...grade,
                    totalRequired: totalGrade10Required,
                    masteredCount: masteredCount10,
                    completion,
                };
            }
            
            // Grades 1-9 calculation
            const requiredIds = getRequiredPracticeIdsForGrade(grade.id);
            const totalRequired = requiredIds.length;
            
            if (totalRequired === 0) {
                return { ...grade, totalRequired: 0, masteredCount: 0, completion: 0 };
            }

            let masteredCount = 0;
            requiredIds.forEach(id => {
                if (progressMap[id] === 'mastered') {
                    masteredCount++;
                }
            });

            const completion = Math.round((masteredCount / totalRequired) * 100);
            
            return {
                ...grade,
                totalRequired,
                masteredCount,
                completion,
            };
        });
        
        return stats;
    }, [progressMap, allDohnanyiCombinations]);
    
    const currentGrade = useMemo(() => {
        // Find the highest grade where completion is 100%
        const completedGrades = gradeStats.filter(g => g.completion === 100);
        
        const nextGrade = gradeStats.find(g => g.completion < 100);
        
        if (nextGrade) {
            return {
                id: nextGrade.id - 1,
                name: nextGrade.id > 1 ? PRACTICE_GRADES[nextGrade.id - 2].name : "Beginner",
                nextGrade: nextGrade,
            };
        }
        
        // If all grades 1-10 are 100%
        return { id: 10, name: PRACTICE_GRADES[9].name, nextGrade: null };
        
    }, [gradeStats]);

    return (
        <Card className="border-primary/50 shadow-lg shadow-primary/20 bg-card/70">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="font-mono text-primary text-xl flex items-center justify-between">
                    GRADE TRACKER 
                    <span className="text-sm text-yellow-400">
                        {currentGrade.nextGrade ? `Working on Grade ${currentGrade.nextGrade.id}` : 'Mastery Achieved'}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                {gradeStats.slice(0, 5).map(grade => (
                    <div key={grade.id} className="space-y-1">
                        <div className="flex justify-between text-sm font-mono font-medium">
                            <span className={cn(grade.completion === 100 ? 'text-green-400' : 'text-foreground')}>{grade.name}</span>
                            <span className={cn(grade.completion === 100 ? 'text-green-400' : 'text-primary')}>{grade.completion}%</span>
                        </div>
                        <Progress value={grade.completion} className="h-2 [&>div]:bg-primary" />
                        <p className="text-xs text-muted-foreground italic">{grade.description}</p>
                    </div>
                ))}
                
                {/* Separator for higher grades */}
                <div className="border-t border-dashed border-border pt-4 space-y-4">
                    {gradeStats.slice(5).map(grade => (
                        <div key={grade.id} className="space-y-1">
                            <div className="flex justify-between text-sm font-mono font-medium">
                                <span className={cn(grade.completion === 100 ? 'text-green-400' : 'text-foreground')}>{grade.name}</span>
                                <span className={cn(grade.completion === 100 ? 'text-green-400' : 'text-primary')}>{grade.completion}%</span>
                            </div>
                            <Progress value={grade.completion} className="h-2 [&>div]:bg-primary" />
                            <p className="text-xs text-muted-foreground italic">{grade.description}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default GradeTracker;