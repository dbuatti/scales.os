import React, { useState } from 'react';
import { Check, Copy, Database, ExternalLink, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { env } from '@/lib/env';
import { showError, showSuccess } from '@/utils/toast';
import migrationSql from '../../supabase/migrations/0003_entitlements.sql?raw';

const projectRef = (() => {
  try {
    return new URL(env.VITE_SUPABASE_URL).hostname.split('.')[0];
  } catch {
    return 'your-project-ref';
  }
})();

const ADMIN_SQL = `insert into public.admin_emails (email)
values ('you@example.com')
on conflict (email) do nothing;`;

const DB_URL = `postgresql://postgres:[PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`;

interface CopyRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

const CopyRow: React.FC<CopyRowProps> = ({ label, value, mono = true }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      showSuccess('Copied.');
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      showError('Could not access the clipboard.');
    }
  };

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="flex items-stretch gap-2">
        <pre
          className={
            mono
              ? 'min-w-0 flex-1 overflow-x-auto rounded-lg border border-border/60 bg-muted/35 px-3 py-2 text-left text-[11px] leading-relaxed text-foreground/80'
              : 'min-w-0 flex-1 truncate rounded-lg border border-border/60 bg-muted/35 px-3 py-2 text-left text-[11px] text-foreground/80'
          }
        >
          {value}
        </pre>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="size-9 shrink-0"
        >
          {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
        </Button>
      </div>
    </div>
  );
};

const Step: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <div className="flex gap-3">
    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-black text-primary">
      {n}
    </span>
    <div className="min-w-0 flex-1 space-y-2">
      <p className="text-sm font-bold leading-snug">{title}</p>
      {children}
    </div>
  </div>
);

export const SetupContent: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] p-4">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
      <p className="text-xs leading-relaxed text-muted-foreground">
        <span className="font-bold text-foreground">Least privilege is the point.</span> I only need
        the migration and one admin row. Don&apos;t paste a <code className="font-mono">service_role</code>{' '}
        key — it bypasses RLS and can read every user&apos;s data.
      </p>
    </div>

    <div className="space-y-2 rounded-xl border border-border/60 bg-card/50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Project</p>
      <p className="font-mono text-sm font-bold">{projectRef}</p>
      <a
        href={`https://supabase.com/dashboard/project/${projectRef}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        Open the dashboard
        <ExternalLink className="size-3.5" />
      </a>
    </div>

    <div className="space-y-5">
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">A</span>
          You run it — no access shared
        </p>
        <Step n={1} title="Open the SQL editor">
          <a
            href={`https://supabase.com/dashboard/project/${projectRef}/sql/new`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            New query
            <ExternalLink className="size-3.5" />
          </a>
        </Step>
        <Step n={2} title="Paste and run the migration">
          <CopyRow label="Migration SQL" value={migrationSql} />
        </Step>
        <Step n={3} title="Make yourself an admin">
          <CopyRow label="Admin insert" value={ADMIN_SQL} />
          <p className="text-[11px] text-muted-foreground">
            Replace <code className="font-mono">you@example.com</code> with your login email first.
          </p>
        </Step>
      </div>

      <div className="space-y-2 border-t border-border/60 pt-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">B</span>
          I run it — temporary database URL
        </p>
        <Step n={1} title="Copy the connection string template">
          <CopyRow label="Database URI" value={DB_URL} />
        </Step>
        <Step n={2} title="Save it to a local file">
          <pre className="overflow-x-auto rounded-lg border border-border/60 bg-muted/35 px-3 py-2 text-left text-[11px] leading-relaxed text-foreground/80">
{`cat > ~/.supabase-db-url <<'EOF'
${DB_URL.replace('[PASSWORD]', 'YOUR_PASSWORD')}
EOF
chmod 600 ~/.supabase-db-url`}
          </pre>
        </Step>
        <Step n={3} title="Tell me it's ready">
          <p className="text-xs leading-relaxed text-muted-foreground">
            I&apos;ll run the migration with <code className="font-mono">psql</code>, verify it, delete
            the file, and you rotate the database password afterward.
          </p>
        </Step>
      </div>

      <div className="space-y-2 border-t border-border/60 pt-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">C</span>
          I run it — temporary access token
        </p>
        <Step n={1} title="Generate a scoped token">
          <a
            href="https://supabase.com/dashboard/account/tokens"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            Access tokens
            <ExternalLink className="size-3.5" />
          </a>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Scope it to project <code className="font-mono">{projectRef}</code> with{' '}
            <span className="font-semibold text-foreground">Database: read-write</span> only. Skip
            billing, org and storage permissions.
          </p>
        </Step>
        <Step n={2} title="Store it in your Keychain (preferred)">
          <pre className="overflow-x-auto rounded-lg border border-border/60 bg-muted/35 px-3 py-2 text-left text-[11px] leading-relaxed text-foreground/80">
{`security add-generic-password -a "$USER" \
  -s scales-supabase-token -w 'sbp_...' \
  -T /usr/bin/security`}
          </pre>
          <p className="text-[11px] text-muted-foreground">
            Or use a file: <code className="font-mono">echo 'sbp_...' &gt; ~/.supabase-token && chmod 600 ~/.supabase-token</code>
          </p>
        </Step>
        <Step n={3} title="Tell me it's ready">
          <p className="text-xs leading-relaxed text-muted-foreground">
            I&apos;ll run the migration through the Management API and verify it. Revoke the token
            when you&apos;re done — scoped tokens are safer than account-wide ones, but still real
            access.
          </p>
        </Step>
      </div>
    </div>

    <div className="space-y-2 rounded-xl border border-border/60 bg-muted/25 p-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
        <Database className="size-3.5" />
        What I&apos;ll do with access
      </p>
      <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
        <li>Run <code className="font-mono">0003_entitlements.sql</code> only.</li>
        <li>Insert your admin email.</li>
        <li>Verify the tables, RLS policies and triggers.</li>
        <li>Delete the temporary credential and report back.</li>
      </ul>
      <p className="text-[11px] leading-relaxed text-muted-foreground/80">
        I won&apos;t touch existing rows, storage files, auth providers, or any other project.
      </p>
    </div>
  </div>
);

const SetupPanel: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 h-10 gap-2 rounded-full border-border/70 bg-card/90 px-4 text-xs font-bold shadow-lg shadow-primary/10 backdrop-blur"
      >
        <KeyRound className="size-4 text-primary" />
        Supabase setup
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close setup panel"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Supabase setup"
            className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border/60 bg-background p-6 shadow-2xl animate-in slide-in-from-right duration-300"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Setup</p>
                <h2 className="mt-1.5 font-display text-2xl leading-tight tracking-tight">
                  Give Scales.os Supabase access
                </h2>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                <span aria-hidden="true" className="text-lg leading-none">×</span>
              </Button>
            </div>

            <SetupContent />

            <p className="mt-6 border-t border-border/60 pt-4 text-[10px] text-muted-foreground/70">
              Open this panel on any page with <code className="font-mono">?setup=1</code>.
            </p>
          </aside>
        </div>
      )}
    </>
  );
};

export default SetupPanel;