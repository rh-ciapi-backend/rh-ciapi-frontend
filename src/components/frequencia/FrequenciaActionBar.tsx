import React from 'react';
import { Download, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react';
import type { FrequenciaActionBarProps, FrequenciaExportFormat } from '../../types/frequencia';

export default function FrequenciaActionBar({
  disabled = false,
  exporting = false,
  onRefresh,
  onExport,
}: FrequenciaActionBarProps) {
  const buttons: Array<{
    label: string;
    format: FrequenciaExportFormat;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { label: 'Exportar DOCX', format: 'docx', icon: FileText },
    { label: 'Exportar PDF', format: 'pdf', icon: Download },
    { label: 'Exportar CSV', format: 'csv', icon: FileSpreadsheet },
  ];

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Ações da frequência</h2>
          <p className="mt-1 text-xs text-slate-400">
            Atualize os dados ou exporte a competência selecionada quando desejar.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={disabled || exporting}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={['h-4 w-4', exporting ? 'animate-spin' : ''].join(' ')} />
            Atualizar
          </button>

          {buttons.map((button) => {
            const Icon = button.icon;

            return (
              <button
                key={button.format}
                type="button"
                onClick={() => onExport(button.format)}
                disabled={disabled || exporting}
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon className="h-4 w-4" />
                {exporting ? 'Exportando...' : button.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
