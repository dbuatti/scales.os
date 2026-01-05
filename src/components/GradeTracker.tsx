import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
    PRACTICE_GRADES, getGradeRequirements, GradeRequirement
} from '@/lib/scales';
import { useScales } from '../context/ScalesContext';
import { cn } from '@/lib/utils';

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