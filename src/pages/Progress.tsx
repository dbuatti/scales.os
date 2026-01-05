import React from 'react';
import PracticeStats from '@/components/PracticeStats';
import ScaleGrid from '@/components/ScaleGrid';
import PracticeLog from '@/components/PracticeLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useScales } from '@/context/ScalesContext';
import { Skeleton } from '@/components/ui/skeleton';
import GradeTracker from '@/components/GradeTracker'; // Import GradeTracker
import { Button } from '@/components/ui/button'; // Import Button
import { Trash2 } from 'lucide-react'; // Import Trash2 icon

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
      
      {/* Grade Tracker added here */}
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

      {/* Button to clear Dohnányi and Hanon progress */}
      <div className="flex justify-center mt-10">
        <Button 
          onClick={clearExerciseMastery} 
          variant="destructive" 
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Clear Dohnányi & Hanon Progress
        </Button>
      </div>
    </div>
  );
};

export default ProgressPage;