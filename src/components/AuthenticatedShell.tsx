import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ScalesProvider } from '@/context/ScalesContext';
import AppLayout from './AppLayout';
import AuthenticatedHeaderControls from './AuthenticatedHeaderControls';
import { Button } from '@/components/ui/button';
import { Play, BarChart2, LogOut } from 'lucide-react';
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
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
                "flex items-center gap-2 px-4 py-2 transition-all",
                isActive ? "font-medium" : "text-muted-foreground hover:text-foreground"
            )}
        >
            <Link to={to}>
                {icon}
                <span className="text-sm">{label}</span>
            </Link>
        </Button>
    );
};

const AuthenticatedShell: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        showError("Failed to log out.");
    } else {
        showSuccess("Logged out.");
        navigate('/login');
    }
  };

  const authenticatedHeaderRightContent = (
    <div className="flex items-center gap-4">
      <AuthenticatedHeaderControls />
      <div className="h-6 w-px bg-border mx-2 hidden md:block" />
      <nav className="flex items-center gap-1">
        <NavLink to="/" icon={<Play className="w-4 h-4" />} label="Practice" />
        <NavLink to="/progress" icon={<BarChart2 className="w-4 h-4" />} label="Progress" />
        <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
        >
            <LogOut className="w-4 h-4" />
            <span className="sr-only">Logout</span>
        </Button>
      </nav>
    </div>
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