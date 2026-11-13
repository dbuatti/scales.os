import type { SavedDocument } from '@/hooks/use-repertoire-data';

interface ExportInput {
  email: string | null;
  log: unknown[];
  scaleMasteryBPMMap: Record<string, number>;
  exerciseMasteryBPMMap: Record<string, number>;
  documents: SavedDocument[];
}

/**
 * Builds a portable JSON export of everything the user created.
 * PDFs are intentionally excluded — only their metadata, never the files.
 */
export const buildExport = ({
  email,
  log,
  scaleMasteryBPMMap,
  exerciseMasteryBPMMap,
  documents,
}: ExportInput) => ({
  app: 'Scales.os',
  exportedAt: new Date().toISOString(),
  account: { email },
  practice: {
    logs: log,
    scaleMasteryBpm: scaleMasteryBPMMap,
    exerciseMasteryBpm: exerciseMasteryBPMMap,
  },
  library: documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    mode: doc.mode,
    pageCount: doc.page_count,
    createdAt: doc.created_at,
  })),
});

export const downloadJson = (data: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const exportFilename = () => {
  const date = new Date().toISOString().slice(0, 10);
  return `scales-os-export-${date}.json`;
};