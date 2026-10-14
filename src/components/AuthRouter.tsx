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
import ReaderPage from '@/pages/ReaderPage';
import BusinessPlan from '@/pages/BusinessPlan';
import NotFound from '@/pages/NotFound';
import ResetPassword from '@/pages/ResetPassword'; // Import the new ResetPassword page

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
      <main
        className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6 sm:p-8"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="flex w-full max-w-6xl flex-col gap-4" role="status">
          <span className="sr-only">Loading your workspace</span>
          <Skeleton className="h-8 w-48 bg-card/50" />
          <Skeleton className="h-[min(600px,calc(100vh-180px))] w-full bg-card/50" />
        </div>
      </main>
    );
  }

  if (session) {
    // User is authenticated, render protected routes
    return (
      <Routes>
        <Route element={<AuthenticatedShell />}>
          <Route path="/" element={<Index />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/reader" element={<ReaderPage />} />
          <Route path="/business-plan" element={<BusinessPlan />} />
          {/* Recovery links sign the user in, so this must stay reachable with a session */}
          <Route path="/reset-password" element={<ResetPassword />} />
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
          <Route path="/reset-password" element={<ResetPassword />} /> {/* New public route */}
        </Route>
        {/* Redirect any protected routes to login if not logged in */}
        <Route path="/progress" element={<Navigate to="/login" replace />} />
        <Route path="/reader" element={<Navigate to="/login" replace />} />
        <Route path="/business-plan" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} /> {/* Catch-all for public routes */}
      </Routes>
    );
  }
};

export default AuthRouter;
