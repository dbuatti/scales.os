import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import pdfjsUrl from 'pdfjs-dist/legacy/build/pdf.min.mjs?url';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { cn } from '@/lib/utils';
import { getMappingForPage, PageMapping } from '@/lib/repertoire';
import { FileText, Loader2, AlertTriangle, Bookmark as BookmarkIcon } from 'lucide-react';

// Load pdf.js at runtime from its own asset URL. Keeping it out of the Rollup
// graph is deliberate: inlining the pdf.js module into an app chunk breaks its
// internal top-level evaluation order under minification.
type PdfjsModule = typeof import('pdfjs-dist');

const PDFJS_WASM_BASE = `${import.meta.env.BASE_URL}pdfjs-wasm/`;

let pdfjsPromise: Promise<PdfjsModule> | null = null;

function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import(/* @vite-ignore */ pdfjsUrl)
      .then((module) => {
        const mod = module as unknown as PdfjsModule;
        mod.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        return mod;
      })
      .catch((err) => {
        pdfjsPromise = null;
        throw err;
      });
  }
  return pdfjsPromise;
}

export interface PdfViewerHandle {
  scrollToPage: (page: number) => void;
}

interface PdfViewerProps {
  source: string | ArrayBuffer | null;
  mappings: PageMapping[];
  onPageChange?: (page: number, mapping?: PageMapping) => void;
  onDocumentLoaded?: (pageCount: number) => void;
  initialPage?: number;
  maxPixelRatio?: number;
  onBookmark?: (page: number) => void;
  scrollClassName?: string;
  className?: string;
}

interface PdfPageProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  label?: string;
  mode?: string;
  isActive: boolean;
  maxPixelRatio: number;
  showBookmark?: boolean;
  onBookmark?: () => void;
}

const PdfPage: React.FC<PdfPageProps> = ({
  pdf,
  pageNumber,
  width,
  label,
  mode,
  isActive,
  maxPixelRatio,
  showBookmark,
  onBookmark,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1.414);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
      },
      { rootMargin: '700px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || rendered || width <= 0) return;

    let cancelled = false;
    let renderTask: { promise: Promise<void>; cancel?: () => void } | undefined;

    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const baseViewport = page.getViewport({ scale: 1 });
      setAspectRatio(baseViewport.height / baseViewport.width);

      const scale = width / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const outputScale = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = '100%';
      canvas.style.height = 'auto';

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;
      renderTask = page.render({
        canvasContext: context,
        viewport,
        transform,
      } as never) as unknown as { promise: Promise<void>; cancel?: () => void };
      await renderTask.promise;
      if (!cancelled) setRendered(true);
    })().catch(() => {
      /* rendering cancelled or failed; leave placeholder */
    });

    return () => {
      cancelled = true;
      renderTask?.cancel?.();
    };
  }, [visible, rendered, width, pdf, pageNumber, maxPixelRatio]);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'relative rounded-md overflow-hidden border bg-white shadow-sm transition-all',
        isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-border/60',
      )}
      style={{ aspectRatio: `1 / ${aspectRatio}` }}
    >
      <canvas ref={canvasRef} className="block w-full" />
      {!rendered && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
          {visible ? <Loader2 className="w-6 h-6 animate-spin" /> : null}
        </div>
      )}
      {label && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-md bg-background/90 px-2 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm border border-primary/20">
          <FileText className="w-3 h-3 text-primary" />
          <span className="max-w-[220px] truncate">{label}</span>
          <span className="rounded bg-primary/10 px-1 py-0.5 text-primary">{mode}</span>
        </div>
      )}
      <div className="absolute bottom-2 right-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
        {pageNumber}
      </div>
      {showBookmark && (
        <button
          onClick={onBookmark}
          title="Bookmark exercise on this page"
          className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-primary/90 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-sm hover:bg-primary transition-colors"
        >
          <BookmarkIcon className="w-3 h-3" />
          Bookmark
        </button>
      )}
    </div>
  );
};

