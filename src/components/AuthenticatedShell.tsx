import React from 'react';
import { Outlet } from 'react-router-dom';
import { ScalesProvider } from '@/context/ScalesContext';
import AppLayout from './AppLayout';

const AuthenticatedShell: React.FC = () => {
  return (
    <ScalesProvider>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ScalesProvider>
  );
};

export default AuthenticatedShell;