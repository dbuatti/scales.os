import React, { useMemo } from 'react';
import { useScales } from '@/context/ScalesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  PRACTICE_GRADES, getGradeRequirements
} from '@/lib/scales';
import { Clock, Check, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const PracticeStats = () => {
  const { log, allScales, allDohnanyiCombinations, allHanonCombinations, scaleMasteryBPMMap, exerciseMasteryBPMMap } = useScales();

  const stats = useMemo(() => {
    const allGrade10Requirements = getGradeRequirements(10);
    const totalGrade10Required = allGrade10Requirements.length;
    let masteredCount = 0;
    let practicedCount = 0; 
    
    allGrade10Requirements.forEach(req => {
        const highestBPM = req.type === 'scale' 
            ? (scaleMasteryBPMMap[req.scalePermutationId] || 0)
            : (exerciseMasteryBPMMap[req.practiceId] || 0);
            
        if (highestBPM >= req.requiredBPM) masteredCount++;
        else if (highestBPM > 0) practicedCount++;
    });
    
    const totalDurationMinutes = log.reduce((sum, entry) => sum + entry.durationMinutes, 0);
    const completionPercentage = totalGrade10Required > 0 ? Math.round((masteredCount / totalGrade10Required) * 100) : 0;

    return {
      totalCombinations: totalGrade10Required,
      masteredCount,
      practicedCount,
      untouchedCount: totalGrade10Required - masteredCount - practicedCount,
      completionPercentage,
      totalDurationMinutes,
    };
  }, [log, scaleMasteryBPMMap, exerciseMasteryBPMMap]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-2 border-2 border-primary/10 shadow-lg bg-card relative overflow-hidden">
        <div className="crt-overlay" />
        <CardHeader className="p-6 border-b border-primary/5 relative z-10">
          <CardTitle className="font-mono text-primary text-lg">Overall Mastery Progress</CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6 relative z-10">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-4xl font-bold tracking-tighter text-primary">{stats.completionPercentage}%</p>
              <p className="text-xs text-muted-foreground font-mono uppercase">Grade 10 Completion</p>
            </div>
            <div className="text-right font-mono text-xs text-muted-foreground">
              {stats.masteredCount} / {stats.totalCombinations} Goals
            </div>
          </div>
          <Progress value={stats.completionPercentage} className="h-3 shadow-inner" />
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-primary/5">
            <div className="text-center">
              <p className="text-xl font-bold text-success">{stats.masteredCount}</p>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Mastered</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-warning">{stats.practicedCount}</p>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-muted-foreground">{stats.untouchedCount}</p>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Untouched</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary/10 shadow-lg bg-card relative overflow-hidden">
        <div className="crt-overlay" />
        <CardHeader className="p-6 border-b border-primary/5 relative z-10">
          <CardTitle className="font-mono text-primary text-lg">Practice Stats</CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-8 relative z-10">
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tighter text-primary">{stats.totalDurationMinutes}</p>
            <p className="text-xs text-muted-foreground font-mono uppercase">Total Minutes Practiced</p>
          </div>
          <div className="space-y-4 pt-6 border-t border-primary/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Target className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold">Consistency is Key</p>
                <p className="text-[10px] text-muted-foreground">Log daily to build muscle memory.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PracticeStats;