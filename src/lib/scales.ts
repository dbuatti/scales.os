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

// --- Global BPM Constants ---
export const MIN_BPM = 40;
export const MAX_BPM = 250;


// Utility to clean strings for ID generation
const cleanString = (s: string) => s.replace(/[\s\/\(\)]/g, "");

// Utility to generate a unique ID for a specific scale permutation (excluding BPM/Tempo)
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

// Utility to parse a scale permutation ID back into its components
export const parseScalePermutationId = (
  scalePermutationId: string
): {
    scaleId: string;
    articulation: Articulation;
    direction: DirectionType;
    handConfig: HandConfiguration;
    rhythm: RhythmicPermutation;
    accent: AccentDistribution;
    octaves: OctaveConfiguration;
} | null => {
    const parts = scalePermutationId.split('-');
    
    // We expect at least 8 parts: Key, Type, Articulation, Direction, HandConfig, Rhythm, Accent, Octaves
    // Example: C-Major-Legato-Asc+Descstandard-Handstogether-Straight-Noaccentneutralevenness-2OctavesStandard
    if (parts.length < 8) return null; 

    const scaleId = `${parts[0]}-${parts[1]}`; 
    const cleanedPermutationParts = parts.slice(2);
    
    const findOriginal = (cleanedPart: string, options: readonly string[]): string | undefined => {
        return options.find(option => cleanString(option) === cleanedPart);
    };
    
    const articulation = findOriginal(cleanedPermutationParts[0], ARTICULATIONS);
    const direction = findOriginal(cleanedPermutationParts[1], DIRECTION_TYPES);
    const handConfig = findOriginal(cleanedPermutationParts[2], HAND_CONFIGURATIONS);
    const rhythm = findOriginal(cleanedPermutationParts[3], RHYTHMIC_PERMUTATIONS);
    const accent = findOriginal(cleanedPermutationParts[4], ACCENT_DISTRIBUTIONS);
    const octaves = findOriginal(cleanedPermutationParts[5], OCTAVE_CONFIGURATIONS);

    if (!articulation || !direction || !handConfig || !rhythm || !accent || !octaves) {
        // console.error("Failed to parse permutation ID components:", scalePermutationId); // Removed log
        return null;
    }

    return {
        scaleId,
        articulation: articulation as Articulation,
        direction: direction as DirectionType,
        handConfig: handConfig as HandConfiguration,
        rhythm: rhythm as RhythmicPermutation,
        accent: accent as AccentDistribution,
        octaves: octaves as OctaveConfiguration,
    };
};


// Utility to generate a unique ID for a specific practice combination (used for Grade Tracker based on TempoLevel categories)
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
  return `${scaleId}-${cleanString(articulation)}-${cleanString(tempo)}-${cleanString(direction)}-${cleanString(handConfig)}-${cleanString(rhythm)}-${cleanString(accent)}-${cleanString(octaves)}`;
};

// Utility to map TempoLevel to the required BPM threshold for Grade Tracking
export const getTempoLevelBPMThreshold = (tempo: TempoLevel): number => {
    if (tempo === TEMPO_LEVELS[0]) return 70; // Slow (Under 80 BPM)
    if (tempo === TEMPO_LEVELS[1]) return 90; // Moderate (80-100 BPM)
    if (tempo === TEMPO_LEVELS[2]) return 110; // Fast (100-120 BPM)
    if (tempo === TEMPO_LEVELS[3]) return 130; // Professional (120+ BPM)
    return 0;
};

// Utility to generate a unique ID for a specific Dohnanyi exercise at a BPM target
export const getDohnanyiPracticeId = (
  exercise: DohnanyiExercise, 
  bpm: DohnanyiBPMTarget
): string => {
  return `Dohnanyi-${cleanString(exercise)}-${bpm}BPM`;
};

