import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  // If true, only show content if NOT authenticated (e.g., Login page)
  isPublic?: boolean; 
}

const AuthGuard: React.FC<AuthGuardProps> = ({ isPublic = false }) => {
  const { session, isLoading } = useSupabaseSession();

  console.log("[AuthGuard] isLoading:", isLoading, "session:", session, "isPublic:", isPublic);

  if (isLoading) {
    console.log("[AuthGuard] Rendering Skeleton (Loading session)");
    // Show a full-screen loading skeleton while checking session
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-8">
        <Skeleton className="w-full max-w-6xl h-[600px] bg-card/50" />
      </div>
    );
  }

  if (isPublic) {
    // If public route (like login) and user is logged in, redirect to home
    if (session) {
      console.log("[AuthGuard] Public route, user logged in, redirecting to /");
      return <Navigate to="/" replace />;
    }
    // Otherwise, render the public content (Login page)
    console.log("[AuthGuard] Public route, user not logged in, rendering Outlet");
    return <Outlet />;
  }

  // Protected route: If user is NOT logged in, redirect to login
  if (!session) {
    console.log("[AuthGuard] Protected route, user not logged in, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  // If logged in, render the protected content
  console.log("[AuthGuard] Protected route, user logged in, rendering Outlet");
  return <Outlet />;
};

export default AuthGuard;