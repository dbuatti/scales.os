import React, { useState } from 'react';
import { useScales } from '../context/ScalesContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { showSuccess } from '@/utils/toast';

interface LogSessionFormProps {
  durationMinutes: number;
  onLogComplete: () => void;
}

const LogSessionForm: React.FC<LogSessionFormProps> = ({ durationMinutes, onLogComplete }) => {
  const { allScales, addLogEntry } = useScales();
  const [selectedScales, setSelectedScales] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const handleCheckboxChange = (scaleId: string, checked: boolean) => {
    setSelectedScales(prev => 
      checked ? [...prev, scaleId] : prev.filter(id => id !== scaleId)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedScales.length === 0) {
      // Optionally show an error toast, but we'll allow empty logs for general practice
    }

    addLogEntry({
      durationMinutes,
      scalesPracticed: selectedScales,
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes on Session (Technique, Tempo, Articulation, etc.)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Focused on E major melodic minor articulation at ♩=100."
            />
          </div>

          <div className="space-y-2">
            <Label>Scales Practiced</Label>
            <ScrollArea className="h-48 w-full rounded-md border p-4">
              <div className="grid grid-cols-2 gap-2">
                {allScales.map(scale => (
                  <div key={scale.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={scale.id}
                      checked={selectedScales.includes(scale.id)}
                      onCheckedChange={(checked) => handleCheckboxChange(scale.id, !!checked)}
                    />
                    <Label htmlFor={scale.id} className="text-sm font-normal cursor-pointer">
                      {scale.key} {scale.type}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
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