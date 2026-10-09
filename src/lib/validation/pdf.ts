export const MAX_PDF_BYTES = 25 * 1024 * 1024;
export const PDF_MIME_TYPE = 'application/pdf';

const PDF_MAGIC = '%PDF-';

export interface PdfFileMeta {
  name: string;
  size: number;
  type: string;
}

export interface PdfValidationResult {
  ok: boolean;
  reason?: string;
}

export const validatePdfFileMeta = (file: PdfFileMeta): PdfValidationResult => {
  if (!file || typeof file.name !== 'string' || file.name.trim().length === 0) {
    return { ok: false, reason: 'The selected file has no name.' };
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { ok: false, reason: 'The selected file is empty.' };
  }
  if (file.size > MAX_PDF_BYTES) {
    const limitMb = Math.round(MAX_PDF_BYTES / (1024 * 1024));
    return { ok: false, reason: `PDFs must be ${limitMb} MB or smaller.` };
  }
  if (file.type && file.type !== PDF_MIME_TYPE) {
    return { ok: false, reason: 'Only PDF files are supported.' };
  }
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return { ok: false, reason: 'Only .pdf files are supported.' };
  }
  return { ok: true };
};

export const hasPdfMagicBytes = async (blob: Blob): Promise<boolean> => {
  const header = await blob.slice(0, PDF_MAGIC.length).arrayBuffer();
  const signature = String.fromCharCode(...new Uint8Array(header));
  return signature === PDF_MAGIC;
};

export const validatePdfFile = async (
  file: File,
): Promise<PdfValidationResult> => {
  const meta = validatePdfFileMeta(file);
  if (!meta.ok) return meta;
  if (!(await hasPdfMagicBytes(file))) {
    return { ok: false, reason: 'This file does not look like a valid PDF.' };
  }
  return { ok: true };
};
