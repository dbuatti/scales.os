import { PracticeLogEntry } from '@/context/ScalesContext';

export interface PracticePoint {
  name: string;
  timestamp: number;
  bpm: number;
}

export const extractPracticePoints = (log: PracticeLogEntry[]): PracticePoint[] => {
  const points: PracticePoint[] = [];
  for (const entry of log) {
    for (const item of entry.itemsPracticed ?? []) {
      let name: string | null = null;
      let bpm: number | null = null;

      if (item.type === 'scale' && typeof item.practicedBPM === 'number') {
        name = item.scaleId || 'Scale';
        bpm = item.practicedBPM;
      } else if (item.type === 'repertoire' && typeof item.repertoireBpmTarget === 'number') {
        name = item.repertoireName || 'Repertoire';
        bpm = item.repertoireBpmTarget;
      } else if (item.type === 'hanon' && typeof item.hanonBpmTarget === 'number') {
        name = item.hanonName || 'Hanon';
        bpm = item.hanonBpmTarget;
      } else if (item.type === 'dohnanyi' && typeof item.bpmTarget === 'number') {
        name = item.dohnanyiName || 'Dohnányi';
        bpm = item.bpmTarget;
      }

      if (name && bpm !== null && bpm > 0) {
        points.push({ name, timestamp: entry.timestamp, bpm });
      }
    }
  }
  return points;
};

export const groupPointsByName = (
  points: PracticePoint[],
): { name: string; points: PracticePoint[] }[] => {
  const map = new Map<string, PracticePoint[]>();
  for (const point of points) {
    const list = map.get(point.name) ?? [];
    list.push(point);
    map.set(point.name, list);
  }
  return Array.from(map.entries())
    .map(([name, list]) => ({
      name,
      points: list.sort((a, b) => a.timestamp - b.timestamp),
    }))
    .sort((a, b) => {
      const lastA = a.points[a.points.length - 1].timestamp;
      const lastB = b.points[b.points.length - 1].timestamp;
      return lastB - lastA;
    });
};
