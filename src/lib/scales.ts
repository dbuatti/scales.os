export const KEYS = [
  "C", "G", "D", "A", "E", "B/Cb", "F#/Gb", "Db/C#", "Ab", "Eb", "Bb", "F"
] as const;

export const SCALE_TYPES = [
  "Major",
  "Harmonic Minor",
  "Melodic Minor",
  "Chromatic",
] as const;

export const ARPEGGIO_TYPES = [
  "Major Arpeggio",
  "Minor Arpeggio",
  "Dominant 7th",
  "Diminished 7th",
] as const;

export type Key = typeof KEYS[number];
export type ScaleType = typeof SCALE_TYPES[number];
export type ArpeggioType = typeof ARPEGGIO_TYPES[number];

export type ScaleItem = {
  key: Key;
  type: ScaleType | ArpeggioType;
  id: string;
};

// Function to generate all scale items
export const generateScaleItems = (): ScaleItem[] => {
  const items: ScaleItem[] = [];

  // Scales (Major, Harmonic Minor, Melodic Minor)
  SCALE_TYPES.filter(t => t !== "Chromatic").forEach(type => {
    KEYS.forEach(key => {
      items.push({
        id: `${key}-${type.replace(/\s/g, "")}`,
        key,
        type,
      });
    });
  });

  // Chromatic scale (only one entry, typically starting on C or any note)
  items.push({
    id: `C-Chromatic`,
    key: "C",
    type: "Chromatic",
  });

  // Arpeggios
  ARPEGGIO_TYPES.forEach(type => {
    KEYS.forEach(key => {
      items.push({
        id: `${key}-${type.replace(/\s/g, "")}`,
        key,
        type,
      });
    });
  });

  return items;
};

export const ALL_SCALE_ITEMS = generateScaleItems();