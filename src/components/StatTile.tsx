import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/** Compact metric card: icon chip, large value, uppercase label. */
const StatTile: React.FC<StatTileProps> = ({ icon: Icon, label, value, className, style }) => (
  <Card style={style} className={cn('surface', className)}>
    <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
      <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary sm:p-2.5">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xl font-black tabular-nums tracking-tight sm:text-2xl">{value}</p>
        <p className="truncate text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default StatTile;
