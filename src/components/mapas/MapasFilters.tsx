import React from 'react';
import { MapaFilters, ModoExportacaoMapa, StatusFiltroMapa, TipoLayoutMapa } from '../../types/mapas';

interface Props {
  filters: MapaFilters;
  categorias: string[];
  setores: string[];
  onChange: (patch: Partial<MapaFilters>) => void;
  onRefresh: () => void;
}

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function MapasFilters({ filters, categorias, setores, onChange, onRefresh }: Props) {
  const anoAtual = new Date().getFullYear();
  const anos = Array.from({ length: 6 }).map((_, idx) => anoAtual - idx);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mês</span>
          <select
            value={filters.mes}
            onChange={(e) => onChange({ mes: Number(e.target.value) })}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
          >
            {meses.map((mes, idx) => (
              <option key={mes} value={idx + 1}>{mes}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ano</span>
          <select
            value={filters.ano}
            onChange={(e) => onChange({ ano: Number(e.target.value) })}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
          >
            {anos.map((ano) => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Categoria</span>
          <select
            value={filters.categoria || ''}
            onChange={(e) => onChange({ categoria: e.target.value || '' })}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
          >
            <option value="">Todas</option>
            {categorias.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Setor</span>
          <select
            value={filters.setor || ''}
            onChange={(e) => onChange({ setor: e.target.value || '' })}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
          >
            <option value="">Todos</option>
            {setores.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
          <select
            value={filters.status || 'ATIVO'}
            onChange={(e) => onChange({ status: e.target.value as StatusFiltroMapa })}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
          >
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
            <option value="TODOS">Todos</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tipo de layout</span>
          <select
            value={filters.layout || 'automatico'}
            onChange={(e) => onChange({ layout: e.target.value as TipoLayoutMapa })}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
          >
            <option value="automatico">Automático</option>
            <option value="setrabes_simples">Padrão simples SETRABES</option>
            <option value="sesau_detalhado">Padrão detalhado SESAU</option>
            <option value="sesau_seletivo">Padrão SESAU seletivo</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Modo de exportação</span>
          <select
            value={filters.modoExportacao || 'arquivo_unico'}
            onChange={(e) => onChange({ modoExportacao: e.target.value as ModoExportacaoMapa })}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
          >
            <option value="arquivo_unico">Arquivo único</option>
            <option value="separado_categoria">Separado por categoria</option>
            <option value="separado_setor">Separado por setor</option>
            <option value="zip_consolidado">ZIP consolidado</option>
          </select>
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={onRefresh}
          className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
        >
          Atualizar mapa
        </button>
      </div>
    </div>
  );
}
