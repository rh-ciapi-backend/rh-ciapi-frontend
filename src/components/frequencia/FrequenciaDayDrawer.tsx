import React from 'react';
import {
  Calendar,
  Copy,
  Edit3,
  Eraser,
  FileText,
  Flag,
  Layers3,
  Repeat2,
} from 'lucide-react';
import type { FrequenciaDayItem } from '../../types/frequencia';
import FrequenciaStatusBadge from './FrequenciaStatusBadge';

type Props = {
  day?: FrequenciaDayItem | null;
  onEdit?: () => void;
  onReplicate?: () => void;
  onClear?: () => void;
  onLaunch?: () => void;
};

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
      <span className="block text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <strong className="mt-1 block text-sm text-slate-100">
        {value && value.trim() ? value : 'Não informado'}
      </strong>
    </div>
  );
}

export default function FrequenciaDayDrawer({
  day,
  onEdit,
  onReplicate,
  onClear,
  onLaunch,
}: Props) {
  if (!day) {
    return (
      <aside className="flex min-h-[620px] items-center justify-center rounded-3xl border border-slate-700/70 bg-slate-900/70 p-6 text-center shadow-xl shadow-black/10 backdrop-blur-sm">
        <div className="max-w-xs">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700/70 bg-slate-800/70 text-cyan-300">
            <Layers3 className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">Selecione um dia</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Abra um dia da grade mensal para visualizar turnos, rubrica,
            ocorrência, observações e ações rápidas.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex min-h-[620px] flex-col rounded-3xl border border-slate-700/70 bg-slate-900/70 shadow-xl shadow-black/10 backdrop-blur-sm">
      <div className="border-b border-slate-800 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">
                Detalhes do dia
              </h3>
              <FrequenciaStatusBadge status={day.statusFinal} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Leitura completa do registro selecionado.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700/70 bg-slate-800/70 p-2 text-cyan-300">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/8 p-4">
          <p className="text-xs uppercase tracking-wide text-cyan-300/80">
            Data completa
          </p>
          <h4 className="mt-1 text-lg font-bold text-white">
            Dia {day.dia} • {day.weekdayLabel}
          </h4>
          <p className="mt-1 text-sm text-slate-300">{day.dataIso}</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <InfoBlock label="Turno 1" value={day.turno1} />
          <InfoBlock label="Turno 2" value={day.turno2} />
          <InfoBlock label="Rubrica" value={day.rubrica} />
          <InfoBlock label="Ocorrência" value={day.ocorrencia} />
          <InfoBlock label="Observações" value={day.observacoes} />
          <InfoBlock
            label="Destino da informação"
            value={
              day.channel === 'rubrica'
                ? 'Vai para rubrica'
                : day.channel === 'ocorrencia'
                ? 'Vai para ocorrência'
                : day.channel === 'ambos'
                ? 'Vai para rubrica e ocorrência'
                : 'Sem destino definido'
            }
          />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Flag className="h-4 w-4 text-violet-300" />
            <h4 className="text-sm font-semibold text-white">Vínculos do dia</h4>
          </div>

          <div className="flex flex-wrap gap-2">
            {day.isHoliday && (
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                Feriado
              </span>
            )}
            {day.isPontoFacultativo && (
              <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs text-fuchsia-300">
                Ponto facultativo
              </span>
            )}
            {day.isFerias && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                Férias
              </span>
            )}
            {day.isAtestado && (
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                Atestado
              </span>
            )}
            {day.isFalta && (
              <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-300">
                Falta
              </span>
            )}
            {day.isPending && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                Pendência
              </span>
            )}
            {!day.isHoliday &&
              !day.isPontoFacultativo &&
              !day.isFerias &&
              !day.isAtestado &&
              !day.isFalta &&
              !day.isPending && (
                <span className="rounded-full border border-slate-700/70 bg-slate-800/70 px-3 py-1 text-xs text-slate-300">
                  Sem vínculos especiais
                </span>
              )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-800 p-4">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-800/70 px-3 py-2.5 text-sm font-medium text-slate-100 transition hover:border-slate-600"
        >
          <Edit3 className="h-4 w-4" />
          Editar
        </button>

        <button
          type="button"
          onClick={onReplicate}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-800/70 px-3 py-2.5 text-sm font-medium text-slate-100 transition hover:border-slate-600"
        >
          <Repeat2 className="h-4 w-4" />
          Replicar
        </button>

        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-200 transition hover:bg-rose-500/15"
        >
          <Eraser className="h-4 w-4" />
          Limpar
        </button>

        <button
          type="button"
          onClick={onLaunch}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/15 px-3 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
        >
          <FileText className="h-4 w-4" />
          Lançar
        </button>
      </div>
    </aside>
  );
}
