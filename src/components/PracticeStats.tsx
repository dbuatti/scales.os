import React, { useMemo } from 'react';
import { useScales, ScaleStatus } from '../context/ScalesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  PRACTICE_GRADES, ALL_SCALE_ITEMS,
  getGradeRequirements, getScalePermutationId
} from '@/lib/scales';
import { Clock, Check, Target } from 'lucide-react';

const PracticeStats = () => {
  const { progressMap, log, allScales, allDohnanyiCombinations, allHanonCombinations, scaleMasteryBPMMap, exerciseMasteryBPMMap } = useScales();

  const stats = useMemo(() => {
    
    // Use Grade 10 requirements as the total goal
    const allGrade10Requirements = getGradeRequirements(10);
    const totalGrade10Required = allGrade10Requirements.length;
    
    let masteredCount = 0;
    let practicedCount = 0; 
    
    allGrade10Requirements.forEach(req => {
        let isMastered = false;
        let isPracticed = false;
        
        if (req.type === 'scale') {
            const highestBPM = scaleMasteryBPMMap[req.scalePermutationId] || 0;
            if (highestBPM >= req.requiredBPM) {
                isMastered = true;
            } else if (highestBPM > 0) {
                isPracticed = true;
            }
        } else { // Dohnanyi or Hanon
            const highestBPM = exerciseMasteryBPMMap[req.practiceId] || 0; // Use exerciseMasteryBPMMap
            if (highestBPM >= req.requiredBPM) {
                isMastered = true;
            } else if (highestBPM > 0) {
                isPracticed = true;
            }
        }
        
        if (isMastered) {
            masteredCount++;
        } else if (isPracticed) {
            practicedCount++;
        }
    });
    
    const untouchedCount = totalGrade10Required - masteredCount - practicedCount;
    
    // Calculate total practice time
    const totalDurationMinutes = log.reduce((sum, entry) => sum + entry.durationMinutes, 0);

    const completionPercentage = totalGrade10Required > 0 ? Math.round((masteredCount / totalGrade10Required) * 100) : 0;

    return {
      totalCombinations: totalGrade10Required,
      masteredCount,
      practicedCount,
      untouchedCount,
      completionPercentage,
      totalDurationMinutes,
    };
  }, [progressMap, log, scaleMasteryBPMMap, exerciseMasteryBPMMap]);

  // Logic to suggest the next focus based on the lowest incomplete grade
  const nextFocus = useMemo(() => {
    const nextGrade = PRACTICE_GRADES.find(grade => {
        const requirements = getGradeRequirements(grade.id);
        
        return requirements.some(req => {
            if (req.type === 'scale') {
                const highestBPM = scaleMasteryBPMMap[req.scalePermutationId] || 0;
                return highestBPM < req.requiredBPM;
            } else {
                const highestBPM = exerciseMasteryBPMMap[req.practiceId] || 0; // Use exerciseMasteryBPMMap
                return highestBPM < req.requiredBPM;
            }
        });
    });

    if (!nextGrade) {
        return null; // All grades mastered
    }
    
    const requirements = getGradeRequirements(nextGrade.id);
    
    // Find the first unmastered requirement
    const nextRequirement = requirements.find(req => {
        if (req.type === 'scale') {
            const highestBPM = scaleMasteryBPMMap[req.scalePermutationId] || 0;
            return highestBPM < req.requiredBPM;
        } else {
            const highestBPM = exerciseMasteryBPMMap[req.practiceId] || 0; // Use exerciseMasteryBPMMap
            return highestBPM < req.requiredBPM;
        }
    });
    
    if (!nextRequirement) return null;

    if (nextRequirement.type === 'scale') {
        const highestBPM = scaleMasteryBPMMap[nextRequirement.scalePermutationId] || 0;
        const nextBPMGoal = highestBPM > 0 ? highestBPM + 3 : 40;
        
        // Parse scale details from permutation ID
        const parts = nextRequirement.scalePermutationId.split('-');
        const scaleId = parts[0] + '-' + parts[1];
        const scaleItem = allScales.find(s => s.id === scaleId);
        
        if (scaleItem) {
            return {
                type: 'Scale',
                key: scaleItem.key,
                scaleType: scaleItem.type,
                goal: `Achieve ${nextRequirement.requiredBPM} BPM for this permutation. Current highest: ${highestBPM} BPM. Next suggested practice: ${nextBPMGoal} BPM.`,
                grade: nextGrade.id,
                description: nextRequirement.description,
            };
        }
    } else if (nextRequirement.type === 'dohnanyi') {
        const dohItem = allDohnanyiCombinations.find(c => c.id === nextRequirement.practiceId);
        if (dohItem) {
            const highestBPM = exerciseMasteryBPMMap[nextRequirement.practiceId] || 0; // Use exerciseMasteryBPMMap
            const nextBPMGoal = highestBPM > 0 ? highestBPM + 3 : 40;
            return {
                type: 'Dohnanyi',
                name: dohItem.name,
                goal: `Achieve ${nextRequirement.requiredBPM} BPM for ${dohItem.name}. Current highest: ${highestBPM} BPM. Next suggested practice: ${nextBPMGoal} BPM.`,
                grade: nextGrade.id,
                description: nextRequirement.description,
            };
        }
    } else if (nextRequirement.type === 'hanon') {
        const hanonItem = allHanonCombinations.find(c => c.id === nextRequirement.practiceId);
        if (hanonItem) {
            const highestBPM = exerciseMasteryBPMMap[nextRequirement.practiceId] || 0; // Use exerciseMasteryBPMMap
            const nextBPMGoal = highestBPM > 0 ? highestBPM + 3 : 40;
            return {
                type: 'Hanon',
                name: hanonItem.name,
                goal: `Achieve ${nextRequirement.requiredBPM} BPM for ${hanonItem.name}. Current highest: ${highestBPM} BPM. Next suggested practice: ${nextBPMGoal} BPM.`,
                grade: nextGrade.id,
                description: nextRequirement.description,
            };
        }
    }
    
    return { type: 'General', goal: `Continue working on Grade ${nextGrade.id}: ${nextGrade.description}`, grade: nextGrade.id };

  }, [progressMap, log, allScales, allDohnanyiCombinations, allHanonCombinations, scaleMasteryBPMMap, exerciseMasteryBPMMap]);

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
              <Check className="w-5 h-5 text-success" />
              <span className="text-xl font-bold mt-1 font-mono">{stats.masteredCount}</span>
              <span className="text-xs text-muted-foreground font-mono">Mastered Goals</span>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="w-5 h-5 text-warning" />
              <span className="text-xl font-bold mt-1 font-mono">{stats.practicedCount}</span>
              <span className="text-xs text-muted-foreground font-mono">In Progress Goals</span>
            </div>
            <div className="flex flex-col items-center">
              <Target className="w-5 h-5 text-destructive" />
              <span className="text-xl font-bold mt-1 font-mono">{stats.untouchedCount}</span>
              <span className="text-xs text-muted-foreground font-mono">Untouched Goals</span>
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
              <p className="text-sm font-bold text-warning mb-2">
                GRADE {nextFocus.grade} GOAL
              </p>
              
              <p className="text-muted-foreground italic text-xs">
                {nextFocus.description}
              </p>
              
              <p className="text-sm text-foreground pt-2 border-t border-border">
                {nextFocus.goal}
              </p>
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