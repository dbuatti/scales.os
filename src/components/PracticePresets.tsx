"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Target, ShieldCheck, Flame } from 'lucide-react';
import { 
  ARTICULATIONS, 
  DIRECTION_TYPES, 
  HAND_CONFIGURATIONS, 
  RHYTHMIC_PERMUTATIONS, 
  ACCENT_DISTRIBUTIONS, 
  OCTAVE_CONFIGURATIONS 
} from '@/lib/scales';

interface Preset {
  name: string;
  icon: React.ReactNode;
  config: {
    articulation: string;
    direction: string;
    handConfig: string;
    rhythm: string;
    accent: string;
    octaves: string;
  };
}

const PRESETS: Preset[] = [
  {
    name: "Standard",
    icon: <ShieldCheck className="w-4 h-4" />,
    config: {
      articulation: ARTICULATIONS[0],
      direction: DIRECTION_TYPES[2],
      handConfig: HAND_CONFIGURATIONS[0],
      rhythm: RHYTHMIC_PERMUTATIONS[0],
      accent: ACCENT_DISTRIBUTIONS[3],
      octaves: OCTAVE_CONFIGURATIONS[1],
    }
  },
  {
    name: "Independence",
    icon: <Target className="w-4 h-4" />,
    config: {
      articulation: ARTICULATIONS[0],
      direction: DIRECTION_TYPES[2],
      handConfig: HAND_CONFIGURATIONS[1],
      rhythm: RHYTHMIC_PERMUTATIONS[1],
      accent: ACCENT_DISTRIBUTIONS[3],
      octaves: OCTAVE_CONFIGURATIONS[1],
    }
  },
  {
    name: "Coordination",
    icon: <Zap className="w-4 h-4" />,
    config: {
      articulation: ARTICULATIONS[1],
      direction: DIRECTION_TYPES[3],
      handConfig: HAND_CONFIGURATIONS[3],
      rhythm: RHYTHMIC_PERMUTATIONS[0],
      accent: ACCENT_DISTRIBUTIONS[1],
      octaves: OCTAVE_CONFIGURATIONS[2],
    }
  },
  {
    name: "Endurance",
    icon: <Flame className="w-4 h-4" />,
    config: {
      articulation: ARTICULATIONS[0],
      direction: DIRECTION_TYPES[2],
      handConfig: HAND_CONFIGURATIONS[0],
      rhythm: RHYTHMIC_PERMUTATIONS[0],
      accent: ACCENT_DISTRIBUTIONS[3],
      octaves: OCTAVE_CONFIGURATIONS[3],
    }
  }
];

interface PracticePresetsProps {
  onSelect: (config: Preset['config']) => void;
}

const PracticePresets: React.FC<PracticePresetsProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((preset) => (
        <Button
          key={preset.name}
          variant="outline"
          size="sm"
          onClick={() => onSelect(preset.config)}
          className="h-8 text-[10px] font-bold uppercase tracking-wider gap-2 border-primary/20 hover:bg-primary/5 focus-scale"
        >
          {preset.icon}
          {preset.name}
        </Button>
      ))}
    </div>
  );
};

export default PracticePresets;