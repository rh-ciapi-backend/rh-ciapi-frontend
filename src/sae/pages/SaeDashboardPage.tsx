import React from 'react';
import {
  Activity,
  CalendarDays,
  Clock3,
  Stethoscope,
  Users,
  ArrowRight,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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

const CARDS = [
  {
    label: 'Usuários Ativos',
    value: '—',
    helper: 'Cadastros ativos no SAE',
    icon: Users,
  },
  {
    label: 'Agendamentos Hoje',
    value: '—',
    helper: 'Agenda do dia',
    icon: CalendarDays,
  },
  {
    label: 'Atendimentos no Mês',
    value: '—',
    helper: 'Registros realizados',
    icon: Stethoscope,
  },
  {
    label: 'Sinais Vitais',
    value: '—',
    helper: 'Lançamentos no período',
    icon: HeartPulse,
  },
];

export default function SaeDashboardPage() {
  const { user } = useAuth();
  const firstName = getFirstName(user);

  const agora = new Date();

  const dataFormatada = agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const horaFormatada = agora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const hour = agora.getHours();
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Visão Geral
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
            {greeting}, {firstName}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <CalendarDays size={14} />
            <span className="capitalize">{dataFormatada}</span>
            <span>•</span>
            <Clock3 size={14} />
            <span>{horaFormatada}</span>
          </div>

          <p className="mt-3 text-sm text-slate-400">
            Acompanhe os principais indicadores do SAE em um único lugar.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover"
        >
          <CalendarDays size={18} />
          Novo Agendamento
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="rounded-3xl border border-border-dark bg-card-dark p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    {card.label}
                  </p>

                  <p className="mt-3 text-3xl font-bold text-white">
                    {card.value}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {card.helper}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <Icon size={19} />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <section className="rounded-3xl border border-border-dark bg-card-dark p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-primary" />
                <h2 className="text-base font-bold text-white">
                  Agendamentos do Dia
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Os próximos atendimentos aparecerão aqui.
              </p>
            </div>

            <button
              type="button"
              className="flex items-center gap-1 text-xs font-bold text-primary"
            >
              Ver agenda
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-border-dark">
            <div className="grid grid-cols-[90px_1fr_1fr_120px] gap-3 bg-slate-800/60 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              <span>Horário</span>
              <span>Usuário</span>
              <span>Serviço</span>
              <span>Status</span>
            </div>

            <div className="flex min-h-[220px] items-center justify-center px-5 py-10 text-center">
              <div>
                <CalendarDays size={32} className="mx-auto text-slate-700" />
                <p className="mt-3 text-sm font-semibold text-slate-400">
                  Nenhum agendamento carregado
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Os dados aparecerão após a integração do banco SAE.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border-dark bg-card-dark p-5">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            <h2 className="text-base font-bold text-white">
              Resumo do SAE
            </h2>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Situação operacional do ambiente.
          </p>

          <div className="mt-5 space-y-3">
            <StatusRow
              label="Banco de usuários"
              value="Aguardando integração"
            />
            <StatusRow
              label="Agenda dos profissionais"
              value="Aguardando configuração"
            />
            <StatusRow
              label="Sinais vitais"
              value="Aguardando integração"
            />
            <StatusRow
              label="Relatórios"
              value="Aguardando dados"
            />
          </div>
        </section>
      </div>
    </section>
  );
}

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border-dark bg-slate-800/30 p-4">
      <p className="text-xs font-semibold text-slate-300">
        {label}
      </p>

      <p className="mt-1 text-[11px] text-slate-600">
        {value}
      </p>
    </div>
  );
}
