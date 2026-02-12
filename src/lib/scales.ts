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
  "Left hand only",
  "Right hand only",
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

export const MIN_BPM = 40;
export const MAX_BPM = 250;

export const cleanString = (s: string) => s.replace(/[\s\/\(\)]/g, "");

export const getScalePermutationId = (
  scaleId: string, 
  articulation: Articulation, 
  direction: DirectionType,
  handConfig: HandConfiguration,
  rhythm: RhythmicPermutation,
  accent: AccentDistribution,
  octaves: OctaveConfiguration
): string => {
  return `${scaleId}-${cleanString(articulation)}-${cleanString(direction)}-${cleanString(handConfig)}-${cleanString(rhythm)}-${cleanString(accent)}-${cleanString(octaves)}`;
};

export const parseScalePermutationId = (
  scalePermutationId: string
): {
    scaleId: string;
    articulation: Articulation;
    direction: DirectionType;
    handConfig: HandConfiguration | 'Hands separately';
    rhythm: RhythmicPermutation;
    accent: AccentDistribution;
    octaves: OctaveConfiguration;
} | null => {
    const parts = scalePermutationId.split('-');
    if (parts.length < 8) return null; 

    const scaleId = `${parts[0]}-${parts[1]}`; 
    const cleanedPermutationParts = parts.slice(2);
    
    const findOriginal = (cleanedPart: string, options: readonly string[]): string | undefined => {
        return options.find(option => cleanString(option) === cleanedPart);
    };
    
    const articulation = findOriginal(cleanedPermutationParts[0], ARTICULATIONS);
    const direction = findOriginal(cleanedPermutationParts[1], DIRECTION_TYPES);
    let handConfig: HandConfiguration | 'Hands separately' | undefined = findOriginal(cleanedPermutationParts[2], HAND_CONFIGURATIONS) as HandConfiguration;
    if (!handConfig && cleanedPermutationParts[2] === cleanString("Hands separately")) {
        handConfig = 'Hands separately';
    }

    const rhythm = findOriginal(cleanedPermutationParts[3], RHYTHMIC_PERMUTATIONS);
    const accent = findOriginal(cleanedPermutationParts[4], ACCENT_DISTRIBUTIONS);
    const octaves = findOriginal(cleanedPermutationParts[5], OCTAVE_CONFIGURATIONS);

    if (!articulation || !direction || !handConfig || !rhythm || !accent || !octaves) {
        return null;
    }

    return {
        scaleId,
        articulation: articulation as Articulation,
        direction: direction as DirectionType,
        handConfig: handConfig,
        rhythm: rhythm as RhythmicPermutation,
        accent: accent as AccentDistribution,
        octaves: octaves as OctaveConfiguration,
    };
};

export const getTempoLevelBPMThreshold = (tempo: TempoLevel): number => {
    if (tempo === TEMPO_LEVELS[0]) return 70; 
    if (tempo === TEMPO_LEVELS[1]) return 90; 
    if (tempo === TEMPO_LEVELS[2]) return 110; 
    if (tempo === TEMPO_LEVELS[3]) return 130; 
    return 0;
};

export const DOHNANYI_EXERCISES = [
  "Exercise I", "Exercise II", "Exercise III", "Exercise IV", 
  "Exercise V", "Exercise VI", "Exercise VII", "Exercise VIII", 
  "Exercise IX", "Exercise X"
] as const;

export type DohnanyiExercise = typeof DOHNANYI_EXERCISES[number];

export const getDohnanyiExerciseBaseId = (
  exercise: DohnanyiExercise
): string => {
  return `Dohnanyi-${cleanString(exercise)}`;
};

export type DohnanyiItem = {
  type: 'Dohnanyi';
  name: DohnanyiExercise;
  id: string; 
};

export const ALL_DOHNANYI_ITEMS: DohnanyiItem[] = DOHNANYI_EXERCISES.map(name => ({
    type: 'Dohnanyi',
    name,
    id: getDohnanyiExerciseBaseId(name),
}));

export const DOHNANYI_BPM_TARGETS = [60, 80, 100, 120, 140, 160] as const;
export type DohnanyiBPMTarget = typeof DOHNANYI_BPM_TARGETS[number];

export const getDohnanyiPracticeId = (
  exercise: DohnanyiExercise, 
  bpm: DohnanyiBPMTarget
): string => {
  return `Dohnanyi-${cleanString(exercise)}-${bpm}BPM`;
};

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

const HANON_EXERCISE_NAMES = Array.from({ length: 60 }, (_, i) => `Exercise ${i + 1}`) as [string, ...string[]];
export const HANON_EXERCISES = HANON_EXERCISE_NAMES as Readonly<typeof HANON_EXERCISE_NAMES>;

export type HanonExercise = typeof HANON_EXERCISES[number];

export const getHanonExerciseBaseId = (
  exercise: HanonExercise
): string => {
  return `Hanon-${cleanString(exercise)}`;
};

export type HanonItem = {
  type: 'Hanon';
  name: HanonExercise;
  id: string; 
};

