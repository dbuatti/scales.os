import React from 'react';
import { Loader2 } from 'lucide-react';

const ViewerFallback: React.FC = () => (
  <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 p-8 text-center">
    <Loader2 className="mb-3 h-7 w-7 animate-spin text-muted-foreground/40" />
    <p className="text-sm font-medium text-muted-foreground">Loading PDF viewer…</p>
  </div>
);

export default ViewerFallback;
