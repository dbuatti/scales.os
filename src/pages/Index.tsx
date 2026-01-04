import React from 'react';
import { MadeWithDyad } from "@/components/made-with-dyad";
import PracticeCommandCenter from '@/components/PracticeCommandCenter';
import { ScalesProvider } from '../context/ScalesContext';

const IndexContent = () => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <PracticeCommandCenter />
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