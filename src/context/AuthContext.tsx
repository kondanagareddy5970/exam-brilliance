import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  jwt: string | null;
  setJwt: (token: string | null) => void;
  user: any;
  setUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [jwt, setJwt] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  return (
    <AuthContext.Provider value={{ jwt, setJwt, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
