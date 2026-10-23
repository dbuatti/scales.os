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
    <div className="space-y-2.5">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          {eyebrow}
        </p>
      )}
      <h1 className="text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
      {description && (
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">{description}</p>
      )}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
  </div>
);

export default PageHeader;
