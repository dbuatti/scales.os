import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
    PRACTICE_GRADES, getGradeRequirements, GradeRequirement
} from '@/lib/scales';
import { useScales } from '../context/ScalesContext';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, Award } from 'lucide-react';

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
                } else { // Dohnanyi or Hanon
                    const highestBPM = exerciseMasteryBPMMap[req.practiceId] || 0; // Use exerciseMasteryBPMMap
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
        // Find the highest grade where completion is 100%
        const completedGrades = gradeStats.filter(g => g.completion === 100);
        
        const nextGradeStats = gradeStats.find(g => g.completion < 100);
        
        if (nextGradeStats) {
            return {
                currentGradeName: nextGradeStats.id > 1 ? PRACTICE_GRADES[nextGradeStats.id - 2].name : "Beginner",
                nextGrade: nextGradeStats,
                completedCount: completedGrades.length,
            };
        }
        
        // If all grades 1-10 are 100%
        return { 
            currentGradeName: PRACTICE_GRADES[9].name, 
            nextGrade: null,
            completedCount: completedGrades.length,
        };
        
    }, [gradeStats]);
    
    const { nextGrade, completedCount } = currentGradeInfo;

    return (
        <Card className="border-4 border-primary/80 shadow-2xl shadow-primary/40 bg-card/95 relative overflow-hidden">
            {/* Subtle CRT glow overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
            </div>
            <CardHeader className="p-4 pb-2 border-b-2 border-primary/50 relative z-10">
                <CardTitle className="font-mono text-primary text-xl flex items-center justify-between text-glow">
                    <Award className="w-6 h-6 mr-2 text-warning animate-pulse" />
                    GRADE TRACKER 
                    <span className={cn("text-sm font-bold", nextGrade ? 'text-warning animate-pulse' : 'text-success')}>
                        {nextGrade ? `Working on Grade ${nextGrade.id}` : 'Mastery Achieved'}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 relative z-10">
                {/* Summary View (Always visible) */}
                {nextGrade && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-mono font-medium">
                            <span className="text-foreground text-primary/90">Next Goal: {nextGrade.name}</span>
                            <span className="text-primary text-glow">{nextGrade.completion}%</span>
                        </div>
                        <Progress value={nextGrade.completion} className="h-2 [&>div]:bg-primary shadow-md shadow-primary/30" />
                        <p className="text-xs text-muted-foreground italic text-primary/70">{nextGrade.description}</p>
                    </div>
                )}
                
                {/* Collapsible Detail View */}
                <Collapsible>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between text-sm font-mono text-muted-foreground hover:text-primary p-0 h-auto border-t border-primary/30 pt-4 mt-4">
                            View All Grade Progress ({completedCount} / 10 Completed)
                            <ChevronDown className="w-4 h-4 transition-transform data-[state=open]:rotate-180" />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4 border-t border-dashed border-primary/30 mt-4">
                        {gradeStats.map(grade => (
                            <div key={grade.id} className="space-y-1 p-2 rounded-md bg-secondary/30 border border-primary/20">
                                <div className="flex justify-between text-sm font-mono font-medium">
                                    <span className={cn(grade.completion === 100 ? 'text-success text-glow' : 'text-primary/90')}>{grade.name}</span>
                                    <span className={cn(grade.completion === 100 ? 'text-success text-glow' : 'text-primary text-glow')}>{grade.completion}%</span>
                                </div>
                                <Progress value={grade.completion} className="h-2 [&>div]:bg-primary shadow-sm shadow-primary/20" />
                                <p className="text-xs text-muted-foreground italic text-primary/70">{grade.description}</p>
                            </div>
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
};

export default GradeTracker;