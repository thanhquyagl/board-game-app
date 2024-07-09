'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';


interface PlayerContextType {
  idPlayer: string | null;
  setIdPlayer: React.Dispatch<React.SetStateAction<string | null>>;
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

  useEffect(() => {
    const storedIdPlayer = sessionStorage.getItem('idPlayerStorage');
    if (storedIdPlayer) {
      setIdPlayer(storedIdPlayer);
    }
  }, []);

  return (
    <PlayerContext.Provider value={{ idPlayer, setIdPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
};
