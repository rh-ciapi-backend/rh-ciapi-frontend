import React from 'react';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  MoonStar,
  SunMedium,
} from 'lucide-react';
import type { FrequenciaDayItem } from '../../types/frequencia';
import FrequenciaStatusBadge from './FrequenciaStatusBadge';

type Props = {
  dayItems: FrequenciaDayItem[];
  selectedDayId?: string | null;
  onSelectDay: (day: FrequenciaDayItem) => void;
};

function getDayIcon(day: FrequenciaDayItem) {
  if (day.isSunday) return MoonStar;
  if (day.isSaturday) return SunMedium;
  if (day.isPending) return FileWarning;
  if (day.hasOcorrencia) return ClipboardList;
  return CheckCircle2;
}

export default function FrequenciaMonthGrid({
  dayItems,
  selectedDayId,
  onSelectDay,
}: Props) {
  return (
    <section className="flex h-full min-h-[620px] flex-col rounded-3xl border border-slate-700/70 bg-slate-900/70 shadow-xl shadow-black/10 backdrop-blur-sm">
      <div className="border-b border-slate-800 p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Leitura mensal</h3>
            <p className="text-xs text-slate-400">
              Grade operacional por dia, com destaque de rubrica, ocorrência e status final.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-300">
            <CalendarClock className="h-4 w-4 text-cyan-300" />
            {dayItems.length} dias carregados
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {dayItems.map((day) => {
          const Icon = getDayIcon(day);
          const selected = selectedDayId === day.id;

          return (
            <button
              key={day.id}
              type="button"
              onClick={() => onSelectDay(day)}
              className={[
                'group rounded-2xl border p-3 text-left transition',
                selected
                  ? 'border-cyan-500/40 bg-cyan-500/10 shadow-lg shadow-cyan-950/20'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/70',
              ].join(' ')}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-white">
                      {day.dia}
                    </span>
                    {day.isToday && (
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                        Hoje
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-400">
                    {day.weekdayLabel}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-2 text-slate-300">
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mb-3">
                <FrequenciaStatusBadge status={day.statusFinal} />
              </div>

              <div className="space-y-2 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                  <span className="block text-slate-500">Rubrica</span>
                  <strong className="line-clamp-1 text-slate-200">
                    {day.rubrica || 'Sem rubrica'}
                  </strong>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                  <span className="block text-slate-500">Ocorrência</span>
                  <strong className="line-clamp-1 text-slate-200">
                    {day.ocorrencia || 'Sem ocorrência'}
                  </strong>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                    <span className="block text-slate-500">Turno 1</span>
                    <strong className="line-clamp-1 text-slate-200">
                      {day.turno1 || '—'}
                    </strong>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                    <span className="block text-slate-500">Turno 2</span>
                    <strong className="line-clamp-1 text-slate-200">
                      {day.turno2 || '—'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {(day.chips || []).slice(0, 3).map((chip) => (
                  <span
                    key={`${day.id}-${chip}`}
                    className="rounded-full border border-slate-700/70 bg-slate-800/70 px-2 py-1 text-[10px] text-slate-300"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
