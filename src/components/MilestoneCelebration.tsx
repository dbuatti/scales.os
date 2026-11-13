import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useScales } from '@/context/ScalesContext';
import { CheckCircle, Flame, Trophy, Star, Piano, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGradeRequirements } from '@/lib/scales';
import ShareProgress from './ShareProgress';

const CELEBRATED_KEY = 'scales.milestones.celebrated';

const STREAK_MILESTONES = [1, 3, 7, 14, 30];

interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tone: string;
}

const getMilestone = (id: string): Milestone | null => {
  const milestones: Record<string, Milestone> = {
    first_session: {
      id: 'first_session',
      title: 'First session logged',
      description: 'Your practice journey begins. Every great pianist started right here.',
      icon: <Piano className="h-6 w-6" />,
      tone: 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/10',
    },
    streak_1: {
      id: 'streak_1',
      title: 'One day streak',
      description: 'You showed up today. Keep the chain going.',
      icon: <Flame className="h-6 w-6" />,
      tone: 'bg-accent/10 text-accent ring-1 ring-inset ring-accent/15',
    },
    streak_3: {
      id: 'streak_3',
      title: 'Three day streak',
      description: 'Building momentum. Three days down, many more to come.',
      icon: <Flame className="h-6 w-6" />,
      tone: 'bg-accent/10 text-accent ring-1 ring-inset ring-accent/15',
    },
    streak_7: {
      id: 'streak_7',
      title: 'One week streak',
      description: 'A full week of practice. Consistency is the secret.',
      icon: <Flame className="h-6 w-6" />,
      tone: 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/10',
    },
    streak_14: {
      id: 'streak_14',
      title: 'Two week streak',
      description: 'Fourteen days in a row. You\'re making this a habit.',
      icon: <Star className="h-6 w-6" />,
      tone: 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/10',
    },
    streak_30: {
      id: 'streak_30',
      title: 'One month streak',
      description: 'Thirty days of practice. That\'s dedication.',
      icon: <Trophy className="h-6 w-6" />,
      tone: 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/10',
    },
    first_mastery: {
      id: 'first_mastery',
      title: 'First item mastered',
      description: 'You hit your goal tempo. The first of many.',
      icon: <Trophy className="h-6 w-6" />,
      tone: 'bg-success/10 text-success ring-1 ring-inset ring-success/15',
    },
  };
  return milestones[id] ?? null;
};

const loadCelebrated = (): Set<string> => {
  try {
    const raw = localStorage.getItem(CELEBRATED_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    // ignore
  }
  return new Set();
};

const saveCelebrated = (celebrated: Set<string>) => {
  try {
    localStorage.setItem(CELEBRATED_KEY, JSON.stringify([...celebrated]));
  } catch {
    // ignore
  }
};

const MilestoneCelebration: React.FC = () => {
  const { log, streak, scaleMasteryBPMMap, exerciseMasteryBPMMap } = useScales();
  const [open, setOpen] = useState(false);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [celebrated, setCelebrated] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCelebrated(loadCelebrated());
  }, []);

  const detectMilestone = useCallback((): Milestone | null => {
    if (celebrated.has('first_session') && celebrated.has('first_mastery') &&
        STREAK_MILESTONES.every(m => celebrated.has(`streak_${m}`))) {
      return null;
    }

    if (log.length > 0 && !celebrated.has('first_session')) {
      return getMilestone('first_session');
    }

    if (streak.current_streak >= 1 && !celebrated.has('streak_1')) {
      return getMilestone('streak_1');
    }
    if (streak.current_streak >= 3 && !celebrated.has('streak_3')) {
      return getMilestone('streak_3');
    }
    if (streak.current_streak >= 7 && !celebrated.has('streak_7')) {
      return getMilestone('streak_7');
    }
    if (streak.current_streak >= 14 && !celebrated.has('streak_14')) {
      return getMilestone('streak_14');
    }
    if (streak.current_streak >= 30 && !celebrated.has('streak_30')) {
      return getMilestone('streak_30');
    }

    const grade1 = getGradeRequirements(1);
    const hasMastery = grade1.some(req => {
      const bpm = req.type === 'scale'
        ? (scaleMasteryBPMMap[req.scalePermutationId] || 0)
        : (exerciseMasteryBPMMap[req.practiceId] || 0);
      return bpm >= req.requiredBPM;
    });
    if (hasMastery && !celebrated.has('first_mastery')) {
      return getMilestone('first_mastery');
    }

    return null;
  }, [log, streak, scaleMasteryBPMMap, exerciseMasteryBPMMap, celebrated]);

  useEffect(() => {
    const m = detectMilestone();
    if (m) {
      setMilestone(m);
      setOpen(true);
    }
  }, [detectMilestone]);

  const handleCelebrate = () => {
    if (!milestone) return;
    const next = new Set(celebrated);
    next.add(milestone.id);
    setCelebrated(next);
    saveCelebrated(next);
    setOpen(false);
    setMilestone(null);
  };

  if (!milestone) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl', milestone.tone)}>
            {milestone.icon}
          </div>
        </div>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-tight">{milestone.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{milestone.description}</DialogDescription>
        </DialogHeader>
        <ShareProgress className="mx-auto mt-6" />
        <DialogFooter>
          <Button variant="outline" onClick={handleCelebrate} className="w-full font-bold">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MilestoneCelebration;
