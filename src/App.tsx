import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";
import ProgressPage from "./pages/Progress";
import Login from "./pages/Login";
import AuthGuard from "./components/AuthGuard";
import AuthenticatedShell from "./components/AuthenticatedShell";
import { GlobalBPMProvider } from "./context/GlobalBPMContext";

const queryClient = new QueryClient();

// Wrapper for unauthenticated routes to still use AppLayout
const PublicLayoutWrapper = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GlobalBPMProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Routes wrapped in AppLayout */}
            <Route element={<PublicLayoutWrapper />}>
              <Route path="/login" element={<AuthGuard isPublic={true} />}>
                <Route index element={<Login />} />
              </Route>
              
              {/* Catch-all for 404 */}
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Protected Routes wrapped in AuthGuard and AuthenticatedShell (which includes ScalesProvider and AppLayout) */}
            <Route element={<AuthGuard />}>
              <Route element={<AuthenticatedShell />}>
                <Route path="/" element={<Index />} />
                <Route path="/progress" element={<ProgressPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </GlobalBPMProvider>
  </QueryClientProvider>
);

export default App;