import React from 'react';
import PracticeStats from '@/components/PracticeStats';
import ScaleGrid from '@/components/ScaleGrid';
import PracticeLog from '@/components/PracticeLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const ProgressPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-center lg:text-5xl font-mono text-primary">
        MASTER Y O U R SCALES
      </h1>
      <p className="text-center text-lg text-muted-foreground max-w-3xl mx-auto font-mono">
        Review your progress across all scale and arpeggio combinations.
      </p>

      <PracticeStats />

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
    </div>
  );
};

export default ProgressPage;