export const ALL_HANON_ITEMS: HanonItem[] = HANON_EXERCISES.map(name => ({
    type: 'Hanon',
    name,
    id: getHanonExerciseBaseId(name),
}));

export const HANON_BPM_TARGETS = [60, 80, 100, 120, 140, 160] as const;
export type HanonBPMTarget = typeof HANON_BPM_TARGETS[number];

export const getHanonPracticeId = (
  exercise: HanonExercise,
  bpm: HanonBPMTarget
): string => {
  return `Hanon-${cleanString(exercise)}-${bpm}BPM`;
};

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

export const PRACTICE_GRADES = [
  { id: 1, name: "Grade 1: Fundamentals", description: "C Major/Minor Arpeggios, 1 Octave, LH/RH separately. Target: 60 BPM" },
  { id: 2, name: "Grade 2: Basic Scales", description: "C Major/Minor Scales, 1 Octave, LH/RH separately. Target: 60 BPM" },
  { id: 3, name: "Grade 3: Expanding Keys", description: "G, D, F Major/Minor Arp & Scales, 2 Octaves, LH/RH. Target: 70 BPM" },
  { id: 4, name: "Grade 4: All Keys Arpeggios", description: "All Keys Major/Minor Arp, 2 Octaves, LH/RH. Target: 80 BPM" },
  { id: 5, name: "Grade 5: All Keys Scales", description: "All Keys Major/Minor Scales, 2 Octaves, LH/RH. Target: 80 BPM" },
  { id: 6, name: "Grade 6: Hands Together", description: "All Keys Major/Minor Arp & Scales, 2 Octaves, HT. Target: 80 BPM" },
  { id: 7, name: "Grade 7: Advanced Range", description: "All Keys, 3 Octaves, HT. Target: 100 BPM" },
  { id: 8, name: "Grade 8: Articulation Mastery", description: "All Keys, 2 Octaves, HT, Staccato/Portato. Target: 90 BPM" },
  { id: 9, name: "Grade 9: Rhythmic Complexity", description: "All Keys, 2 Octaves, HT, Dotted/Grouped. Target: 90 BPM" },
  { id: 10, name: "Grade 10: Professional Mastery", description: "All combinations, 4 Octaves, HT. Target: 120+ BPM" },
] as const;

export type PracticeGrade = typeof PRACTICE_GRADES[number];

export type ScaleRequirement = {
    type: 'scale';
    scalePermutationId: string;
    requiredBPM: number;
    description: string;
};

export type ExerciseRequirement = {
    type: 'dohnanyi' | 'hanon';
    practiceId: string; 
    exerciseId: string; 
    requiredBPM: number;
    description: string;
};

export type GradeRequirement = ScaleRequirement | ExerciseRequirement;

