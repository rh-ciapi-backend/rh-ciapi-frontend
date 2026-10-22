import React, { useState } from 'react';
import { User, Lock, ArrowRight, Info, AlertCircle, Layers3, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { InstitutionalHeader } from '../components/InstitutionalHeader';
import { HeartPulse, UsersRound, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth, AmbienteSistema } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { setAmbiente } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ambienteSelecionado, setAmbienteSelecionado] = useState<AmbienteSistema>('rh');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(authError.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : authError.message);
        setIsLoading(false);
        return;
      }

      setAmbiente(ambienteSelecionado);
    } catch {
      setError('Ocorreu um erro inesperado ao tentar entrar.');
      setIsLoading(false);
    }
  };

  return (
    <div className="institutional-login min-h-screen">
      <InstitutionalHeader subtitle="Acesso aos sistemas internos" />
      <div className="institutional-login__content">
        <div className="institutional-login__intro"><h1>Sistemas Internos</h1><p>Selecione o ambiente e entre com sua conta institucional.</p></div>
        <div className="institutional-login__grid">
          <div className="institutional-login__systems" aria-label="Sistemas disponíveis">
            <button className={`institutional-system-card ${ambienteSelecionado === 'rh' ? 'is-selected' : ''}`} type="button" onClick={() => setAmbienteSelecionado('rh')} aria-pressed={ambienteSelecionado === 'rh'}><span className="institutional-system-card__icon"><UsersRound size={30}/></span><strong>CIAPI RH</strong><small>Sistema Integrado de Gestão de Recursos Humanos</small></button>
            <button className={`institutional-system-card ${ambienteSelecionado === 'sae' ? 'is-selected' : ''}`} type="button" onClick={() => setAmbienteSelecionado('sae')} aria-pressed={ambienteSelecionado === 'sae'}><span className="institutional-system-card__icon"><HeartPulse size={30}/></span><strong>SAE</strong><small>Serviço de Atenção Especializada</small></button>
          </div>
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="institutional-login__panel">
            <div className="institutional-login__panelhead"><ShieldCheck size={23}/><div><strong>Identificação do usuário</strong><span>{ambienteSelecionado === 'rh' ? 'Acessar CIAPI RH' : 'Acessar SAE'}</span></div></div>
            <form onSubmit={handleSubmit} className="institutional-login__form">
              {error && <div role="alert" className="institutional-login__error"><AlertCircle size={17}/>{error}</div>}
              <label htmlFor="ciapi-email">E-mail institucional</label><div className="institutional-login__field"><User size={18}/><input id="ciapi-email" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" /></div>
              <label htmlFor="ciapi-password">Senha</label><div className="institutional-login__field"><Lock size={18}/><input id="ciapi-password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Digite sua senha" /></div>
              <button className="institutional-login__submit" type="submit" disabled={isLoading}>{isLoading?'Autenticando...':<>Entrar no sistema <ArrowRight size={18}/></>}</button>
              <p className="institutional-login__notice">Acesso exclusivo a usuários autorizados. As permissões são verificadas após a autenticação.</p>
            </form>
          </motion.div>
        </div>
      </div>
      <footer className="institutional-login__footer">Governo do Estado de Roraima · SETRABES · CIAPI</footer>
    </div>
  );
};
