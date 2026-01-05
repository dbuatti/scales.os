import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ScalesProvider } from '@/context/ScalesContext';
import AppLayout from './AppLayout';
import AuthenticatedHeaderControls from './AuthenticatedHeaderControls';
import { Button } from '@/components/ui/button';
import { Gauge, Grid3x3, LogOut } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface NavLinkProps {
    to: string;
    icon: React.ReactNode;
    label: string;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Button
            asChild
            variant="ghost"
            className={cn(
                "flex flex-col items-center p-2 transition-colors duration-200 h-auto",
                isActive
                    ? "bg-primary/20 text-primary shadow-inner border border-primary/50"
                    : "text-muted-foreground hover:bg-accent hover:text-primary"
            )}
        >
            <Link to={to}>
                {icon}
                <span className="text-xs mt-1 hidden sm:inline font-mono">{label}</span>
            </Link>
        </Button>
    );
};

const AuthenticatedShell: React.FC = () => {
  const { session } = useSupabaseSession(); // Need session to handle logout
  const navigate = useNavigate(); // Need navigate for logout

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        showError("Failed to log out.");
    } else {
        showSuccess("Successfully logged out.");
        navigate('/login'); // Redirect to login after logout
    }
  };

  const authenticatedHeaderRightContent = (
    <>
      {/* Global Controls (BPM/Timer) */}
      <AuthenticatedHeaderControls />

      {/* Navigation Links for Authenticated Users */}
      <NavLink to="/" icon={<Gauge className="w-5 h-5" />} label="Command Centre" />
      <NavLink to="/progress" icon={<Grid3x3 className="w-5 h-5" />} label="Mastery Matrix" />

      {/* Logout Button */}
      <Button
          variant="ghost"
          onClick={handleLogout}
          className="flex flex-col items-center p-2 transition-colors duration-200 h-auto text-destructive hover:bg-destructive/20 hover:text-destructive"
      >
          <LogOut className="w-5 h-5" />
          <span className="text-xs mt-1 hidden sm:inline font-mono">Logout</span>
      </Button>
    </>
  );

  return (
    <ScalesProvider>
      <AppLayout headerRightContent={authenticatedHeaderRightContent}>
        <Outlet />
      </AppLayout>
    </ScalesProvider>
  );
};

export default AuthenticatedShell;