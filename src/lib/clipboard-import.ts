import { PageMapping } from './repertoire';

export interface ImportedFile {
  name: string;
  type: 'pdf' | 'audio' | 'other';
  size: number;
  bpm?: number;
  bpmCandidates: number[];
  data?: ArrayBuffer;
  file?: File;
}

export interface ParsedBPMInfo {
  bpms: number[];
  highestBPM: number;
  suggestedGoalBPM: number;
  suggestedMilestones: number[];
}

export function parseBPMsFromFilename(filename: string): ParsedBPMInfo {
  const patterns = [
    /(\d{2,3})\s*(?:bpm|BPM)/gi,
    /(\d{2,3})\s*(?:@|-)\s*(?:bpm|BPM)?/gi,
    /\[(\d{2,3})\s*(?:bpm|BPM)?\]/gi,
    /\((\d{2,3})\s*(?:bpm|BPM)?\)/gi,
    /_(\d{2,3})_/g,
    /^(\d{2,3})[\s_-]/g,
    /[\s_-](\d{2,3})[\s_-]/g,
  ];

  const allBPMs: number[] = [];

  for (const pattern of patterns) {
    const matches = filename.matchAll(pattern);
    for (const match of matches) {
      const bpm = parseInt(match[1], 10);
      if (bpm >= 30 && bpm <= 300) {
        allBPMs.push(bpm);
      }
    }
  }

  const uniqueBPMs = [...new Set(allBPMs)].sort((a, b) => a - b);

  if (uniqueBPMs.length === 0) {
    return { bpms: [], highestBPM: 0, suggestedGoalBPM: 0, suggestedMilestones: [] };
  }

  const highestBPM = uniqueBPMs[uniqueBPMs.length - 1];
  const suggestedGoalBPM = highestBPM;
  const suggestedMilestones = uniqueBPMs.slice(0, -1);

  return {
    bpms: uniqueBPMs,
    highestBPM,
    suggestedGoalBPM,
    suggestedMilestones,
  };
}

export function parseFilesFromClipboard(items: DataTransferItemList): Promise<ImportedFile[]> {
  const promises: Promise<ImportedFile>[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) {
        promises.push(
          (async () => {
            const arrayBuffer = await file.arrayBuffer();
            const bpmInfo = parseBPMsFromFilename(file.name);
            return {
              name: file.name,
              type: file.type === 'application/pdf' ? 'pdf' : file.type.startsWith('audio/') ? 'audio' : 'other',
              size: file.size,
              bpm: bpmInfo.highestBPM || undefined,
              bpmCandidates: bpmInfo.bpms,
              data: arrayBuffer,
              file,
            };
          })()
        );
      }
    }
  }

  return Promise.all(promises);
}

export function parseFilesFromDropboxText(text: string): ImportedFile[] {
  const lines = text.split('\n').filter(l => l.trim());
  const files: ImportedFile[] = [];

  for (const line of lines) {
    let filename = line.trim();
    filename = filename.replace(/\s+\([\d.]+\s*(?:KB|MB|GB)\)\s*[-–—]\s*.*$/, '');
    filename = filename.replace(/\s+[-–—]\s*\d{1,2}\s+\w+\s+\d{4}.*$/, '');

    if (filename && (filename.endsWith('.pdf') || filename.match(/\.(mp3|wav|m4a|flac|ogg)$/i))) {
      const bpmInfo = parseBPMsFromFilename(filename);
      files.push({
        name: filename,
        type: filename.endsWith('.pdf') ? 'pdf' : 'audio',
        size: 0,
        bpm: bpmInfo.highestBPM || undefined,
        bpmCandidates: bpmInfo.bpms,
      });
    }
  }

  return files;
}