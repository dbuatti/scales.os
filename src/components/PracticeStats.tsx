import React, { useMemo } from 'react';
import { useScales } from '@/context/ScalesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  getGradeRequirements, ARPEGGIO_TYPES
} from '@/lib/scales';
import { Clock, Target, Activity, Flame, Calendar } from 'lucide-react';
import { isSameDay, subDays, startOfDay } from 'date-fns';

const PracticeStats = () => {
  const { log, scaleMasteryBPMMap, exerciseMasteryBPMMap } = useScales();

  const stats = useMemo(() => {
    const allGrade10Requirements = getGradeRequirements(10);
    const totalGrade10Required = allGrade10Requirements.length;
    let masteredCount = 0;
    let practicedCount = 0; 
    
    allGrade10Requirements.forEach(req => {
        const highestBPM = req.type === 'scale' 
            ? (scaleMasteryBPMMap[req.scalePermutationId] || 0)
            : (exerciseMasteryBPMMap[req.practiceId] || 0);
            
        const isMastered = highestBPM >= req.requiredBPM;
        if (isMastered) masteredCount++;
        else if (highestBPM > 0) practicedCount++;
    });
    
    const totalDurationMinutes = log.reduce((sum, entry) => sum + entry.durationMinutes, 0);
    const completionPercentage = totalGrade10Required > 0 ? Math.round((masteredCount / totalGrade10Required) * 100) : 0;

    // Calculate Streak
    let streak = 0;
    if (log.length > 0) {
      const sortedLogs = [...log].sort((a, b) => b.timestamp - a.timestamp);
      let checkDate = startOfDay(new Date());
      
      // Check if practiced today or yesterday to keep streak alive
      const practicedToday = sortedLogs.some(l => isSameDay(new Date(l.timestamp), checkDate));
      const practicedYesterday = sortedLogs.some(l => isSameDay(new Date(l.timestamp), subDays(checkDate, 1)));
      
      if (practicedToday || practicedYesterday) {
        if (!practicedToday) checkDate = subDays(checkDate, 1);
        
        while (sortedLogs.some(l => isSameDay(new Date(l.timestamp), checkDate))) {
          streak++;
          checkDate = subDays(checkDate, 1);
        }
      }
    }

    return {
      totalCombinations: totalGrade10Required,
      masteredCount,
      practicedCount,
      completionPercentage,
      totalDurationMinutes,
      streak,
      totalSessions: log.filter(l => l.durationMinutes > 0).length
    };
  }, [log, scaleMasteryBPMMap, exerciseMasteryBPMMap]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card style={{ animationDelay: '0ms' }} className="surface-interactive animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/10 p-3 text-primary ring-1 ring-inset ring-primary/10">
              <Activity className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black tracking-tight tabular-nums">
                {stats.completionPercentage === 0 ? '—' : stats.completionPercentage}
              </p>
              <p className="text-[10px] font-bold uppercase leading-tight tracking-widest text-muted-foreground">
                {stats.completionPercentage === 0 ? 'Getting started' : 'Overall Mastery'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card style={{ animationDelay: '60ms' }} className="surface-interactive animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-accent/10 p-3 text-accent ring-1 ring-inset ring-accent/15">
              <Flame className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black tracking-tight tabular-nums">
                {stats.streak === 0 ? '—' : `${stats.streak} Days`}
              </p>
              <p className="text-[10px] font-bold uppercase leading-tight tracking-widest text-muted-foreground">
                {stats.streak === 0 ? 'Start your streak' : 'Practice Streak'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card style={{ animationDelay: '120ms' }} className="surface-interactive animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/[0.07] p-3 text-primary/80 ring-1 ring-inset ring-primary/10">
              <Clock className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black tracking-tight tabular-nums">{stats.totalDurationMinutes}m</p>
              <p className="text-[10px] font-bold uppercase leading-tight tracking-widest text-muted-foreground">Total Time</p>
            </div>
          </CardContent>
        </Card>

        <Card style={{ animationDelay: '180ms' }} className="surface-interactive animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-foreground/[0.06] p-3 text-foreground/70 ring-1 ring-inset ring-foreground/10">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black tracking-tight tabular-nums">{stats.totalSessions}</p>
              <p className="text-[10px] font-bold uppercase leading-tight tracking-widest text-muted-foreground">Total Sessions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PracticeStats;