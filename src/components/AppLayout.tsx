import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, User, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ScrollToTopButton from './ScrollToTopButton';
import ThemeSwitcher from './ThemeSwitcher';
import ZenModeToggle from './ZenModeToggle';
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

interface AppLayoutProps {
    children: React.ReactNode;
    headerRightContent?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, headerRightContent }) => {
    const { isZenMode } = useZenMode();

    return (
        <div className={cn("min-h-screen flex flex-col bg-background transition-all duration-500", isZenMode && "bg-background/95")}>
            <header className={cn(
                "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
                isZenMode && "h-12 opacity-50 hover:opacity-100"
            )}>
                <div className="container flex h-full items-center justify-between py-2">
                    <Link to="/" className={cn("flex items-center gap-2 font-bold text-xl tracking-tight transition-all", isZenMode && "text-sm")}>
                        <div className={cn("bg-primary rounded-lg flex items-center justify-center text-primary-foreground transition-all", isZenMode ? "w-6 h-6" : "w-8 h-8")}>
                            <Play className={cn("fill-current", isZenMode ? "w-3 h-3" : "w-5 h-5")} />
                        </div>
                        <span className={cn(isZenMode && "hidden sm:inline")}>Scales</span>
                    </Link>
                    <nav className="flex items-center gap-2">
                        {headerRightContent ? (
                            <>
                                {headerRightContent}
                                <ZenModeToggle />
                                {!isZenMode && <ThemeSwitcher />}
                            </>
                        ) : (
                            <>
                                <NavLink to="/landing" icon={<Home className="w-4 h-4" />} label="Home" />
                                <Button asChild variant="default" size="sm">
                                    <Link to="/login">
                                        <User className="w-4 h-4 mr-2" /> Login
                                    </Link>
                                </Button>
                                <ZenModeToggle />
                                {!isZenMode && <ThemeSwitcher />}
                            </>
                        )}
                    </nav>
                </div>
            </header>
            
            <main className={cn("flex-grow container py-8 transition-all duration-500", isZenMode && "py-4 max-w-5xl")}>
                {children}
            </main>

            {!isZenMode && (
                <footer className="border-t py-6 md:py-0">
                    <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                            Built for pianists. Focused on technique.
                        </p>
                    </div>
                </footer>
            )}

            {!isZenMode && <ScrollToTopButton />}
        </div>
    );
};

export default AppLayout;