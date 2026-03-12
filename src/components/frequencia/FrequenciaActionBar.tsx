import React from 'react';
import {
  Copy,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  FileText,
  Import,
  PlusCircle,
  Trash2,
} from 'lucide-react';

type Props = {
  disabled?: boolean;
  onLaunch?: () => void;
  onEdit?: () => void;
  onReplicate?: () => void;
  onClear?: () => void;
  onImport?: () => void;
  onPreview?: () => void;
  onExportDocx?: () => void;
  onExportPdf?: () => void;
  onExportCsv?: () => void;
};

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  tone = 'neutral',
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'neutral' | 'primary' | 'danger' | 'success';
}) {
  const toneClass =
    tone === 'primary'
      ? 'border-cyan-500/30 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/20'
      : tone === 'danger'
      ? 'border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15'
      : tone === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
      : 'border-slate-700/70 bg-slate-800/70 text-slate-100 hover:border-slate-600';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition',
        toneClass,
        disabled ? 'cursor-not-allowed opacity-50' : '',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export default function FrequenciaActionBar({
  disabled,
  onLaunch,
  onEdit,
  onReplicate,
  onClear,
  onImport,
  onPreview,
  onExportDocx,
  onExportPdf,
  onExportCsv,
}: Props) {
  return (
    <section className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Barra de ações</h3>
        <p className="mt-1 text-xs text-slate-400">
          Ações operacionais do mês e atalhos para evolução futura da exportação oficial.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <ActionButton
          label="Lançar frequência"
          icon={PlusCircle}
          onClick={onLaunch}
          disabled={disabled}
          tone="primary"
        />
        <ActionButton
          label="Editar dia"
          icon={Edit3}
          onClick={onEdit}
          disabled={disabled}
        />
        <ActionButton
          label="Replicar informação"
          icon={Copy}
          onClick={onReplicate}
          disabled={disabled}
        />
        <ActionButton
          label="Limpar lançamento"
          icon={Trash2}
          onClick={onClear}
          disabled={disabled}
          tone="danger"
        />
        <ActionButton
          label="Importar dados"
          icon={Import}
          onClick={onImport}
          tone="success"
        />

        <ActionButton
          label="Visualizar prévia"
          icon={Eye}
          onClick={onPreview}
          disabled={disabled}
        />
        <ActionButton
          label="Exportar DOCX"
          icon={FileText}
          onClick={onExportDocx}
          disabled={disabled}
        />
        <ActionButton
          label="Exportar PDF"
          icon={Download}
          onClick={onExportPdf}
          disabled={disabled}
        />
        <ActionButton
          label="Exportar CSV"
          icon={FileSpreadsheet}
          onClick={onExportCsv}
          disabled={disabled}
        />
      </div>
    </section>
  );
}
