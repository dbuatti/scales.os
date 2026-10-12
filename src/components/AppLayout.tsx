import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, User, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ScrollToTopButton from './ScrollToTopButton';
import ThemeSwitcher from './ThemeSwitcher';
import ZenModeToggle from './ZenModeToggle';
import KeyboardShortcuts from './KeyboardShortcuts';
import { useZenMode } from '@/context/ZenModeContext';

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
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                isActive
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                    : "text-muted-foreground hover:text-foreground"
            )}
        >
            <Link to={to}>
                {icon}
                <span className="text-sm">{label}</span>
            </Link>
        </Button>
    );
};

interface AppLayoutProps {
    children: React.ReactNode;
    headerRightContent?: React.ReactNode;
    mobileNav?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, headerRightContent, mobileNav }) => {
    const { isZenMode } = useZenMode();

    return (
        <div className={cn("min-h-screen flex flex-col bg-background transition-all duration-500", isZenMode && "bg-background/95")}>
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg"
            >
                Skip to main content
            </a>
            <header className={cn(
                "sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 shadow-[0_1px_0_hsl(var(--border)/0.35),0_8px_24px_hsl(228_24%_12%/0.04)] backdrop-blur-lg supports-[backdrop-filter]:bg-background/75 transition-all duration-300",
                isZenMode ? "h-12 opacity-60 hover:opacity-100" : "h-16"
            )}>
                <div className="container flex h-full items-center justify-between gap-4 px-4 sm:px-6">
                    <Link to="/" aria-label="Scales OS home" className={cn("group flex items-center gap-2.5 font-bold text-lg tracking-tight transition-all shrink-0", isZenMode && "text-sm")}>
                        <div aria-hidden="true" className={cn("bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-sm transition-all duration-200 group-hover:rotate-[-4deg] group-hover:scale-105", isZenMode ? "w-7 h-7" : "w-9 h-9")}>
                            <Play className={cn("fill-current", isZenMode ? "w-3.5 h-3.5" : "w-4 h-4")} />
                        </div>
                        <span className={cn("tracking-tight", isZenMode && "hidden sm:inline")}>Scales</span>
                    </Link>
                    <nav aria-label="Primary navigation" className="flex items-center gap-2">
                        {headerRightContent ? (
                            <>
                                {headerRightContent}
                                <div className="hidden md:inline-flex">
                                    <KeyboardShortcuts />
                                </div>
                                <ZenModeToggle />
                                {!isZenMode && <ThemeSwitcher />}
                            </>
                        ) : (
                            <>
                                <div className="hidden sm:inline-flex">
                                    <NavLink to="/landing" icon={<Home className="w-4 h-4" />} label="Home" />
                                </div>
                                <Button asChild variant="default" size="sm">
                                    <Link to="/login">
                                        <User className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Login</span>
                                    </Link>
                                </Button>
                                <div className="hidden md:inline-flex">
                                    <KeyboardShortcuts />
                                </div>
                                <ZenModeToggle />
                                {!isZenMode && <ThemeSwitcher />}
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main id="main-content" tabIndex={-1} className={cn("container flex-grow py-8 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4", isZenMode && "py-4 max-w-5xl", mobileNav && "pb-20 md:pb-8")}>
                {children}
            </main>

            {mobileNav && (
                <nav aria-label="Mobile navigation" className="sticky bottom-0 z-40 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
                    {mobileNav}
                </nav>
            )}

            {!isZenMode && (
                <footer className="border-t border-border/60 py-8">
                    <div className="container flex flex-col items-center justify-between gap-2 text-center md:flex-row md:text-left">
                        <p className="text-sm text-muted-foreground">
                            Built for pianists. Focused on technique.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground/70 md:justify-end">
                            <p>Scales · Arpeggios · Method books</p>
                            <span aria-label="Application version" data-testid="build-version" className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 font-semibold tracking-[0.08em]">
                                UI refresh · v0.4.0
                            </span>
                        </div>
                    </div>
                </footer>
            )}

            {!isZenMode && <ScrollToTopButton />}
        </div>
    );
};

export default AppLayout;
