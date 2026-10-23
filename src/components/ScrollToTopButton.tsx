import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) { // Show button after scrolling 300px down
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <Button
      onClick={scrollToTop}
      variant="outline"
      size="icon"
      tabIndex={isVisible ? 0 : -1}
      className={cn(
        // Bottom-left so it never collides with the floating tempo panel (bottom-right)
        "fixed bottom-24 left-4 z-40 h-10 w-10 rounded-full border-border/60 bg-card/90 text-muted-foreground shadow-md backdrop-blur transition-all duration-200 hover:text-foreground active:scale-[0.98] lg:bottom-8 lg:left-8",
        isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  );
};

export default ScrollToTopButton;