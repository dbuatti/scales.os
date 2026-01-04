import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gauge, Grid3x3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header/Navigation Bar */}
            <header className="sticky top-0 z-50 w-full border-b border-primary/50 bg-card/90 backdrop-blur-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
                    <h1 className="text-xl font-bold tracking-wider text-primary font-mono">
                        SCALES.OS
                    </h1>
                    <nav className="flex space-x-4">
                        <NavLink to="/" icon={<Gauge className="w-5 h-5" />} label="Command Centre" />
                        <NavLink to="/progress" icon={<Grid3x3 className="w-5 h-5" />} label="Mastery Matrix" />
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