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

export const ARTICULATIONS = [
  "Legato",
  "Staccato",
  "Portato",
  "Voiced Hands (RH Project)",
  "Voiced Hands (LH Project)",
] as const;

export const TEMPO_LEVELS = [
  "Slow (Under 80 BPM)",
  "Moderate (80-100 BPM)",
  "Fast (100-120 BPM)",
  "Professional (120+ BPM)",
] as const;

export const DIRECTION_TYPES = [
  "Ascending only",
  "Descending only",
  "Asc + Desc (standard)",
  "Start from top note",
  "Start from middle of keyboard",
] as const;

export const HAND_CONFIGURATIONS = [
  "Hands together",
  "Hands separately",
  "Hands in contrary motion",
  "Hands in similar motion, staggered entry",
] as const;

export const RHYTHMIC_PERMUTATIONS = [
  "Straight",
  "Dotted (long–short)",
  "Dotted (short–long)",
  "Grouped 3s",
  "Grouped 5s",
] as const;

export const ACCENT_DISTRIBUTIONS = [
  "Accent every 2",
  "Accent every 3",
  "Accent on thumb crossings",
  "No accent (neutral evenness)",
] as const;

export const OCTAVE_CONFIGURATIONS = [
  "1 Octave (Beginner)",
  "2 Octaves (Standard)",
  "3 Octaves (Advanced)",
  "4 Octaves (Professional)",
] as const;


export type Key = typeof KEYS[number];
export type ScaleType = typeof SCALE_TYPES[number];
export type ArpeggioType = typeof ARPEGGIO_TYPES[number];
export type Articulation = typeof ARTICULATIONS[number];
export type TempoLevel = typeof TEMPO_LEVELS[number];
export type DirectionType = typeof DIRECTION_TYPES[number];
export type HandConfiguration = typeof HAND_CONFIGURATIONS[number];
export type RhythmicPermutation = typeof RHYTHMIC_PERMUTATIONS[number];
export type AccentDistribution = typeof ACCENT_DISTRIBUTIONS[number];
export type OctaveConfiguration = typeof OCTAVE_CONFIGURATIONS[number];


export type ScaleItem = {
  key: Key;
  type: ScaleType | ArpeggioType;
  id: string;
};

// Utility to generate a unique ID for a specific practice combination
export const getPracticeId = (
  scaleId: string, 
  articulation: Articulation, 
  tempo: TempoLevel,
  direction: DirectionType,
  handConfig: HandConfiguration,
  rhythm: RhythmicPermutation,
  accent: AccentDistribution,
  octaves: OctaveConfiguration
): string => {
  const cleanString = (s: string) => s.replace(/[\s\/\(\)]/g, "");
  return `${scaleId}-${cleanString(articulation)}-${cleanString(tempo)}-${cleanString(direction)}-${cleanString(handConfig)}-${cleanString(rhythm)}-${cleanString(accent)}-${cleanString(octaves)}`;
};

// Utility to generate a unique ID for Dohnanyi practice based on target BPM
export const getDohnanyiPracticeId = (exercise: DohnanyiExercise, bpmTarget: DohnanyiBPMTarget): string => {
    const cleanString = (s: string) => s.replace(/[\s\/\(\)]/g, "");
    return `DOHNANYI-${cleanString(exercise)}-${bpmTarget}BPM`;
};

// Utility to generate a unique ID for Hanon practice based on target BPM
export const getHanonPracticeId = (exercise: HanonExercise, bpmTarget: HanonBPMTarget): string => {
    const cleanString = (s: string) => s.replace(/[\s\/\(\)]/g, "");
    return `HANON-${cleanString(exercise)}-${bpmTarget}BPM`;
};


// --- Dohnányi Exercises ---
export const DOHNANYI_EXERCISES = [
  "Exercise I", "Exercise II", "Exercise III", "Exercise IV", 
  "Exercise V", "Exercise VI", "Exercise VII", "Exercise VIII", 
  "Exercise IX", "Exercise X"
] as const;

export type DohnanyiExercise = typeof DOHNANYI_EXERCISES[number];

export type DohnanyiItem = {
  type: 'Dohnanyi';
  name: DohnanyiExercise;
  id: string; // e.g., Dohnanyi-ExerciseI
};

