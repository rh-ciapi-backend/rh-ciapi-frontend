import React from 'react';
import { Filter, RefreshCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import type {
  FrequenciaFiltersState,
  FrequenciaOption,
  FrequenciaViewMode,
} from '../../types/frequencia';

type Props = {
  filters: FrequenciaFiltersState;
  meses: FrequenciaOption[];
  anos: FrequenciaOption[];
  categorias: FrequenciaOption[];
  setores: FrequenciaOption[];
  statuses: FrequenciaOption[];
  onChange: <K extends keyof FrequenciaFiltersState>(
    field: K,
    value: FrequenciaFiltersState[K]
  ) => void;
  onApply: () => void;
  onClear: () => void;
};

function ModeButton({
  active,
  label,
  value,
  onChange,
}: {
  active: boolean;
  label: string;
  value: FrequenciaViewMode;
  onChange: (value: FrequenciaViewMode) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={[
        'rounded-xl border px-3 py-2 text-sm font-medium transition',
        active
          ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-200'
          : 'border-slate-700/70 bg-slate-800/60 text-slate-300 hover:border-slate-600',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | number;
  options: FrequenciaOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <select
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-2xl border border-slate-700/70 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500/40"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function FrequenciaFilters({
  filters,
  meses,
  anos,
  categorias,
  setores,
  statuses,
  onChange,
  onApply,
  onClear,
}: Props) {
  return (
    <section className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur-sm">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-800/70 p-2 text-cyan-300">
            <Filter className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Filtros da competência</h2>
            <p className="text-xs text-slate-400">
              Refine a visão mensal, selecione um servidor e controle a leitura operacional.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ModeButton
            active={filters.viewMode === 'geral'}
            label="Visão geral"
            value="geral"
            onChange={(value) => onChange('viewMode', value)}
          />
          <ModeButton
            active={filters.viewMode === 'individual'}
            label="Visão individual"
            value="individual"
            onChange={(value) => onChange('viewMode', value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SelectField
          label="Mês"
          value={filters.mes}
          options={meses}
          onChange={(value) => onChange('mes', Number(value))}
        />

        <SelectField
          label="Ano"
          value={filters.ano}
          options={anos}
          onChange={(value) => onChange('ano', Number(value))}
        />

        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Servidor
          </span>
          <input
            value={filters.servidor}
            onChange={(e) => onChange('servidor', e.target.value)}
            placeholder="Nome, CPF ou matrícula"
            className="h-11 rounded-2xl border border-slate-700/70 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500/40"
          />
        </label>

        <SelectField
          label="Categoria"
          value={filters.categoria}
          options={categorias}
          onChange={(value) => onChange('categoria', value)}
        />

        <SelectField
          label="Setor"
          value={filters.setor}
          options={setores}
          onChange={(value) => onChange('setor', value)}
        />

        <SelectField
          label="Status"
          value={filters.status}
          options={statuses}
          onChange={(value) => onChange('status', value)}
        />

        <label className="flex flex-col gap-2 xl:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Busca textual
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={filters.busca}
              onChange={(e) => onChange('busca', e.target.value)}
              placeholder="Buscar por nome, cargo, setor, categoria ou status"
              className="h-11 w-full rounded-2xl border border-slate-700/70 bg-slate-900/80 pl-10 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500/40"
            />
          </div>
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <SlidersHorizontal className="h-4 w-4" />
          Atualize a leitura para recalcular lista, grade mensal e indicadores.
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-800/70 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-600"
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </button>

          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/15 px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
          >
            <RefreshCcw className="h-4 w-4" />
            Aplicar visualização
          </button>
        </div>
      </div>
    </section>
  );
}
