import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  ArrowRight,
  BookOpen,
  Check,
  Gauge,
  GraduationCap,
  Layers,
  LineChart,
  Lock,
  Music,
  Play,
  ShieldCheck,
  Target,
  Timer,
  Users,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Reveal from '@/components/landing/Reveal';
import ProductPreview from '@/components/landing/ProductPreview';
import MobileCtaBar from '@/components/MobileCtaBar';
import { track } from '@/lib/analytics';

const METHOD_BOOKS = ['Hanon', 'Dohnányi', 'Czerny', 'Schmitt', 'Burgmüller', 'Your PDFs'];

const PAINS = [
  {
    title: 'The metronome forgets',
    body: 'You set a tempo, play it through, close the app. Tomorrow you start from memory — and memory rounds down.',
  },
  {
    title: 'Your books live in another app',
    body: 'Hanon in a PDF reader, tempo in a metronome, progress in your head. Three windows, no thread between them.',
  },
  {
    title: 'Progress is a feeling',
    body: 'Without a log, a breakthrough and a plateau look identical. You cannot fix what you cannot see.',
  },
];

const STEPS = [
  {
    title: 'Choose the permutation',
    body: 'Key, type, articulation, rhythm, hand configuration, octaves. If a teacher can ask for it, it is one tap away — or let the curriculum choose for you.',
  },
  {
    title: 'Practice with the metronome',
    body: 'Tap a tempo, set subdivisions, let it auto-increment every few bars. The BPM you actually play is the BPM that gets saved.',
  },
  {
    title: 'Save it. Watch it climb.',
    body: 'Every session is logged against a goal. The chart shows the line going up — or tells you exactly where to pivot when it stalls.',
  },
];

const PERMUTATION_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];

const PERSONAS = [
  {
    icon: Music,
    title: 'The returning adult',
    body: 'You played as a kid. You do not need nursery rhymes — you need a system that respects the hour you actually have.',
    fit: 'Adults rebuilding technique',
  },
  {
    icon: GraduationCap,
    title: 'The serious student',
    body: 'You have a teacher and a syllabus. You need the repetitions, and proof that you did them between lessons.',
    fit: 'Students working to a grade',
  },
  {
    icon: Users,
    title: 'The teacher',
    body: 'You want to know what actually happened between lessons. Studio — shared libraries and student reports — is next on the roadmap.',
    fit: 'Teachers with multiple students',
  },
];

const FAQS = [
  {
    q: 'Is this a piano lesson app?',
    a: 'No. Scales.os assumes you already know what to practice — from a teacher, a method book or a syllabus. It is built for the practice itself: the repetitions, the tempo and the record of them.',
  },
  {
    q: 'Do I need a teacher to use it?',
    a: 'No, but it is designed to support one. The curriculum grades take you from single-octave fundamentals to professional-level permutations, and every session is logged so a teacher can see exactly what you did.',
  },
  {
    q: 'Which method books work?',
    a: 'Any PDF you own. Hanon, Dohnányi, Czerny, Schmitt and Burgmüller are common, but you can upload your own editions, map pages to exercises and open them straight from the practice screen.',
  },
  {
    q: 'Does it work on an iPad?',
    a: 'Yes. Scales.os is an installable web app — add it to your home screen and it behaves like a native app, with your PDFs cached for offline practice.',
  },
  {
    q: 'Is my practice data private?',
    a: 'Your logs, goals and uploads belong to your account. Method books are user-uploaded and are not shared or resold. You can clear all of your practice data at any time from Progress.',
  },
  {
    q: 'Can I cancel Pro?',
    a: 'Any time, in one click. The free tier stays free forever, and everything you have practiced remains yours.',
  },
];

const PRICING = {
  monthly: { pro: '$5', suffix: '/month', note: 'Billed monthly. Cancel anytime.' },
  annual: { pro: '$49', suffix: '/year', note: 'About $4.08/month — two months free.' },
};

