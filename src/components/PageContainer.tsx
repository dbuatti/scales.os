import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className, ...props }) => (
  <div {...props} className={cn('mx-auto w-full max-w-7xl space-y-8 md:space-y-10 animate-in fade-in duration-300', className)}>
    {children}
  </div>
);

export default PageContainer;
