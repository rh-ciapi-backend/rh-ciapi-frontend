import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { API_BASE_URL } from '../config/api';

export type AmbienteSistema = 'rh' | 'sae';
export interface AcessoSistema {
  auth_uid: string;
  id: string | null;
  email: string;
  perfil: string;
  status: string;
  is_master: boolean;
  ambiente: 'RH' | 'SAE';
  ambientes_permitidos: ('RH' | 'SAE')[];
}
interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  ambiente: AmbienteSistema;
  setAmbiente: (ambiente: AmbienteSistema) => void;
  acesso: AcessoSistema | null;
  isAccessLoading: boolean;
  accessError: string | null;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'ciapi_ambiente';

// O ambiente também fica limitado à janela atual do PWA.
// Ao fechar completamente o aplicativo, o próximo acesso volta ao padrão RH.

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [acesso, setAcesso] = useState<AcessoSistema | null>(null);
  const [isAccessLoading, setIsAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [ambiente, setAmbienteState] = useState<AmbienteSistema>(() =>
    sessionStorage.getItem(STORAGE_KEY) === 'sae' ? 'sae' : 'rh'
  );

  useEffect(() => {
    let ativo = true;
    const atualizarSessao = (novaSessao: Session | null) => {
      if (!ativo) return;
      setSession(novaSessao);
      setUser(novaSessao?.user ?? null);
      setIsLoading(false);
    };
    supabase.auth.getSession().then(({ data }) => atualizarSessao(data.session))
      .catch(() => { if (ativo) setIsLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      atualizarSessao(novaSessao);
    });
    return () => { ativo = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setAcesso(null);
    setAccessError(null);
    if (!session) { setIsAccessLoading(false); return () => controller.abort(); }
    setIsAccessLoading(true);
    const base = String(API_BASE_URL || '').replace(/\/$/, '');
    const timer = window.setTimeout(() => {
      setAccessError('Tempo limite ao verificar o acesso. Atualize a página para tentar novamente.');
      setIsAccessLoading(false);
      controller.abort();
    }, 30000);
    fetch(`${base}/api/admin/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      signal: controller.signal,
      cache: 'no-store',
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Não foi possível verificar o acesso.');
      if (!Array.isArray(data?.user?.ambientes_permitidos)) {
        throw new Error('Atualize o backend para habilitar as permissões por ambiente.');
      }
      if (!controller.signal.aborted) setAcesso({ ...data.user, auth_uid: session.user.id });
    }).catch((error: any) => {
      // Abort por troca de sessão não altera o estado da nova sessão.
      if (!controller.signal.aborted) setAccessError(error?.message || 'Falha ao verificar as permissões.');
    }).finally(() => {
      window.clearTimeout(timer);
      if (!controller.signal.aborted) setIsAccessLoading(false);
    });
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [session?.user.id, session?.access_token]);

  const setAmbiente = (novoAmbiente: AmbienteSistema) => {
    sessionStorage.setItem(STORAGE_KEY, novoAmbiente);
    setAmbienteState(novoAmbiente);
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem(STORAGE_KEY);
    setAmbienteState('rh');
    setAcesso(null);
  };
  return <AuthContext.Provider value={{ session, user, isLoading, ambiente, setAmbiente,
    acesso, isAccessLoading, accessError, signOut }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
