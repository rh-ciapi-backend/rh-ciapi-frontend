import React, { useState } from 'react';
import { Shield, User, Lock, ArrowRight, Info, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabaseClient';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos.' 
          : authError.message);
        setIsLoading(false);
        return;
      }

      // No need to call onLogin(), AuthProvider handles the state change
    } catch (err: any) {
      setError('Ocorreu um erro inesperado ao tentar entrar.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card-dark border border-border-dark rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 pb-0 flex flex-col items-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center font-bold text-white text-3xl shadow-xl shadow-primary/20 mb-6">
              C
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">CIAPI RH</h1>
            <p className="text-slate-500 text-sm mt-2">Sistema de Gestão de Recursos Humanos</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-400 text-xs"
              >
                <AlertCircle size={18} className="shrink-0" />
                {error}
              </motion.div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">E-mail</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com" 
                    className="w-full bg-slate-800 border border-border-dark rounded-2xl py-3.5 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Senha</label>
                  <button type="button" className="text-[10px] font-bold text-primary hover:underline">Esqueceu a senha?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-slate-800 border border-border-dark rounded-2xl py-3.5 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 group disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="p-6 bg-slate-800/50 border-t border-border-dark flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Info size={16} />
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Acesso restrito a servidores autorizados. Todas as ações são monitoradas e registradas em log.
            </p>
          </div>
        </div>

        <p className="text-center mt-8 text-slate-600 text-xs font-medium">
          &copy; 2024 CIAPI RH - Todos os direitos reservados
        </p>
      </motion.div>
    </div>
  );
};
