"use client";

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Maximize2, ZoomIn } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SheetMusicViewerProps {
  title: string;
  imageUrl: string;
}

const SheetMusicViewer: React.FC<SheetMusicViewerProps> = ({ title, imageUrl }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2 border-primary/30 hover:bg-primary/5 font-mono text-xs focus-scale"
        >
          <FileText className="w-4 h-4" />
          VIEW SHEET MUSIC
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col bg-card/95 border-4 border-primary/80 shadow-2xl">
        <DialogHeader className="border-b-2 border-primary/50 pb-4">
          <DialogTitle className="text-primary font-mono text-xl flex items-center gap-2">
            <ZoomIn className="w-5 h-5" />
            {title} - REFERENCE
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-grow mt-4 rounded-md border border-primary/20 bg-white p-2">
          <div className="flex justify-center">
            <img 
              src={imageUrl} 
              alt={title} 
              className="max-w-full h-auto shadow-lg"
              // Using a high-quality rendering style for sheet music
              style={{ imageRendering: 'auto' }}
            />
          </div>
        </ScrollArea>
        
        <div className="mt-4 flex justify-between items-center text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          <span>Scroll to view full page</span>
          <span className="text-primary/60">Dohnányi Essential Finger Exercises</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SheetMusicViewer;