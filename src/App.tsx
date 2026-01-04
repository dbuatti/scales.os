import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";
import ProgressPage from "./pages/Progress";
import Login from "./pages/Login";
import AuthGuard from "./components/AuthGuard";
import ProtectedWrapper from "./components/ProtectedWrapper";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<AuthGuard isPublic={true} />}>
              <Route index element={<Login />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<AuthGuard />}>
              <Route element={<ProtectedWrapper />}>
                <Route path="/" element={<Index />} />
                <Route path="/progress" element={<ProgressPage />} />
              </Route>
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;