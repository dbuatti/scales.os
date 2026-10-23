import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Music } from 'lucide-react';
import { useTheme } from 'next-themes';

const DARK_THEMES = ['dark', 'retro-terminal'];

const Login: React.FC = () => {
  const { session, isLoading } = useSupabaseSession();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && session) {
      // Redirect authenticated users to the home page
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
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
      />
      <Card className="surface relative w-full max-w-md shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300">
        <CardHeader className="space-y-1.5 p-6 text-center">
          <div className="mx-auto mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/25">
            <Music className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight">Welcome to Scales</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to continue your practice.</p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary) / 0.9)',
                    defaultButtonBackground: 'hsl(var(--secondary))',
                    defaultButtonBackgroundHover: 'hsl(var(--muted))',
                    defaultButtonText: 'hsl(var(--foreground))',
                    inputBackground: 'hsl(var(--card))',
                    inputBorder: 'hsl(var(--border))',
                    inputBorderHover: 'hsl(var(--primary))',
                    inputBorderFocus: 'hsl(var(--primary))',
                    anchorTextColor: 'hsl(var(--primary))',
                    anchorTextHoverColor: 'hsl(var(--primary) / 0.8)',
                  },
                  radii: {
                    borderRadiusButton: '0.5rem',
                    inputBorderRadius: '0.5rem',
                  },
                },
              },
            }}
            theme={DARK_THEMES.includes(resolvedTheme ?? '') ? 'dark' : 'default'}
            providers={['google']}
            // Ensure password recovery redirects to the new ResetPassword page
            redirectTo={window.location.origin + '/reset-password'}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
