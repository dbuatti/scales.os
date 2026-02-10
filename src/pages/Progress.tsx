import React from 'react';
import PracticeStats from '@/components/PracticeStats';
import ScaleGrid from '@/components/ScaleGrid';
import PracticeLog from '@/components/PracticeLog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useScales } from '@/context/ScalesContext';
import { Skeleton } from '@/components/ui/skeleton';
import GradeTracker from '@/components/GradeTracker';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw, PlayCircle, AlertCircle } from 'lucide-react';
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
  const { isLoading, clearExerciseMastery, clearScaleMastery, clearAllLogs, refetchData, progressMap, updatePracticeStatus } = useScales();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchData();
    setIsRefreshing(false);
  };

  const handleClearAllData = async () => {
    await clearAllLogs();
    await clearExerciseMastery();
    await clearScaleMastery();
  };

  const stasisItems = Object.entries(progressMap).filter(([_, status]) => status === 'stasis');

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-center lg:text-5xl">
          Progress
        </h1>
        <Skeleton className="h-40 w-full bg-card/50" />
        <Skeleton className="h-[500px] w-full bg-card/50" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Progress
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Review your mastery across all techniques and manage your practice stasis.
        </p>
      </div>

      <PracticeStats />
      
      <GradeTracker />

      {stasisItems.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="w-5 h-5" />
              Technique Stasis
            </CardTitle>
            <CardDescription>
              These items were marked as "Too Hard" and are currently hidden from suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stasisItems.map(([id, _]) => (
                <div key={id} className="flex items-center justify-between p-3 bg-card border rounded-lg shadow-sm">
                  <span className="text-sm font-medium truncate max-w-[200px]">{id.split('-').slice(0, 2).join(' ')}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => updatePracticeStatus(id, 'untouched')}
                    className="text-xs text-primary hover:bg-primary/10"
                  >
                    <PlayCircle className="w-4 h-4 mr-1" />
                    Reactivate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Scale Mastery Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <ScaleGrid />
        </CardContent>
      </Card>

      <Separator />

      <PracticeLog />

      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing || isLoading}
          variant="outline" 
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
          Refresh Data
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Clear ALL Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete ALL your practice logs, scale mastery, and exercise progress.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAllData}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ProgressPage;