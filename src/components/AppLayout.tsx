import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Gauge, Grid3x3, LogOut, User, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import ScrollToTopButton from './ScrollToTopButton';
import ThemeSwitcher from './ThemeSwitcher'; // Import the new ThemeSwitcher

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

interface AppLayoutProps {
    children: React.ReactNode;
    headerRightContent?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, headerRightContent }) => {
    const { session, isLoading } = useSupabaseSession();
    const navigate = useNavigate();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            showError("Failed to log out.");
        } else {
            showSuccess("Successfully logged out.");
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header/Navigation Bar */}
            <header className="sticky top-0 z-50 w-full border-b border-primary/50 bg-card/90 backdrop-blur-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
                    <h1 className="text-xl font-bold tracking-wider text-primary font-mono">
                        SCALES.OS
                    </h1>
                    <nav className="flex items-center space-x-4">
                        {headerRightContent ? (
                            <>
                                {headerRightContent}
                                <ThemeSwitcher /> {/* Add ThemeSwitcher here */}
                            </>
                        ) : (
                            <>
                                <NavLink to="/landing" icon={<Home className="w-5 h-5" />} label="Home" />
                                <Button asChild variant="ghost" className="text-primary hover:bg-primary/20">
                                    <Link to="/login">
                                        <User className="w-5 h-5 mr-2" /> Login / Sign Up
                                    </Link>
                                </Button>
                                <ThemeSwitcher /> {/* Add ThemeSwitcher here for public routes too */}
                            </>
                        )}
                    </nav>
                </div>
            </header>
            
            {/* Main Content */}
            <main className="flex-grow">
                {children}
            </main>

            {/* Scroll to Top Button */}
            <ScrollToTopButton />
        </div>
    );
};

export default AppLayout;