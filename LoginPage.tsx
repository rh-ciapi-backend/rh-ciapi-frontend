import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, AlertCircle, HeartPulse, Lock, ShieldCheck, User, UsersRound } from 'lucide-react';
import { motion } from 'motion/react';
import { InstitutionalHeader } from '../components/InstitutionalHeader';
import { supabase } from '../lib/supabaseClient';
import { useAuth, type AmbienteSistema } from '../contexts/AuthContext';

type SistemaCard = { id: AmbienteSistema; titulo: string; descricao: string };
const sistemas: SistemaCard[] = [
  { id: 'rh', titulo: 'CIAPI RH', descricao: 'Sistema Integrado de Gestão de Recursos Humanos' },
  { id: 'sae', titulo: 'SAE', descricao: 'Serviço de Atenção Especializada' },
];

export const LoginPage: React.FC = () => {
  const { setAmbiente } = useAuth();
  const [ambienteSelecionado, setAmbienteSelecionado] = useState<AmbienteSistema | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ambiente = sistemas.find(s => s.id === ambienteSelecionado);

  const selecionar = (id: AmbienteSistema) => {
    setAmbienteSelecionado(id);
    setError(null);
    setPassword('');
  };

  const voltar = () => {
    if (isLoading) return;
    setAmbienteSelecionado(null);
    setError(null);
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ambienteSelecionado || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : authError.message);
        return;
      }
      setAmbiente(ambienteSelecionado);
    } catch {
      setError('Ocorreu um erro inesperado ao tentar entrar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="institutional-login min-h-screen">
      <InstitutionalHeader subtitle="SETRABES · Centro Integrado de Atenção à Pessoa Idosa" />
      <main className="institutional-login__content">
        {!ambienteSelecionado ? (
          <>
            <div className="institutional-login__intro">
              <h1>Sistemas Internos</h1>
              <p>Selecione o sistema que deseja acessar.</p>
            </div>
            <div className="institutional-login__systems institutional-login__systems--home" aria-label="Sistemas internos">
              {sistemas.map(sistema => (
                <button key={sistema.id} className="institutional-system-card" type="button" onClick={() => selecionar(sistema.id)}>
                  <span className="institutional-system-card__icon">{sistema.id === 'rh' ? <UsersRound size={37} /> : <HeartPulse size={37} />}</span>
                  <strong>{sistema.titulo}</strong>
                  <small>{sistema.descricao}</small>
                  <span className="institutional-system-card__access">Acessar sistema <ArrowRight size={14} /></span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="institutional-login__selected">
            <button type="button" onClick={voltar} className="institutional-login__back"><ArrowLeft size={17} /> Voltar aos sistemas</button>
            <div className="institutional-login__intro institutional-login__intro--selected"><h1>{ambiente?.titulo}</h1><p>{ambiente?.descricao}</p></div>
            <motion.div key={ambienteSelecionado} initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} className="institutional-login__panel">
              <div className="institutional-login__panelhead"><ShieldCheck size={23} /><div><strong>Identificação do usuário</strong><span>Acessar {ambiente?.titulo}</span></div></div>
              <form onSubmit={handleSubmit} className="institutional-login__form">
                {error && <div role="alert" className="institutional-login__error"><AlertCircle size={17} />{error}</div>}
                <label htmlFor="ciapi-email">E-mail institucional</label>
                <div className="institutional-login__field"><User size={18} /><input id="ciapi-email" type="email" autoComplete="username" required autoFocus value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" /></div>
                <label htmlFor="ciapi-password">Senha</label>
                <div className="institutional-login__field"><Lock size={18} /><input id="ciapi-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Digite sua senha" /></div>
                <button className="institutional-login__submit" type="submit" disabled={isLoading}>{isLoading ? 'Autenticando...' : <>Entrar no sistema <ArrowRight size={18} /></>}</button>
                <p className="institutional-login__notice">Acesso exclusivo a usuários autorizados. As permissões são verificadas após a autenticação.</p>
              </form>
            </motion.div>
          </div>
        )}
      </main>
      <footer className="institutional-login__footer">Governo do Estado de Roraima · SETRABES · CIAPI</footer>
    </div>
  );
};
