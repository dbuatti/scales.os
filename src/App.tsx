import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { GlobalBPMProvider } from "./context/GlobalBPMContext";
import AuthRouter from "./components/AuthRouter"; // Import the new AuthRouter

const queryClient = new QueryClient();

const App = () => {
  console.log("[App.tsx] App component rendering.");
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalBPMProvider>
        <TooltipProvider>
          <Sonner /> {/* Only render Sonner for toasts */}
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthRouter /> {/* Render the AuthRouter here */}
          </BrowserRouter>
        </TooltipProvider>
      </GlobalBPMProvider>
    </QueryClientProvider>
  );
};

export default App;