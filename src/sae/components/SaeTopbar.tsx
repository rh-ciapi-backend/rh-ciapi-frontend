import React, { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  CalendarClock,
  ChevronDown,
  Layers3,
  Search,
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { SaeTab } from './SaeSidebar';
import MinhaAgendaModal from './agendamentos/MinhaAgendaModal';
import CentralSolicitacoesModal from './agendamentos/CentralSolicitacoesModal';
import { saeAgendaService } from '../services/saeAgendaService';

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

  const [minhaAgendaAberta, setMinhaAgendaAberta] = useState(false);
  const [centralAberta, setCentralAberta] = useState(false);
  const [pendentes, setPendentes] = useState(0);
  const [podeVerSolicitacoes, setPodeVerSolicitacoes] = useState(false);

  const atualizarPendentes = useCallback(async () => {
    try {
      const response = await saeAgendaService.listarSolicitacoes({
        status: 'PENDENTE',
      });

      setPendentes(response.solicitacoes?.length || 0);
      setPodeVerSolicitacoes(true);
    } catch {
      setPendentes(0);
      setPodeVerSolicitacoes(false);
    }
  }, []);

  useEffect(() => {
    atualizarPendentes();

    const timer = window.setInterval(atualizarPendentes, 60_000);
    const onFocus = () => atualizarPendentes();

    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [atualizarPendentes]);

  return (
    <>
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

          <button
            type="button"
            onClick={() => setMinhaAgendaAberta(true)}
            className="hidden items-center gap-2 rounded-xl border border-border-dark bg-card-dark px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-primary/30 hover:text-white sm:flex"
            title="Minha agenda profissional"
          >
            <CalendarClock size={17} className="text-primary" />
            Minha agenda
          </button>

          <div className="hidden items-center gap-2 rounded-xl border border-border-dark bg-card-dark px-3 py-2 text-xs font-bold text-slate-300 lg:flex">
            <Layers3 size={17} className="text-primary" />
            SAE
            <ChevronDown size={14} className="text-slate-500" />
          </div>

          <button
            type="button"
            onClick={() => setMinhaAgendaAberta(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-dark bg-card-dark text-slate-400 transition-colors hover:text-white sm:hidden"
            title="Minha agenda profissional"
          >
            <CalendarClock size={18} />
          </button>

          <button
            type="button"
            onClick={() => podeVerSolicitacoes && setCentralAberta(true)}
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl border bg-card-dark transition-colors ${
              podeVerSolicitacoes
                ? 'border-border-dark text-slate-400 hover:border-primary/30 hover:text-white'
                : 'cursor-default border-border-dark text-slate-600'
            }`}
            title={
              podeVerSolicitacoes
                ? 'Solicitações pendentes'
                : 'Sem acesso à caixa de solicitações'
            }
          >
            <Bell size={18} />

            {podeVerSolicitacoes && pendentes > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-extrabold leading-none text-white ring-2 ring-bg-dark">
                {pendentes > 99 ? '99+' : pendentes}
              </span>
            )}
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

      <MinhaAgendaModal
        aberto={minhaAgendaAberta}
        onClose={() => setMinhaAgendaAberta(false)}
      />

      <CentralSolicitacoesModal
        aberto={centralAberta}
        onClose={() => setCentralAberta(false)}
        onAtualizarPendentes={atualizarPendentes}
      />
    </>
  );
}