const PdfViewer = React.forwardRef<PdfViewerHandle, PdfViewerProps>(({
  source,
  mappings,
  onPageChange,
  onDocumentLoaded,
  initialPage,
  maxPixelRatio = 2,
  onBookmark,
  scrollClassName = 'h-[70vh] min-h-[480px]',
  className,
}, ref) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const taskRef = useRef<{ destroy(): void } | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const didJumpRef = useRef(false);
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void pdfRef.current?.cleanup();
    pdfRef.current = null;
    taskRef.current?.destroy();
    taskRef.current = null;
    setPdf(null);
    setPageCount(0);
    setCurrentPage(1);
    setError(null);

    if (!source) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const params = typeof source === 'string'
      ? { url: source, wasmUrl: PDFJS_WASM_BASE }
      : { data: source, wasmUrl: PDFJS_WASM_BASE };

    (async () => {
      let task: ReturnType<PdfjsModule['getDocument']>;
      try {
        const pdfjsLib = await loadPdfjs();
        task = pdfjsLib.getDocument(params as never);
        taskRef.current = task;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load pdf.js.');
          setLoading(false);
        }
        return;
      }

      task.promise
        .then((doc) => {
          if (cancelled) {
            void doc.cleanup();
            return;
          }
          pdfRef.current = doc;
          setPdf(doc);
          setPageCount(doc.numPages);
          setCurrentPage(1);
          onDocumentLoaded?.(doc.numPages);
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Failed to load PDF.');
            setPdf(null);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    })();

    return () => {
      cancelled = true;
      taskRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  useEffect(() => {
    const el = pagesRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      setWidth(next);
    });
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, [pdf]);

  useEffect(() => {
    return () => {
      void pdfRef.current?.cleanup();
      pdfRef.current = null;
      taskRef.current?.destroy();
      taskRef.current = null;
    };
  }, []);

  const pages = useMemo(
    () => (pdf ? Array.from({ length: pageCount }, (_, i) => i + 1) : []),
    [pdf, pageCount],
  );

  useEffect(() => {
    didJumpRef.current = false;
  }, [source]);

  const scrollToPage = useCallback(
    (page: number) => {
      const container = scrollRef.current;
      const target = pageRefs.current.get(page);
      if (container && target) {
        container.scrollTop = target.offsetTop;
        setCurrentPage(page);
      }
    },
    [],
  );

  useImperativeHandle(ref, () => ({ scrollToPage }), [scrollToPage]);

  useEffect(() => {
    if (!pdf || width <= 0 || !initialPage || initialPage <= 1 || didJumpRef.current) return;
    scrollToPage(initialPage);
    didJumpRef.current = true;
  }, [pdf, width, initialPage, pages, scrollToPage]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const marker = container.scrollTop + container.clientHeight * 0.3;
    let best = 1;
    pageRefs.current.forEach((el, page) => {
      if (el.offsetTop <= marker) best = page;
    });
    setCurrentPage((prev) => (prev === best ? prev : best));
  }, []);

  useEffect(() => {
    const mapping = getMappingForPage(mappings, currentPage);
    onPageChangeRef.current?.(currentPage, mapping);
  }, [currentPage, mappings]);

  if (!source) {
    return (
      <div className={cn('flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 min-h-[420px] text-center p-8', className)}>
        <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Load a PDF to begin</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Your whole method book works here — no need to split it into separate files.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 min-h-[420px] text-center p-8', className)}>
        <AlertTriangle className="w-8 h-8 text-destructive mb-3" />
        <p className="text-sm font-medium text-destructive">Could not load PDF</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm break-words">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn('overflow-y-auto rounded-lg bg-muted/20 border border-border/60 p-4', scrollClassName)}
      >
        <div ref={pagesRef} className="relative mx-auto flex flex-col items-center gap-4 max-w-3xl">
          {loading && (
            <div className="flex items-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading document…</span>
            </div>
          )}
          {pages.map((page) => {
            const mapping = getMappingForPage(mappings, page);
            const isMapped = Boolean(mapping);
            return (
              <div
                key={page}
                ref={(el) => {
                  if (el) pageRefs.current.set(page, el);
                  else pageRefs.current.delete(page);
                }}
                className="w-full"
              >
                {pdf && (
                  <PdfPage
                    pdf={pdf}
                    pageNumber={page}
                    width={width}
                    label={mapping?.label}
                    mode={mapping?.mode}
                    isActive={page === currentPage}
                    maxPixelRatio={maxPixelRatio}
                    showBookmark={!isMapped && page === currentPage && Boolean(onBookmark)}
                    onBookmark={onBookmark ? () => onBookmark(page) : undefined}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default PdfViewer;
