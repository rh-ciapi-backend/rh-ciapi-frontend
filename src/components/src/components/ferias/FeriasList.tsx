import React from 'react';
import { Eye, Pencil, Trash2, CalendarClock } from 'lucide-react';

export type FeriasListStatus = 'PROGRAMADAS' | 'EM_ANDAMENTO' | 'FINALIZADAS';

export interface FeriasListItem {
  id: string;
  servidorNome: string;
  matricula?: string;
  cpf?: string;
  setor?: string;
  inicio: string;
  fim: string;
  dias: number;
  status: FeriasListStatus;
  observacao?: string;
}

interface FeriasListProps {
  registros: FeriasListItem[];
  carregando?: boolean;
  onVisualizar?: (item: FeriasListItem) => void;
  onEditar?: (item: FeriasListItem) => void;
  onExcluir?: (item: FeriasListItem) => void;
}

function statusClass(status: FeriasListStatus) {
  if (status === 'EM_ANDAMENTO') return 'border-amber-500/20 bg-amber-500/10 text-amber-200';
  if (status === 'FINALIZADAS') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200';
  return 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200';
}

function formatPeriod(inicio: string, fim: string) {
  const start = inicio ? new Date(`${inicio}T00:00:00`).toLocaleDateString('pt-BR') : '-';
  const end = fim ? new Date(`${fim}T00:00:00`).toLocaleDateString('pt-BR') : '-';
  return `${start} até ${end}`;
}

export function FeriasList({ registros, carregando = false, onVisualizar, onEditar, onExcluir }: FeriasListProps) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-slate-900/80 p-5 shadow-[0_14px_30px_rgba(0,0,0,0.22)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-cyan-300">
            <CalendarClock className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em]">Lista operacional</span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-white">Períodos cadastrados</h2>
          <p className="mt-1 text-sm text-slate-400">Acompanhe, revise e edite os registros filtrados.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-right">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Resultado</p>
          <p className="mt-1 text-2xl font-bold text-white">{carregando ? '...' : registros.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        {!carregando && registros.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/35 px-4 py-12 text-center text-sm text-slate-400">
            Nenhum período de férias encontrado para os filtros informados.
          </div>
        )}

        {registros.map((item) => (
          <article
            key={item.id}
            className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-lg font-semibold text-white">{item.servidorNome}</h3>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusClass(item.status)}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-300 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Período</p>
                    <p className="mt-1">{formatPeriod(item.inicio, item.fim)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Setor</p>
                    <p className="mt-1">{item.setor || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Matrícula / CPF</p>
                    <p className="mt-1">{item.matricula || item.cpf || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Dias</p>
                    <p className="mt-1">{item.dias} dia(s)</p>
                  </div>
                </div>

                {item.observacao && (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-2.5 text-sm text-slate-300">
                    {item.observacao}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <button
                  type="button"
                  onClick={() => onVisualizar?.(item)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
                >
                  <Eye className="h-4 w-4" />
                  Visualizar
                </button>
                <button
                  type="button"
                  onClick={() => onEditar?.(item)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/16"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onExcluir?.(item)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-200 transition hover:bg-rose-500/16"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FeriasList;
