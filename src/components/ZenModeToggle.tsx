"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useZenMode } from '@/context/ZenModeContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ZenModeToggle: React.FC = () => {
  const { isZenMode, toggleZenMode } = useZenMode();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleZenMode}
          className={isZenMode ? "text-primary bg-primary/10" : "text-muted-foreground"}
        >
          {isZenMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          <span className="sr-only">Toggle Zen Mode</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isZenMode ? "Disable Zen Mode" : "Enable Zen Mode"}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ZenModeToggle;