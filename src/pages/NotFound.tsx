import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // console.error( // Removed log
    //   "404 Error: User attempted to access non-existent route:",
    //   location.pathname,
    // );
  }, [location.pathname]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md bg-card/90 border-4 border-primary/80 shadow-2xl shadow-primary/40 relative overflow-hidden">
        {/* Subtle CRT glow overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        </div>
        <CardHeader className="text-center p-6 border-b-2 border-primary/50 relative z-10">
          <CardTitle className={cn("text-4xl font-mono tracking-widest text-destructive drop-shadow-[0_0_12px_hsl(var(--destructive)/0.8)]", "text-amber-glow")}>
            ERROR 404
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-6 relative z-10">
          <AlertTriangle className="w-20 h-20 mx-auto text-destructive animate-pulse" />
          <p className="text-xl text-primary/90 font-mono tracking-wide">
            FILE NOT FOUND
          </p>
          <p className="text-sm text-muted-foreground font-mono text-primary/70">
            The requested resource at <span className="text-warning font-bold">{location.pathname}</span> could not be located.
          </p>
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-lg shadow-lg shadow-primary/30">
            <a href="/">RETURN TO BASE SYSTEM</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;