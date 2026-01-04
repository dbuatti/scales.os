import React, { useState } from 'react';
import { useScales, PracticeLogEntry } from '../context/ScalesContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { showSuccess } from '@/utils/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ARTICULATIONS, TEMPO_LEVELS, Articulation, TempoLevel } from '@/lib/scales';
import { X } from 'lucide-react';

interface LogSessionFormProps {
  durationMinutes: number;
  onLogComplete: () => void;
}

type PracticedItem = PracticeLogEntry['scalesPracticed'][number];

const LogSessionForm: React.FC<LogSessionFormProps> = ({ durationMinutes, onLogComplete }) => {
  const { allScales, addLogEntry } = useScales();
  const [practicedItems, setPracticedItems] = useState<PracticedItem[]>([]);
  const [notes, setNotes] = useState('');

  // State for adding a new item
  const [selectedScaleId, setSelectedScaleId] = useState<string>('');
  const [selectedArticulation, setSelectedArticulation] = useState<Articulation>(ARTICULATIONS[0]);
  const [selectedTempo, setSelectedTempo] = useState<TempoLevel>(TEMPO_LEVELS[0]);

  const scaleMap = allScales.reduce((acc, scale) => {
    acc[scale.id] = `${scale.key} ${scale.type}`;
    return acc;
  }, {} as Record<string, string>);

  const handleAddItem = () => {
    if (!selectedScaleId) return;

    const newItem: PracticedItem = {
      scaleId: selectedScaleId,
      articulation: selectedArticulation,
      tempo: selectedTempo,
    };

    // Prevent duplicate logging of the exact same combination in one session
    const isDuplicate = practicedItems.some(item => 
      item.scaleId === newItem.scaleId && 
      item.articulation === newItem.articulation && 
      item.tempo === newItem.tempo
    );

    if (!isDuplicate) {
      setPracticedItems(prev => [...prev, newItem]);
    }
    
    // Reset selection for next entry
    setSelectedScaleId('');
  };

  const handleRemoveItem = (index: number) => {
    setPracticedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (practicedItems.length === 0) {
      // Allow logging time even if no specific scales were tracked
    }

    addLogEntry({
      durationMinutes,
      scalesPracticed: practicedItems,
      notes,
    });

    showSuccess(`Practice session logged! Duration: ${durationMinutes} minutes.`);
    onLogComplete();
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Log Practice Session ({durationMinutes} min)</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Add Scale Combination */}
          <div className="space-y-4 border p-4 rounded-md">
            <h3 className="font-semibold">Add Practiced Scale</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label>Scale/Arpeggio</Label>
                <Select value={selectedScaleId} onValueChange={setSelectedScaleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a scale..." />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-48">
                      {allScales.map(scale => (
                        <SelectItem key={scale.id} value={scale.id}>
                          {scale.key} {scale.type}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Articulation</Label>
                <Select value={selectedArticulation} onValueChange={(v) => setSelectedArticulation(v as Articulation)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select articulation" />
                  </SelectTrigger>
                  <SelectContent>
                    {ARTICULATIONS.map(art => (
                      <SelectItem key={art} value={art}>
                        {art}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Tempo Level</Label>
                <Select value={selectedTempo} onValueChange={(v) => setSelectedTempo(v as TempoLevel)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tempo level" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPO_LEVELS.map(tempo => (
                      <SelectItem key={tempo} value={tempo}>
                        {tempo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="button" onClick={handleAddItem} disabled={!selectedScaleId} className="w-full">
              Add to Log
            </Button>
          </div>

          {/* 2. List of Practiced Items */}
          <div className="space-y-2">
            <Label>Scales Logged in this Session ({practicedItems.length})</Label>
            <ScrollArea className="h-32 w-full rounded-md border p-2">
              {practicedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">No specific scales logged yet.</p>
              ) : (
                <div className="space-y-1">
                  {practicedItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-accent/50 rounded-md">
                      <span className="text-sm">
                        {scaleMap[item.scaleId]} - {item.articulation} ({item.tempo})
                      </span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* 3. Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes on Session</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Focused on E major melodic minor articulation at ♩=100."
            />
          </div>

          <Button type="submit" className="w-full">
            Save Log
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LogSessionForm;