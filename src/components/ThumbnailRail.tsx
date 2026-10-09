import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FileText, Loader2 } from 'lucide-react';

const THUMB_WIDTH = 96;

interface ThumbnailProps {
  pdf: PDFDocumentProxy;
  page: number;
  active: boolean;
  onSelect: () => void;
}

const Thumbnail: React.FC<ThumbnailProps> = ({ pdf, page, active, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || rendered) return;
    let cancelled = false;

    (async () => {
      const pageProxy = await pdf.getPage(page);
      if (cancelled) return;
      const base = pageProxy.getViewport({ scale: 1 });
      const viewport = pageProxy.getViewport({ scale: THUMB_WIDTH / base.width });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      const task = pageProxy.render({
        canvasContext: context,
        viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
      } as never) as unknown as { promise: Promise<void> };

      await task.promise;
      if (!cancelled) setRendered(true);
    })().catch(() => {
      /* rendering cancelled or failed; leave placeholder */
    });

    return () => {
      cancelled = true;
    };
  }, [visible, rendered, pdf, page]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative w-full shrink-0 rounded-md border bg-white p-1 shadow-sm transition-colors',
        active
          ? 'border-primary ring-2 ring-primary'
          : 'border-border/60 hover:border-primary/40',
      )}
    >
      <div
        ref={containerRef}
        className="relative flex min-h-[40px] items-center justify-center"
      >
        <canvas ref={canvasRef} className="block max-w-full rounded-sm" />
        {!rendered && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>
      <span
        className={cn(
          'mt-1 block text-center text-[10px] font-bold tabular-nums',
          active ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {page}
      </span>
    </button>
  );
};

interface ThumbnailRailProps {
  pdf: PDFDocumentProxy | null;
  pageCount: number;
  currentPage: number;
  onSelect: (page: number) => void;
}

const ThumbnailRail: React.FC<ThumbnailRailProps> = ({
  pdf,
  pageCount,
  currentPage,
  onSelect,
}) => {
  if (!pdf || pageCount === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
        <FileText className="h-4 w-4" />
        No document open
      </div>
    );
  }

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <ScrollArea className="h-[44vh] pr-1">
      <div className="grid grid-cols-3 gap-2">
        {pages.map((page) => (
          <Thumbnail
            key={page}
            pdf={pdf}
            page={page}
            active={page === currentPage}
            onSelect={() => onSelect(page)}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default ThumbnailRail;
