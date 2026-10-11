import { describe, expect, it } from 'vitest';
import { extractPracticePoints, groupPointsByName } from './progression';

const entry = (timestamp: number, items: unknown[]) => ({
  id: `id-${timestamp}`,
  timestamp,
  durationMinutes: 0,
  notes: '',
  itemsPracticed: items as never,
});

describe('extractPracticePoints', () => {
  it('extracts BPM from scale and repertoire items', () => {
    const points = extractPracticePoints([
      entry(1000, [
        { type: 'scale', scaleId: 'C-Major', practicedBPM: 60 },
        { type: 'repertoire', repertoireName: 'Hanon No. 1', repertoireBpmTarget: 80 },
      ]),
    ]);
    expect(points).toHaveLength(2);
    expect(points[0]).toMatchObject({ name: 'C-Major', bpm: 60, timestamp: 1000 });
    expect(points[1]).toMatchObject({ name: 'Hanon No. 1', bpm: 80 });
  });

  it('ignores items without a BPM', () => {
    const points = extractPracticePoints([
      entry(2000, [{ type: 'scale', scaleId: 'C-Major' }]),
    ]);
    expect(points).toHaveLength(0);
  });
});

describe('groupPointsByName', () => {
  it('groups and sorts points by timestamp', () => {
    const groups = groupPointsByName([
      { name: 'C-Major', timestamp: 3000, bpm: 70 },
      { name: 'C-Major', timestamp: 1000, bpm: 60 },
      { name: 'D-Major', timestamp: 2000, bpm: 80 },
    ]);
    expect(groups).toHaveLength(2);
    const c = groups.find((g) => g.name === 'C-Major');
    expect(c?.points.map((p) => p.bpm)).toEqual([60, 70]);
  });
});
