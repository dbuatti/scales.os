import React, { useState } from 'react';
import { MadeWithDyad } from "@/components/made-with-dyad";
import PracticeTimer from '@/components/PracticeTimer';
import LogSessionForm from '@/components/LogSessionForm';
import ScaleGrid from '@/components/ScaleGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScalesProvider } from '../context/ScalesContext';
import PracticeLog from '@/components/PracticeLog';

const IndexContent = () => {
  const [sessionDuration, setSessionDuration] = useState<number | null>(null);

  const handleTimerEnd = (durationMinutes: number) => {
    setSessionDuration(durationMinutes);
  };

  const handleLogComplete = () => {
    setSessionDuration(null);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-center lg:text-5xl">
        Professional Scales Tracker
      </h1>
      <p className="text-center text-lg text-muted-foreground max-w-3xl mx-auto">
        Focus on deployment, reliability, and consistency. Use the 5-minute timer for focused, high-quality practice.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          {sessionDuration === null ? (
            <PracticeTimer onTimerEnd={handleTimerEnd} />
          ) : (
            <LogSessionForm durationMinutes={sessionDuration} onLogComplete={handleLogComplete} />
          )}
        </div>
        
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