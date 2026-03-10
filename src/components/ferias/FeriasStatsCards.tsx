import React from 'react';
import { CalendarDays, CalendarRange, BriefcaseBusiness, BarChart3 } from 'lucide-react';

interface FeriasStats {
  totalRegistros: number;
  emFeriasAgora: number;
  previstasMes: number;
  saldoProgramadoAno: number;
  coberturaPlanejada: number;
}

interface FeriasStatsCardsProps {
  stats: FeriasStats;
  carregando?: boolean;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: React.ReactNode;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.08),transparent_30%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">{value}</p>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

export function FeriasStatsCards({ stats, carregando = false }: FeriasStatsCardsProps) {
  const coverage = Number.isFinite(stats.coberturaPlanejada) ? `${Math.round(stats.coberturaPlanejada)}%` : '0%';

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Registros"
        value={carregando ? '...' : stats.totalRegistros}
        subtitle="Períodos cadastrados no painel"
        icon={<CalendarDays className="h-5 w-5" />}
      />
      <StatCard
        title="Em férias agora"
        value={carregando ? '...' : stats.emFeriasAgora}
        subtitle="Servidores afastados neste momento"
        icon={<BriefcaseBusiness className="h-5 w-5" />}
      />
      <StatCard
        title="Previstas no mês"
        value={carregando ? '...' : stats.previstasMes}
        subtitle="Saídas previstas no filtro atual"
        icon={<CalendarRange className="h-5 w-5" />}
      />
      <StatCard
        title="Cobertura anual"
        value={carregando ? '...' : coverage}
        subtitle="Percentual planejado dentro do ano"
        icon={<BarChart3 className="h-5 w-5" />}
      />
    </section>
  );
}

export default FeriasStatsCards;
