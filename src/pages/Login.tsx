import React, { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { track } from '@/lib/analytics';

const HIGHLIGHTS = [
  'Every permutation, one tap away',
  'A metronome that remembers your tempo',
  'Your Hanon and Dohnányi books in the loop',
];

const Login: React.FC = () => {
  const { session, isLoading } = useSupabaseSession();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  useEffect(() => {
    track('login_view');
  }, []);

  useEffect(() => {
    if (!isLoading && session) {
      navigate('/', { replace: true });
    }
  }, [session, isLoading, navigate]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setGoogleError(error.message);
      setGoogleLoading(false);
    }
  };

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

        {/* Spacer keeps the headline centred; the site header carries the brand. */}
        <div aria-hidden="true" />

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
          <div className="w-full rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="space-y-1.5 p-6 pb-2">
              <h1 className="font-display text-3xl font-normal tracking-tight">
                Sign in
              </h1>
              <p className="text-sm text-muted-foreground">
                New here? Create an account — the free tier is free forever.
              </p>
            </div>
            <div className="p-6 pt-4">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full font-semibold"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Continue with Google
              </Button>
              {googleError && (
                <p role="alert" className="mt-3 text-sm font-medium text-destructive">
                  Google sign-in failed: {googleError}
                </p>
              )}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
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
                theme="default"
                providers={[]}
                redirectTo={window.location.origin}
                localization={{
                  variables: {
                    sign_in: {
                      email_label: 'Email',
                      password_label: 'Password',
                      email_input_placeholder: 'you@example.com',
                      password_input_placeholder: 'Your password',
                      link_text: 'Already have an account? Sign in',
                    },
                    sign_up: {
                      email_label: 'Email',
                      password_label: 'Create a password',
                      email_input_placeholder: 'you@example.com',
                      password_input_placeholder: 'Choose a strong password',
                      button_label: 'Create free account',
                      link_text: "New here? Create a free account",
                    },
                    forgotten_password: {
                      email_label: 'Email',
                      email_input_placeholder: 'you@example.com',
                      link_text: 'Forgot your password?',
                    },
                  },
                }}
              />
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            By continuing you agree to our{' '}
            <Link to="/terms" className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline">
              Privacy policy
            </Link>
            . Your practice data stays yours.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
