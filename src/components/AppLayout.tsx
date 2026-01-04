import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Gauge, Grid3x3, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

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

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session, isLoading } = useSupabaseSession();
    const navigate = useNavigate();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Logout error:", error);
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
                        {session && (
                            <>
                                <NavLink to="/" icon={<Gauge className="w-5 h-5" />} label="Command Centre" />
                                <NavLink to="/progress" icon={<Grid3x3 className="w-5 h-5" />} label="Mastery Matrix" />
                                <Button 
                                    variant="ghost" 
                                    onClick={handleLogout}
                                    className="flex flex-col items-center p-2 transition-colors duration-200 h-auto text-destructive hover:bg-destructive/20 hover:text-destructive"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="text-xs mt-1 hidden sm:inline font-mono">Logout</span>
                                </Button>
                            </>
                        )}
                        {!session && !isLoading && (
                            <Button asChild variant="ghost" className="text-primary hover:bg-primary/20">
                                <Link to="/login">
                                    <User className="w-5 h-5 mr-2" /> Login
                                </Link>
                            </Button>
                        )}
                    </nav>
                </div>
            </header>
            
            {/* Main Content */}
            <main className="flex-grow">
                {children}
            </main>
        </div>
    );
};

export default AppLayout;