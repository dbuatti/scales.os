import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { GlobalBPMProvider } from "./context/GlobalBPMContext";
import { MetronomeProvider } from "./context/MetronomeContext";
import { ZenModeProvider } from "./context/ZenModeContext";
import AuthRouter from "./components/AuthRouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "@/components/theme-provider";

const queryClient = new QueryClient();

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GlobalBPMProvider>
          <MetronomeProvider>
            <ZenModeProvider>
              <ThemeProvider>
                <TooltipProvider>
                  <Sonner />
                  <BrowserRouter>
                    <ScrollToTop />
                    <AuthRouter />
                  </BrowserRouter>
                </TooltipProvider>
              </ThemeProvider>
            </ZenModeProvider>
          </MetronomeProvider>
        </GlobalBPMProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
