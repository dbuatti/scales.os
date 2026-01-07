import React, { useMemo } from 'react';
import { useScales, ScaleStatus } from '../context/ScalesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  PRACTICE_GRADES, ALL_SCALE_ITEMS,
  getGradeRequirements, getScalePermutationId
} from '@/lib/scales';
import { Clock, Check, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <Card className="md:col-span-2 border-4 border-primary/80 shadow-2xl shadow-primary/40 bg-card/95 relative overflow-hidden">
        {/* Subtle CRT glow overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        </div>
        <CardHeader className="p-4 border-b-2 border-primary/50 relative z-10">
          <CardTitle className="font-mono text-primary text-xl text-glow">Overall Mastery (Grade 10 Goal)</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4 relative z-10">
          <div className="flex justify-between text-sm font-mono font-medium">
            <span>Grade 10 Completion</span>
            <span className="text-primary text-glow">{stats.completionPercentage}%</span>
          </div>
          <Progress value={stats.completionPercentage} className="h-3 [&>div]:bg-primary shadow-md shadow-primary/30" />
          <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t border-primary/30">
            <div className="flex flex-col items-center">
              <Check className="w-6 h-6 text-success text-glow" />
              <span className="text-2xl font-bold mt-1 font-mono text-primary text-glow">{stats.masteredCount}</span>
              <span className="text-xs text-muted-foreground font-mono">Mastered Goals</span>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="w-6 h-6 text-warning text-glow animate-pulse" />
              <span className="text-2xl font-bold mt-1 font-mono text-primary text-glow">{stats.practicedCount}</span>
              <span className="text-xs text-muted-foreground font-mono">In Progress Goals</span>
            </div>
            <div className="flex flex-col items-center">
              <Target className="w-6 h-6 text-destructive text-glow" />
              <span className="text-2xl font-bold mt-1 font-mono text-primary text-glow">{stats.untouchedCount}</span>
              <span className="text-xs text-muted-foreground font-mono">Untouched Goals</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Next Focus */}
      <Card className="border-4 border-primary/80 shadow-2xl shadow-primary/40 bg-card/95 relative overflow-hidden">
        {/* Subtle CRT glow overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        </div>
        <CardHeader className="p-4 border-b-2 border-primary/50 relative z-10">
          <CardTitle className="font-mono text-primary text-xl text-glow">Next Focus Target</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3 relative z-10">
          {nextFocus ? (
            <div className="space-y-2 font-mono text-sm">
              <p className="text-xl font-semibold text-primary text-glow">
                {nextFocus.type === 'Scale' ? `${nextFocus.key} ${nextFocus.scaleType}` : nextFocus.name}
              </p>
              <p className="text-base font-bold text-warning mb-2 text-glow animate-pulse">
                GRADE {nextFocus.grade} GOAL
              </p>
              
              <p className="text-sm text-muted-foreground italic text-primary/70">
                {nextFocus.description}
              </p>
              
              <p className="text-base text-foreground pt-2 border-t border-primary/30 text-primary/90">
                {nextFocus.goal}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground font-mono text-lg text-primary/70">
              Congratulations! All graded steps are mastered.
            </p>
          )}
          <div className="pt-2 border-t border-primary/30 mt-4">
            <p className="text-xs text-muted-foreground font-mono text-primary/70">
              Total Practice Time: <span className="font-medium text-primary text-glow">{stats.totalDurationMinutes} minutes</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PracticeStats;