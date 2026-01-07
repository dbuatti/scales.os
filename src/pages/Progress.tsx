import React from 'react';
import PracticeStats from '@/components/PracticeStats';
import ScaleGrid from '@/components/ScaleGrid';
import PracticeLog from '@/components/PracticeLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useScales } from '@/context/ScalesContext';
import { Skeleton } from '@/components/ui/skeleton';
import GradeTracker from '@/components/GradeTracker';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ProgressPage: React.FC = () => {
  const { isLoading, clearExerciseMastery, clearScaleMastery, clearAllLogs, refetchData } = useScales();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchData();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-center lg:text-5xl font-mono text-primary">
          MASTER Y O U R SCALES
        </h1>
        <Skeleton className="h-40 w-full bg-card/50" />
        <Skeleton className="h-[500px] w-full bg-card/50" />
        <Skeleton className="h-[400px] w-full bg-card/50" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-center lg:text-5xl font-mono text-primary">
        MASTER Y O U R SCALES
      </h1>
      <p className="text-center text-lg text-muted-foreground max-w-3xl mx-auto font-mono">
        Review your progress across all scale and arpeggio combinations.
      </p>

      <PracticeStats />
      
      <GradeTracker />

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-primary">Scale Mastery Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <ScaleGrid />
        </CardContent>
      </Card>

      <Separator />

      <PracticeLog />

      {/* Buttons to clear progress with confirmation dialogs */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
        {/* Refresh Data Button */}
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing || isLoading}
          variant="outline" 
          className="border-primary/70 text-primary hover:bg-primary/20 hover:text-foreground transition-all"
        >
          {isRefreshing ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh Data
        </Button>

        {/* Clear All Logs Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Clear All Practice Logs
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-primary/50 shadow-2xl shadow-primary/30">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-primary font-mono">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action cannot be undone. This will permanently delete ALL your practice log entries. Your mastery progress will remain.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-muted-foreground text-muted-foreground hover:bg-accent">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={clearAllLogs} 
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Clear Dohnányi & Hanon Progress */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Clear Dohnányi & Hanon Progress
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-primary/50 shadow-2xl shadow-primary/30">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-primary font-mono">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action cannot be undone. This will permanently delete your highest mastered BPM records for all Dohnányi and Hanon exercises.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-muted-foreground text-muted-foreground hover:bg-accent">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={clearExerciseMastery} 
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Clear All Scale Mastery Progress */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Clear All Scale Mastery
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-primary/50 shadow-2xl shadow-primary/30">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-primary font-mono">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action cannot be undone. This will permanently delete your highest mastered BPM records for ALL scale permutations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-muted-foreground text-muted-foreground hover:bg-accent">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={clearScaleMastery} 
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ProgressPage;