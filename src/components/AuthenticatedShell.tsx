import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ScalesProvider } from '@/context/ScalesContext';
import { RepertoireProvider } from '@/context/RepertoireContext';
import { PracticeTransportProvider } from '@/context/PracticeTransportContext';
import AppLayout from './AppLayout';
import HeaderTransport from './HeaderTransport';
import { Button } from '@/components/ui/button';
import { Play, BarChart2, BookOpen, LogOut, Settings2, Keyboard } from 'lucide-react';
import MobileSettingsSheet from './MobileSettingsSheet';
import TransportBar from './TransportBar';
import SettingsSheet from './SettingsSheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import KeyboardShortcuts from './KeyboardShortcuts';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { useZenMode } from '@/context/ZenModeContext';
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
                            ? "bg-background text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Link to={to} aria-current={isActive ? 'page' : undefined} aria-label={label}>
                        {icon}
                        <span className="hidden text-sm lg:inline">{label}</span>
                    </Link>
                </Button>
            </TooltipTrigger>
            <TooltipContent className="lg:hidden">{label}</TooltipContent>
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [desktopSettingsOpen, setDesktopSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isZenMode } = useZenMode();
  const { session } = useSupabaseSession();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const userEmail = session?.user?.email ?? '';
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'S';

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
    <div className="flex items-center gap-2">
      <nav aria-label="Sections" className="hidden items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 md:flex">
        <NavLink to="/" icon={<Play className="w-4 h-4" />} label="Practice" />
        <NavLink to="/reader" icon={<BookOpen className="w-4 h-4" />} label="Reader" />
        <NavLink to="/progress" icon={<BarChart2 className="w-4 h-4" />} label="Progress" />
      </nav>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hidden rounded-full text-muted-foreground hover:text-primary md:inline-flex"
            aria-label="Account menu"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold uppercase text-primary">
              {userInitial}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
            {userEmail || 'Your account'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDesktopSettingsOpen(true)} className="font-medium">
            <Settings2 className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setShortcutsOpen(true)} className="font-medium">
            <Keyboard className="mr-2 h-4 w-4" />
            Keyboard shortcuts
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleLogout}
            className="font-medium text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <KeyboardShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );

  const mobileNav = (
    <div className="flex items-stretch">
      <MobileNavItem to="/" icon={<Play className="w-5 h-5" />} label="Practice" />
      <MobileNavItem to="/reader" icon={<BookOpen className="w-5 h-5" />} label="Reader" />
      <MobileNavItem to="/progress" icon={<BarChart2 className="w-5 h-5" />} label="Progress" />

      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className="flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <Settings2 className="w-5 h-5" />
        <span>Settings</span>
      </button>

      <button
        type="button"
        onClick={handleLogout}
        className="flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted/60 hover:text-destructive focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </button>

      <MobileSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
      <SettingsSheet open={desktopSettingsOpen} onOpenChange={setDesktopSettingsOpen} />
    </div>
  );

  return (
    <ScalesProvider>
      <RepertoireProvider>
        <PracticeTransportProvider>
          <AppLayout
            headerRightContent={authenticatedHeaderRightContent}
            headerTools={pathname === '/' && !isZenMode ? <HeaderTransport /> : undefined}
            mobileNav={mobileNav}
          >
            {/* Practice owns a dedicated transport in the sticky header; the Reader
                owns its floating tempo panel. Other pages keep this inline bar. */}
            <div
              className={cn(
                'mb-4',
                (pathname === '/reader' || pathname === '/') && 'hidden',
              )}
            >
              <TransportBar />
            </div>
            <Outlet />
          </AppLayout>
        </PracticeTransportProvider>
      </RepertoireProvider>
    </ScalesProvider>
  );
};

export default AuthenticatedShell;
