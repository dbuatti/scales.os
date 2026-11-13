import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PageContainer from '@/components/PageContainer';
import PageHeader from '@/components/PageHeader';
import { usePlan } from '@/hooks/use-plan';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { supabase } from '@/integrations/supabase/client';
import { PRO_CHECKOUT, PRO_PRICE } from '@/lib/plan';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, Crown, Minus, Sparkles } from 'lucide-react';
import { track } from '@/lib/analytics';

const INCLUDED = [
  'Unlimited PDF method books',
  'Page bookmarks & exercise mapping',
  'Full BPM progression history',
  'All 10 grades & custom exercises',
  'Cross-device sync',
  'Priority support',
];

const COMPARISON: { label: string; free: string | boolean; pro: string | boolean }[] = [
  { label: 'Scales, arpeggios & metronome', free: true, pro: true },
  { label: 'Tempo logging', free: true, pro: true },
  { label: 'Cloud method books', free: '2 books', pro: 'Unlimited' },
  { label: 'Page-to-exercise mapping', free: false, pro: true },
  { label: 'Full BPM history', free: 'Recent', pro: 'All time' },
  { label: 'All 10 grades', free: 'Core', pro: true },
];

const ProPage: React.FC = () => {
  const { session } = useSupabaseSession();
  const { isPro, isLoading, refresh } = usePlan();
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual');
  const [email, setEmail] = useState('');
  const [waitlistState, setWaitlistState] = useState<'idle' | 'saving' | 'done'>('idle');

  useEffect(() => {
    track('pro_view');
  }, []);

  const checkoutUrl = billing === 'annual' ? PRO_CHECKOUT.annual : PRO_CHECKOUT.monthly;
  const canCheckout = Boolean(checkoutUrl);

  // Pass the Supabase user id so the webhook can grant Pro without matching emails.
  const checkoutHref = (() => {
    if (!checkoutUrl) return '';
    try {
      const url = new URL(checkoutUrl);
      if (session?.user?.id) url.searchParams.set('client_reference_id', session.user.id);
      return url.toString();
    } catch {
      return checkoutUrl;
    }
  })();

  const handleWaitlist = async (event: React.FormEvent) => {
    event.preventDefault();
    if (waitlistState === 'saving') return;

    setWaitlistState('saving');
    const { error } = await supabase
      .from('pro_waitlist')
      .insert({ email: email.trim().toLowerCase(), source: 'pro-page' });

    if (error) {
      setWaitlistState('idle');
      showError('Could not save your email. Please try again.');
      return;
    }

    setWaitlistState('done');
    track('waitlist_submit');
    showSuccess("You're on the list.");
  };

  if (isLoading) {
    return (
      <PageContainer className="max-w-4xl">
        <Skeleton className="h-10 w-64 bg-card/50" />
        <Skeleton className="h-72 w-full bg-card/50" />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        eyebrow="Pro"
        title={isPro ? 'You’re on Pro.' : 'Practice without limits.'}
        description={
          isPro
            ? 'Everything is unlocked: unlimited method books, the full curriculum and your complete tempo history.'
            : 'Unlimited method books, page mapping, the full curriculum and every BPM you have ever logged.'
        }
      />

      {isPro ? (
        <Card className="surface overflow-hidden">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
              <Crown className="size-6" />
            </div>
            <h2 className="font-display text-3xl tracking-tight">Pro is active</h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Your library is unlimited and your full history is unlocked. Keep logging — the
              chart is the point.
            </p>
            <Button asChild className="mt-2 font-bold">
              <Link to="/">
                Back to practice
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          {/* Plan card */}
          <Card className="surface relative overflow-hidden bg-gradient-to-b from-primary/[0.06] via-card/80 to-card/80">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-primary/10 blur-3xl"
            />
            <CardContent className="relative p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Crown className="size-4 text-primary" />
                  <h2 className="text-lg font-bold">Scales Pro</h2>
                </div>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/15">Early access</Badge>
              </div>

              <div
                role="group"
                aria-label="Billing period"
                className="mt-5 inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/70 p-1"
              >
                {(['monthly', 'annual'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setBilling(option)}
                    aria-pressed={billing === option}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition-all duration-200',
                      billing === option
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {option}
                    {option === 'annual' && (
                      <span
                        className={cn(
                          'ml-1.5 text-[10px] font-bold',
                          billing === option ? 'text-primary-foreground/80' : 'text-primary',
                        )}
                      >
                        −18%
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="tnum font-display text-6xl leading-none tracking-tight">
                  ${billing === 'annual' ? PRO_PRICE.annual : PRO_PRICE.monthly}
                </span>
                <span className="text-sm text-muted-foreground">
                  {billing === 'annual' ? '/year' : '/month'}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {billing === 'annual'
                  ? `About $${PRO_PRICE.annualPerMonth.toFixed(2)}/month — two months free.`
                  : 'Billed monthly. Cancel anytime.'}
              </p>

              <div className="mt-6">
                {canCheckout ? (
                  <Button asChild size="lg" className="w-full font-bold">
                    <a
                      href={checkoutHref}
                      rel="noreferrer"
                      onClick={() => track('checkout_click', { billing })}
                    >
                      Continue to checkout
                      <ArrowRight className="ml-2 size-4" />
                    </a>
                  </Button>
                ) : (
                  <form onSubmit={handleWaitlist} className="space-y-2.5">
                    <label htmlFor="pro-email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Get early access
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="pro-email"
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="h-11"
                        disabled={waitlistState === 'done'}
                      />
                      <Button
                        type="submit"
                        size="lg"
                        className="h-11 shrink-0 font-bold"
                        disabled={waitlistState === 'saving' || waitlistState === 'done'}
                      >
                        {waitlistState === 'done' ? 'On the list' : 'Join'}
                        {waitlistState !== 'done' && <ArrowRight className="ml-2 size-4" />}
                      </Button>
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Checkout is being finalised. Leave your email and you&apos;ll be first in
                      line — no charge today.
                    </p>
                  </form>
                )}
              </div>

              <div className="mt-3 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] font-semibold text-muted-foreground hover:text-primary"
                  onClick={async () => {
                    await refresh();
                    showSuccess('Plan status refreshed.');
                  }}
                >
                  Already upgraded? Refresh status
                </Button>
              </div>

              {!session && (
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  <Link to="/login" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>{' '}
                  to upgrade the account you already practice with.
                </p>
              )}

              <ul className="mt-7 grid gap-2.5 border-t border-border/60 pt-6 sm:grid-cols-2">
                {INCLUDED.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Comparison */}
          <div className="space-y-4">
            <Card className="surface">
              <CardContent className="p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Free vs Pro
                </h2>
                <ul className="mt-4 divide-y divide-border/60">
                  {COMPARISON.map((row) => (
                    <li key={row.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-2.5 text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="flex w-16 justify-center text-xs font-semibold text-muted-foreground">
                        {typeof row.free === 'boolean' ? (
                          row.free ? (
                            <Check className="size-4 text-primary" />
                          ) : (
                            <Minus className="size-4 text-muted-foreground/50" />
                          )
                        ) : (
                          row.free
                        )}
                      </span>
                      <span className="flex w-20 justify-center text-xs font-bold text-foreground">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? (
                            <Check className="size-4 text-primary" />
                          ) : (
                            <Minus className="size-4 text-muted-foreground/50" />
                          )
                        ) : (
                          row.pro
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="surface flex items-start gap-3 p-5">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Sparkles className="size-4" />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-bold text-foreground">One account, every device.</span>{' '}
                Pro follows your login — iPad, laptop and the web app all see the same library and
                the same history.
              </p>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default ProPage;