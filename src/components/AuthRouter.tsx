import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { Skeleton } from '@/components/ui/skeleton';
import { track } from '@/lib/analytics';

import AppLayout from './AppLayout';
import AuthenticatedShell from './AuthenticatedShell';

// Route-level code splitting: the marketing page should not pay for the
// practice UI, charts, or PDF viewer.
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const Login = lazy(() => import('@/pages/Login'));
const Index = lazy(() => import('@/pages/Index'));
const ProgressPage = lazy(() => import('@/pages/Progress'));
const ProPage = lazy(() => import('@/pages/Pro'));
const ReaderPage = lazy(() => import('@/pages/ReaderPage'));
const BusinessPlan = lazy(() => import('@/pages/BusinessPlan'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Legal = lazy(() => import('@/pages/Legal'));
const Setup = lazy(() => import('@/pages/Setup'));

const RouteFallback: React.FC = () => (
  <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
    <div className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden="true" />
    <span className="sr-only">Loading</span>
  </div>
);

// Wrapper component to provide children to AppLayout for public routes
const PublicLayoutWrapper: React.FC = () => {
  const { pathname } = useLocation();
  const bleed = pathname === '/' || pathname === '/landing' || pathname === '/login';

  return (
    <AppLayout bleed={bleed}>
      <Outlet />
    </AppLayout>
  );
};

const AuthRouter: React.FC = () => {
  const { session, isLoading } = useSupabaseSession();
  const trackedSession = useRef(false);

  useEffect(() => {
    if (session && !trackedSession.current) {
      trackedSession.current = true;
      track('session_start');
    }
  }, [session]);

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

  const routes = session ? (
    <Routes>
      <Route element={<AuthenticatedShell />}>
        <Route path="/" element={<Index />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/pro" element={<ProPage />} />
        <Route path="/reader" element={<ReaderPage />} />
        <Route path="/business-plan" element={<BusinessPlan />} />
        {/* Recovery links sign the user in, so this must stay reachable with a session */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<Legal kind="privacy" />} />
        <Route path="/terms" element={<Legal kind="terms" />} />
        <Route path="/setup" element={<Setup />} />
      </Route>
      {/* Redirect any public routes to authenticated home if logged in */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/landing" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} /> {/* Catch-all for protected routes */}
    </Routes>
  ) : (
    <Routes>
      <Route element={<PublicLayoutWrapper />}>
        <Route path="/login" element={<Login />} />
        <Route path="/pro" element={<ProPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/" element={<LandingPage />} /> {/* Default public route */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<Legal kind="privacy" />} />
        <Route path="/terms" element={<Legal kind="terms" />} />
        <Route path="/setup" element={<Setup />} />
      </Route>
      {/* Redirect any protected routes to login if not logged in */}
      <Route path="/progress" element={<Navigate to="/login" replace />} />
      <Route path="/reader" element={<Navigate to="/login" replace />} />
      <Route path="/business-plan" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} /> {/* Catch-all for public routes */}
    </Routes>
  );

  return <Suspense fallback={<RouteFallback />}>{routes}</Suspense>;
};

export default AuthRouter;