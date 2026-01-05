import React from 'react';
import { MadeWithDyad } from "@/components/made-with-dyad";
import PracticeCommandCenter from '@/components/PracticeCommandCenter';
import { useScales } from '../context/ScalesContext';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { isLoading } = useScales();

  console.log("[Index.tsx] ScalesContext isLoading:", isLoading);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-64px)] p-4 md:p-8 items-center justify-center">
        <Skeleton className="w-full max-w-6xl h-[600px] bg-card/50" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <PracticeCommandCenter />
      <MadeWithDyad />
    </div>
  );
};

export default Index;