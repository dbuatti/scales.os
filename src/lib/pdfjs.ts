import pdfjsUrl from 'pdfjs-dist/legacy/build/pdf.min.mjs?url';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

export type PdfjsModule = typeof import('pdfjs-dist');

export const PDFJS_WASM_BASE = `${import.meta.env.BASE_URL}pdfjs-wasm/`;

let pdfjsPromise: Promise<PdfjsModule> | null = null;

// Load pdf.js at runtime from its own asset URL. Keeping it out of the Rollup
// graph is deliberate: inlining the pdf.js module into an app chunk breaks its
// internal top-level evaluation order under minification.
export function loadPdfjs(): Promise<PdfjsModule> {
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
