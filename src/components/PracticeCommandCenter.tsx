import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { LogIn, Play, Pause, RotateCcw } from 'lucide-react';
import { KEYS, SCALE_TYPES, ARPEGGIO_TYPES, ARTICULATIONS, TEMPO_LEVELS, getPracticeId, Key, Articulation, TempoLevel, ALL_SCALE_ITEMS } from '@/lib/scales';
import { useScales } from '../context/ScalesContext';
import { showSuccess, showError } from '@/utils/toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

// Helper to combine scale and arpeggio types for selection
const ALL_TYPES = [...SCALE_TYPES, ...ARPEGGIO_TYPES];

// --- Timer Component Logic (Integrated) ---
const INITIAL_TIME_SECONDS = 5 * 60; // 5 minutes

const PracticeTimer: React.FC = () => {
  const [time, setTime] = useState(INITIAL_TIME_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsFinished(false);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(INITIAL_TIME_SECONDS);
    setIsFinished(false);
  };

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0 && isRunning) {
      setIsRunning(false);
      setIsFinished(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, time]);

  return (
    <Card className="w-full bg-card/70 border-primary/30 shadow-2xl">
      <CardHeader className="p-3 border-b border-primary/20">
        <CardTitle className="text-center text-lg font-mono tracking-widest text-primary">FOCUS TIMER</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-3 p-4">
        <div className={cn(
            "text-6xl font-mono font-extrabold transition-colors",
            isFinished ? "text-green-400" : "text-primary-foreground"
        )}>
          {formatTime(time)}
        </div>
        {isFinished && (
            <p className="text-sm font-semibold text-green-400">Session Complete</p>
        )}
        <div className="flex space-x-4">
          {isRunning ? (
            <Button onClick={handlePause} variant="secondary" size="sm" className="bg-red-600 hover:bg-red-700 text-white">
              <Pause className="w-4 h-4 mr-1" /> PAUSE
            </Button>
          ) : (
            <Button onClick={handleStart} size="sm" disabled={isFinished} className="bg-green-600 hover:bg-green-700 text-white">
              <Play className="w-4 h-4 mr-1" /> START
            </Button>
          )}
          <Button onClick={handleReset} variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
            <RotateCcw className="w-4 h-4 mr-1" /> RESET
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
// --- End Timer Component Logic ---


const PracticeCommandCenter: React.FC = () => {
  const { addLogEntry, updatePracticeStatus, allScales } = useScales();
  
  // State for selected parameters
  const [selectedKey, setSelectedKey] = useState<Key>(KEYS[0]);
  const [selectedType, setSelectedType] = useState<string>(ALL_TYPES[0]); // Can be ScaleType or ArpeggioType
  const [selectedArticulation, setSelectedArticulation] = useState<Articulation>(ARTICULATIONS[0]);
  const [selectedTempoIndex, setSelectedTempoIndex] = useState<number>(0); // Index 0-3 for TEMPO_LEVELS

  const selectedTempo = TEMPO_LEVELS[selectedTempoIndex];

  const handleSaveSnapshot = () => {
    // 1. Find the corresponding ScaleItem ID
    let scaleItem;
    const isChromatic = selectedType === "Chromatic";

    if (isChromatic) {
        // Chromatic scale ID is always based on 'C' in our data structure
        scaleItem = allScales.find(s => s.type === "Chromatic");
    } else {
        scaleItem = allScales.find(s => s.key === selectedKey && s.type === selectedType);
    }

    if (!scaleItem) {
      showError("Could not identify the scale/arpeggio combination.");
      return;
    }

    const practiceId = getPracticeId(scaleItem.id, selectedArticulation, selectedTempo);

    // 2. Log the snapshot (durationMinutes: 0 indicates a snapshot log)
    addLogEntry({
      durationMinutes: 0, 
      scalesPracticed: [{
        scaleId: scaleItem.id,
        articulation: selectedArticulation,
        tempo: selectedTempo,
      }],
      notes: `Snapshot: ${scaleItem.key} ${scaleItem.type}, ${selectedArticulation}, ${selectedTempo}`,
    });

    // 3. Update the status to 'practiced'
    updatePracticeStatus(practiceId, 'practiced');

    showSuccess(`Snapshot saved! ${scaleItem.key} ${scaleItem.type} marked as practiced.`);
  };

  // Determine available keys based on selected type
  const isChromatic = selectedType === "Chromatic";
  const availableKeys = isChromatic ? ["C"] : KEYS;


  return (
    <div className="p-4 md:p-8 min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-900 text-white">
      <Card className="w-full max-w-6xl bg-gray-800 border-2 border-primary shadow-2xl shadow-primary/50 transition-all duration-500">
        <CardHeader className="p-4 border-b border-primary/50">
          <CardTitle className="text-2xl font-mono tracking-widest text-primary text-center">
            PRACTICE CONTROL PANEL
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          
          {/* Column 1: Key and Type Selection */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* Key Selection */}
            <div className="space-y-3 border p-4 rounded-lg border-primary/30 bg-gray-700/30">
              <Label className="text-lg font-semibold text-primary block mb-2">KEY SELECTION</Label>
              <ToggleGroup 
                type="single" 
                value={selectedKey} 
                onValueChange={(value) => value && setSelectedKey(value as Key)}
                className="flex flex-wrap justify-start gap-2"
                disabled={isChromatic}
              >
                {availableKeys.map(key => (
                  <ToggleGroupItem 
                    key={key} 
                    value={key} 
                    aria-label={`Select key ${key}`}
                    className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:border-primary/80 border border-gray-500 text-sm px-3 py-1 h-auto"
                  >
                    {key}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {isChromatic && <p className="text-xs text-yellow-400 mt-2">Chromatic scale is key-independent.</p>}
            </div>

            {/* Scale/Arpeggio Type Selection */}
            <div className="space-y-3 border p-4 rounded-lg border-primary/30 bg-gray-700/30">
              <Label className="text-lg font-semibold text-primary block mb-2">SCALE/ARPEGGIO TYPE</Label>
              <ToggleGroup 
                type="single" 
                value={selectedType} 
                onValueChange={(value) => {
                  if (value) {
                    setSelectedType(value);
                    if (value === "Chromatic") {
                        setSelectedKey("C");
                    }
                  }
                }}
                className="flex flex-wrap justify-start gap-2"
              >
                {ALL_TYPES.map(type => (
                  <ToggleGroupItem 
                    key={type} 
                    value={type} 
                    aria-label={`Select type ${type}`}
                    className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:border-primary/80 border border-gray-500 text-sm px-4 py-2 h-auto"
                  >
                    {type}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>

          {/* Column 2: Articulation, Tempo, and Timer */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Articulation Selection */}
            <div className="space-y-3 border p-4 rounded-lg border-primary/30 bg-gray-700/30">
              <Label className="text-lg font-semibold text-primary block mb-2">ARTICULATION MODE</Label>
              <div className="space-y-2">
                {ARTICULATIONS.map(articulation => (
                  <div key={articulation} className={cn(
                    "flex items-center space-x-3 p-3 rounded-md transition-colors cursor-pointer",
                    selectedArticulation === articulation ? "bg-primary/20 border border-primary" : "hover:bg-gray-700"
                  )}
                   onClick={() => setSelectedArticulation(articulation)}>
                    <Checkbox 
                      id={`art-${articulation}`} 
                      checked={selectedArticulation === articulation}
                      onCheckedChange={() => setSelectedArticulation(articulation)}
                      className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <Label htmlFor={`art-${articulation}`} className="text-sm font-medium leading-none cursor-pointer text-foreground">
                      {articulation}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Timer Integration */}
            <PracticeTimer />
          </div>
        </CardContent>
        
        {/* Footer: Tempo Slider and Save Button */}
        <div className="p-6 pt-0 space-y-6 border-t border-primary/50">
            {/* Tempo Slider */}
            <div className="space-y-4 pt-4 border-t border-gray-700">
              <Label className="text-lg font-semibold text-primary block">
                TEMPO LEVEL: <span className="font-mono text-xl text-green-400">{selectedTempo}</span>
              </Label>
              <Slider
                min={0}
                max={TEMPO_LEVELS.length - 1}
                step={1}
                value={[selectedTempoIndex]}
                onValueChange={(value) => setSelectedTempoIndex(value[0])}
                className="w-full [&>span:first-child]:bg-primary [&>span:first-child]:h-2 [&>span:first-child]:rounded-full [&>span:nth-child(2)]:bg-primary [&>span:nth-child(2)]:border-2 [&>span:nth-child(2)]:border-primary-foreground [&>span:nth-child(2)]:w-5 [&>span:nth-child(2)]:h-5"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>{TEMPO_LEVELS[0].split(' ')[0]}</span>
                <span>{TEMPO_LEVELS[TEMPO_LEVELS.length - 1].split(' ')[0]}</span>
              </div>
            </div>

            <Button 
              onClick={handleSaveSnapshot} 
              className="w-full text-xl py-6 bg-green-600 hover:bg-green-700 transition-all duration-300 shadow-lg shadow-green-600/50"
            >
              <LogIn className="w-6 h-6 mr-3" /> LOG PRACTICE SNAPSHOT
            </Button>
        </div>
      </Card>
    </div>
  );
};

export default PracticeCommandCenter;