import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';

/**
 * Persistent mobile CTA for the marketing page. Appears once the hero is
 * behind you and steps aside near the footer so it never covers the legal links.
 */
const MobileCtaBar: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const y = window.scrollY;
      const nearBottom =
        y + window.innerHeight >= document.documentElement.scrollHeight - 240;
      setVisible(y > 620 && !nearBottom);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 md:hidden',
        'transition-transform duration-300 ease-out',
        visible ? 'translate-y-0' : 'pointer-events-none translate-y-full',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold leading-tight">Free forever</p>
          <p className="text-[10px] leading-tight text-muted-foreground">
            No card · iPad &amp; desktop
          </p>
        </div>
        <Button asChild size="sm" className="h-10 shrink-0 px-5 font-bold shadow-sm">
          <Link to="/login" onClick={() => track('signup_click', { location: 'mobile_bar' })}>
            Start free
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default MobileCtaBar;