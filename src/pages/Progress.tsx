import React from 'react';
import PracticeStats from '@/components/PracticeStats';
import RepertoireStats from '@/components/RepertoireStats';
import ScaleGrid from '@/components/ScaleGrid';
import PracticeLog from '@/components/PracticeLog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useScales } from '@/context/ScalesContext';
import { Skeleton } from '@/components/ui/skeleton';
import GradeTracker from '@/components/GradeTracker';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw, PlayCircle, AlertCircle, LayoutDashboard, Piano, History } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
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
      <div className="mx-auto max-w-7xl space-y-10">
        <PageHeader eyebrow="Progress" title="Your Mastery" description="Review your mastery across all techniques and manage your practice stasis." />
        <Skeleton className="h-40 w-full bg-card/50" />
        <Skeleton className="h-[500px] w-full bg-card/50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Progress"
        title="Your Mastery"
        description="Review your mastery across all techniques and manage your practice stasis."
        actions={
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="font-bold focus-scale">
            <RefreshCw className={isRefreshing ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
            Sync
          </Button>
        }
      />

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="flex h-auto w-full justify-start gap-2 overflow-x-auto rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="shrink-0 gap-2 rounded-none border-b-4 border-transparent px-1 pb-4 font-bold shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="technique"
            className="shrink-0 gap-2 rounded-none border-b-4 border-transparent px-1 pb-4 font-bold shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
          >
            <Piano className="h-4 w-4" />
            Technique
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="shrink-0 gap-2 rounded-none border-b-4 border-transparent px-1 pb-4 font-bold shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
          >
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <PracticeStats />
          <RepertoireStats />
          <GradeTracker />
        </TabsContent>

        <TabsContent value="technique" className="space-y-8">
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {stasisItems.map(([id]) => (
                    <div key={id} className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-sm">
                      <span className="max-w-[200px] truncate text-sm font-medium">{id.split('-').slice(0, 2).join(' ')}</span>
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

          <ScaleGrid />
        </TabsContent>

        <TabsContent value="history" className="space-y-8">
          <PracticeLog />

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Permanently clear all of your practice data. This cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="font-bold">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear all practice data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all practice data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all logs, scale mastery, and exercise progress.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAllData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgressPage;