export const ALL_DOHNANYI_ITEMS: DohnanyiItem[] = DOHNANYI_EXERCISES.map(name => ({
    type: 'Dohnanyi',
    name,
    id: `Dohnanyi-${name.replace(/\s/g, "")}`,
}));

export const DOHNANYI_BPM_TARGETS = [60, 80, 100, 120, 140, 160] as const;
export type DohnanyiBPMTarget = typeof DOHNANYI_BPM_TARGETS[number];

export const ALL_DOHNANYI_COMBINATIONS: { id: string, name: DohnanyiExercise, bpm: DohnanyiBPMTarget }[] = [];
DOHNANYI_EXERCISES.forEach(name => {
    DOHNANYI_BPM_TARGETS.forEach(bpm => {
        ALL_DOHNANYI_COMBINATIONS.push({
            id: getDohnanyiPracticeId(name, bpm),
            name,
            bpm,
        });
    });
});


// --- Hanon Exercises ---
const HANON_EXERCISE_NAMES = Array.from({ length: 60 }, (_, i) => `Exercise ${i + 1}`) as [string, ...string[]];
export const HANON_EXERCISES = HANON_EXERCISE_NAMES as Readonly<typeof HANON_EXERCISE_NAMES>;

export type HanonExercise = typeof HANON_EXERCISES[number];

export type HanonItem = {
  type: 'Hanon';
  name: HanonExercise;
  id: string; // e.g., Hanon-Exercise1
};

export const ALL_HANON_ITEMS: HanonItem[] = HANON_EXERCISES.map(name => ({
    type: 'Hanon',
    name,
    id: `Hanon-${name.replace(/\s/g, "")}`,
}));

export const HANON_BPM_TARGETS = [60, 80, 100, 120, 140, 160] as const;
export type HanonBPMTarget = typeof HANON_BPM_TARGETS[number];

export const ALL_HANON_COMBINATIONS: { id: string, name: HanonExercise, bpm: HanonBPMTarget }[] = [];
HANON_EXERCISES.forEach(name => {
    HANON_BPM_TARGETS.forEach(bpm => {
        ALL_HANON_COMBINATIONS.push({
            id: getHanonPracticeId(name, bpm),
            name,
            bpm,
        });
    });
});


// --- Grading System ---
export const PRACTICE_GRADES = [
  { id: 1, name: "Grade 1: Basic Foundation", description: "C Major/Minor Arpeggios, 1 Octave, Legato, Hands Separately. Target BPM: 70" },
  { id: 2, name: "Grade 2: Expanding Range", description: "All Keys Major/Minor Arpeggios, 2 Octaves, Legato, Hands Separately. Target BPM: 70" },
  { id: 3, name: "Grade 3: Hands Together", description: "All Keys Major/Minor Arpeggios, 2 Octaves, Legato, Hands Together. Target BPM: 90" },
  { id: 4, name: "Grade 4: Introducing Scales", description: "All Keys Major/Minor Scales, 2 Octaves, Legato, Hands Together. Target BPM: 90" },
  { id: 5, name: "Grade 5: Articulation Focus", description: "All Keys Major/Minor Scales, 2 Octaves, Staccato/Portato, Hands Together. Target BPM: 90" },
  { id: 6, name: "Grade 6: Tempo & Range", description: "All Keys Major/Minor Scales, 3 Octaves, Legato, Hands Together. Target BPM: 110" },
  { id: 7, name: "Grade 7: Rhythmic Complexity", description: "All Keys Major/Minor Scales, 2 Octaves, Legato, Dotted/Grouped 3s, Hands Together. Target BPM: 90" },
  { id: 8, name: "Grade 8: Advanced Permutations", description: "All Keys All Types, 4 Octaves, Contrary Motion, Accent every 3. Target BPM: 110" },
  { id: 9, name: "Grade 9: Professional Speed", description: "All Keys All Types, 4 Octaves, Legato, Straight, Hands Together. Target BPM: 130" },
  { id: 10, name: "Grade 10: Full Mastery", description: "All combinations mastered across all parameters." },
] as const;

export type PracticeGrade = typeof PRACTICE_GRADES[number];


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