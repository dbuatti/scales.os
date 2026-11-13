"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { showSuccess } from '@/utils/toast';
import { Target, Play, Sparkles, Crown, Music } from 'lucide-react';
import { useZenMode } from '@/context/ZenModeContext';
import PageHeader from './PageHeader';
import HomeModes from './HomeModes';
import PageContainer from './PageContainer';
import OnboardingChecklist from './OnboardingChecklist';
import MilestoneCelebration from './MilestoneCelebration';
import Metronome from './Metronome';
import { usePlan } from '@/hooks/use-plan';
import { useWeeklyGoal } from '@/hooks/use-weekly-goal';
import { track } from '@/lib/analytics';

const PracticeCommandCenter: React.FC = () => {
  const {
    addLogEntry,
    allScales,
    log,
    updatePracticeStatus,
    updateScaleMasteryBPM,
    scaleMasteryBPMMap,
    nextFocus,
    refetchData,
    isLoading: isScalesContextLoading,
  } = useScales();

  const {
    currentBPM,
    activePracticeItem,
    setCurrentBPM,
    setActivePermutationHighestBPM,
    setIsPermutationManuallyAdjusted,
    handleBpmChange,
    activeLogSnapshotFunction,
  } = useGlobalBPM();

  const { isZenMode } = useZenMode();
  const { isPro } = usePlan();
  const { goal, setGoal } = useWeeklyGoal();
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
    : null;

  const [mode, setMode] = useState<'scales' | 'arpeggios'>('scales');
  const [isEngagingSuggestion, setIsEngagingSuggestion] = useState(false);
  const [scaleQuickPick, setScaleQuickPick] = useState<{ kind: 'scale' | 'arpeggio'; nonce: number } | null>(null);
  const firstLogTracked = useRef(false);

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
      scrollToPracticePanel();
    },
    [scrollToPracticePanel],
  );

  const suggestedLabel = nextFocus
    ? 'scaleItem' in nextFocus
      ? `${nextFocus.scaleItem.key} ${nextFocus.scaleItem.type}`
      : nextFocus.name
    : 'None';

  return (
    <PageContainer className={cn('transition-all duration-500', isZenMode && 'max-w-4xl')}>
      <PageHeader
        eyebrow={greeting}
        title="Practice"
        description="Pick a mode, adjust tempo, and track every session."
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

      {nextFocus && (
        <Card className="surface relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.10] via-card/60 to-card/60 shadow-md shadow-primary/[0.06] animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/15 blur-3xl"
          />
          <CardContent className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
                <Target className="size-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    Suggested focus
                  </p>
                  <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Ready
                  </span>
                </div>
                <p className="truncate font-display text-2xl leading-tight tracking-tight sm:text-3xl">{suggestedLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {targetBpm ? (
                <div className="hidden text-right sm:block">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Target
                  </p>
                  <p className="text-xl font-black tabular-nums text-primary">{targetBpm} BPM</p>
                </div>
              ) : null}
              <Button
                size="lg"
                onClick={() => handleLoadSuggestion(nextFocus)}
                disabled={isEngagingSuggestion}
                className="w-full font-bold shadow-sm shadow-primary/20 focus-scale sm:w-auto"
              >
                <Play data-icon="inline-start" />
                Start session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div id="practice-modes" className="scroll-mt-24">
        <HomeModes active={mode} onSelect={handleSelectMode} />
      </div>

      <OnboardingChecklist />

      <div className={cn('grid grid-cols-1 gap-6 xl:gap-8', !isZenMode && 'lg:grid-cols-4')}>
        <div
          id="practice-panel"
          className={cn('flex min-w-0 scroll-mt-24 flex-col gap-6 xl:gap-8', !isZenMode ? 'lg:col-span-3' : 'col-span-1')}
        >
          <PracticeSummaryPanel />

          <ScalePracticePanel
            suggestedScalePermutation={
              nextFocus?.type === 'scale' || nextFocus?.type === 'arpeggio' ? nextFocus : undefined
            }
            currentBPM={currentBPM}
            addLogEntry={addLogEntry}
            updatePracticeStatus={updatePracticeStatus}
            updateScaleMasteryBPM={updateScaleMasteryBPM}
            scaleMasteryBPMMap={scaleMasteryBPMMap}
            allScales={allScales}
            activeTab="scales"
            quickPick={scaleQuickPick}
          />
        </div>

        {!isZenMode && (
          <div className="flex flex-col gap-6 xl:gap-8 lg:sticky lg:top-24 lg:self-start">
            <Card style={{ animationDelay: '60ms' }} className="surface animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Music className="h-3.5 w-3.5" />
                  Metronome
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Metronome showSettings={true} />
              </CardContent>
            </Card>
          </div>
        )}
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
