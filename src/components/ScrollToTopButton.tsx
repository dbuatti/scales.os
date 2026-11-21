import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Show after this much scroll. */
const SHOW_AFTER_PX = 600;
/** Hide again once the footer comes into view so it never covers footer links. */
const FOOTER_CLEARANCE_PX = 220;

const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const { scrollY, innerHeight } = window;
      const distanceFromBottom = document.documentElement.scrollHeight - (scrollY + innerHeight);
      setIsVisible(scrollY > SHOW_AFTER_PX && distanceFromBottom > FOOTER_CLEARANCE_PX);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <Button
      onClick={scrollToTop}
      variant="outline"
      size="icon"
      tabIndex={isVisible ? 0 : -1}
      aria-hidden={!isVisible}
      className={cn(
        // Desktop/tablet only: on phones it covered content and competed with the
        // sticky CTA / mobile nav. Bottom-left so it never collides with the
        // floating tempo panel (bottom-right).
        'fixed bottom-8 left-8 z-40 hidden h-10 w-10 rounded-full border-border/60 bg-card/90 text-muted-foreground shadow-sm backdrop-blur transition-all duration-200 hover:text-foreground hover:shadow-md active:scale-[0.98] md:inline-flex',
        isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
};

export default ScrollToTopButton;
