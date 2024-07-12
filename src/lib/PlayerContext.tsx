'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';

interface PlayerContextType {
  idPlayer: string | null;
  setIdPlayer: React.Dispatch<React.SetStateAction<string | null>>;
  idAdmin: string | null;
  setIdAdmin: React.Dispatch<React.SetStateAction<string | null>>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [idPlayer, setIdPlayer] = useState<string | null>(null);
  const [idAdmin, setIdAdmin] = useState<string | null>(null);

  useEffect(() => {
    const storedIdPlayer = sessionStorage.getItem('idPlayerStorage');
    const storedIdAdmin = sessionStorage.getItem('idAdminStorage');
    
    if (storedIdPlayer) {
      setIdPlayer(storedIdPlayer);
    }

    if (storedIdAdmin) {
      setIdAdmin(storedIdAdmin);
    }
  }, []);

  return (
    <PlayerContext.Provider value={{ idPlayer, setIdPlayer, idAdmin, setIdAdmin }}>
      {children}
    </PlayerContext.Provider>
  );
};
