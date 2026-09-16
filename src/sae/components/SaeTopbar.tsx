import React from 'react';
import {
  Bell,
  ChevronDown,
  Layers3,
  Search,
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { SaeTab } from './SaeSidebar';

interface SaeTopbarProps {
  activeTab: SaeTab;
}

const TITLES: Record<SaeTab, string> = {
  dashboard: 'Dashboard',
  usuarios: 'Usuários',
  triagem: 'Triagem',
  agendamentos: 'Agendamentos',
  atendimentos: 'Atendimentos',
  'sinais-vitais': 'Sinais Vitais',
  mapas: 'Mapas',
  relatorios: 'Relatórios',
};

function getFirstName(user: ReturnType<typeof useAuth>['user']) {
  const metadataName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.display_name;

  if (typeof metadataName === 'string' && metadataName.trim()) {
    return metadataName.trim().split(/\s+/)[0];
  }

  if (user?.email) {
    return user.email.split('@')[0];
  }

  return 'Servidor';
}

export default function SaeTopbar({ activeTab }: SaeTopbarProps) {
  const { user } = useAuth();
  const firstName = getFirstName(user);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border-dark bg-bg-dark/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
          SAE
        </p>

        <h2 className="text-lg font-bold text-white">
          {TITLES[activeTab]}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden w-[320px] items-center gap-2 rounded-xl border border-border-dark bg-card-dark px-3 py-2.5 md:flex">
          <Search size={17} className="text-slate-500" />
          <input
            type="text"
            placeholder="Buscar usuário, prontuário..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
          />
        </div>

        <div className="hidden items-center gap-2 rounded-xl border border-border-dark bg-card-dark px-3 py-2 text-xs font-bold text-slate-300 sm:flex">
          <Layers3 size={17} className="text-primary" />
          SAE
          <ChevronDown size={14} className="text-slate-500" />
        </div>

        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border-dark bg-card-dark text-slate-400 transition-colors hover:text-white"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-card-dark" />
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-border-dark bg-card-dark px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-white">
            {firstName.slice(0, 2).toUpperCase()}
          </div>

          <div className="hidden sm:block">
            <p className="text-xs font-bold text-white">
              {firstName}
            </p>
            <p className="text-[10px] text-slate-500">
              Servidor • SAE
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
