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
import { Trash2 } from 'lucide-react';
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
  const { isLoading, clearExerciseMastery } = useScales();

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

      {/* Button to clear Dohnányi and Hanon progress with confirmation dialog */}
      <div className="flex justify-center mt-10">
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
      </div>
    </div>
  );
};

export default ProgressPage;