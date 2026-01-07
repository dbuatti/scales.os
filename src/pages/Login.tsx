import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils'; // Import cn for utility classes

const Login: React.FC = () => {
  const { session, isLoading } = useSupabaseSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && session) {
      // Redirect authenticated users to the home page
      navigate('/', { replace: true });
    }
  }, [session, isLoading, navigate]);

  if (isLoading || session) {
    // Show a loading state or nothing while checking session/redirecting
    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
            <p className="text-primary font-mono">Loading...</p>
        </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/90 border-4 border-primary/80 shadow-2xl shadow-primary/40 relative overflow-hidden">
        {/* Subtle CRT glow overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        </div>
        <CardHeader className="text-center p-6 border-b-2 border-primary/50 relative z-10">
          <CardTitle className={cn("text-3xl font-mono tracking-widest text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.8)]", "text-glow-intense")}>
            SCALES.OS LOGIN
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 relative z-10">
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
                    inputBackground: 'hsl(var(--input))',
                    inputBorder: 'hsl(var(--border))',
                    inputBorderHover: 'hsl(var(--primary))',
                    inputBorderFocus: 'hsl(var(--primary))',
                    anchorTextColor: 'hsl(var(--primary))',
                    anchorTextHoverColor: 'hsl(var(--primary)/0.8)',
                  },
                },
              },
            }}
            theme="dark"
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