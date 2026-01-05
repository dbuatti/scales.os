import React from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { Skeleton } from '@/components/ui/skeleton';

import AppLayout from './AppLayout';
import AuthenticatedShell from './AuthenticatedShell';
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Index from '@/pages/Index';
import ProgressPage from '@/pages/Progress';
import NotFound from '@/pages/NotFound';

// Wrapper component to provide children to AppLayout for public routes
const PublicLayoutWrapper: React.FC = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
);

const AuthRouter: React.FC = () => {
  const { session, isLoading } = useSupabaseSession();

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-8">
        <Skeleton className="w-full max-w-6xl h-[600px] bg-card/50" />
      </div>
    );
  }

  if (session) {
    // User is authenticated, render protected routes
    return (
      <Routes>
        <Route element={<AuthenticatedShell />}>
          <Route path="/" element={<Index />} />
          <Route path="/progress" element={<ProgressPage />} />
        </Route>
        {/* Redirect any public routes to authenticated home if logged in */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} /> {/* Catch-all for protected routes */}
      </Routes>
    );
  } else {
    // User is not authenticated, render public routes
    return (
      <Routes>
        <Route element={<PublicLayoutWrapper />}> {/* Use the wrapper here */}
          <Route path="/login" element={<Login />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/" element={<LandingPage />} /> {/* Default public route */}
        </Route>
        {/* Redirect any protected routes to login if not logged in */}
        <Route path="/progress" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} /> {/* Catch-all for public routes */}
      </Routes>
    );
  }
};

export default AuthRouter;