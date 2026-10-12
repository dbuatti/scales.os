import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border border-border/60 bg-card/50 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 border-b border-border/60 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm font-bold">Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <p className="text-sm text-muted-foreground">
            The page <span className="font-bold text-foreground">{location.pathname}</span> doesn&apos;t exist or has moved.
          </p>
          <Button asChild className="w-full font-bold focus-scale">
            <a href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to practice
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
