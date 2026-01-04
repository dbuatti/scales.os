import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { LogIn } from 'lucide-react';
import { KEYS, SCALE_TYPES, ARPEGGIO_TYPES, ARTICULATIONS, TEMPO_LEVELS, getPracticeId, Key, Articulation, TempoLevel, ALL_SCALE_ITEMS } from '@/lib/scales';
import { useScales } from '../context/ScalesContext';
import { showSuccess, showError } from '@/utils/toast';

// Helper to combine scale and arpeggio types for selection
const ALL_TYPES = [...SCALE_TYPES, ...ARPEGGIO_TYPES];

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
    <Card className="w-full max-w-lg mx-auto bg-card shadow-xl border-primary/20">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg p-4">
        <CardTitle className="flex items-center justify-between text-xl">
          Practice Command Centre
          <LogIn className="w-6 h-6" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        
        {/* Key and Type Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Key</Label>
            <Select 
              value={selectedKey} 
              onValueChange={(value) => setSelectedKey(value as Key)}
              disabled={isChromatic}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Key" />
              </SelectTrigger>
              <SelectContent>
                {availableKeys.map(key => (
                  <SelectItem key={key} value={key}>{key}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isChromatic && <p className="text-xs text-muted-foreground">Key selection disabled for Chromatic scale.</p>}
          </div>

          <div className="space-y-2">
            <Label>Scale/Arpeggio Type</Label>
            <Select 
              value={selectedType} 
              onValueChange={(value) => {
                setSelectedType(value);
                // Reset key selection if switching to Chromatic
                if (value === "Chromatic") {
                    setSelectedKey("C");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {ALL_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Articulation Selection (Radio Group style using Checkboxes) */}
        <div className="space-y-3">
          <Label>Articulation</Label>
          <div className="grid grid-cols-2 gap-3">
            {ARTICULATIONS.map(articulation => (
              <div key={articulation} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
                   onClick={() => setSelectedArticulation(articulation)}>
                <Checkbox 
                  id={`art-${articulation}`} 
                  checked={selectedArticulation === articulation}
                  onCheckedChange={() => setSelectedArticulation(articulation)}
                />
                <Label htmlFor={`art-${articulation}`} className="text-sm font-medium leading-none cursor-pointer">
                  {articulation}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Tempo Slider */}
        <div className="space-y-4 pt-2">
          <Label>Tempo Level: <span className="font-semibold text-primary">{selectedTempo}</span></Label>
          <Slider
            min={0}
            max={TEMPO_LEVELS.length - 1}
            step={1}
            value={[selectedTempoIndex]}
            onValueChange={(value) => setSelectedTempoIndex(value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{TEMPO_LEVELS[0].split(' ')[0]}</span>
            <span>{TEMPO_LEVELS[TEMPO_LEVELS.length - 1].split(' ')[0]}</span>
          </div>
        </div>

        <Button 
          onClick={handleSaveSnapshot} 
          className="w-full text-lg py-6 bg-green-600 hover:bg-green-700"
        >
          <LogIn className="w-5 h-5 mr-2" /> Save Snapshot & Mark Practiced
        </Button>
      </CardContent>
    </Card>
  );
};

export default PracticeCommandCenter;