'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  idPlayer: string | null;
  setIdPlayer: React.Dispatch<React.SetStateAction<string | null>>;
  idAdmin: string | null;
  setIdAdmin: React.Dispatch<React.SetStateAction<string | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const usePlayer = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('usePlayer must be used within a AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
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
    <AuthContext.Provider value={{ idPlayer, setIdPlayer, idAdmin, setIdAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
