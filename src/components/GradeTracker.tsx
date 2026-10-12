import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
    PRACTICE_GRADES, getGradeRequirements, GradeRequirement
} from '@/lib/scales';
import { useScales } from '@/context/ScalesContext';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, Award, Trophy, Star, Shield } from 'lucide-react';

const GradeTracker: React.FC = () => {
    const { scaleMasteryBPMMap, exerciseMasteryBPMMap } = useScales();

    const gradeStats = useMemo(() => {
        const stats = PRACTICE_GRADES.map(grade => {
            const requirements: GradeRequirement[] = getGradeRequirements(grade.id);
            const totalRequired = requirements.length;
            
            if (totalRequired === 0) {
                return { ...grade, totalRequired: 0, masteredCount: 0, completion: 0 };
            }

            let masteredCount = 0;
            
            requirements.forEach(req => {
                let isMastered = false;
                
                if (req.type === 'scale') {
                    const highestBPM = scaleMasteryBPMMap[req.scalePermutationId] || 0;
                    if (highestBPM >= req.requiredBPM) {
                        isMastered = true;
                    }
                } else {
                    const highestBPM = exerciseMasteryBPMMap[req.practiceId] || 0;
                    if (highestBPM >= req.requiredBPM) {
                        isMastered = true;
                    }
                }
                
                if (isMastered) {
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
    }, [scaleMasteryBPMMap, exerciseMasteryBPMMap]);
    
    const currentGradeInfo = useMemo(() => {
        const completedGrades = gradeStats.filter(g => g.completion === 100);
        const nextGradeStats = gradeStats.find(g => g.completion < 100);
        
        if (nextGradeStats) {
            return {
                currentGradeName: nextGradeStats.id > 1 ? PRACTICE_GRADES[nextGradeStats.id - 2].name : "Novice",
                nextGrade: nextGradeStats,
                completedCount: completedGrades.length,
            };
        }
        
        return { 
            currentGradeName: PRACTICE_GRADES[9].name, 
            nextGrade: null,
            completedCount: completedGrades.length,
        };
        
    }, [gradeStats]);
    
    const { nextGrade, completedCount, currentGradeName } = currentGradeInfo;

    const getRankIcon = (count: number) => {
        if (count >= 10) return <Trophy className="h-6 w-6 text-primary" />;
        if (count >= 7) return <Star className="h-6 w-6 text-primary" />;
        if (count >= 4) return <Award className="h-6 w-6 text-primary" />;
        return <Shield className="h-6 w-6 text-muted-foreground" />;
    };

    return (
        <Card className="border border-border/60 bg-card/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 border-b border-border/60 p-5">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Award className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-sm font-bold">System rank: {currentGradeName}</CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground tabular-nums">
                        {completedCount} / 10 grades mastered
                    </p>
                </div>
                <div className="shrink-0">{getRankIcon(completedCount)}</div>
            </CardHeader>
            <CardContent className="space-y-6 p-5">
                {nextGrade && (
                    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                        <div className="flex items-end justify-between gap-3">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current objective</span>
                                <h3 className="text-base font-bold leading-tight">{nextGrade.name}</h3>
                            </div>
                            <span className="text-2xl font-black tabular-nums leading-none">{nextGrade.completion}%</span>
                        </div>
                        <Progress value={nextGrade.completion} className="h-2" />
                        <p className="text-xs leading-relaxed text-muted-foreground">{nextGrade.description}</p>
                    </div>
                )}

                <Collapsible>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="h-auto w-full justify-between border-t border-border/60 p-0 pt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                            Curriculum overview
                            <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-4">
                        {gradeStats.map(grade => (
                            <div key={grade.id} className={cn(
                                "space-y-2 rounded-lg border p-3 transition-all",
                                grade.completion === 100 ? "border-success/30 bg-success/5" : "border-border/60 bg-muted/30"
                            )}>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                    <span className={cn(grade.completion === 100 ? 'text-success' : 'text-muted-foreground')}>Grade {grade.id}: {grade.name}</span>
                                    <span className={cn('tabular-nums', grade.completion === 100 ? 'text-success' : 'text-foreground')}>{grade.completion}%</span>
                                </div>
                                <Progress value={grade.completion} className={cn("h-1.5", grade.completion === 100 && "[&>div]:bg-success")} />
                            </div>
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
};

export default GradeTracker;