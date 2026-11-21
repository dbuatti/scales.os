import React from 'react';
import PageContainer from '@/components/PageContainer';
import PageHeader from '@/components/PageHeader';
import { Mail } from 'lucide-react';
import { SUPPORT_EMAIL, supportMailto } from '@/lib/support';

type LegalKind = 'privacy' | 'terms';

interface LegalSection {
  heading: string;
  paragraphs: string[];
}

const CONTENT: Record<LegalKind, { title: string; description: string; sections: LegalSection[] }> = {
  privacy: {
    title: 'Privacy',
    description:
      'What Scales.os stores, why it stores it, and how to get it deleted. Short version: your practice data is yours.',
    sections: [
      {
        heading: 'What we store',
        paragraphs: [
          'Your account email and the practice data you create: scales and exercises you practice, tempo snapshots, goals, mastery levels, and the method books you upload.',
          'If you upgrade, your payment provider (Stripe, or a merchant of record if enabled) processes the transaction. Card details never touch our servers.',
        ],
      },
      {
        heading: 'Why we store it',
        paragraphs: [
          'To show your progress, remember where you left off, sync your library across devices, and restore your data when you sign in elsewhere.',
          'We do not sell your data, and we do not use your practice history for advertising.',
        ],
      },
      {
        heading: 'Where it lives',
        paragraphs: [
          'Account and practice data are stored in Supabase (database and file storage). The app is hosted on Vercel. Both act as our processors.',
          'Analytics are limited to what is needed to keep the service reliable. There are no third-party advertising trackers.',
        ],
      },
      {
        heading: 'Your controls',
        paragraphs: [
          'You can clear your practice history at any time from Settings → Danger zone → Clear all practice data.',
          'You can delete all of your Scales data yourself from Settings → Danger zone → Delete my Scales account. This removes your history, uploaded method books, page mappings and Pro access.',
          'Your sign-in is shared with another app, so deleting your Scales data does not delete the login itself. If you also need the login removed, email us from the address you signed up with.',
        ],
      },
      {
        heading: 'Method books you upload',
        paragraphs: [
          'Uploads are private to your account. We do not share, resell, or use your PDFs to train anything. You are responsible for holding the rights to the material you upload.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Questions about this policy, or a data request? Email us using the address below.',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms',
    description:
      'The plain-language agreement for using Scales.os. No dark patterns, no surprise renewals.',
    sections: [
      {
        heading: 'Your account',
        paragraphs: [
          'You need an account to use Scales.os. Keep your login credentials secure — you are responsible for activity under your account.',
          'You must be old enough to enter a contract in your country. If you are under 16, use Scales.os with a parent or guardian.',
        ],
      },
      {
        heading: 'Free and Pro',
        paragraphs: [
          'The free tier includes the practice loop, the metronome, basic progress tracking and up to two cloud method books.',
          'Pro unlocks unlimited method books, page mapping, the full grade curriculum, the complete tempo history and cross-device sync.',
          'Paid plans renew automatically until cancelled. Cancel any time; access continues until the end of the paid period. Prices are shown before you pay and may change with notice.',
        ],
      },
      {
        heading: 'Acceptable use',
        paragraphs: [
          'Use Scales.os for your own practice. Do not upload material you do not have the rights to, attempt to break the service, resell access, or use it to harass anyone.',
          'We may suspend accounts that abuse the service or put its infrastructure at risk.',
        ],
      },
      {
        heading: 'Your content',
        paragraphs: [
          'You keep ownership of the PDFs and notes you upload. You grant us the limited permission needed to store and display them back to you.',
        ],
      },
      {
        heading: 'Availability and changes',
        paragraphs: [
          'We work hard to keep Scales.os available, but it is provided “as is” without warranties. We may change or discontinue features; if a change materially affects a paid plan, we will tell you first.',
          'We may update these terms. Continued use after an update means you accept the new version.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Questions about these terms? Email us using the address below.',
        ],
      },
    ],
  },
};

const Legal: React.FC<{ kind: LegalKind }> = ({ kind }) => {
  const content = CONTENT[kind];

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader eyebrow="Legal" title={content.title} description={content.description} />

      <div className="surface space-y-8 p-6 sm:p-8">
        {content.sections.map((section) => (
          <section key={section.heading} className="space-y-2.5">
            <h2 className="text-base font-bold tracking-tight">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        {SUPPORT_EMAIL && (
          <a
            href={supportMailto(kind === 'privacy' ? 'Privacy request' : 'Terms question') ?? undefined}
            className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-4 shadow-sm transition-all duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <Mail className="size-4" aria-hidden="true" />
            </span>
            <span className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact</span>
              <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                {SUPPORT_EMAIL}
              </span>
            </span>
          </a>
        )}

        <p className="border-t border-border/60 pt-6 text-xs text-muted-foreground/70">
          Last updated November 2026.
        </p>
      </div>
    </PageContainer>
  );
};

export default Legal;