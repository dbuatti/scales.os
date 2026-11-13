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
    <div className="space-y-3">
      {eyebrow && (
        <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          <span aria-hidden="true" className="h-px w-6 bg-primary/50" />
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-[2.6rem] leading-[1.02] tracking-[-0.02em] md:text-5xl">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
      )}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
  </div>
);

export default PageHeader;