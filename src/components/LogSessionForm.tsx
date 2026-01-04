import React, { useState } from 'react';
import { useScales } from '../context/ScalesContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showSuccess } from '@/utils/toast';

interface LogSessionFormProps {
  durationMinutes: number;
  onLogComplete: () => void;
}

const LogSessionForm: React.FC<LogSessionFormProps> = ({ durationMinutes, onLogComplete }) => {
  const { addLogEntry } = useScales();
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log the session time and notes. scalesPracticed is empty since tracking is now done via the grid.
    addLogEntry({
      durationMinutes,
      scalesPracticed: [],
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
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes on Session</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Focused on E major melodic minor articulation at ♩=100. Struggled with LH voicing."
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