import React, { useState, useEffect } from 'react';
import { Activity, Globe, Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL, fetchJson } from '../config/api';
import { motion } from 'motion/react';

export const DiagnosticoPage = () => {
  const [healthStatus, setHealthStatus] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const testConnection = async () => {
    setHealthStatus('loading');
    setLastError(null);
    const start = Date.now();
    try {
      // Usamos fetch direto para o health para evitar o wrapper fetchJson que pode ter retry
      const response = await fetch(`${API_BASE_URL}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(10000) // 10s timeout para o teste
      });
      
      const end = Date.now();
      setResponseTime(end - start);

      if (response.ok) {
        setHealthStatus('ok');
      } else {
        setHealthStatus('fail');
        setLastError(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      setHealthStatus('fail');
      setLastError(error.name === 'AbortError' ? 'Tempo limite excedido (10s)' : error.message);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-card-dark p-8 rounded-2xl border border-border-dark shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Painel de Diagnóstico</h2>
            <p className="text-sm text-slate-500">Verifique a conectividade com o backend de produção</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configuração */}
          <div className="p-6 bg-slate-800/50 rounded-xl border border-border-dark space-y-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Globe size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Configuração</span>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">API_BASE_URL</label>
              <code className="text-xs bg-black/30 p-2 rounded block text-primary break-all">
                {API_BASE_URL}
              </code>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              * Definido via VITE_API_BACKEND_URL ou fallback padrão.
            </p>
          </div>

          {/* Status da Conexão */}
          <div className="p-6 bg-slate-800/50 rounded-xl border border-border-dark space-y-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Wifi size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Status Atual</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {healthStatus === 'loading' && <RefreshCw size={20} className="text-primary animate-spin" />}
                {healthStatus === 'ok' && <CheckCircle2 size={20} className="text-emerald-500" />}
                {healthStatus === 'fail' && <AlertCircle size={20} className="text-rose-500" />}
                {healthStatus === 'idle' && <Activity size={20} className="text-slate-500" />}
                
                <span className={`font-bold ${
                  healthStatus === 'ok' ? 'text-emerald-500' : 
                  healthStatus === 'fail' ? 'text-rose-500' : 
                  'text-white'
                }`}>
                  {healthStatus === 'loading' ? 'Testando...' : 
                   healthStatus === 'ok' ? 'Conectado' : 
                   healthStatus === 'fail' ? 'Erro de Conexão' : 'Aguardando'}
                </span>
              </div>
              
              {responseTime && healthStatus === 'ok' && (
                <span className="text-xs text-slate-500 font-mono">{responseTime}ms</span>
              )}
            </div>

            <button 
              onClick={testConnection}
              disabled={healthStatus === 'loading'}
              className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-bold transition-all"
            >
              <RefreshCw size={16} className={healthStatus === 'loading' ? 'animate-spin' : ''} />
              Testar Novamente
            </button>
          </div>
        </div>

        {/* Detalhes do Erro */}
        {lastError && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <WifiOff size={18} className="text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-rose-500">Detalhes da Falha</p>
                <p className="text-xs text-rose-400/80 mt-1 font-mono break-all">{lastError}</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-8 p-4 bg-primary/5 border border-primary/10 rounded-xl">
          <h4 className="text-primary text-xs font-bold uppercase mb-2">Instruções de CORS</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Se o status for "Erro de Conexão" mas a URL estiver correta, verifique se o backend no Render permite as seguintes origens no CORS:
          </p>
          <ul className="mt-2 space-y-1">
            <li className="text-[10px] font-mono text-slate-500">• https://aistudio.google.com</li>
            <li className="text-[10px] font-mono text-slate-500">• https://www.rhciapi.com.br</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
