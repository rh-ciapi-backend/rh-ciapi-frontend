import React from 'react';
import { FREQUENCIA_STATUS_META, type FrequenciaDayStatus } from '../../types/frequencia';

interface Props {
  status: FrequenciaDayStatus;
  label?: string;
  small?: boolean;
  className?: string;
}

export default function FrequenciaStatusBadge({
  status,
  label,
  small = false,
  className = '',
}: Props) {
  const meta = FREQUENCIA_STATUS_META[status] || FREQUENCIA_STATUS_META.sem_registro;

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border font-medium',
        small ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
        meta.chipClassName,
        className,
      ].join(' ')}
    >
      <span className={['h-2 w-2 rounded-full', meta.dotClassName].join(' ')} />
      <span>{label || meta.label}</span>
    </span>
  );
}
