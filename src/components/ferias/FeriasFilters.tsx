import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';

export type FeriasFiltroStatus = 'TODOS' | 'PROGRAMADAS' | 'EM_ANDAMENTO' | 'FINALIZADAS';

export interface FeriasFiltroState {
  busca: string;
  ano: number;
  mes: number;
  setor: string;
  status: FeriasFiltroStatus;
}

interface FeriasFiltersProps {
  filtros: FeriasFiltroState;
  setores: string[];
  onChange: <K extends keyof FeriasFiltroState>(field: K, value: FeriasFiltroState[K]) => void;
  onReset: () => void;
}

const MONTHS = [
  { value: 0, label: 'Todos os meses' },
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export function FeriasFilters({ filtros, setores, onChange, onReset }: FeriasFiltersProps) {
  const baseYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 7 }).map((_, index) => baseYear - 2 + index);

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-900/70 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2 text-slate-300">
        <Filter className="h-4 w-4 text-cyan-300" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">Filtros da gestão</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="space-y-2 xl:col-span-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Busca</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={filtros.busca}
              onChange={(event) => onChange('busca', event.target.value)}
              placeholder="Servidor, matrícula, CPF, setor ou observação"
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 pl-10 pr-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ano</span>
          <select
            value={filtros.ano}
            onChange={(event) => onChange('ano', Number(event.target.value))}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Mês</span>
          <select
            value={filtros.mes}
            onChange={(event) => onChange('mes', Number(event.target.value))}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
          >
            {MONTHS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Setor</span>
          <select
            value={filtros.setor}
            onChange={(event) => onChange('setor', event.target.value)}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
          >
            <option value="">Todos os setores</option>
            {setores.map((setor) => (
              <option key={setor} value={setor}>
                {setor}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'TODOS', label: 'Todos' },
            { value: 'PROGRAMADAS', label: 'Programadas' },
            { value: 'EM_ANDAMENTO', label: 'Em andamento' },
            { value: 'FINALIZADAS', label: 'Finalizadas' },
          ].map((option) => {
            const active = filtros.status === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange('status', option.value as FeriasFiltroState['status'])}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  active
                    ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200'
                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
        >
          <RotateCcw className="h-4 w-4" />
          Limpar filtros
        </button>
      </div>
    </section>
  );
}

export default FeriasFilters;
