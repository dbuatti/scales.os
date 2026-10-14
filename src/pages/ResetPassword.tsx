import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Link2Off, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { passwordResetSchema } from '@/lib/validation/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';

const ResetPassword: React.FC = () => {
  const { session, isLoading } = useSupabaseSession();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
        <Card className="surface w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader className="space-y-2 p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Link2Off className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-black tracking-tight">Link expired</CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired. Request a new one from the sign-in page.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Button className="w-full font-bold focus-scale" onClick={() => navigate('/login')}>
              Back to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = passwordResetSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setFormError(result.error.issues[0].message);
      return;
    }

    setFormError(null);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      showError(`Password reset failed: ${error.message}`);
      console.error('[ResetPassword] Password update error:', error);
      return;
    }

    showSuccess('Your password has been updated.');
    navigate('/', { replace: true });
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <Card className="surface w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300">
        <CardHeader className="space-y-2 p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-black tracking-tight">Reset password</CardTitle>
            <CardDescription>Choose a new password for your account.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={formError !== null}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={formError !== null}
                disabled={loading}
              />
            </div>
            {formError && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {formError}
              </p>
            )}
            <Button type="submit" className="w-full font-bold focus-scale" disabled={loading}>
              {loading ? 'Updating…' : 'Reset password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
