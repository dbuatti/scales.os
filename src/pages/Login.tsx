import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2, Music } from 'lucide-react';
import { useTheme } from 'next-themes';
import { track } from '@/lib/analytics';

const DARK_THEMES = ['dark', 'retro-terminal'];

const HIGHLIGHTS = [
  'Every permutation, one tap away',
  'A metronome that remembers your tempo',
  'Your Hanon and Dohnányi books in the loop',
];

const Login: React.FC = () => {
  const { session, isLoading } = useSupabaseSession();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    track('login_view');
  }, []);

  useEffect(() => {
    if (!isLoading && session) {
      navigate('/', { replace: true });
    }
  }, [session, isLoading, navigate]);

  if (isLoading || session) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl items-stretch">
      {/* Brand panel */}
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-border/60 bg-muted/20 p-12 lg:flex">
        <div aria-hidden="true" className="grid-paper pointer-events-none absolute inset-0 opacity-70" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-1/3 size-72 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/25">
            <Music className="size-4" aria-hidden="true" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Scales
            <span className="ml-0.5 align-super text-[9px] font-bold uppercase tracking-[0.18em] text-primary/70">
              os
            </span>
          </span>
        </div>

        <div className="relative max-w-md">
          <p className="eyebrow">Welcome</p>
          <h1 className="mt-5 font-display text-5xl leading-[1.02] tracking-[-0.02em]">
            Practice,
            <br />
            <em className="italic text-primary">on the record.</em>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Sign in to pick up exactly where your tempo left off — goals, books and all.
          </p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/80">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">
          Scales · Arpeggios · Method books
        </p>
      </aside>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/25">
              <Music className="size-4" aria-hidden="true" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Scales
              <span className="ml-0.5 align-super text-[9px] font-bold uppercase tracking-[0.18em] text-primary/70">
                os
              </span>
            </span>
          </div>

          <Card className="surface w-full shadow-lg shadow-primary/5">
            <CardHeader className="space-y-1.5 p-6 pb-2">
              <CardTitle className="font-display text-3xl font-normal tracking-tight">
                Sign in
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                New here? Create an account — the free tier is free forever.
              </p>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: 'hsl(var(--primary))',
                        brandAccent: 'hsl(var(--primary-foreground))',
                        defaultButtonBackground: 'hsl(var(--secondary))',
                        defaultButtonBackgroundHover: 'hsl(var(--secondary)/0.8)',
                        defaultButtonText: 'hsl(var(--foreground))',
                        inputBackground: 'hsl(var(--card))',
                        inputBorder: 'hsl(var(--border))',
                        inputBorderHover: 'hsl(var(--primary))',
                        inputBorderFocus: 'hsl(var(--primary))',
                        anchorTextColor: 'hsl(var(--primary))',
                        anchorTextHoverColor: 'hsl(var(--primary)/0.8)',
                      },
                      radii: {
                        borderRadiusButton: '0.625rem',
                        inputBorderRadius: '0.625rem',
                      },
                    },
                  },
                }}
                theme={DARK_THEMES.includes(resolvedTheme ?? '') ? 'dark' : 'default'}
                providers={['google']}
                redirectTo={window.location.origin + '/reset-password'}
              />
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            By continuing you agree to keep your practice honest.
            <br className="sm:hidden" /> Your data stays yours.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;