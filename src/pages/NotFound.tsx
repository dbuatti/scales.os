import { Link, useLocation } from "react-router-dom";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, Home } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="surface w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Compass className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Error 404</p>
            <h1 className="text-2xl font-black tracking-tight">Page not found</h1>
            <p className="text-sm text-muted-foreground">
              <span className="break-all font-semibold text-foreground">{location.pathname}</span> doesn&apos;t exist or has moved.
            </p>
          </div>
          <Button asChild className="w-full font-bold focus-scale">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default NotFound;
