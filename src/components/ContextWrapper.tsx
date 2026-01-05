import React from 'react';
import { Outlet } from 'react-router-dom';
import { ScalesProvider } from '@/context/ScalesContext';

const ContextWrapper: React.FC = () => {
  return (
    <ScalesProvider>
      <Outlet />
    </ScalesProvider>
  );
};

export default ContextWrapper;