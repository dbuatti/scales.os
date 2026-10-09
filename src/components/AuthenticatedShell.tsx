import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ScalesProvider } from '@/context/ScalesContext';
import { RepertoireProvider } from '@/context/RepertoireContext';
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

interface MobileNavItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
}

const MobileNavItem: React.FC<MobileNavItemProps> = ({ to, icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
            )}
        >
            {icon}
            <span>{label}</span>
        </Link>
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
    <div className="flex items-center gap-3">
      <AuthenticatedHeaderControls />
      <div className="hidden h-6 w-px bg-border md:block" />
      <nav className="hidden items-center gap-1 md:flex">
        <NavLink to="/" icon={<Play className="w-4 h-4" />} label="Practice" />
        <NavLink to="/progress" icon={<BarChart2 className="w-4 h-4" />} label="Progress" />
      </nav>
      <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="hidden text-muted-foreground hover:text-destructive md:inline-flex"
      >
          <LogOut className="w-4 h-4" />
          <span className="sr-only">Logout</span>
      </Button>
    </div>
  );

  const mobileNav = (
    <div className="flex items-stretch">
      <MobileNavItem to="/" icon={<Play className="w-5 h-5" />} label="Practice" />
      <MobileNavItem to="/progress" icon={<BarChart2 className="w-5 h-5" />} label="Progress" />
      <button
        type="button"
        onClick={handleLogout}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-destructive"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </button>
    </div>
  );

  return (
    <ScalesProvider>
      <RepertoireProvider>
        <AppLayout headerRightContent={authenticatedHeaderRightContent} mobileNav={mobileNav}>
          <Outlet />
        </AppLayout>
      </RepertoireProvider>
    </ScalesProvider>
  );
};

export default AuthenticatedShell;
