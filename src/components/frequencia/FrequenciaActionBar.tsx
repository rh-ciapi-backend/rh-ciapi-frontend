import React from 'react';
import {
  BrushCleaning,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  PenSquare,
  PlusCircle,
  RefreshCw,
  Upload,
} from 'lucide-react';
import type { FrequenciaActionBarProps, FrequenciaActionKey } from '../../types/frequencia';

interface ActionItem {
  key: FrequenciaActionKey;
  label: string;
  tone: string;
  icon: React.ComponentType<{ className?: string }>;
}

const primaryActions: ActionItem[] = [
  {
    key: 'lancar',
    label: 'Lançar frequência',
    tone: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15',
    icon: PlusCircle,
  },
  {
    key: 'editar',
    label: 'Editar dia',
    tone: 'border-amber-500/20 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15',
    icon: PenSquare,
  },
  {
    key: 'replicar',
    label: 'Replicar informação',
    tone: 'border-violet-500/20 bg-violet-500/10 text-violet-200 hover:bg-violet-500/15',
    icon: Copy,
  },
  {
    key: 'limpar',
    label: 'Limpar lançamento',
    tone: 'border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15',
    icon: BrushCleaning,
  },
  {
    key: 'importar',
    label: 'Importar dados do mês',
    tone: 'border-sky-500/20 bg-sky-500/10 text-sky-200 hover:bg-sky-500/15',
    icon: Upload,
  },
  {
    key: 'previa',
    label: 'Visualizar prévia',
    tone: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/15',
    icon: Eye,
  },
];

const exportActions: ActionItem[] = [
  {
    key: 'export-docx',
    label: 'Exportar DOCX',
    tone: 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]',
    icon: FileText,
  },
  {
    key: 'export-pdf',
    label: 'Exportar PDF',
    tone: 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]',
    icon: Download,
  },
  {
    key: 'export-csv',
    label: 'Exportar CSV',
    tone: 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]',
    icon: FileSpreadsheet,
  },
];

export default function FrequenciaActionBar({
  disabled = false,
  exporting = false,
  onRefresh,
  onAction,
}: FrequenciaActionBarProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Ações da frequência</h2>
            <p className="mt-1 text-xs text-slate-400">
              Os botões já estão blindados para continuidade. O que ainda não tiver backend usa fallback seguro sem derrubar a tela.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={disabled || exporting}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${exporting ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {primaryActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                type="button"
                onClick={() => onAction(action.key)}
                disabled={disabled || exporting}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${action.tone}`}
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {exportActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                type="button"
                onClick={() => onAction(action.key)}
                disabled={disabled || exporting}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${action.tone}`}
              >
                <Icon className="h-4 w-4" />
                {exporting ? 'Processando...' : action.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
