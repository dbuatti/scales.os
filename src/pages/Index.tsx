import React from 'react';
import { MadeWithDyad } from "@/components/made-with-dyad";
import PracticeTimer from '@/components/PracticeTimer';
import ScaleGrid from '@/components/ScaleGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScalesProvider } from '../context/ScalesContext';
import PracticeLog from '@/components/PracticeLog';
import PracticeStats from '@/components/PracticeStats';
import PracticeCommandCenter from '@/components/PracticeCommandCenter';

const IndexContent = () => {
  // Removed sessionDuration state and handlers

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-center lg:text-5xl">
        Scales Command Centre
      </h1>
      <p className="text-center text-lg text-muted-foreground max-w-3xl mx-auto">
        Track your mastery, log focused snapshots, and deploy your practice routine.
      </p>

      <PracticeStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Command Centre and Timer */}
        <div className="lg:col-span-1 space-y-8">
          <PracticeCommandCenter />
          <PracticeTimer />
        </div>
        
        {/* Right Column: Mastery Matrix */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Scale Mastery Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <ScaleGrid />
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      <PracticeLog />

      <MadeWithDyad />
    </div>
  );
};

const Index = () => (
  <ScalesProvider>
    <IndexContent />
  </ScalesProvider>
);

export default Index;