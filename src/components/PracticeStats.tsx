import React, { useMemo } from 'react';
import { useScales } from '@/context/ScalesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  PRACTICE_GRADES, getGradeRequirements, SCALE_TYPES, ARPEGGIO_TYPES
} from '@/lib/scales';
import { Clock, Check, Target, PieChart, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const PracticeStats = () => {
  const { log, scaleMasteryBPMMap, exerciseMasteryBPMMap } = useScales();

  const stats = useMemo(() => {
    const allGrade10Requirements = getGradeRequirements(10);
    const totalGrade10Required = allGrade10Requirements.length;
    let masteredCount = 0;
    let practicedCount = 0; 
    
    // Technique Balance tracking
    const balance = {
        scales: { total: 0, mastered: 0 },
        arpeggios: { total: 0, mastered: 0 },
        dohnanyi: { total: 0, mastered: 0 },
        hanon: { total: 0, mastered: 0 }
    };

    allGrade10Requirements.forEach(req => {
        const highestBPM = req.type === 'scale' 
            ? (scaleMasteryBPMMap[req.scalePermutationId] || 0)
            : (exerciseMasteryBPMMap[req.practiceId] || 0);
            
        const isMastered = highestBPM >= req.requiredBPM;
        if (isMastered) masteredCount++;
        else if (highestBPM > 0) practicedCount++;

        // Categorize for balance
        if (req.type === 'scale') {
            const isArp = ARPEGGIO_TYPES.some(t => req.description.includes(t.replace(' Arpeggio', '')));
            if (isArp) {
                balance.arpeggios.total++;
                if (isMastered) balance.arpeggios.mastered++;
            } else {
                balance.scales.total++;
                if (isMastered) balance.scales.mastered++;
            }
        } else if (req.type === 'dohnanyi') {
            balance.dohnanyi.total++;
            if (isMastered) balance.dohnanyi.mastered++;
        } else if (req.type === 'hanon') {
            balance.hanon.total++;
            if (isMastered) balance.hanon.mastered++;
        }
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
      balance
    };
  }, [log, scaleMasteryBPMMap, exerciseMasteryBPMMap]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-2 border-2 border-primary/10 shadow-lg bg-card relative overflow-hidden">
        <div className="crt-overlay" />
        <CardHeader className="p-6 border-b border-primary/5 relative z-10">
          <CardTitle className="font-mono text-primary text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Overall Mastery Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-8 relative z-10">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-5xl font-black tracking-tighter text-primary">{stats.completionPercentage}%</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Grade 10 Completion</p>
            </div>
            <div className="text-right font-mono text-xs text-muted-foreground">
              {stats.masteredCount} / {stats.totalCombinations} Goals
            </div>
          </div>
          <Progress value={stats.completionPercentage} className="h-4 shadow-inner" />
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-primary/5">
            {Object.entries(stats.balance).map(([key, data]) => (
                <div key={key} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <span>{key}</span>
                        <span>{Math.round((data.mastered / data.total) * 100 || 0)}%</span>
                    </div>
                    <Progress value={(data.mastered / data.total) * 100 || 0} className="h-1.5" />
                </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary/10 shadow-lg bg-card relative overflow-hidden">
        <div className="crt-overlay" />
        <CardHeader className="p-6 border-b border-primary/5 relative z-10">
          <CardTitle className="font-mono text-primary text-lg flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Practice Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-8 relative z-10">
          <div className="space-y-1">
            <p className="text-4xl font-black tracking-tighter text-primary">{stats.totalDurationMinutes}</p>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Total Minutes Practiced</p>
          </div>
          <div className="space-y-4 pt-6 border-t border-primary/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Target className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold">Technique Balance</p>
                <p className="text-[10px] text-muted-foreground">Ensure you're rotating between all categories.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PracticeStats;