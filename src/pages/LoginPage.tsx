import AbrigoPortalCard from '../components/AbrigoPortalCard';
import React, { useState } from 'react';
import { User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { InstitutionalHeader } from '../components/InstitutionalHeader';
import { HeartPulse, UsersRound, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth, AmbienteSistema } from '../contexts/AuthContext';
import './ciapi-abrigo-portal.css';

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
    <div className={`institutional-login min-h-screen${!ambienteSelecionado ? ' ciapi-portal' : ''}`}>
      {!ambienteSelecionado ? (
        <>
          <InstitutionalHeader title="Portal CIAPI" subtitle="Centro Integrado de Atenção à Pessoa Idosa" />
          <main className="ciapi-portal__main">
            <div className="ciapi-portal__intro">
              <p className="ciapi-portal__eyebrow">SEU ESPAÇO DE TRABALHO</p>
              <h1>Como podemos ajudar hoje?</h1>
              <p>Escolha o sistema para começar.</p>
            </div>
            <div className="ciapi-portal__systems" aria-label="Sistemas disponíveis">
              <button type="button" className="ciapi-portal-card ciapi-portal-card--rh" onClick={() => choose('rh')}>
                <span className="ciapi-portal-card__top"><span className="ciapi-portal-card__icon" aria-hidden="true"><UsersRound size={27} strokeWidth={1.7}/></span><span className="ciapi-portal-card__tag">Gestão de pessoas</span></span>
                <span className="ciapi-portal-card__body"><strong>CIAPI RH</strong><span>Recursos humanos</span><small>Servidores, frequência e férias em um só lugar.</small></span>
                <span className="ciapi-portal-card__action">Acessar RH <ArrowRight size={17} aria-hidden="true"/></span>
              </button>
              <button type="button" className="ciapi-portal-card ciapi-portal-card--sae" onClick={() => choose('sae')}>
                <span className="ciapi-portal-card__top"><span className="ciapi-portal-card__icon" aria-hidden="true"><HeartPulse size={27} strokeWidth={1.7}/></span><span className="ciapi-portal-card__tag">Atenção à pessoa idosa</span></span>
                <span className="ciapi-portal-card__body"><strong>SAE</strong><span>Serviço de Atenção Especializada</span><small>Acompanhamento, atendimentos e cuidado.</small></span>
                <span className="ciapi-portal-card__action">Acessar SAE <ArrowRight size={17} aria-hidden="true"/></span>
              </button>
              <AbrigoPortalCard />
            </div>
            <p className="ciapi-portal__access"><ShieldCheck size={15} aria-hidden="true"/>Acesso exclusivo para usuários autorizados</p>
          </main>
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
