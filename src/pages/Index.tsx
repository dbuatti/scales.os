import React from 'react';
import PracticeCommandCenter from '@/components/PracticeCommandCenter';
import { useScales } from '@/context/ScalesContext';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { isLoading } = useScales();

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-4 md:p-8">
        <Skeleton className="h-[600px] w-full max-w-6xl bg-card/50" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col">
      <PracticeCommandCenter />
    </div>
  );
};

export default Index;