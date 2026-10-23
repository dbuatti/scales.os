import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ScalesProvider } from '@/context/ScalesContext';
import { RepertoireProvider } from '@/context/RepertoireContext';
import AppLayout from './AppLayout';
import AuthenticatedHeaderControls from './AuthenticatedHeaderControls';
import { Button } from '@/components/ui/button';
import { Play, BarChart2, BookOpen, LogOut } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavLinkProps {
    to: string;
    icon: React.ReactNode;
    label: string;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label }) => {
    const location = useLocation();
    const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    asChild
                    variant="ghost"
                    className={cn(
                        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.98] 2xl:px-3",
                        isActive
                            ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Link to={to} aria-current={isActive ? 'page' : undefined} aria-label={label}>
                        {icon}
                        <span className="hidden text-sm 2xl:inline">{label}</span>
                    </Link>
                </Button>
            </TooltipTrigger>
            <TooltipContent className="2xl:hidden">{label}</TooltipContent>
        </Tooltip>
    );
};

interface MobileNavItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
}

const MobileNavItem: React.FC<MobileNavItemProps> = ({ to, icon, label }) => {
    const location = useLocation();
    const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

    return (
        <Link
            to={to}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
                "flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
};

const AuthenticatedShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isReader = location.pathname.startsWith('/reader');

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
      <AuthenticatedHeaderControls showMetronome={!isReader} />
      <div className="hidden h-6 w-px bg-border lg:block" />
      <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
        <NavLink to="/" icon={<Play className="w-4 h-4" />} label="Practice" />
        <NavLink to="/reader" icon={<BookOpen className="w-4 h-4" />} label="Reader" />
        <NavLink to="/progress" icon={<BarChart2 className="w-4 h-4" />} label="Progress" />
      </nav>
      <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="hidden text-muted-foreground hover:text-destructive lg:inline-flex"
      >
          <LogOut className="w-4 h-4" />
          <span className="sr-only">Logout</span>
      </Button>
    </div>
  );

  const mobileNav = (
    <div className="flex items-stretch">
      <MobileNavItem to="/" icon={<Play className="w-5 h-5" />} label="Practice" />
      <MobileNavItem to="/reader" icon={<BookOpen className="w-5 h-5" />} label="Reader" />
      <MobileNavItem to="/progress" icon={<BarChart2 className="w-5 h-5" />} label="Progress" />
      <button
        type="button"
        onClick={handleLogout}
        className="flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/60 hover:text-destructive focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
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
