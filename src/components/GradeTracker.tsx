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
import { ChevronDown } from 'lucide-react';

const GradeTracker: React.FC = () => {
    const { progressMap, scaleMasteryBPMMap } = useScales();

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
                    if (progressMap[req.practiceId] === 'mastered') {
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
    }, [progressMap, scaleMasteryBPMMap]);
    
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
        <Card className="border-primary/50 shadow-lg shadow-primary/20 bg-card/70">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="font-mono text-primary text-xl flex items-center justify-between">
                    GRADE TRACKER 
                    <span className="text-sm text-yellow-400">
                        {nextGrade ? `Working on Grade ${nextGrade.id}` : 'Mastery Achieved'}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                {/* Summary View (Always visible) */}
                {nextGrade && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-mono font-medium">
                            <span className="text-foreground">Next Goal: {nextGrade.name}</span>
                            <span className="text-primary">{nextGrade.completion}%</span>
                        </div>
                        <Progress value={nextGrade.completion} className="h-2 [&>div]:bg-primary" />
                        <p className="text-xs text-muted-foreground italic">{nextGrade.description}</p>
                    </div>
                )}
                
                {/* Collapsible Detail View */}
                <Collapsible>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between text-sm font-mono text-muted-foreground hover:text-primary p-0 h-auto">
                            View All Grade Progress ({completedCount} / 10 Completed)
                            <ChevronDown className="w-4 h-4 transition-transform data-[state=open]:rotate-180" />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4 border-t border-dashed border-border mt-4">
                        {gradeStats.map(grade => (
                            <div key={grade.id} className="space-y-1">
                                <div className="flex justify-between text-sm font-mono font-medium">
                                    <span className={cn(grade.completion === 100 ? 'text-green-400' : 'text-foreground')}>{grade.name}</span>
                                    <span className={cn(grade.completion === 100 ? 'text-green-400' : 'text-primary')}>{grade.completion}%</span>
                                </div>
                                <Progress value={grade.completion} className="h-2 [&>div]:bg-primary" />
                                <p className="text-xs text-muted-foreground italic">{grade.description}</p>
                            </div>
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
};

export default GradeTracker;