"use client";

import React, { useMemo } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { useScales } from '@/context/ScalesContext';
import { ARPEGGIO_TYPES, getGradeRequirements } from '@/lib/scales';

const TechniqueRadar = () => {
  const { scaleMasteryBPMMap, exerciseMasteryBPMMap } = useScales();

  const data = useMemo(() => {
    const requirements = getGradeRequirements(10);
    const stats = {
      Scales: { total: 0, mastered: 0 },
      Arpeggios: { total: 0, mastered: 0 },
      Dohnányi: { total: 0, mastered: 0 },
      Hanon: { total: 0, mastered: 0 }
    };

    requirements.forEach(req => {
      const bpm = req.type === 'scale' 
        ? (scaleMasteryBPMMap[req.scalePermutationId] || 0)
        : (exerciseMasteryBPMMap[req.exerciseId] || 0);
      
      const isMastered = bpm >= req.requiredBPM;
      
      let category: keyof typeof stats;
      if (req.type === 'dohnanyi') category = 'Dohnányi';
      else if (req.type === 'hanon') category = 'Hanon';
      else {
        const isArp = ARPEGGIO_TYPES.some(t => req.description.includes(t.replace(' Arpeggio', '')));
        category = isArp ? 'Arpeggios' : 'Scales';
      }

      stats[category].total++;
      if (isMastered) stats[category].mastered++;
    });

    return Object.entries(stats).map(([subject, val]) => ({
      subject,
      A: val.total > 0 ? Math.round((val.mastered / val.total) * 100) : 0,
      fullMark: 100,
    }));
  }, [scaleMasteryBPMMap, exerciseMasteryBPMMap]);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="hsl(var(--primary) / 0.2)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Mastery"
            dataKey="A"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TechniqueRadar;