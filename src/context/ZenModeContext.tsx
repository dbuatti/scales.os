"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';

interface ZenModeContextType {
  isZenMode: boolean;
  toggleZenMode: () => void;
}

const ZenModeContext = createContext<ZenModeContextType | undefined>(undefined);

export const ZenModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isZenMode, setIsZenMode] = useState(false);

  const toggleZenMode = () => setIsZenMode(prev => !prev);

  const value = useMemo(() => ({ isZenMode, toggleZenMode }), [isZenMode]);

  return (
    <ZenModeContext.Provider value={value}>
      {children}
    </ZenModeContext.Provider>
  );
};

export const useZenMode = () => {
  const context = useContext(ZenModeContext);
  if (context === undefined) {
    throw new Error('useZenMode must be used within a ZenModeProvider');
  }
  return context;
};