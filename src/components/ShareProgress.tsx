import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useScales } from '@/context/ScalesContext';
import { Share2, CheckCircle, Flame } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { getGradeRequirements } from '@/lib/scales';

type ShareData = { title?: string; text?: string; url?: string };

interface ShareProgressProps {
  className?: string;
}

const APP_URL = 'https://scales.os';

const ShareProgress: React.FC<ShareProgressProps> = ({ className }) => {
  const { log, scaleMasteryBPMMap, exerciseMasteryBPMMap, streak } = useScales();
  const [copied, setCopied] = useState(false);

  const shareText = useMemo(() => {
    const allGrade10 = getGradeRequirements(10);
    let mastered = 0;
    let topBpm = 0;

    allGrade10.forEach(req => {
      const bpm = req.type === 'scale'
        ? (scaleMasteryBPMMap[req.scalePermutationId] || 0)
        : (exerciseMasteryBPMMap[req.practiceId] || 0);
      if (bpm >= req.requiredBPM) mastered++;
      if (bpm > topBpm) topBpm = bpm;
    });

    const totalMinutes = log.reduce((sum, e) => sum + e.durationMinutes, 0);
    const streakText = streak.current_streak > 0
      ? `${streak.current_streak}-day streak`
      : 'Just started';

    return `🎹 ${streakText} on Scales.os — ${mastered}/${allGrade10.length} mastered, top BPM ${topBpm}, ${totalMinutes}m logged.`;
  }, [log, scaleMasteryBPMMap, exerciseMasteryBPMMap, streak]);

  const handleShare = useCallback(async () => {
    const navigatorShare = (navigator as { share?: (data: ShareData) => Promise<void> }).share;
    if (navigatorShare) {
      try {
        await navigatorShare({
          title: 'My Scales.os practice progress',
          text: `${shareText} ${APP_URL}`,
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(`${shareText} ${APP_URL}`);
    showSuccess('Progress copied to clipboard.');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareText]);

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size="sm"
      className={cn('flex items-center gap-2 text-[11px] font-bold text-muted-foreground hover:text-primary focus-scale', className)}
    >
      {copied ? (
        <CheckCircle className="h-3.5 w-3.5 text-success" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
      {copied ? 'Copied!' : 'Share progress'}
    </Button>
  );
};

export default ShareProgress;
