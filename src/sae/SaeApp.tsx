import React from 'react';
import { Layers3, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SaeApp() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-bg-dark text-white">
      <header className="h-20 border-b border-border-dark flex items-center justify-between px-8 bg-card-dark">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center font-bold text-xl">
            C
          </div>

          <div>
            <h1 className="font-bold text-lg">CIAPI</h1>
            <p className="text-xs text-slate-500">
              Sistema Integrado de Gestão
            </p>
          </div>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </header>

      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center p-8">
        <div className="max-w-xl w-full bg-card-dark border border-border-dark rounded-3xl p-10 text-center shadow-2xl">
          <div className="mx-auto w-16 h-16 bg-primary/15 text-primary rounded-2xl flex items-center justify-center mb-6">
            <Layers3 size={32} />
          </div>

          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
            AMBIENTE SAE
          </div>

          <h2 className="text-3xl font-bold">SAE</h2>

          <p className="text-slate-400 mt-3">
            Gestão de Atendimento e Acompanhamento
          </p>

          <div className="mt-8 bg-slate-800/60 rounded-2xl p-5 text-left">
            <p className="text-xs text-slate-500">
              Sessão autenticada
            </p>

            <p className="text-sm mt-1 text-slate-300">
              {user?.email}
            </p>
          </div>

          <p className="text-sm text-slate-500 mt-8">
            O ambiente SAE foi carregado corretamente.
          </p>
        </div>
      </main>
    </div>
  );
}
