import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gauge, Grid3x3 } from 'lucide-react';
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
        <Link 
            to={to} 
            className={cn(
                "flex flex-col items-center p-2 transition-colors duration-200 rounded-lg",
                isActive 
                    ? "bg-primary text-primary-foreground shadow-lg" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
        >
            {icon}
            <span className="text-xs mt-1 hidden sm:inline">{label}</span>
        </Link>
    );
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header/Navigation Bar */}
            <header className="sticky top-0 z-50 w-full border-b bg-card/90 backdrop-blur-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
                    <h1 className="text-xl font-bold tracking-wider text-primary">
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