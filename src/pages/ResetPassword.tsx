import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase redirects with access_token and type=recovery in the URL hash
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1)); // Remove '#'
    const accessToken = params.get('access_token');
    const type = params.get('type');

    if (accessToken && type === 'recovery') {
      // Temporarily set the session from the URL hash to allow password update
      // The Auth component usually handles this, but for direct password reset,
      // we ensure the client is aware of the session.
      // Supabase's `updateUser` will use the current session, which should be
      // set by the recovery token in the URL.
      showSuccess("Please set your new password.");
    } else {
      showError("Invalid password reset link or token not found.");
      navigate('/login');
    }
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      showError(`Password reset failed: ${error.message}`);
      console.error("[ResetPassword] Password update error:", error);
    } else {
      showSuccess("Your password has been reset successfully! Please log in with your new password.");
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/90 border-4 border-primary/80 shadow-2xl shadow-primary/40 relative overflow-hidden">
        {/* Subtle CRT glow overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        </div>
        <CardHeader className="text-center p-6 border-b-2 border-primary/50 relative z-10">
          <CardTitle className={cn("text-3xl font-mono tracking-widest text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.8)]", "text-glow-intense")}>
            RESET PASSWORD
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 relative z-10">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-primary/90 font-mono">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-input border-primary/50 text-foreground font-mono focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-primary/90 font-mono">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-input border-primary/50 text-foreground font-mono focus:ring-primary focus:border-primary"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-lg shadow-lg shadow-primary/30" disabled={loading}>
              {loading ? 'RESETTING...' : 'RESET PASSWORD'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;