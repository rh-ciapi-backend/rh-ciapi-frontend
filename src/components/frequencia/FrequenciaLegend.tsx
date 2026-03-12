import React from 'react';
import type { FrequenciaLegendItem } from '../../types/frequencia';
import FrequenciaStatusBadge from './FrequenciaStatusBadge';

type Props = {
  items: FrequenciaLegendItem[];
};

export default function FrequenciaLegend({ items }: Props) {
  return (
    <section className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Legenda visual</h3>
        <p className="mt-1 text-xs text-slate-400">
          Referência rápida de leitura dos status usados na grade mensal.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3"
          >
            <div className="mb-2">
              <FrequenciaStatusBadge status={item.key} label={item.label} />
            </div>
            <p className="text-xs leading-5 text-slate-400">
              {item.description || 'Status disponível na visualização mensal.'}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