export const getGradeRequirements = (gradeId: number): GradeRequirement[] => {
    const requirements: GradeRequirement[] = [];
    
    const generateScaleRequirements = (
        keys: readonly Key[], 
        types: readonly (ScaleType | ArpeggioType)[], 
        articulations: readonly Articulation[], 
        requiredBPM: number, 
        octaves: OctaveConfiguration,
        direction: DirectionType,
        handConfigs: readonly HandConfiguration[], 
        rhythm: RhythmicPermutation,
        accent: AccentDistribution,
        description: string
    ) => {
        keys.forEach(key => {
            types.forEach(type => {
                if (type === "Chromatic" && key !== "C") return;
                const scaleId = `${key}-${type.replace(/\s/g, "")}`;
                articulations.forEach(articulation => {
                    handConfigs.forEach(handConfig => {
                        const scalePermutationId = getScalePermutationId(
                            scaleId, articulation, direction, handConfig, rhythm, accent, octaves
                        );
                        requirements.push({
                            type: 'scale',
                            scalePermutationId,
                            requiredBPM,
                            description: `${key} ${type} (${articulation}, ${octaves}, ${handConfig}) @ ${requiredBPM} BPM`,
                        });
                    });
                });
            });
        });
    };

    const ALL_KEYS = KEYS;
    const MAJOR_MINOR_ARP = [ARPEGGIO_TYPES[0], ARPEGGIO_TYPES[1]] as const;
    const MAJOR_MINOR_SCALES = [SCALE_TYPES[0], SCALE_TYPES[1]] as const;
    const ALL_TYPES = [...SCALE_TYPES, ...ARPEGGIO_TYPES] as const;
    
    if (gradeId >= 1) {
        generateScaleRequirements(["C"], MAJOR_MINOR_ARP, [ARTICULATIONS[0]], 60, OCTAVE_CONFIGURATIONS[0], DIRECTION_TYPES[2], [HAND_CONFIGURATIONS[1], HAND_CONFIGURATIONS[2]], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3], PRACTICE_GRADES[0].description);
    }
    if (gradeId >= 2) {
        generateScaleRequirements(["C"], MAJOR_MINOR_SCALES, [ARTICULATIONS[0]], 60, OCTAVE_CONFIGURATIONS[0], DIRECTION_TYPES[2], [HAND_CONFIGURATIONS[1], HAND_CONFIGURATIONS[2]], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3], PRACTICE_GRADES[1].description);
    }
    if (gradeId >= 3) {
        generateScaleRequirements(["G", "D", "F"], [...MAJOR_MINOR_ARP, ...MAJOR_MINOR_SCALES], [ARTICULATIONS[0]], 70, OCTAVE_CONFIGURATIONS[1], DIRECTION_TYPES[2], [HAND_CONFIGURATIONS[1], HAND_CONFIGURATIONS[2]], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3], PRACTICE_GRADES[2].description);
    }
    if (gradeId >= 4) {
        generateScaleRequirements(ALL_KEYS, MAJOR_MINOR_ARP, [ARTICULATIONS[0]], 80, OCTAVE_CONFIGURATIONS[1], DIRECTION_TYPES[2], [HAND_CONFIGURATIONS[1], HAND_CONFIGURATIONS[2]], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3], PRACTICE_GRADES[3].description);
    }
    if (gradeId >= 5) {
        generateScaleRequirements(ALL_KEYS, MAJOR_MINOR_SCALES, [ARTICULATIONS[0]], 80, OCTAVE_CONFIGURATIONS[1], DIRECTION_TYPES[2], [HAND_CONFIGURATIONS[1], HAND_CONFIGURATIONS[2]], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3], PRACTICE_GRADES[4].description);
    }
    if (gradeId >= 6) {
        generateScaleRequirements(ALL_KEYS, [...MAJOR_MINOR_ARP, ...MAJOR_MINOR_SCALES], [ARTICULATIONS[0]], 80, OCTAVE_CONFIGURATIONS[1], DIRECTION_TYPES[2], [HAND_CONFIGURATIONS[0]], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3], PRACTICE_GRADES[5].description);
    }
    if (gradeId >= 7) {
        generateScaleRequirements(ALL_KEYS, ALL_TYPES, [ARTICULATIONS[0]], 100, OCTAVE_CONFIGURATIONS[2], DIRECTION_TYPES[2], [HAND_CONFIGURATIONS[0]], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3], PRACTICE_GRADES[6].description);
    }
    if (gradeId >= 8) {
        generateScaleRequirements(ALL_KEYS, ALL_TYPES, [ARTICULATIONS[1], ARTICULATIONS[2]], 90, OCTAVE_CONFIGURATIONS[1], DIRECTION_TYPES[2], [HAND_CONFIGURATIONS[0]], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3], PRACTICE_GRADES[7].description);
    }
    if (gradeId >= 9) {
        [RHYTHMIC_PERMUTATIONS[1], RHYTHMIC_PERMUTATIONS[3]].forEach(rhythm => {
            generateScaleRequirements(ALL_KEYS, ALL_TYPES, [ARTICULATIONS[0]], 90, OCTAVE_CONFIGURATIONS[1], DIRECTION_TYPES[2], [HAND_CONFIGURATIONS[0]], rhythm, ACCENT_DISTRIBUTIONS[3], PRACTICE_GRADES[8].description);
        });
    }
    if (gradeId >= 10) {
        generateScaleRequirements(ALL_KEYS, ALL_TYPES, [ARTICULATIONS[0]], 120, OCTAVE_CONFIGURATIONS[3], DIRECTION_TYPES[2], [HAND_CONFIGURATIONS[0]], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3], PRACTICE_GRADES[9].description);
        DOHNANYI_EXERCISES.forEach(ex => DOHNANYI_BPM_TARGETS.forEach(bpm => requirements.push({ type: 'dohnanyi', practiceId: getDohnanyiPracticeId(ex, bpm), exerciseId: getDohnanyiExerciseBaseId(ex), requiredBPM: bpm, description: `${ex} @ ${bpm} BPM` })));
        HANON_EXERCISES.forEach(ex => HANON_BPM_TARGETS.forEach(bpm => requirements.push({ type: 'hanon', practiceId: getHanonPracticeId(ex, bpm), exerciseId: getHanonExerciseBaseId(ex), requiredBPM: bpm, description: `${ex} @ ${bpm} BPM` })));
    }

    const uniqueRequirements: GradeRequirement[] = [];
    const seenIds = new Set<string>();
    requirements.forEach(req => {
        const id = req.type === 'scale' ? req.scalePermutationId : req.practiceId;
        if (!seenIds.has(id)) { seenIds.add(id); uniqueRequirements.push(req); }
    });
    return uniqueRequirements;
};

export const generateScaleItems = (): ScaleItem[] => {
  const items: ScaleItem[] = [];
  SCALE_TYPES.filter(t => t !== "Chromatic").forEach(type => KEYS.forEach(key => items.push({ id: `${key}-${type.replace(/\s/g, "")}`, key, type })));
  items.push({ id: `C-Chromatic`, key: "C", type: "Chromatic" });
  ARPEGGIO_TYPES.forEach(type => KEYS.forEach(key => items.push({ id: `${key}-${type.replace(/\s/g, "")}`, key, type })));
  return items;
};

export const ALL_SCALE_ITEMS = generateScaleItems();