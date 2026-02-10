import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, BarChart2, User, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ScrollToTopButton from './ScrollToTopButton';
import ThemeSwitcher from './ThemeSwitcher';

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
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                            <Play className="w-5 h-5 fill-current" />
                        </div>
                        <span>Scales</span>
                    </Link>
                    <nav className="flex items-center gap-2">
                        {headerRightContent ? (
                            <>
                                {headerRightContent}
                                <ThemeSwitcher />
                            </>
                        ) : (
                            <>
                                <NavLink to="/landing" icon={<Home className="w-4 h-4" />} label="Home" />
                                <Button asChild variant="default" size="sm">
                                    <Link to="/login">
                                        <User className="w-4 h-4 mr-2" /> Login
                                    </Link>
                                </Button>
                                <ThemeSwitcher />
                            </>
                        )}
                    </nav>
                </div>
            </header>
            
            <main className="flex-grow container py-8">
                {children}
            </main>

            <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        Built for pianists. Focused on technique.
                    </p>
                </div>
            </footer>

            <ScrollToTopButton />
        </div>
    );
};

export default AppLayout;