const LandingPage: React.FC = () => {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const pro = PRICING[billing];

  useEffect(() => {
    track('landing_view');
  }, []);

  return (
    <div className="bg-background">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="grid-paper pointer-events-none absolute inset-0 -z-10" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-48 left-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:pb-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              For pianists who practice with intent
            </span>

            <h1 className="mt-6 font-display text-[2.9rem] leading-[0.98] tracking-[-0.03em] sm:text-6xl xl:text-7xl">
              Your technique,
              <br />
              <em className="italic text-primary">measured.</em>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Scales, arpeggios and your Hanon or Dohnányi books in one focused workspace — with a
              metronome that follows your tempo and a log that proves you are improving.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="h-12 px-6 text-[15px] font-bold shadow-sm">
                <Link to="/login" onClick={() => track('signup_click', { location: 'hero' })}>
                  <Play className="mr-2 size-4 fill-current" aria-hidden="true" />
                  Start free
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 px-5 text-[15px] font-semibold">
                <a href="#how">
                  See how it works
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </a>
              </Button>
            </div>

            <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
              {['Free forever tier', 'No card required', 'iPad & desktop'].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Reveal delay={120} className="lg:pl-4">
            <ProductPreview />
          </Reveal>
        </div>
      </section>

      {/* ── Method strip ─────────────────────────────────────── */}
      <section aria-label="Method books" className="border-y border-border/60 bg-card/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Built for the books you already own
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {METHOD_BOOKS.map((book) => (
              <li key={book} className="font-display text-lg italic text-foreground/65">
                {book}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Problem ──────────────────────────────────────────── */}
      <section id="why" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <Reveal>
          <p className="eyebrow">The problem</p>
          <h2 className="mt-5 max-w-3xl font-display text-4xl leading-[1.05] tracking-[-0.02em] sm:text-5xl">
            Practice is the only part of piano you can&apos;t fake.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Most apps teach you songs. None of them tell you whether your technique is actually
            getting better — or what to do next when it stops.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PAINS.map((pain, index) => (
            <Reveal key={pain.title} delay={index * 80}>
              <div className="surface h-full p-6">
                <span className="font-display text-3xl italic leading-none text-primary/35">
                  0{index + 1}
                </span>
                <h3 className="mt-5 text-lg font-bold tracking-tight">{pain.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pain.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how" className="border-y border-border/60 bg-muted/25">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] tracking-[-0.02em] sm:text-5xl">
              A practice loop that closes.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Three steps, every session. The loop is the product.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 90}>
                <div className="relative h-full">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-5xl italic leading-none text-primary/30">
                      0{index + 1}
                    </span>
                    <span className="h-px flex-1 bg-border/70" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">The workspace</p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] tracking-[-0.02em] sm:text-5xl">
            Everything the loop needs.
            <br className="hidden sm:block" /> Nothing it doesn&apos;t.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-6">
          {/* Tempo progression — wide */}
          <Reveal className="lg:col-span-4">
            <div className="surface relative h-full overflow-hidden p-6 sm:p-7">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl"
              />
              <div className="relative flex h-full flex-col justify-between gap-8 sm:flex-row sm:items-end">
                <div className="max-w-sm">
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-inset ring-primary/10">
                    <LineChart className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Tempo, on the record</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Every saved BPM is plotted against its goal. See the climb, spot the plateau,
                    and know exactly which exercise earned the next level.
                  </p>
                </div>
                <div className="flex h-28 w-full items-end gap-1.5 sm:w-56" aria-hidden="true">
                  {[34, 42, 38, 52, 58, 54, 68, 74, 70, 84, 92, 100].map((height, index) => (
                    <div
                      key={index}
                      style={{ height: `${height}%`, animationDelay: `${index * 45}ms` }}
                      className={cn(
                        'flex-1 rounded-t-[3px] animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500',
                        index > 8 ? 'bg-primary' : 'bg-primary/25',
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Permutations */}
          <Reveal delay={70} className="lg:col-span-2">
            <div className="surface h-full p-6 sm:p-7">
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-inset ring-primary/10">
                <Layers className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Every permutation</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                12 keys × 8 scale and arpeggio types × 5 articulations × 5 rhythms × 5 hand
                configurations × 4 octave ranges.
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5" aria-hidden="true">
                {PERMUTATION_KEYS.map((key) => (
                  <span
                    key={key}
                    className="tnum rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-[11px] font-bold text-muted-foreground"
                  >
                    {key}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Metronome */}
          <Reveal delay={40} className="lg:col-span-2">
            <div className="surface h-full p-6 sm:p-7">
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-inset ring-primary/10">
                <Timer className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">A metronome that follows you</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Tap tempo, subdivisions and auto-increment — the click and the record are the same
                number.
              </p>
            </div>
          </Reveal>

          {/* Method books */}
          <Reveal delay={90} className="lg:col-span-2">
            <div className="surface h-full p-6 sm:p-7">
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-inset ring-primary/10">
                <BookOpen className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Your method books, in the loop</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Open Hanon or Dohnányi from the practice screen, map pages to exercises, and keep
                the score beside your tempo.
              </p>
            </div>
          </Reveal>

          {/* Curriculum */}
          <Reveal delay={140} className="lg:col-span-2">
            <div className="surface h-full p-6 sm:p-7">
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-inset ring-primary/10">
                <Target className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">A curriculum with a spine</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Ten graded levels, mastery thresholds, and a stasis state when something is too
                hard — so plateaus become decisions, not guesses.
              </p>
            </div>
          </Reveal>

          {/* Privacy + offline — wide */}
          <Reveal delay={60} className="lg:col-span-6">
            <div className="surface grid gap-6 p-6 sm:p-7 md:grid-cols-2 md:items-center">
              <div className="flex items-start gap-4">
                <div className="inline-flex shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-inset ring-primary/10">
                  <Lock className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Private by default</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Your logs, goals and uploads belong to your account. Books you add are never
                    shared or resold, and you can erase your practice history at any time.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 md:border-l md:border-border/60 md:pl-6">
                <div className="inline-flex shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-inset ring-primary/10">
                  <WifiOff className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Offline by design</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Install it on an iPad or laptop and practice without a signal. PDFs are cached
                    so the score opens when the studio Wi-Fi does not.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Pull quote ───────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 md:py-24">
          <Reveal>
            <p className="font-display text-3xl italic leading-snug tracking-[-0.01em] sm:text-4xl">
              “Practice is a measurement problem.
              <br className="hidden sm:block" /> Scales.os makes it measurable.”
            </p>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              The idea behind the product
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Who it's for ─────────────────────────────────────── */}
      <section id="who" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Who it&apos;s for</p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] tracking-[-0.02em] sm:text-5xl">
            Built for the pianist who already knows what to practice.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PERSONAS.map((persona, index) => {
            const Icon = persona.icon;
            return (
              <Reveal key={persona.title} delay={index * 80}>
                <div className="surface flex h-full flex-col p-6">
                  <div className="mb-4 inline-flex w-fit rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-inset ring-primary/10">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">{persona.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {persona.body}
                  </p>
                  <p className="mt-5 border-t border-border/60 pt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {persona.fit}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section id="pricing" className="border-y border-border/60 bg-muted/25">
        <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 md:py-28">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow justify-center">Pricing</p>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] tracking-[-0.02em] sm:text-5xl">
              Less than one lesson.
              <br className="hidden sm:block" /> Every session you log.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Start free. Upgrade when the method-book workflow becomes part of your routine.
            </p>
          </Reveal>

          <div className="mt-10 flex justify-center">
            <div
              role="group"
              aria-label="Billing period"
              className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/70 p-1 backdrop-blur"
            >
              {(['monthly', 'annual'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setBilling(option)}
                  aria-pressed={billing === option}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-bold capitalize transition-all duration-200',
                    billing === option
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {option}
                  {option === 'annual' && (
                    <span className={cn('ml-1.5 text-[10px] font-bold', billing === option ? 'text-primary-foreground/80' : 'text-primary')}>
                      −18%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-5 md:grid-cols-2">
            {/* Free */}
            <Reveal>
              <div className="surface flex h-full flex-col p-6 sm:p-7">
                <h3 className="text-lg font-bold">Free</h3>
                <p className="mt-1 text-sm text-muted-foreground">Everything you need to start practising deliberately.</p>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="tnum font-display text-5xl leading-none tracking-tight">$0</span>
                  <span className="text-sm text-muted-foreground">forever</span>
                </div>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {[
                    'Scales, arpeggios & metronome',
                    'Tempo logging & progress history',
                    'Up to 2 PDF method books',
                    'Core grade curriculum',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="mt-7 w-full font-bold">
                  <Link to="/login" onClick={() => track('signup_click', { location: 'pricing' })}>
                    Start free
                  </Link>
                </Button>
              </div>
            </Reveal>

            {/* Pro */}
            <Reveal delay={80}>
              <div className="surface relative flex h-full flex-col border-primary/40 p-6 ring-1 ring-primary/25 sm:p-7">
                <Badge className="absolute -top-3 left-6">Best value</Badge>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold">Pro</h3>
                  <Gauge className="size-4 text-primary" aria-hidden="true" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">For the full method-book workflow.</p>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="tnum font-display text-5xl leading-none tracking-tight">{pro.pro}</span>
                  <span className="text-sm text-muted-foreground">{pro.suffix}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{pro.note}</p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {[
                    'Unlimited PDF books & bookmarks',
                    'Page-to-exercise mapping',
                    'Full BPM progression history',
                    'All 10 grades & custom exercises',
                    'Cross-device sync',
                    'Priority support',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-7 w-full font-bold">
                  <Link to="/pro" onClick={() => track('pro_click', { location: 'pricing' })}>
                    Go Pro
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>

          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" /> Cancel anytime
            </span>
            <span aria-hidden="true">·</span>
            <span>Prices in USD</span>
            <span aria-hidden="true">·</span>
            <span>No card required to start</span>
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 md:py-28">
        <Reveal>
          <p className="eyebrow">Questions</p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] tracking-[-0.02em] sm:text-5xl">
            The honest answers.
          </h2>
        </Reveal>

        <Reveal delay={80} className="mt-10">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.q} value={`faq-${index}`} className="border-border/60">
                <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline hover:text-primary">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-border/60">
        <div aria-hidden="true" className="grid-paper pointer-events-none absolute inset-0 -z-10 opacity-80" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 left-1/2 -z-10 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center sm:px-6 md:py-28">
          <Reveal>
            <p className="eyebrow justify-center">Start today</p>
            <h2 className="mt-5 font-display text-4xl leading-[1.02] tracking-[-0.02em] sm:text-5xl md:text-6xl">
              Your next tempo record
              <br className="hidden sm:block" /> is waiting.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Create an account, add a book, and log your first session in under two minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-7 text-[15px] font-bold shadow-sm">
                <Link to="/login" onClick={() => track('signup_click', { location: 'final_cta' })}>
                  Start free
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 px-5 text-[15px] font-semibold">
                <a href="#pricing">Compare plans</a>
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">Free forever tier · No card required</p>
          </Reveal>
        </div>
      </section>

      <MobileCtaBar />
    </div>
  );
};

export default LandingPage;