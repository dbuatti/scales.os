import React from 'react';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isAdmin } from '@/lib/admin';
import { ShieldAlert, Lock, TrendingUp, Users, Rocket, Target, BarChart3, Wallet, Map } from 'lucide-react';

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ icon, title, children }) => (
  <Card className="surface">
    <CardContent className="p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-lg bg-primary/10 p-1.5 text-primary">{icon}</span>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      </div>
      <div className="space-y-3 text-sm text-muted-foreground">{children}</div>
    </CardContent>
  </Card>
);

const BusinessPlan: React.FC = () => {
  const { session, isLoading } = useSupabaseSession();
  const email = session?.user?.email;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <Skeleton className="h-10 w-64 bg-card/50" />
        <Skeleton className="h-40 w-full bg-card/50" />
        <Skeleton className="h-40 w-full bg-card/50" />
      </div>
    );
  }

  if (!isAdmin(email)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Card className="surface">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="rounded-full bg-destructive/10 p-3 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold">Access restricted</h1>
            <p className="text-sm text-muted-foreground">
              This page is only available to administrators.
            </p>
            <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Signed in as <span className="font-semibold">{email ?? '—'}</span>
            </div>
            <p className="text-xs text-muted-foreground/70">
              To grant access, add this email to <span className="font-mono">VITE_ADMIN_EMAIL</span> in
              Vercel environment variables.
            </p>
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              Go back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Admin only
        </div>
        <h1 className="text-3xl font-black tracking-tight">Scales.os — Business Plan</h1>
        <p className="text-muted-foreground">
          Monetization and growth plan. Confidential — internal use.
        </p>
      </div>

      <Section icon={<Target className="h-4 w-4" />} title="Executive summary">
        <p>
          Scales.os is a practice companion for pianists: structured scales & arpeggios, a
          metronome tied to your tempo, and your method books (Hanon, Dohnányi) digitized as
          PDFs with page-to-exercise mapping. The wedge is the <strong>tempo log</strong> — every
          session is recorded, so users can watch their highest BPM climb and never lose progress.
        </p>
        <p>
          The product monetizes via a freemium subscription. Free is a generous, genuinely useful
          tier that drives acquisition; Pro unlocks the full method-book workflow and unlimited
          history. Target: solo pianists, students, and teachers.
        </p>
      </Section>

      <Section icon={<Wallet className="h-4 w-4" />} title="Revenue model">
        <ul className="list-inside list-disc space-y-2">
          <li>
            <strong>Free — $0.</strong> Scales & arpeggios, metronome, basic progress, up to 2 PDF
            books. The acquisition engine.
          </li>
          <li>
            <strong>Pro — $5/mo</strong> (or $49/yr, ~18% discount). Unlimited PDF books, page
            bookmarks & exercise mapping, full BPM progression history, all 10 grades, custom
            exercises, cross-device sync, priority support.
          </li>
          <li>
            <strong>Future — Studio — $15/mo.</strong> Multi-student dashboard, shared exercise
            libraries, and progress reports for teachers.
          </li>
        </ul>
        <p>
          The paywall is placed on <strong>quantity and history</strong>, not on the core practice
          loop — free users experience the full value first, then hit the "more books / more
          history" wall.
        </p>
      </Section>

      <Section icon={<Users className="h-4 w-4" />} title="Target market">
        <p>
          Primary: self-taught and student pianists (13–40) who already own method books. Secondary:
          piano teachers managing several students. Global, English-first, mobile/iPad-heavy.
        </p>
        <p>
          Positioning: "the PDF practice companion that remembers your tempo" — differentiated from
          generic PDF readers and generic metronome apps by the exercise-mapping + progression layer.
        </p>
      </Section>

      <Section icon={<Rocket className="h-4 w-4" />} title="Go-to-market">
        <ol className="list-inside list-decimal space-y-2">
          <li>Ship the free tier first; harden auth, RLS and payment.</li>
          <li>Launch as a <strong>Progressive Web App</strong> (no App Store dependency initially).</li>
          <li>Content-led growth: free scales/Hanon charts + practice-routine posts on piano communities.</li>
          <li>Integrate billing with Stripe Checkout (subscription + customer portal).</li>
          <li>Add referrals: "gift a month of Pro" for inviting another pianist.</li>
        </ol>
      </Section>

      <Section icon={<BarChart3 className="h-4 w-4" />} title="Key metrics">
        <ul className="list-inside list-disc space-y-2">
          <li>Activation: upload a PDF + log a snapshot within 24h.</li>
          <li>Retention: weekly active practice sessions (D7 / D30).</li>
          <li>Conversion: free → Pro (target 3–5%).</li>
          <li>Revenue: MRR, churn (&lt;5%/mo), LTV / CAC.</li>
        </ul>
      </Section>

      <Section icon={<Wallet className="h-4 w-4" />} title="Cost structure">
        <p>
          Lean by design: Supabase free tier (auth, DB, storage) until scale; Vercel free/hobby;
          Stripe fees (~2.9% + $0.30). Main variable cost is PDF storage + egress as the library
          grows. No server infra — client-side + Supabase only.
        </p>
      </Section>

      <Section icon={<Map className="h-4 w-4" />} title="Roadmap & risks">
        <p>
          <strong>Now → 90 days:</strong> payment integration, iOS/iPad App Store build, "Studio"
          teacher tier. <strong>Risks:</strong> App Store's 30% cut (mitigate with web signup +
          external payment), content copyright on shared books (keep user-uploaded only), and
          churn in a seasonal hobby market (mitigate with streaks + progress gamification).
        </p>
      </Section>
    </div>
  );
};

export default BusinessPlan;
