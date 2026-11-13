import React from 'react';
import PageContainer from '@/components/PageContainer';
import PageHeader from '@/components/PageHeader';

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
          'You can clear all practice data at any time from Progress → History → Clear all practice data.',
          'To delete your account and everything associated with it, email the address on your account receipt or contact us from the email you signed up with. We will delete it within 30 days.',
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
          'Questions about this policy? Reach us through the support address on your account or the contact link in the app footer.',
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
          'Questions about these terms? Reach us through the support address on your account or the contact link in the app footer.',
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

        <p className="border-t border-border/60 pt-6 text-xs text-muted-foreground/70">
          Last updated November 2026.
        </p>
      </div>
    </PageContainer>
  );
};

export default Legal;