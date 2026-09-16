import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export type AmbienteSistema = 'rh' | 'sae';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  ambiente: AmbienteSistema;
  setAmbiente: (ambiente: AmbienteSistema) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'ciapi_ambiente';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ambiente, setAmbienteState] = useState<AmbienteSistema>(() => {
    const salvo = sessionStorage.getItem(STORAGE_KEY);
    return salvo === 'sae' ? 'sae' : 'rh';
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setAmbiente = (novoAmbiente: AmbienteSistema) => {
    sessionStorage.setItem(STORAGE_KEY, novoAmbiente);
    setAmbienteState(novoAmbiente);
  };

  const signOut = async () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAmbienteState('rh');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, ambiente, setAmbiente, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
