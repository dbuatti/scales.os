import React, { useMemo } from 'react';
import { useScales } from '@/context/ScalesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  getGradeRequirements, ARPEGGIO_TYPES
} from '@/lib/scales';
import { Clock, Target, Activity, Flame, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import TechniqueRadar from './TechniqueRadar';
import WeeklyActivityChart from './WeeklyActivityChart';
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
        <Card className="bg-card border-2 border-primary/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tighter">{stats.completionPercentage}%</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Overall Mastery</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-primary/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tighter">{stats.streak} Days</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Practice Streak</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-primary/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tighter">{stats.totalDurationMinutes}m</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Time</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-primary/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tighter">{stats.totalSessions}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Sessions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-2 border-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Technique Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TechniqueRadar />
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Weekly Volume (Minutes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyActivityChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PracticeStats;