"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScales, NextFocus } from '@/context/ScalesContext';
import ScalePracticePanel from './ScalePracticePanel';
import { cn } from '@/lib/utils';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import { formatDistanceToNow, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import PracticeSummaryPanel from './PracticeSummaryPanel';
import { Button } from '@/components/ui/button';
import { showSuccess } from '@/utils/toast';
import { RefreshCw, Target, Settings2, Keyboard, Clock, Activity, Play } from 'lucide-react';
import { useZenMode } from '@/context/ZenModeContext';
import PageHeader from './PageHeader';
import HomeModes from './HomeModes';
import TempoControl from './TempoControl';
import PageContainer from './PageContainer';

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
    },
    [setIsPermutationManuallyAdjusted, setActivePermutationHighestBPM, navigate],
  );

  const handleSelectMode = useCallback(
    (target: 'scales' | 'arpeggios' | 'technical') => {
      if (target === 'technical') {
        navigate('/reader');
        return;
      }
      setMode(target);
      setScaleQuickPick({
        kind: target === 'arpeggios' ? 'arpeggio' : 'scale',
        nonce: Date.now(),
      });
    },
    [navigate],
  );

  const todayStats = useMemo(() => {
    const today = new Date();
    const todayLogs = log.filter((entry) => isSameDay(new Date(entry.timestamp), today));
    const totalMinutes = todayLogs.reduce((sum, entry) => sum + entry.durationMinutes, 0);
    const itemsPracticed = todayLogs.reduce((sum, entry) => sum + entry.itemsPracticed.length, 0);
    return { totalMinutes, itemsPracticed };
  }, [log]);

  const lastLogEntry = useMemo(() => {
    const entry = log[0];
    if (!entry) return null;
    return { timestamp: entry.timestamp, duration: entry.durationMinutes };
  }, [log]);

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
      />

      <HomeModes active={mode} onSelect={handleSelectMode} />

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
                <p className="truncate text-xl font-black tracking-tight sm:text-2xl">{suggestedLabel}</p>
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

      <div className={cn('grid grid-cols-1 gap-6 xl:gap-8', !isZenMode && 'lg:grid-cols-4')}>
        <div className={cn('flex min-w-0 flex-col gap-6 xl:gap-8', !isZenMode ? 'lg:col-span-3' : 'col-span-1')}>
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
            <Card className="surface">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Settings2 className="h-4 w-4" />
                  Tempo Control
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-8">
                <TempoControl
                  value={currentBPM}
                  onChange={setCurrentBPM}
                  onStep={handleBpmChange}
                  target={targetBpm}
                />
                <div className="flex flex-col gap-4 border-t pt-6">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <Keyboard className="size-3" />
                    Shortcuts
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-[10px]">
                    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-3">
                      <span className="font-medium">Save Progress</span>
                      <span className="font-black bg-background px-1.5 py-0.5 rounded border shadow-sm">Enter / S</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-3">
                      <span className="font-medium">Adjust BPM</span>
                      <span className="font-black bg-background px-1.5 py-0.5 rounded border shadow-sm">↑ / ↓</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center pt-4">
                  <Button variant="ghost" size="sm" onClick={refetchData} disabled={isScalesContextLoading} className="text-xs font-bold text-muted-foreground transition-colors hover:text-primary">
                    <RefreshCw className={cn('mr-2 size-3', isScalesContextLoading && 'animate-spin')} />
                    Sync Progress
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="surface">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" />
                  Today&apos;s activity
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Time</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums">{todayStats.totalMinutes}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Items</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums">{todayStats.itemsPracticed}</span>
                </div>
              </CardContent>
            </Card>

            {lastLogEntry && (
              <Card className="surface">
                <CardContent className="p-5">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Last session
                  </p>
                  <p className="text-base font-semibold tracking-tight">
                    {formatDistanceToNow(lastLogEntry.timestamp, { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default PracticeCommandCenter;
