import React, { useMemo } from 'react';
import { CalendarDays, Users, Sparkles } from 'lucide-react';

export type FeriasCalendarStatus = 'PROGRAMADAS' | 'EM_ANDAMENTO' | 'FINALIZADAS';

export interface FeriasCalendarItem {
  id: string;
  servidorNome: string;
  setor?: string;
  inicio: string;
  fim: string;
  status: FeriasCalendarStatus;
}

interface FeriasCalendarProps {
  ano: number;
  mes: number;
  registros: FeriasCalendarItem[];
  onSelectDate?: (date: string, records: FeriasCalendarItem[]) => void;
}

const WEEK_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatIso(date: Date) {
  return date.toLocaleDateString('en-CA');
}

function monthName(month: number) {
  const date = new Date(2026, Math.max(0, month - 1), 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function statusBadgeClass(status: FeriasCalendarStatus) {
  if (status === 'EM_ANDAMENTO') return 'bg-amber-400';
  if (status === 'FINALIZADAS') return 'bg-emerald-400';
  return 'bg-cyan-400';
}

export function FeriasCalendar({ ano, mes, registros, onSelectDate }: FeriasCalendarProps) {
  const activeMonth = mes > 0 ? mes : new Date().getMonth() + 1;

  const { days, recordsByDate, totalEmDestaque, busiestDay } = useMemo(() => {
    const firstDay = new Date(ano, activeMonth - 1, 1);
    const lastDay = new Date(ano, activeMonth, 0);
    const gridStart = new Date(firstDay);
    gridStart.setDate(gridStart.getDate() - firstDay.getDay());

    const daysList: Date[] = [];
    for (let index = 0; index < 42; index += 1) {
      const current = new Date(gridStart);
      current.setDate(gridStart.getDate() + index);
      daysList.push(current);
    }

    const grouped = new Map<string, FeriasCalendarItem[]>();

    registros.forEach((record) => {
      const start = parseDate(record.inicio);
      const end = parseDate(record.fim);
      if (!start || !end) return;

      const cursor = new Date(start);
      while (cursor <= end) {
        const key = formatIso(cursor);
        const list = grouped.get(key) || [];
        list.push(record);
        grouped.set(key, list);
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    let peakDate = '';
    let peakTotal = 0;
    grouped.forEach((items, key) => {
      if (items.length > peakTotal) {
        peakTotal = items.length;
        peakDate = key;
      }
    });

    return {
      days: daysList,
      recordsByDate: grouped,
      totalEmDestaque: Array.from(grouped.values()).reduce((acc, current) => acc + current.length, 0),
      busiestDay: peakDate ? { date: peakDate, total: peakTotal } : null,
    };
  }, [ano, activeMonth, registros]);

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <div className="rounded-[30px] border border-white/10 bg-slate-900/80 p-5 shadow-[0_14px_30px_rgba(0,0,0,0.22)]">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-300">
              <CalendarDays className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.22em]">Calendário operacional</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold capitalize text-white">{monthName(activeMonth)}</h2>
            <p className="mt-1 text-sm text-slate-400">Clique em um dia destacado para ver quem estará em férias.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Ocorrências no mês</p>
            <p className="mt-1 text-2xl font-bold text-white">{totalEmDestaque}</p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {WEEK_LABELS.map((label) => (
            <div key={label} className="pb-2">{label}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const iso = formatIso(day);
            const items = recordsByDate.get(iso) || [];
            const inCurrentMonth = day.getMonth() + 1 === activeMonth;
            const isToday = iso === formatIso(new Date());

            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelectDate?.(iso, items)}
                className={`min-h-[92px] rounded-2xl border p-3 text-left transition ${
                  items.length
                    ? 'border-cyan-400/20 bg-cyan-500/10 hover:bg-cyan-500/14'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                } ${!inCurrentMonth ? 'opacity-35' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-sm font-semibold ${isToday ? 'text-cyan-300' : 'text-white'}`}>{day.getDate()}</span>
                  {items.length > 0 && (
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
                      {items.length}
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1.5">
                  {items.slice(0, 2).map((item) => (
                    <div key={`${iso}-${item.id}`} className="flex items-center gap-2 rounded-xl bg-slate-950/35 px-2 py-1.5 text-[11px] text-slate-200">
                      <span className={`h-2 w-2 rounded-full ${statusBadgeClass(item.status)}`} />
                      <span className="truncate">{item.servidorNome}</span>
                    </div>
                  ))}
                  {items.length > 2 && <p className="text-[11px] text-slate-400">+{items.length - 2} servidor(es)</p>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-slate-900/80 p-5 shadow-[0_14px_30px_rgba(0,0,0,0.22)]">
        <div className="flex items-center gap-2 text-emerald-300">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.22em]">Planejamento anual</span>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Mês exibido</p>
            <p className="mt-2 text-xl font-bold capitalize text-white">{monthName(activeMonth)}</p>
            <p className="mt-1 text-sm text-slate-400">Referência usada para o calendário visual e acompanhamento do setor.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="h-4 w-4 text-cyan-300" />
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Maior concentração</p>
            </div>
            <p className="mt-2 text-lg font-bold text-white">
              {busiestDay ? new Date(`${busiestDay.date}T00:00:00`).toLocaleDateString('pt-BR') : 'Sem pico registrado'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {busiestDay ? `${busiestDay.total} servidor(es) em férias nesta data.` : 'Cadastre períodos para obter leitura do pico operacional.'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Leitura rápida</p>
            <ul className="mt-3 space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" /> Programadas: períodos futuros já lançados.</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-amber-400" /> Em andamento: servidor atualmente afastado.</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" /> Finalizadas: férias encerradas e mantidas no histórico.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeriasCalendar;
