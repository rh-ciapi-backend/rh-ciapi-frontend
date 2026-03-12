import React from 'react';
import { FREQUENCIA_STATUS_META } from '../../types/frequencia';

const ORDER = [
  'presente',
  'falta',
  'atestado',
  'ferias',
  'feriado',
  'ponto_facultativo',
  'fim_de_semana',
  'aniversario',
  'evento',
  'sem_registro',
] as const;

export default function FrequenciaLegend() {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
      <div className="mb-4 text-sm font-semibold text-white">Legenda da competência</div>
      <div className="flex flex-wrap gap-2">
        {ORDER.map((key) => {
          const item = FREQUENCIA_STATUS_META[key];
          return (
            <span
              key={item.key}
              className={[
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
                item.chipClassName,
              ].join(' ')}
            >
              <span className={['h-2 w-2 rounded-full', item.dotClassName].join(' ')} />
              {item.label}
            </span>
          );
        })}
      </div>
    </section>
  );
}
