import React from 'react';
import { Link } from 'react-router-dom';
import PracticeStats from '@/components/PracticeStats';
import PracticeHeatmap from '@/components/PracticeHeatmap';
import RepertoireStats from '@/components/RepertoireStats';
import ScaleGrid from '@/components/ScaleGrid';
import PracticeLog from '@/components/PracticeLog';
import PageContainer from '@/components/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useScales } from '@/context/ScalesContext';
import { Skeleton } from '@/components/ui/skeleton';
import GradeTracker from '@/components/GradeTracker';
import TempoProgressionChart from '@/components/TempoProgressionChart';
import WeeklyActivityChart from '@/components/WeeklyActivityChart';
import TechniqueRadar from '@/components/TechniqueRadar';
import ShareProgress from '@/components/ShareProgress';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw, PlayCircle, AlertCircle, LayoutDashboard, Piano, History, Download } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useSupabaseSession } from '@/hooks/use-supabase-session';
import { useRepertoire } from '@/context/RepertoireContext';
import { buildExport, downloadJson, exportFilename } from '@/lib/export-data';
import { showSuccess } from '@/utils/toast';
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
  const { isLoading, clearExerciseMastery, clearScaleMastery, clearAllLogs, refetchData, progressMap, updatePracticeStatus, log, scaleMasteryBPMMap, exerciseMasteryBPMMap } = useScales();
  const { session } = useSupabaseSession();
  const { documents } = useRepertoire();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleExport = () => {
    downloadJson(
      buildExport({
        email: session?.user?.email ?? null,
        log,
        scaleMasteryBPMMap,
        exerciseMasteryBPMMap,
        documents,
      }),
      exportFilename(),
    );
    showSuccess('Export downloaded.');
  };

  React.useEffect(() => {
    try {
      localStorage.setItem('scales.progress.visited', '1');
    } catch {
      // storage unavailable
    }
  }, []);

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
      <PageContainer aria-busy="true" aria-live="polite">
        <PageHeader eyebrow="Progress" title="Your Mastery" description="Review your mastery across all techniques and manage your practice stasis." />
        <Skeleton className="h-40 w-full bg-card/50" />
        <Skeleton className="h-[500px] w-full bg-card/50" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Progress"
        title="Your Mastery"
        description="Review your mastery across all techniques and manage your practice stasis."
        actions={
          <div className="flex items-center gap-2">
            <ShareProgress />
            <Button variant="outline" onClick={handleExport} className="font-bold focus-scale">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="font-bold focus-scale">
              <RefreshCw className={isRefreshing ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
              Sync
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="overview" className="flex flex-col gap-8">
        <TabsList aria-label="Progress sections" className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border/60 bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="shrink-0 gap-2 rounded-none border-b-2 border-transparent px-3 pb-3 pt-1 text-sm font-bold text-muted-foreground shadow-none transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="technique"
            className="shrink-0 gap-2 rounded-none border-b-2 border-transparent px-3 pb-3 pt-1 text-sm font-bold text-muted-foreground shadow-none transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
          >
            <Piano className="h-4 w-4" />
            Technique
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="shrink-0 gap-2 rounded-none border-b-2 border-transparent px-3 pb-3 pt-1 text-sm font-bold text-muted-foreground shadow-none transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
          >
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-8">
          {log.length === 0 ? (
            <Card className="surface">
              <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
                <div className="rounded-2xl bg-muted p-4 text-muted-foreground">
                  <LayoutDashboard className="h-10 w-10" />
                </div>
                <h3 className="font-semibold text-foreground">No practice data yet</h3>
                <p className="text-muted-foreground max-w-sm">
                  Start a practice session to see your mastery, consistency, and tempo progress
                  here.
                </p>
                <Button asChild variant="default" className="mt-4 font-bold">
                  <Link to="/">Start a session</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <PracticeStats />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <PracticeHeatmap log={log} />
                </div>
                <div className="lg:col-span-1">
                  <WeeklyActivityChart />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TempoProgressionChart />
                <TechniqueRadar />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RepertoireStats />
                <GradeTracker />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="technique" className="flex flex-col gap-8">
          {stasisItems.length > 0 && (
            <Card className="surface border-warning/40 bg-warning/5">
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
                    <div key={id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card/60 p-3 shadow-sm backdrop-blur-xl">
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

        <TabsContent value="history" className="flex flex-col gap-8">
          <PracticeLog />

          <Card className="surface border-destructive/30">
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
    </PageContainer>
  );
};

export default ProgressPage;
