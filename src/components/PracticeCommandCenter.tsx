"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useScales, NextFocus } from '@/context/ScalesContext';
import ScalePracticePanel from './ScalePracticePanel';
import { cn } from '@/lib/utils';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { Link, useNavigate } from 'react-router-dom';
import PracticeSummaryPanel from './PracticeSummaryPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { showSuccess } from '@/utils/toast';
import { Sparkles, Crown } from 'lucide-react';
import { useZenMode } from '@/context/ZenModeContext';
import PageHeader from './PageHeader';
import HomeModes from './HomeModes';
import PageContainer from './PageContainer';
import OnboardingChecklist from './OnboardingChecklist';
import MilestoneCelebration from './MilestoneCelebration';
import PracticeFocusCard from './PracticeFocusCard';
import PracticeModePanel from './PracticeModePanel';
import PracticeProgressCard from './PracticeProgressCard';
import { usePracticeTransport } from '@/context/PracticeTransportContext';
import { usePlan } from '@/hooks/use-plan';
import { useWeeklyGoal } from '@/hooks/use-weekly-goal';
import { track } from '@/lib/analytics';
import { exerciseProgress } from '@/lib/tempo';

const PracticeCommandCenter: React.FC = () => {
  const {
    addLogEntry,
    allScales,
    log,
    updateScaleMasteryBPM,
    scaleMasteryBPMMap,
    exerciseMasteryBPMMap,
    streak,
    nextFocus,
  } = useScales();

  const {
    currentBPM,
    activePracticeItem,
    setActivePermutationHighestBPM,
    setIsPermutationManuallyAdjusted,
    handleBpmChange,
    activeLogSnapshotFunction,
  } = useGlobalBPM();

  const { isZenMode } = useZenMode();
  const { isPro } = usePlan();
  const { goal: weeklyGoal, setGoal } = useWeeklyGoal();
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState('120');
  const navigate = useNavigate();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Late night session';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const targetBpm = activePracticeItem
    ? activePracticeItem.type === 'scale'
      ? activePracticeItem.nextGoalBPM
      : activePracticeItem.nextTargetBPM
    : nextFocus?.nextBPMGoal ?? null;

  const [mode, setMode] = useState<'scales' | 'arpeggios'>('scales');
  const [isEngagingSuggestion, setIsEngagingSuggestion] = useState(false);
  const [scaleQuickPick, setScaleQuickPick] = useState<{ kind: 'scale' | 'arpeggio'; nonce: number } | null>(null);
  const firstLogTracked = useRef(false);

  const { sessionSeconds, isPracticeMode, startPractice } = usePracticeTransport();

  useEffect(() => {
    if (firstLogTracked.current || log.length === 0) return;
    firstLogTracked.current = true;
    try {
      if (localStorage.getItem('scales.first_log_tracked')) return;
      localStorage.setItem('scales.first_log_tracked', '1');
    } catch {
      // private mode — still track once per session
    }
    track('first_practice_log');
  }, [log.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleBpmChange(1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleBpmChange(-1);
      } else if (e.key.toLowerCase() === 's' || e.key === 'Enter') {
        e.preventDefault();
        activeLogSnapshotFunction?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBpmChange, activeLogSnapshotFunction]);

  const scrollToPracticePanel = useCallback(() => {
    window.setTimeout(() => {
      document.getElementById('practice-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 90);
  }, []);

  const handleLoadSuggestion = useCallback(
    async (item: NextFocus) => {
      if (!item) return;
      if (item.type === 'dohnanyi' || item.type === 'hanon') {
        showSuccess(`Opening Technical for ${item.name}`);
        navigate('/reader');
        return;
      }
      setIsEngagingSuggestion(true);
      setIsPermutationManuallyAdjusted(false);
      setActivePermutationHighestBPM(0);
      const kind = item.type === 'arpeggio' ? 'arpeggio' : 'scale';
      setMode(kind === 'arpeggio' ? 'arpeggios' : 'scales');
      setScaleQuickPick({ kind, nonce: Date.now() });
      showSuccess(`Loaded suggestion: ${item.scaleItem.key} ${item.scaleItem.type}`);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setIsEngagingSuggestion(false);
      scrollToPracticePanel();
    },
    [setIsPermutationManuallyAdjusted, setActivePermutationHighestBPM, navigate, scrollToPracticePanel],
  );

  const handleSelectMode = useCallback(
    (target: 'scales' | 'arpeggios') => {
      setMode(target);
      setScaleQuickPick({
        kind: target === 'arpeggios' ? 'arpeggio' : 'scale',
        nonce: Date.now(),
      });
    },
    [],
  );

  const activeFolder = mode;

  const suggestedLabel = nextFocus
    ? 'scaleItem' in nextFocus
      ? `${nextFocus.scaleItem.key} ${nextFocus.scaleItem.type}`
      : nextFocus.name
    : null;

  const focusTitle = activePracticeItem
    ? activePracticeItem.type === 'scale'
      ? `${activePracticeItem.key} ${activePracticeItem.scaleType}`
      : activePracticeItem.name
    : suggestedLabel ?? 'Choose an exercise';

  const focusMeta = activePracticeItem
    ? activePracticeItem.type === 'scale'
      ? `${activePracticeItem.articulation} · ${activePracticeItem.octaves} · ${activePracticeItem.handConfig}`
      : 'Method book exercise'
    : 'Pick a key and scale below to begin';

  const overallBestBpm = Math.max(
    0,
    ...Object.values(scaleMasteryBPMMap),
    ...Object.values(exerciseMasteryBPMMap),
  );

  const exerciseBestBpm = activePracticeItem
    ? activePracticeItem.type === 'scale'
      ? activePracticeItem.highestBPM
      : activePracticeItem.currentHighestBPM
    : nextFocus?.currentHighestBPM ?? 0;

  const { percentage: masteryPercentage, remaining: remainingBpm } = exerciseProgress(
    currentBPM,
    exerciseBestBpm,
    targetBpm ?? currentBPM,
  );

  return (
    <PageContainer
      className={cn(
        'max-w-6xl space-y-5 transition-all duration-500 md:space-y-6',
        isZenMode && 'max-w-4xl',
      )}
    >
      <PageHeader
        eyebrow={greeting}
        title="Your practice space."
        description="Choose an exercise, settle into a tempo, and let the session take over."
        actions={
          isPro ? (
            <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 font-bold">
              <Crown className="size-3.5 text-primary" />
              Pro
            </Badge>
          ) : (
            <Button asChild variant="outline" size="sm" className="font-bold focus-scale">
              <Link to="/pro">
                <Sparkles className="mr-1.5 size-3.5 text-primary" />
                Go Pro
              </Link>
            </Button>
          )
        }
      />

      {isPracticeMode && (
        <PracticeModePanel
          title={focusTitle}
          meta={focusMeta}
          currentBpm={currentBPM}
          targetBpm={targetBpm}
          exerciseBestBpm={exerciseBestBpm}
          overallBestBpm={overallBestBpm || currentBPM}
          masteryPercentage={masteryPercentage}
          remainingBpm={remainingBpm}
          onSave={() => activeLogSnapshotFunction?.()}
          canSave={Boolean(activeLogSnapshotFunction)}
        />
      )}

      {/* Keep the setup panel mounted in practice mode so its snapshot handler
          stays registered — hidden, not unmounted. */}
      <div className={cn('space-y-5 md:space-y-6', isPracticeMode && 'hidden')}>
        <PracticeFocusCard
          title={focusTitle}
          meta={focusMeta}
          bpm={currentBPM}
          targetBpm={targetBpm}
          onStart={startPractice}
          suggestionLabel={suggestedLabel}
          onLoadSuggestion={nextFocus ? () => handleLoadSuggestion(nextFocus) : undefined}
          isEngagingSuggestion={isEngagingSuggestion}
        />

        <PracticeSummaryPanel
          overallBestBpm={overallBestBpm || currentBPM}
          exerciseBestBpm={exerciseBestBpm}
          targetBpm={targetBpm}
          masteryPercentage={masteryPercentage}
          remainingBpm={remainingBpm}
          onAdjust={scrollToPracticePanel}
        />

        <section
          id="practice-modes"
          className="rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Practice setup
              </p>
              <h2 className="font-display text-2xl tracking-tight">Configure your exercise</h2>
              <p className="text-sm text-muted-foreground">
                Direction, hands and rhythm stay tucked away until you need them.
              </p>
            </div>
            <Badge variant="outline" className="font-bold">
              {activeFolder === 'arpeggios' ? 'Arpeggios' : 'Scales'}
            </Badge>
          </div>

          <div className="mt-5">
            <HomeModes active={activeFolder} onSelect={handleSelectMode} />
          </div>

          <div id="practice-panel" className="mt-6 scroll-mt-24">
            <ScalePracticePanel
              suggestedScalePermutation={
                nextFocus?.type === 'scale' || nextFocus?.type === 'arpeggio' ? nextFocus : undefined
              }
              currentBPM={currentBPM}
              addLogEntry={addLogEntry}
              updateScaleMasteryBPM={updateScaleMasteryBPM}
              scaleMasteryBPMMap={scaleMasteryBPMMap}
              allScales={allScales}
              activeTab="scales"
              family={activeFolder === 'arpeggios' ? 'arpeggio' : 'scale'}
              quickPick={scaleQuickPick}
              sessionSeconds={sessionSeconds}
            />
          </div>
        </section>

        <PracticeProgressCard
          log={log}
          streak={streak.current_streak}
          overallBestBpm={overallBestBpm || currentBPM}
          weeklyGoal={weeklyGoal}
        />

        <OnboardingChecklist />
      </div>

      <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl tracking-tight">Weekly goal</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              How many minutes do you want to practise each week? A target makes the habit visible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="weekly-goal" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Minutes per week
            </Label>
            <Input
              id="weekly-goal"
              type="number"
              min={15}
              max={1000}
              step={15}
              value={goalDraft}
              onChange={(event) => setGoalDraft(event.target.value)}
              className="tnum h-11 text-lg font-bold"
            />
            <p className="text-[11px] text-muted-foreground">Saved on this device for now.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setGoalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="font-bold"
              onClick={() => {
                setGoal(Number(goalDraft));
                setGoalOpen(false);
                showSuccess('Weekly goal updated.');
              }}
            >
              Save goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <MilestoneCelebration />
    </PageContainer>
  );
};

export default PracticeCommandCenter;
