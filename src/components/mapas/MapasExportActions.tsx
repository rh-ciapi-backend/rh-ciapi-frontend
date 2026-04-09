import React from 'react';
import { FileArchive, FileText, FileType2, ShieldCheck } from 'lucide-react';

interface Props {
  isBusy?: boolean;
  onValidate: () => void;
  onDocx: () => void;
  onPdf: () => void;
  onZip: () => void;
}

export function MapasExportActions({ isBusy, onValidate, onDocx, onPdf, onZip }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Ações do mapa</h3>
          <p className="mt-1 text-sm text-slate-400">Valide os dados antes de exportar o documento oficial.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button disabled={isBusy} onClick={onValidate} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={16} /> Validar dados</span>
          </button>
          <button disabled={isBusy} onClick={onDocx} className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-50">
            <span className="inline-flex items-center gap-2"><FileText size={16} /> Gerar DOCX</span>
          </button>
          <button disabled={isBusy} onClick={onPdf} className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-50">
            <span className="inline-flex items-center gap-2"><FileType2 size={16} /> Gerar PDF</span>
          </button>
          <button disabled={isBusy} onClick={onZip} className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-50">
            <span className="inline-flex items-center gap-2"><FileArchive size={16} /> Gerar ZIP</span>
          </button>
        </div>
      </div>
    </div>
  );
}
