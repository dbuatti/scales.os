"use client";

import * as React from "react";
import { Moon, Sun, Monitor, Palette } from "lucide-react";
import { useTheme } from "next-themes"; // This package is already installed

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ThemeName = "retro-terminal" | "modern-light" | "vibrant-dark";

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Set initial theme from localStorage or default to 'retro-terminal'
  React.useEffect(() => {
    if (mounted) {
      const storedTheme = localStorage.getItem("theme") as ThemeName | null;
      if (storedTheme) {
        setTheme(storedTheme);
        document.documentElement.setAttribute("data-theme", storedTheme);
      } else {
        // Default to retro-terminal if no theme is stored
        setTheme("retro-terminal");
        document.documentElement.setAttribute("data-theme", "retro-terminal");
      }
    }
  }, [mounted, setTheme]);

  // Update data-theme attribute and localStorage when theme changes
  React.useEffect(() => {
    if (mounted && theme) {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    }
  }, [theme, mounted]);

  if (!mounted) {
    return null; // Or a loading spinner
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/20">
          <Palette className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-primary/50 shadow-lg">
        <DropdownMenuItem 
          onClick={() => setTheme("retro-terminal")}
          className="text-primary hover:bg-primary/20 focus:bg-primary/20"
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>Retro Terminal</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("modern-light")}
          className="text-primary hover:bg-primary/20 focus:bg-primary/20"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Modern Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("vibrant-dark")}
          className="text-primary hover:bg-primary/20 focus:bg-primary/20"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Vibrant Dark</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSwitcher;