import React from 'react';
import { cn } from '@/lib/utils';

type KbdProps = React.HTMLAttributes<HTMLElement>;

/** Inline keyboard key chip used in shortcut hints. */
const Kbd: React.FC<KbdProps> = ({ className, ...props }) => (
  <kbd
    {...props}
    className={cn(
      'inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border/60 bg-muted/60 px-1.5 text-[10px] font-semibold text-muted-foreground shadow-sm',
      className,
    )}
  />
);

export default Kbd;
