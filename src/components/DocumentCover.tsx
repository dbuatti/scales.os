import React, { useEffect, useRef, useState } from 'react';
import { Loader2, BookOpen } from 'lucide-react';
import { loadPdfjs, PDFJS_WASM_BASE } from '@/lib/pdfjs';
import { SavedDocument } from '@/hooks/use-repertoire-data';
import { cn } from '@/lib/utils';

interface DocumentCoverProps {
  doc: SavedDocument;
  getSignedUrl: (doc: SavedDocument) => Promise<string>;
  className?: string;
}

const GRADIENTS = [
  'from-indigo-500 to-blue-600',
  'from-violet-500 to-fuchsia-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-sky-600',
  'from-rose-500 to-pink-600',
];

const gradientFor = (id: string): string => {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return GRADIENTS[sum % GRADIENTS.length];
};

const DocumentCover: React.FC<DocumentCoverProps> = ({ doc, getSignedUrl, className }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
      },
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || rendered || failed) return;
    let cancelled = false;

    (async () => {
      try {
        const url = await getSignedUrl(doc);
        if (cancelled) return;
        const pdfjs = await loadPdfjs();
        const task = pdfjs.getDocument({ url, wasmUrl: PDFJS_WASM_BASE } as never);
        const pdf = await task.promise;
        if (cancelled) {
          void pdf.cleanup();
          return;
        }
        const page = await pdf.getPage(1);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: 320 / base.width });
        const context = canvas.getContext('2d');
        if (!context) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvasContext: context, viewport } as never).promise;
        if (!cancelled) setRendered(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, rendered, failed, doc, getSignedUrl]);

  return (
    <div ref={wrapRef} className={cn('relative h-full w-full overflow-hidden', className)}>
      {rendered ? (
        <canvas ref={canvasRef} className="h-full w-full object-cover object-top" />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center bg-gradient-to-br',
            gradientFor(doc.id),
          )}
        >
          <BookOpen className="h-8 w-8 text-white/80" />
        </div>
      )}
      {!rendered && !failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Loader2 className="h-4 w-4 animate-spin text-white/80" />
        </div>
      )}
    </div>
  );
};

export default DocumentCover;
