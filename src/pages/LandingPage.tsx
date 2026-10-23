import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Music,
  Gauge,
  BookOpen,
  TrendingUp,
  Sparkles,
  Play,
  GraduationCap,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Music,
    title: 'Scales & arpeggios',
    description: 'Every key, type, articulation, rhythm, hand configuration and octave — fully permutable.',
  },
  {
    icon: Gauge,
    title: 'Metronome that follows you',
    description: 'A built-in metronome with tap tempo, subdivisions and auto-increment, tied to your BPM.',
  },
  {
    icon: BookOpen,
    title: 'Your method books, digitized',
    description: 'Open Hanon, Dohnányi or any PDF, map pages to exercises, and practice straight from the score.',
  },
  {
    icon: TrendingUp,
    title: 'Progression you can see',
    description: 'Every tempo you hit is logged, so you can watch your highest BPM climb day by day.',
  },
  {
    icon: Sparkles,
    title: 'Intelligent focus',
    description: 'A graded curriculum that suggests exactly what to work on next to break through plateaus.',
  },
  {
    icon: GraduationCap,
    title: 'Built for every level',
    description: 'From first fundamentals to professional-grade technique, all in one structured system.',
  },
];

interface Plan {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    tagline: 'Everything you need to start practicing deliberately.',
    features: [
      'Scales & arpeggios practice',
      'Built-in metronome with BPM',
      'Progress tracking',
      'Up to 2 PDF books',
      'Core grade curriculum',
    ],
    cta: 'Start free',
  },
  {
    name: 'Pro',
    price: '$5',
    period: '/month',
    tagline: 'For serious pianists who want the full method-book workflow.',
    features: [
      'Unlimited PDF books',
      'Page bookmarks & exercise mapping',
      'Full BPM progression history',
      'All 10 grades unlocked',
      'Custom exercises',
      'Cross-device sync',
      'Priority support',
    ],
    cta: 'Go Pro',
    highlight: true,
  },
];

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-16 text-foreground md:gap-24">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-sm">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center animate-in fade-in slide-in-from-bottom-3 duration-500 md:py-28">
          <Badge variant="secondary" className="mb-6 border-border/60 px-3 py-1 text-xs font-semibold text-primary">
            The practice companion for pianists
          </Badge>
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Master your scales.
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              Automate your progress.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Structured scales & arpeggios, a metronome that follows you, and your method
            books — Hanon, Dohnányi or anything else — in one place, with a tempo log that
            tracks every session.
          </p>
          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="font-bold shadow-sm transition-all duration-200 active:scale-[0.98]">
              <Link to="/login">
                <Play className="mr-2 h-4 w-4" />
                Start free
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-bold transition-all duration-200 active:scale-[0.98]">
              <a href="#pricing">See pricing</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl">
        <h2 className="text-center text-2xl font-black tracking-tight sm:text-3xl">
          Everything you need to practice deliberately
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          A focused toolkit for technique, tempo and progress — nothing you don&apos;t need.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                style={{ animationDelay: `${index * 50}ms` }}
                className="surface animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold tracking-tight">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-24 rounded-2xl border border-border/60 bg-muted/30">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 md:py-20">
          <h2 className="text-center text-2xl font-black tracking-tight sm:text-3xl">
            Simple, honest pricing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Start free. Upgrade when you&apos;re ready to take your full method-book workflow
            everywhere.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {PLANS.map((plan, index) => (
              <Card
                key={plan.name}
                style={{ animationDelay: `${index * 60}ms` }}
                className={cn(
                  'surface relative flex flex-col transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 fill-mode-both',
                  plan.highlight
                    ? 'border-primary/50 shadow-md ring-1 ring-primary/30'
                    : '',
                )}
              >
                {plan.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-sm">Most popular</Badge>
                )}
                <CardContent className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.tagline}</p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant={plan.highlight ? 'default' : 'outline'}
                    className="mt-8 w-full font-bold transition-all duration-200 active:scale-[0.98]"
                  >
                    <Link to="/login">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Ready to transform your practice?</h2>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            Join today and experience a smarter, more effective way to reach your musical goals.
          </p>
          <Button asChild size="lg" className="mt-8 font-bold shadow-sm transition-all duration-200 active:scale-[0.98]">
            <Link to="/login">Sign up now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
