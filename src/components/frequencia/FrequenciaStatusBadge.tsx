import React from 'react';
import type { FrequenciaDayStatus } from '../../types/frequencia';

type Props = {
  status: FrequenciaDayStatus;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
};

const STATUS_META: Record<
  FrequenciaDayStatus,
  {
    label: string;
    container: string;
    dot: string;
  }
> = {
  dia_util: {
    label: 'Dia útil',
    container:
      'border-slate-700/70 bg-slate-800/80 text-slate-200',
    dot: 'bg-slate-300',
  },
  sabado: {
    label: 'Sábado',
    container:
      'border-sky-700/50 bg-sky-500/10 text-sky-300',
    dot: 'bg-sky-400',
  },
  domingo: {
    label: 'Domingo',
    container:
      'border-indigo-700/50 bg-indigo-500/10 text-indigo-300',
    dot: 'bg-indigo-400',
  },
  feriado: {
    label: 'Feriado',
    container:
      'border-violet-700/50 bg-violet-500/10 text-violet-300',
    dot: 'bg-violet-400',
  },
  ponto_facultativo: {
    label: 'Ponto facultativo',
    container:
      'border-fuchsia-700/50 bg-fuchsia-500/10 text-fuchsia-300',
    dot: 'bg-fuchsia-400',
  },
  ferias: {
    label: 'Férias',
    container:
      'border-emerald-700/50 bg-emerald-500/10 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  atestado: {
    label: 'Atestado',
    container:
      'border-cyan-700/50 bg-cyan-500/10 text-cyan-300',
    dot: 'bg-cyan-400',
  },
  falta: {
    label: 'Falta',
    container:
      'border-rose-700/50 bg-rose-500/10 text-rose-300',
    dot: 'bg-rose-400',
  },
  pendencia: {
    label: 'Pendência',
    container:
      'border-amber-700/50 bg-amber-500/10 text-amber-300',
    dot: 'bg-amber-400',
  },
  ocorrencia: {
    label: 'Ocorrência',
    container:
      'border-blue-700/50 bg-blue-500/10 text-blue-300',
    dot: 'bg-blue-400',
  },
};

export default function FrequenciaStatusBadge({
  status,
  label,
  size = 'sm',
  className = '',
}: Props) {
  const meta = STATUS_META[status];
  const sizeClass =
    size === 'md'
      ? 'px-3 py-1.5 text-[12px]'
      : 'px-2.5 py-1 text-[11px]';

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border font-medium backdrop-blur-sm',
        meta.container,
        sizeClass,
        className,
      ].join(' ')}
    >
      <span className={['h-1.5 w-1.5 rounded-full', meta.dot].join(' ')} />
      <span>{label || meta.label}</span>
    </span>
  );
}
