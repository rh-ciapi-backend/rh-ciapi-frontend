import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, FileText, Filter, Loader2, X } from 'lucide-react';
import {
  buildFeriasExportData,
  ExportCategoria,
  ExportFeriasFilters,
  ExportFormato,
  ExportOrdenacao,
  ExportStatus,
  ExportTipoExtracao,
  FeriasExportRowInput,
  FeriasExportServidorInput,
  feriasExportLabels,
} from '../../services/feriasExportService';

interface ExportarFeriasModalProps {
  open: boolean;
  loading: boolean;
  filters: ExportFeriasFilters;
  registros: FeriasExportRowInput[];
  servidores: FeriasExportServidorInput[];
  setores: string[];
  error?: string;
  onClose: () => void;
  onChange: <K extends keyof ExportFeriasFilters>(field: K, value: ExportFeriasFilters[K]) => void;
  onSubmit: () => void;
}

const getMesValue = (mes?: number | 'TODOS') => {
  if (mes === undefined || mes === null || mes === 'TODOS') return 'TODOS';
  return String(mes);
};

const getMesLabel = (mes?: number | 'TODOS') => {
  if (mes === undefined || mes === null || mes === 'TODOS') {
    return feriasExportLabels.meses[0] || 'Todos os meses';
  }

  return feriasExportLabels.meses[Number(mes)] || 'Todos os meses';
};

export function ExportarFeriasModal({
  open,
  loading,
  filters,
  registros,
  servidores,
  setores,
  error,
  onClose,
  onChange,
  onSubmit,
}: ExportarFeriasModalProps) {
  const preview = React.useMemo(() => {
    try {
      return buildFeriasExportData(filters, registros, servidores);
    } catch {
      return {
        sections: [],
        totalLinhas: 0,
        totalComFerias: 0,
        totalSemFerias: 0,
      };
    }
  }, [filters, registros, servidores]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
          >
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                    <FileText className="h-5 w-5 text-cyan-300" />
                    Exportar férias no modelo oficial
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Gere a Programação Anual de Férias do CIAPI com filtros avançados e download automático.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:bg-white/[0.08]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[72vh] space-y-6 overflow-y-auto px-6 py-5">
              {error ? (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ano / exercício</span>
                  <input
                    type="number"
                    min={2024}
                    max={2100}
                    value={filters.ano}
                    onChange={(event) => onChange('ano', Number(event.target.value) || new Date().getFullYear())}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Categoria</span>
                  <select
                    value={(filters.categoria || 'TODOS') as string}
                    onChange={(event) => onChange('categoria', event.target.value as ExportCategoria)}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {feriasExportLabels.categorias.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria === 'TODOS' ? 'Todos' : categoria}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Setor</span>
                  <select
                    value={(filters.setor || 'TODOS') as string}
                    onChange={(event) => onChange('setor', event.target.value as string | 'TODOS')}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    <option value="TODOS">Todos</option>
                    {setores.map((setor) => (
                      <option key={setor} value={setor}>
                        {setor}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Status do servidor</span>
                  <select
                    value={(filters.status || 'ATIVO') as string}
                    onChange={(event) => onChange('status', event.target.value as ExportStatus)}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    <option value="TODOS">Todos</option>
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Mês</span>
                  <select
                    value={getMesValue(filters.mes)}
                    onChange={(event) => onChange('mes', event.target.value === 'TODOS' ? 'TODOS' : Number(event.target.value))}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    <option value="TODOS">Todos os meses</option>
                    {feriasExportLabels.meses.slice(1).map((mes, index) => (
                      <option key={mes} value={index + 1}>
                        {mes}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 xl:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Tipo de extração</span>
                  <select
                    value={filters.tipoExtracao}
                    onChange={(event) => onChange('tipoExtracao', event.target.value as ExportTipoExtracao)}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    <option value="TODOS_SERVIDORES">Todos os servidores</option>
                    <option value="COM_FERIAS">Somente servidores com férias cadastradas</option>
                    <option value="NO_MES">Somente servidores com férias no mês selecionado</option>
                    <option value="PLANEJAMENTO_ANUAL">Planejamento anual completo</option>
                    <option value="APENAS_1_PERIODO">Apenas 1º período</option>
                    <option value="APENAS_2_PERIODO">Apenas 2º período</option>
                    <option value="APENAS_3_PERIODO">Apenas 3º período</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ordenação</span>
                  <select
                    value={(filters.ordenacao || 'NOME') as string}
                    onChange={(event) => onChange('ordenacao', event.target.value as ExportOrdenacao)}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    <option value="NOME">Nome A-Z</option>
                    <option value="MATRICULA">Matrícula</option>
                    <option value="CATEGORIA">Categoria</option>
                    <option value="SETOR">Setor</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Formato de saída</span>
                  <select
                    value={filters.formato}
                    onChange={(event) => onChange('formato', event.target.value as ExportFormato)}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    <option value="DOCX">DOCX</option>
                    <option value="PDF">PDF</option>
                    <option value="CSV">CSV</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Linhas</p>
                  <div className="mt-3 text-3xl font-bold text-white">{preview.totalLinhas}</div>
                  <p className="mt-1 text-sm text-cyan-100">registros exportáveis</p>
                </div>

                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Com férias</p>
                  <div className="mt-3 text-3xl font-bold text-white">{preview.totalComFerias}</div>
                  <p className="mt-1 text-sm text-emerald-100">com pelo menos um período</p>
                </div>

                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Sem férias</p>
                  <div className="mt-3 text-3xl font-bold text-white">{preview.totalSemFerias}</div>
                  <p className="mt-1 text-sm text-amber-100">incluídos só quando permitido</p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Seções</p>
                  <div className="mt-3 text-3xl font-bold text-white">{preview.sections.length}</div>
                  <p className="mt-1 text-sm text-slate-300">grupos por categoria</p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-cyan-300" />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Resumo da exportação</h3>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
                    Exercício: {filters.ano}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-200">
                    Categoria: {(filters.categoria || 'TODOS') === 'TODOS' ? 'Todos' : filters.categoria}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-200">
                    Setor: {(filters.setor || 'TODOS') === 'TODOS' ? 'Todos' : filters.setor}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-200">
                    Status: {filters.status || 'ATIVO'}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-200">
                    Mês: {getMesLabel(filters.mes)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-200">
                    Tipo: {feriasExportLabels.tiposExtracao[filters.tipoExtracao]}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-200">
                    Ordenação: {feriasExportLabels.ordenacao[(filters.ordenacao || 'NOME') as ExportOrdenacao]}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-200">
                    Formato: {filters.formato}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-5">
              <div className="text-sm text-slate-400">
                A exportação cruza servidores + férias e inicia o download automaticamente.
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Gerar documento
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ExportarFeriasModal;
