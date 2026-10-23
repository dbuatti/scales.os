import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/** Calm, compact placeholder for sections that have no data yet. */
const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-10 text-center', className)}>
    <div className="rounded-lg bg-muted p-2.5 text-muted-foreground">
      <Icon className="h-5 w-5" />
    </div>
    <div className="space-y-1">
      <p className="text-sm font-bold tracking-tight text-foreground">{title}</p>
      {description && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>
);

export default EmptyState;
