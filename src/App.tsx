import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { GlobalBPMProvider } from "./context/GlobalBPMContext";
import { ZenModeProvider } from "./context/ZenModeContext";
import AuthRouter from "./components/AuthRouter";
import { ThemeProvider } from "@/components/theme-provider";

const queryClient = new QueryClient();

const App = () => {
  console.log("[App.tsx] App component rendering.");
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalBPMProvider>
        <ZenModeProvider>
          <ThemeProvider defaultTheme="soft-focus" storageKey="theme" attribute="data-theme">
            <TooltipProvider>
              <Sonner />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AuthRouter />
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </ZenModeProvider>
      </GlobalBPMProvider>
    </QueryClientProvider>
  );
};

export default App;