// Utility to generate a unique ID for a specific Hanon exercise at a BPM target
export const getHanonPracticeId = (
  exercise: HanonExercise, 
  bpm: HanonBPMTarget
): string => {
  return `Hanon-${cleanString(exercise)}-${bpm}BPM`;
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

export type ScaleRequirement = {
    type: 'scale';
    scalePermutationId: string;
    requiredBPM: number;
    description: string;
};

export type ExerciseRequirement = {
    type: 'dohnanyi' | 'hanon';
    practiceId: string;
    requiredBPM: number;
    description: string;
};

export type GradeRequirement = ScaleRequirement | ExerciseRequirement;


// Function to generate all requirements for a specific grade
export const getGradeRequirements = (gradeId: number): GradeRequirement[] => {
    const requirements: GradeRequirement[] = [];
    
    // Helper to generate scale requirements
    const generateScaleRequirements = (
        keys: readonly Key[], 
        types: readonly (ScaleType | ArpeggioType)[], 
        articulations: readonly Articulation[], 
        tempoLevel: TempoLevel, 
        octaves: OctaveConfiguration,
        direction: DirectionType,
        handConfig: HandConfiguration,
        rhythm: RhythmicPermutation,
        accent: AccentDistribution,
        description: string
    ) => {
        const requiredBPM = getTempoLevelBPMThreshold(tempoLevel);
        
        keys.forEach(key => {
            types.forEach(type => {
                // Handle Chromatic scale exception (only C key)
                if (type === "Chromatic" && key !== "C") return;
                
                const scaleId = `${key}-${type.replace(/\s/g, "")}`;
                
                articulations.forEach(articulation => {
                    const scalePermutationId = getScalePermutationId(
                        scaleId, 
                        articulation, 
                        direction,
                        handConfig,
                        rhythm,
                        accent,
                        octaves
                    );
                    requirements.push({
                        type: 'scale',
                        scalePermutationId,
                        requiredBPM,
                        description: `${key} ${type} (${articulation}, ${octaves}, ${direction}, ${handConfig}) @ ${requiredBPM} BPM`,
                    });
                });
            });
        });
    };

    const ALL_KEYS = KEYS;
    const MAJOR_MINOR_ARP = [ARPEGGIO_TYPES[0], ARPEGGIO_TYPES[1]] as const; // Major Arpeggio, Minor Arpeggio
    const MAJOR_MINOR_SCALES = [SCALE_TYPES[0], SCALE_TYPES[1]] as const; // Major, Harmonic Minor
    const ALL_TYPES = [...SCALE_TYPES, ...ARPEGGIO_TYPES] as const;
    
    // Grade 1 requirements (C Major/Minor Arpeggios, 1 Octave, Legato, Hands Separately. Target BPM: 70)
    if (gradeId >= 1) {
        generateScaleRequirements(
            ["C"] as readonly Key[], 
            MAJOR_MINOR_ARP as readonly (ScaleType | ArpeggioType)[], 
            [ARTICULATIONS[0]] as readonly Articulation[], 
            TEMPO_LEVELS[0], OCTAVE_CONFIGURATIONS[0],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[1], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3],
            PRACTICE_GRADES[0].description
        );
    }
    
    // Grade 2 requirements (All Keys Major/Minor Arpeggios, 2 Octaves, Legato, Hands Separately. Target BPM: 70)
    if (gradeId >= 2) {
        generateScaleRequirements(
            ALL_KEYS, MAJOR_MINOR_ARP as readonly (ScaleType | ArpeggioType)[], [ARTICULATIONS[0]] as readonly Articulation[], TEMPO_LEVELS[0], OCTAVE_CONFIGURATIONS[1],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[1], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3],
            PRACTICE_GRADES[1].description
        );
    }

    // Grade 3 requirements (Hands Together, Moderate Tempo. Target BPM: 90)
    if (gradeId >= 3) {
        generateScaleRequirements(
            ALL_KEYS, MAJOR_MINOR_ARP as readonly (ScaleType | ArpeggioType)[], [ARTICULATIONS[0]] as readonly Articulation[], TEMPO_LEVELS[1], OCTAVE_CONFIGURATIONS[1],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3],
            PRACTICE_GRADES[2].description
        );
    }

    // Grade 4 requirements (Introducing Scales. Target BPM: 90)
    if (gradeId >= 4) {
        generateScaleRequirements(
            ALL_KEYS, MAJOR_MINOR_SCALES as readonly (ScaleType | ArpeggioType)[], [ARTICULATIONS[0]] as readonly Articulation[], TEMPO_LEVELS[1], OCTAVE_CONFIGURATIONS[1],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3],
            PRACTICE_GRADES[3].description
        );
    }

    // Grade 5 requirements (Articulation Focus: Staccato/Portato. Target BPM: 90)
    if (gradeId >= 5) {
        generateScaleRequirements(
            ALL_KEYS, MAJOR_MINOR_SCALES as readonly (ScaleType | ArpeggioType)[], [ARTICULATIONS[1], ARTICULATIONS[2]] as readonly Articulation[], 
            TEMPO_LEVELS[1], OCTAVE_CONFIGURATIONS[1],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3],
            PRACTICE_GRADES[4].description
        );
    }

    // Grade 6 requirements (Tempo & Range: Fast, 3 Octaves. Target BPM: 110)
    if (gradeId >= 6) {
        generateScaleRequirements(
            ALL_KEYS, MAJOR_MINOR_SCALES as readonly (ScaleType | ArpeggioType)[], [ARTICULATIONS[0]] as readonly Articulation[], TEMPO_LEVELS[2], OCTAVE_CONFIGURATIONS[2],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3],
            PRACTICE_GRADES[5].description
        );
    }

    // Grade 7 requirements (Rhythmic Complexity: Dotted/Grouped 3s. Target BPM: 90)
    if (gradeId >= 7) {
        [RHYTHMIC_PERMUTATIONS[1], RHYTHMIC_PERMUTATIONS[3]].forEach(rhythm => {
            generateScaleRequirements(
                ALL_KEYS, MAJOR_MINOR_SCALES as readonly (ScaleType | ArpeggioType)[], [ARTICULATIONS[0]] as readonly Articulation[], TEMPO_LEVELS[1], OCTAVE_CONFIGURATIONS[1],
                DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], rhythm, ACCENT_DISTRIBUTIONS[3],
                PRACTICE_GRADES[6].description
            );
        });
    }

    // Grade 8 requirements (Advanced Permutations: Contrary Motion, Accent every 3, 4 Octaves. Target BPM: 110)
    if (gradeId >= 8) {
        generateScaleRequirements(
            ALL_KEYS, ALL_TYPES as readonly (ScaleType | ArpeggioType)[], [ARTICULATIONS[0]] as readonly Articulation[], TEMPO_LEVELS[2], OCTAVE_CONFIGURATIONS[3],
            DIRECTION_TYPES[3], HAND_CONFIGURATIONS[2], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[1],
            PRACTICE_GRADES[7].description
        );
    }

    // Grade 9 requirements (Professional Speed: 130 BPM equivalent)
    if (gradeId >= 9) {
        generateScaleRequirements(
            ALL_KEYS, ALL_TYPES as readonly (ScaleType | ArpeggioType)[], [ARTICULATIONS[0]] as readonly Articulation[], TEMPO_LEVELS[3], OCTAVE_CONFIGURATIONS[3],
            DIRECTION_TYPES[2], HAND_CONFIGURATIONS[0], RHYTHMIC_PERMUTATIONS[0], ACCENT_DISTRIBUTIONS[3],
            PRACTICE_GRADES[8].description
        );
    }
    
    // Grade 10 includes all Dohnányi and Hanon mastery steps
    if (gradeId >= 10) {
        DOHNANYI_EXERCISES.forEach(exercise => {
            DOHNANYI_BPM_TARGETS.forEach(bpm => {
                requirements.push({
                    type: 'dohnanyi',
                    practiceId: getDohnanyiPracticeId(exercise, bpm),
                    requiredBPM: bpm,
                    description: `${exercise} @ ${bpm} BPM`,
                });
            });
        });
        
        HANON_EXERCISES.forEach(exercise => {
            HANON_BPM_TARGETS.forEach(bpm => {
                requirements.push({
                    type: 'hanon',
                    practiceId: getHanonPracticeId(exercise, bpm),
                    requiredBPM: bpm,
                    description: `${exercise} @ ${bpm} BPM`,
                });
            });
        });
    }

    // Filter out duplicates (important for scale requirements)
    const uniqueRequirements: GradeRequirement[] = [];
    const seenIds = new Set<string>();
    
    requirements.forEach(req => {
        const id = req.type === 'scale' ? req.scalePermutationId : req.practiceId;
        if (!seenIds.has(id)) {
            seenIds.add(id);
            uniqueRequirements.push(req);
        }
    });

    return uniqueRequirements;
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