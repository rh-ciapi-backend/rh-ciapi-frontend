import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { adminAccessService } from '../services/adminAccessService';

export type AmbienteSistema = 'rh' | 'sae';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  perfil: string | null;
  statusAcesso: string | null;
  erroPerfil: string | null;
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
  const [perfil, setPerfil] = useState<string | null>(null);
  const [statusAcesso, setStatusAcesso] = useState<string | null>(null);
  const [erroPerfil, setErroPerfil] = useState<string | null>(null);
  const [ambiente, setAmbienteState] = useState<AmbienteSistema>(() => {
    const salvo = sessionStorage.getItem(STORAGE_KEY);
    return salvo === 'sae' ? 'sae' : 'rh';
  });

  useEffect(() => {
    let ativo = true;
    let consulta = 0;

    const atualizarSessao = (novaSessao: Session | null) => {
      const atual = ++consulta;
      setSession(novaSessao);
      setUser(novaSessao?.user ?? null);
      setPerfil(null);
      setStatusAcesso(null);
      setErroPerfil(null);

      if (!novaSessao) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      // O callback do Supabase Auth não deve aguardar outra chamada ao Auth.
      window.setTimeout(() => {
        if (!ativo || atual !== consulta) return;
        adminAccessService.getMe()
          .then(({ user: currentUser }) => {
            if (!ativo || atual !== consulta) return;
            setPerfil(currentUser.perfil);
            setStatusAcesso(currentUser.status);
          })
          .catch(() => {
            if (!ativo || atual !== consulta) return;
            setErroPerfil('Não foi possível verificar as permissões do usuário.');
          })
          .finally(() => {
            if (ativo && atual === consulta) setIsLoading(false);
          });
      }, 0);
    };

    supabase.auth.getSession()
      .then(({ data: { session: sessaoAtual } }) => {
        if (ativo) atualizarSessao(sessaoAtual);
      })
      .catch(() => {
        if (ativo) { setErroPerfil('Não foi possível verificar a sessão.'); setIsLoading(false); }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      if (ativo) atualizarSessao(novaSessao);
    });

    return () => { ativo = false; consulta++; subscription.unsubscribe(); };
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
    <AuthContext.Provider value={{ session, user, isLoading, perfil, statusAcesso, erroPerfil, ambiente, setAmbiente, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
