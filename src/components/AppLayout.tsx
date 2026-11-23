import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, User, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ScrollToTopButton from './ScrollToTopButton';
import { useZenMode } from '@/context/ZenModeContext';
import SetupPanel from './SetupPanel';
import InstallAppButton from './InstallAppButton';
import { trackPageview } from '@/lib/analytics';
import { supportMailto } from '@/lib/support';

interface AppLayoutProps {
    children: React.ReactNode;
    headerRightContent?: React.ReactNode;
    /** Optional slim second row inside the sticky header (e.g. practice transport). */
    headerTools?: React.ReactNode;
    mobileNav?: React.ReactNode;
    /** Public pages that own their own gutters (e.g. the landing page). */
    bleed?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, headerRightContent, headerTools, mobileNav, bleed = false }) => {
    const { isZenMode } = useZenMode();
    const setupMode =
        typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('setup');
    const location = useLocation();
    const contactHref = supportMailto('Scales.os support');
    const [isOnline, setIsOnline] = React.useState(
        typeof navigator === 'undefined' ? true : navigator.onLine,
    );

    useEffect(() => {
        const update = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        // Safari can miss the event after a captive-portal or network switch.
        const poll = window.setInterval(update, 5000);
        return () => {
            window.removeEventListener('online', update);
            window.removeEventListener('offline', update);
            window.clearInterval(poll);
        };
    }, []);

    useEffect(() => {
        trackPageview();
    }, [location.pathname]);

    return (
        <div className={cn("min-h-screen flex flex-col bg-background transition-all duration-500", isZenMode && "bg-background/95")}>
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg"
            >
                Skip to main content
            </a>
            <header className={cn(
                "sticky top-0 z-50 w-full border-b border-border/40 bg-background transition-all duration-300",
                isZenMode && "bg-background/95"
            )}>
                <div className={cn(
                    "mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6",
                    isZenMode ? "h-12 opacity-60 hover:opacity-100" : "h-16"
                )}>
                    <Link to="/" aria-label="Scales OS home" className={cn("group flex items-center gap-2.5 tracking-tight transition-all shrink-0", isZenMode ? "text-base" : "text-lg")}>
                        <div aria-hidden="true" className={cn("bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center text-primary-foreground  shadow-primary/25 transition-all duration-200 group-hover:rotate-[-4deg] group-hover:scale-105", isZenMode ? "w-7 h-7" : "w-9 h-9")}>
                            <Play className={cn("fill-current", isZenMode ? "w-3.5 h-3.5" : "w-4 h-4")} />
                        </div>
                        <span className="font-bold tracking-tight">
                            Scales
                            <span className="ml-0.5 align-super text-[9px] font-bold uppercase tracking-[0.18em] text-primary/70">os</span>
                        </span>
                    </Link>
                    <nav aria-label="Primary navigation" className="flex items-center gap-1 sm:gap-2">
                        {headerRightContent ? (
                            headerRightContent
                        ) : location.pathname === '/login' ? null : (
                            <Button asChild variant="default" size="sm" className="font-semibold">
                                <Link to="/login">
                                    <User className="mr-2 size-4" aria-hidden="true" />
                                    Sign in
                                </Link>
                            </Button>
                        )}
                    </nav>
                </div>
                {headerTools && !isZenMode && (
                    <div className="border-t border-border/40 bg-background/95">
                        <div className="mx-auto flex h-11 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
                            {headerTools}
                        </div>
                    </div>
                )}
            </header>

            <main
                id="main-content"
                tabIndex={-1}
                className={cn(
                    "flex-grow outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4",
                    bleed ? "" : "container py-8",
                    isZenMode && !bleed && "py-4 max-w-6xl",
                    mobileNav && "pb-20 md:pb-8",
                )}
            >
                {children}
            </main>

            {mobileNav && (
                <nav aria-label="Mobile navigation" className="sticky bottom-0 z-40 w-full border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
                    {mobileNav}
                </nav>
            )}

            {!isZenMode && (
                <footer className="border-t border-border/60 py-8">
                    <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:px-6 md:flex-row md:text-left">
                        <div className="space-y-1">
                            <p className="font-display text-lg italic tracking-tight text-foreground/80">
                                Built for pianists. Focused on technique.
                            </p>
                            <p className="text-xs text-muted-foreground">Scales · Arpeggios · Method books</p>
                            <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs text-muted-foreground/70 md:justify-start">
                                <InstallAppButton />
                                <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
                                <span aria-hidden="true">·</span>
                                <Link to="/terms" className="transition-colors hover:text-foreground">Terms</Link>
                                {contactHref && (
                                    <>
                                        <span aria-hidden="true">·</span>
                                        <a href={contactHref} className="transition-colors hover:text-foreground">Contact</a>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground/70 md:justify-end">
                            <span aria-label="Application version" data-testid="build-version" className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 font-semibold tracking-[0.08em]">
                                v0.5.0
                            </span>
                        </div>
                    </div>
                </footer>
            )}

            {!isZenMode && <ScrollToTopButton />}
            {setupMode && <SetupPanel />}
            {!isOnline && (
                <div
                    role="status"
                    className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border/60 bg-card/95 px-3.5 py-2 text-[11px] font-semibold text-foreground shadow-lg backdrop-blur md:bottom-6"
                >
                    <WifiOff className="size-3.5 text-accent" aria-hidden="true" />
                    Offline — practice still works
                </div>
            )}
        </div>
    );
};

export default AppLayout;