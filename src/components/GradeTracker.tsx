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
    const { progressMap, scaleMasteryBPMMap, exerciseMasteryBPMMap } = useScales();

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
    }, [progressMap, scaleMasteryBPMMap, exerciseMasteryBPMMap]);
    
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
        if (count >= 10) return <Trophy className="w-8 h-8 text-warning animate-bounce" />;
        if (count >= 7) return <Star className="w-8 h-8 text-warning animate-pulse" />;
        if (count >= 4) return <Award className="w-8 h-8 text-primary" />;
        return <Shield className="w-8 h-8 text-muted-foreground" />;
    };

    return (
        <Card className="border-4 border-primary/80 shadow-2xl shadow-primary/40 bg-card/95 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
            </div>
            <CardHeader className="p-6 pb-2 border-b-2 border-primary/50 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="font-mono text-primary text-2xl flex items-center text-glow">
                            SYSTEM RANK: {currentGradeName.toUpperCase()}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                            {completedCount} / 10 Grades Mastered
                        </p>
                    </div>
                    <div className="p-3 rounded-full bg-primary/5 border border-primary/20">
                        {getRankIcon(completedCount)}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 relative z-10">
                {nextGrade && (
                    <div className="space-y-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Current Objective</span>
                                <h3 className="text-lg font-bold text-primary">{nextGrade.name}</h3>
                            </div>
                            <span className="text-2xl font-black text-primary text-glow">{nextGrade.completion}%</span>
                        </div>
                        <Progress value={nextGrade.completion} className="h-3 [&>div]:bg-primary shadow-md shadow-primary/30" />
                        <p className="text-xs text-muted-foreground italic leading-relaxed">{nextGrade.description}</p>
                    </div>
                )}
                
                <Collapsible>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary p-0 h-auto border-t border-primary/10 pt-4">
                            Curriculum Overview
                            <ChevronDown className="w-4 h-4 transition-transform data-[state=open]:rotate-180" />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-4">
                        {gradeStats.map(grade => (
                            <div key={grade.id} className={cn(
                                "space-y-2 p-3 rounded-lg border transition-all",
                                grade.completion === 100 ? "bg-success/5 border-success/20" : "bg-secondary/30 border-primary/10"
                            )}>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className={cn(grade.completion === 100 ? 'text-success' : 'text-primary/70')}>Grade {grade.id}: {grade.name}</span>
                                    <span className={cn(grade.completion === 100 ? 'text-success' : 'text-primary')}>{grade.completion}%</span>
                                </div>
                                <Progress value={grade.completion} className={cn("h-1.5", grade.completion === 100 ? "[&>div]:bg-success" : "[&>div]:bg-primary")} />
                            </div>
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
};

export default GradeTracker;