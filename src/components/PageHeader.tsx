import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  actions,
  className,
}) => (
  <div className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
    <div className="space-y-2">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70">
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      {description && (
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">{description}</p>
      )}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
  </div>
);

export default PageHeader;
