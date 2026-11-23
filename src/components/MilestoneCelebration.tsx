import React, { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useScales } from '@/context/ScalesContext';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Trophy, Star, Piano } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGradeRequirements } from '@/lib/scales';
import ShareProgress from './ShareProgress';

const CELEBRATED_KEY = 'scales.milestones.celebrated';

/** Keep each account's celebrations separate, and stay compatible with the old shared key. */
const celebratedKey = (userId: string | null): string =>
  userId ? `${CELEBRATED_KEY}.${userId}` : CELEBRATED_KEY;

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

const loadCelebrated = (userId: string | null): Set<string> => {
  try {
    // Fall back to the legacy shared key so existing users keep their history.
    const raw = localStorage.getItem(celebratedKey(userId)) ??
      (userId ? localStorage.getItem(CELEBRATED_KEY) : null);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((id): id is string => typeof id === 'string'));
      }
    }
  } catch {
    // ignore
  }
  return new Set();
};

const saveCelebrated = (userId: string | null, celebrated: Set<string>) => {
  try {
    localStorage.setItem(celebratedKey(userId), JSON.stringify([...celebrated]));
  } catch {
    // ignore
  }
};

/** Cloud state is the source of truth so a refresh or another device never replays a milestone. */
const loadCelebratedFromCloud = async (userId: string): Promise<Set<string> | null> => {
  try {
    const { data, error } = await supabase
      .from('scales_profiles')
      .select('celebrated_milestones')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data || !Array.isArray(data.celebrated_milestones)) return null;
    return new Set(
      data.celebrated_milestones.filter((id): id is string => typeof id === 'string'),
    );
  } catch {
    return null;
  }
};

const saveCelebratedToCloud = async (userId: string, celebrated: Set<string>) => {
  try {
    const { error } = await supabase
      .from('scales_profiles')
      .update({ celebrated_milestones: [...celebrated] })
      .eq('id', userId);
    if (error) console.warn('Could not save celebrated milestones', error);
  } catch {
    // Local storage remains the fallback when the network is unavailable.
  }
};

const MilestoneCelebration: React.FC = () => {
  const { log, streak, scaleMasteryBPMMap, exerciseMasteryBPMMap, isLoading } = useScales();
  const { userId } = useSupabaseSession();
  const [open, setOpen] = useState(false);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [celebrated, setCelebrated] = useState<Set<string>>(() => loadCelebrated(userId));
  const [celebratedFor, setCelebratedFor] = useState<string | null>(userId);
  const [isLoadingCelebrated, setIsLoadingCelebrated] = useState(Boolean(userId));

  useEffect(() => {
    let active = true;
    setCelebrated(loadCelebrated(userId));
    setCelebratedFor(userId);

    if (!userId) {
      setIsLoadingCelebrated(false);
      return () => {
        active = false;
      };
    }

    setIsLoadingCelebrated(true);
    void loadCelebratedFromCloud(userId).then((fromCloud) => {
      if (!active) return;
      if (fromCloud) {
        setCelebrated(fromCloud);
        saveCelebrated(userId, fromCloud);
      }
      setIsLoadingCelebrated(false);
    });

    return () => {
      active = false;
    };
  }, [userId]);

  const getEarnedMilestoneIds = useCallback((): string[] => {
    // Wait for the right account, its data, and its cloud-seen state.
    if (isLoading || isLoadingCelebrated || !userId || userId !== celebratedFor) return [];

    const earned: string[] = [];
    if (log.length > 0) earned.push('first_session');
    STREAK_MILESTONES.forEach((m) => {
      if (streak.current_streak >= m) earned.push(`streak_${m}`);
    });

    const grade1 = getGradeRequirements(1);
    const hasMastery = grade1.some(req => {
      const bpm = req.type === 'scale'
        ? (scaleMasteryBPMMap[req.scalePermutationId] || 0)
        : (exerciseMasteryBPMMap[req.practiceId] || 0);
      return bpm >= req.requiredBPM;
    });
    if (hasMastery) earned.push('first_mastery');

    return earned;
  }, [log, streak, scaleMasteryBPMMap, exerciseMasteryBPMMap, isLoading, isLoadingCelebrated, userId, celebratedFor]);

  const detectMilestone = useCallback((): Milestone | null => {
    const earned = getEarnedMilestoneIds();
    for (const id of earned) {
      if (!celebrated.has(id)) return getMilestone(id);
    }
    return null;
  }, [getEarnedMilestoneIds, celebrated]);

  useEffect(() => {
    const m = detectMilestone();
    if (m) {
      setMilestone(m);
      setOpen(true);
    }
  }, [detectMilestone]);

  // Any dismissal (Continue, X, Escape or outside click) marks every milestone
  // earned right now as seen. Otherwise closing one dialog immediately opens
  // the next queued one, which feels like the same popup repeating.
  const handleClose = (nextOpen: boolean) => {
    if (nextOpen) return;
    const next = new Set(celebrated);
    getEarnedMilestoneIds().forEach((id) => next.add(id));
    if (milestone) next.add(milestone.id);
    setCelebrated(next);
    saveCelebrated(userId, next);
    if (userId) void saveCelebratedToCloud(userId, next);
    setOpen(false);
    setMilestone(null);
  };

  if (!milestone) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
          <Button variant="outline" onClick={() => handleClose(false)} className="w-full font-bold">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MilestoneCelebration;
