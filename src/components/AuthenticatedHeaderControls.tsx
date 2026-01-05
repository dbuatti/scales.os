import React from 'react';
import { useScales } from '@/context/ScalesContext';
import { useGlobalBPM } from '@/context/GlobalBPMContext';
import HeaderControls from './HeaderControls';

const AuthenticatedHeaderControls: React.FC = () => {
    const { addLogEntry } = useScales();
    const { currentBPM, handleBpmChange } = useGlobalBPM();

    const handleLogSession = (durationMinutes: number) => {
        // When logging a timed session, we log a general entry without specific scale/dohnanyi items, 
        // as the user might switch between exercises during the timed session.
        addLogEntry({
            durationMinutes: durationMinutes, 
            itemsPracticed: [],
            notes: `General timed practice session logged. Focused BPM: ${currentBPM}`,
        });
    };

    return (
        <HeaderControls 
            currentBPM={currentBPM} 
            onBpmChange={handleBpmChange} 
            onLogSession={handleLogSession} 
        />
    );
};

export default AuthenticatedHeaderControls;