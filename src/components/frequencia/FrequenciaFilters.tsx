import React from 'react';
import { CalendarRange, Filter, Search, X } from 'lucide-react';
import type { FrequenciaFiltersState } from '../../types/frequencia';

interface Props {
  filters: FrequenciaFiltersState;
  categorias: string[];
  setores: string[];
  onChange: <K extends keyof FrequenciaFiltersState>(key: K, value: FrequenciaFiltersState[K]) => void;
  onReset: () => void;
}

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export default function FrequenciaFilters({
  filters,
  categorias,
  setores,
  onChange,
  onReset,
}: Props) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, index) => currentYear - 2 + index);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20 backdrop-blur">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Filter className="h-4 w-4 text-cyan-300" />
          Filtros da competência
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
          Limpar filtros
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Busca</span>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/80 px-3">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={filters.busca}
              onChange={(e) => onChange('busca', e.target.value)}
              placeholder="Nome, CPF, matrícula..."
              className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Mês</span>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/80 px-3">
            <CalendarRange className="h-4 w-4 text-slate-500" />
            <select
              value={filters.mes}
              onChange={(e) => onChange('mes', Number(e.target.value))}
              className="h-11 w-full bg-transparent text-sm text-white outline-none"
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1} className="bg-slate-900 text-white">
                  {month}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Ano</span>
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-3">
            <select
              value={filters.ano}
              onChange={(e) => onChange('ano', Number(e.target.value))}
              className="h-11 w-full bg-transparent text-sm text-white outline-none"
            >
              {years.map((year) => (
                <option key={year} value={year} className="bg-slate-900 text-white">
                  {year}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Categoria</span>
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-3">
            <select
              value={filters.categoria}
              onChange={(e) => onChange('categoria', e.target.value)}
              className="h-11 w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="" className="bg-slate-900 text-white">
                Todas
              </option>
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria} className="bg-slate-900 text-white">
                  {categoria}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Setor</span>
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-3">
            <select
              value={filters.setor}
              onChange={(e) => onChange('setor', e.target.value)}
              className="h-11 w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="" className="bg-slate-900 text-white">
                Todos
              </option>
              {setores.map((setor) => (
                <option key={setor} value={setor} className="bg-slate-900 text-white">
                  {setor}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Status</span>
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-3">
            <select
              value={filters.statusServidor}
              onChange={(e) => onChange('statusServidor', e.target.value)}
              className="h-11 w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="" className="bg-slate-900 text-white">
                Todos
              </option>
              <option value="ATIVO" className="bg-slate-900 text-white">
                Ativo
              </option>
              <option value="INATIVO" className="bg-slate-900 text-white">
                Inativo
              </option>
            </select>
          </div>
        </label>
      </div>
    </section>
  );
}
