import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { GlobalBPMProvider } from "./context/GlobalBPMContext";
import AuthRouter from "./components/AuthRouter"; // Import the new AuthRouter
import { ThemeProvider } from "@/components/theme-provider"; // Import ThemeProvider

const queryClient = new QueryClient();

const App = () => {
  console.log("[App.tsx] App component rendering.");
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalBPMProvider>
        <ThemeProvider defaultTheme="retro-terminal" storageKey="theme"> {/* Wrap with ThemeProvider */}
          <TooltipProvider>
            <Sonner /> {/* Only render Sonner for toasts */}
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AuthRouter /> {/* Render the AuthRouter here */}
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </GlobalBPMProvider>
    </QueryClientProvider>
  );
};

export default App;