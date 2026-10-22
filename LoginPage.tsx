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
  const [ambienteSelecionado, setAmbienteSelecionado] = useState<AmbienteSistema | null>(null);
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

  const choose = (id: AmbienteSistema) => { setAmbienteSelecionado(id); setError(null); };
  return (
    <div className="institutional-login min-h-screen">
      {!ambienteSelecionado ? (
        <>
          <InstitutionalHeader subtitle="Centro Integrado de Atenção à Pessoa Idosa" />
          <div className="institutional-login__content institutional-login__content--portal">
            <div className="institutional-login__intro"><h1>Sistemas Internos</h1><p>Selecione o sistema que deseja acessar.</p></div>
            <div className="institutional-login__systems institutional-login__systems--portal" aria-label="Sistemas disponíveis">
              <button type="button" className="institutional-system-card" onClick={() => choose('rh')}><span className="institutional-system-card__icon"><UsersRound size={34}/></span><strong>CIAPI RH</strong><small>Sistema Integrado de Gestão de Recursos Humanos</small><span className="institutional-system-card__action">Acessar sistema →</span></button>
              <button type="button" className="institutional-system-card" onClick={() => choose('sae')}><span className="institutional-system-card__icon"><HeartPulse size={34}/></span><strong>SAE</strong><small>Serviço de Atenção Especializada</small><span className="institutional-system-card__action">Acessar sistema →</span></button>
            </div>
          </div>
        </>
      ) : (
        <div className="institutional-login__standalone">
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="institutional-login__standalone-panel">
            <div className="institutional-login__banner"><img src="/images/governo-roraima-identidade.jpg" alt="Governo de Roraima"/><div><small>GOVERNO DE RORAIMA · SETRABES</small><strong>{ambienteSelecionado === 'rh' ? 'CIAPI RH' : 'SAE'}</strong><span>{ambienteSelecionado === 'rh' ? 'Sistema Integrado de Gestão de Recursos Humanos' : 'Serviço de Atenção Especializada'}</span></div></div>
            <div className="institutional-login__panelhead"><ShieldCheck size={21}/><div><strong>Identificação do usuário</strong><span>Acesso ao {ambienteSelecionado === 'rh' ? 'CIAPI RH' : 'SAE'}</span></div></div>
            <form onSubmit={handleSubmit} className="institutional-login__form">
              {error && <div role="alert" className="institutional-login__error"><AlertCircle size={17}/>{error}</div>}
              <label htmlFor="ciapi-email">E-mail institucional</label><div className="institutional-login__field"><User size={18}/><input id="ciapi-email" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" /></div>
              <label htmlFor="ciapi-password">Senha</label><div className="institutional-login__field"><Lock size={18}/><input id="ciapi-password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Digite sua senha" /></div>
              <button className="institutional-login__submit" type="submit" disabled={isLoading}>{isLoading?'Autenticando...':<>Entrar no sistema <ArrowRight size={18}/></>}</button>
              <p className="institutional-login__notice">Acesso restrito a usuários autorizados. Suas permissões serão verificadas após o login.</p>
            </form>
            <button type="button" className="institutional-login__back" onClick={() => {setAmbienteSelecionado(null); setError(null); setPassword('');}}>← Voltar aos sistemas</button>
          </motion.div>
        </div>
      )}
      <footer className="institutional-login__footer">Governo do Estado de Roraima · SETRABES · CIAPI</footer>
    </div>
  );
};
