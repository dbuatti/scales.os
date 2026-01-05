import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
      <Card className="w-full max-w-md bg-card/90 border-primary/50 shadow-2xl shadow-primary/30">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-mono tracking-widest text-primary">
            SCALES.OS LOGIN
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            providers={[]}
            // Ensure password recovery redirects to the new ResetPassword page
            redirectTo={window.location.origin + '/reset-password'} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;