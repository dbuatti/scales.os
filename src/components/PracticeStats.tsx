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
import StatTile from './StatTile';
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Activity} label="Overall mastery" value={`${stats.completionPercentage}%`} />
        <StatTile icon={Flame} label="Practice streak" value={`${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}`} />
        <StatTile icon={Clock} label="Total time" value={`${stats.totalDurationMinutes}m`} />
        <StatTile icon={Calendar} label="Total sessions" value={stats.totalSessions} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card style={{ animationDelay: '120ms' }} className="surface animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Target className="h-4 w-4" />
              Technique Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TechniqueRadar />
          </CardContent>
        </Card>

        <Card style={{ animationDelay: '180ms' }} className="surface animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Activity className="h-4 w-4" />
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