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
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <Card className="surface w-full max-w-md shadow-md">
        <CardHeader className="space-y-1.5 p-6 text-center">
          <div className="mx-auto mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Music className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome to Scales</CardTitle>
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
