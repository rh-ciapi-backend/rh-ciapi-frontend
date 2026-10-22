import React from 'react';
import { CalendarCheck2, CalendarX2 } from 'lucide-react';
import type { FrequenciaDayItem, FrequenciaMonthGridProps } from '../../types/frequencia';
import { FREQUENCIA_STATUS_META } from '../../types/frequencia';
import FrequenciaStatusBadge from './FrequenciaStatusBadge';

function dayCellClasses(status: FrequenciaDayItem['status'], selected: boolean): string {
  const base =
    'group relative overflow-hidden rounded-2xl border p-3 text-left transition duration-200';
  const active = selected ? 'ring-2 ring-cyan-400/70' : '';

  switch (status) {
    case 'presente':
      return `${base} ${active} border-emerald-500/20 bg-emerald-500/8 hover:bg-emerald-500/12`;
    case 'falta':
      return `${base} ${active} border-rose-500/20 bg-rose-500/8 hover:bg-rose-500/12`;
    case 'atestado':
      return `${base} ${active} border-amber-500/20 bg-amber-500/8 hover:bg-amber-500/12`;
    case 'ferias':
      return `${base} ${active} border-sky-500/20 bg-sky-500/8 hover:bg-sky-500/12`;
    case 'feriado':
      return `${base} ${active} border-fuchsia-500/20 bg-fuchsia-500/8 hover:bg-fuchsia-500/12`;
    case 'ponto_facultativo':
      return `${base} ${active} border-violet-500/20 bg-violet-500/8 hover:bg-violet-500/12`;
    case 'fim_de_semana':
      return `${base} ${active} border-slate-700 bg-slate-800/60 hover:bg-slate-800/80`;
    default:
      return `${base} ${active} border-white/10 bg-white/[0.03] hover:bg-white/[0.05]`;
  }
}

export default function FrequenciaMonthGrid({
  servidor,
  selectedDay,
  onSelectDay,
  loading = false,
}: FrequenciaMonthGridProps) {
  if (loading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
        <div className="mb-4 h-6 w-48 animate-pulse rounded bg-white/10" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {Array.from({ length: 31 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      </section>
    );
  }

  if (!servidor) {
    return (
      <section className="rounded-3xl border border-dashed border-white/10 bg-slate-900/50 p-10 text-center shadow-xl shadow-black/20">
        <CalendarX2 className="mx-auto mb-4 h-10 w-10 text-slate-500" />
        <h3 className="text-lg font-semibold text-white">Nenhum servidor selecionado</h3>
        <p className="mt-2 text-sm text-slate-400">
          Escolha um servidor na lista para visualizar a grade mensal da frequência.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{servidor.nome}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {servidor.cargo || 'Cargo não informado'} • {servidor.categoria || 'Categoria não informada'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <FrequenciaStatusBadge status="falta" label={`Faltas: ${servidor.resumo.faltas}`} small />
          <FrequenciaStatusBadge status="atestado" label={`Atestados: ${servidor.resumo.atestados}`} small />
          <FrequenciaStatusBadge status="ferias" label={`Férias: ${servidor.resumo.ferias}`} small />
          <FrequenciaStatusBadge status="sem_registro" label={`Sem registro: ${servidor.resumo.semRegistro}`} small />
        </div>
      </div>

      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
        <CalendarCheck2 className="h-4 w-4 text-cyan-300" />
        Clique em um dia para abrir os detalhes completos
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {servidor.dias.map((day) => {
          const meta = FREQUENCIA_STATUS_META[day.status] || FREQUENCIA_STATUS_META.sem_registro;
          const isSelected = selectedDay === day.dia;

          return (
            <button
              key={day.dataIso}
              type="button"
              onClick={() => onSelectDay(day)}
              className={dayCellClasses(day.status, isSelected)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-2xl font-bold text-white">{String(day.dia).padStart(2, '0')}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                    {day.weekdayLabel}
                  </div>
                </div>
                <span className={['mt-1 h-2.5 w-2.5 rounded-full', meta.dotClassName].join(' ')} />
              </div>

              <div className="mt-4 space-y-2">
                <div className="truncate text-xs font-medium text-white">{day.titulo || meta.label}</div>
                <div className="line-clamp-2 min-h-[32px] text-xs leading-4 text-slate-400">
                  {day.rubrica || day.descricao || 'Sem observações registradas para este dia.'}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {day.ocorrenciaManha && (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-slate-300">
                    Manhã: {day.ocorrenciaManha}
                  </span>
                )}
                {day.ocorrenciaTarde && (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-slate-300">
                    Tarde: {day.ocorrenciaTarde}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
