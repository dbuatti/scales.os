import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className }) => (
  <div className={cn('mx-auto w-full max-w-7xl space-y-8 md:space-y-10', className)}>
    {children}
  </div>
);

export default PageContainer;
