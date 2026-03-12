import React from 'react';
import {
  CalendarDays,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Sparkles,
} from 'lucide-react';

type Props = {
  mesLabel: string;
  ano: number;
  onPreview?: () => void;
  onExportDocx?: () => void;
  onExportPdf?: () => void;
  onExportCsv?: () => void;
};

export default function FrequenciaHero({
  mesLabel,
  ano,
  onPreview,
  onExportDocx,
  onExportPdf,
  onExportCsv,
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 shadow-2xl shadow-cyan-950/20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_24%)]" />
      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            <Sparkles className="h-4 w-4" />
            Painel premium de controle mensal
          </div>

          <div className="flex items-start gap-4">
            <div className="hidden rounded-2xl border border-slate-700/60 bg-slate-800/60 p-3 text-cyan-300 lg:flex">
              <CalendarDays className="h-8 w-8" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Gestão de Frequência
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Controle mensal de frequência com visão operacional moderna,
                leitura clara por servidor, destaque de rubrica e ocorrência e
                base pronta para evolução da exportação oficial individual.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-slate-700/70 bg-slate-800/70 px-3 py-1">
                  Competência: {mesLabel} / {ano}
                </span>
                <span className="rounded-full border border-slate-700/70 bg-slate-800/70 px-3 py-1">
                  CIAPI RH
                </span>
                <span className="rounded-full border border-slate-700/70 bg-slate-800/70 px-3 py-1">
                  Estrutura pronta para DOCX / PDF / CSV
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:min-w-[520px]">
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-800/70 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-500/30 hover:bg-slate-800"
          >
            <Eye className="h-4 w-4" />
            Prévia
          </button>

          <button
            type="button"
            onClick={onExportDocx}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/15"
          >
            <FileText className="h-4 w-4" />
            Exportar DOCX
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-200 transition hover:bg-blue-500/15"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/15"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>
    </section>
  );
}
