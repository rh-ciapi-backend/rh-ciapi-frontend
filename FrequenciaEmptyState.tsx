import React from 'react';
import { DatabaseZap } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
}

export default function FrequenciaEmptyState({
  title = 'Nenhum dado disponível para esta competência',
  description = 'Não foi possível montar a frequência com os filtros atuais. Verifique mês, ano e disponibilidade dos dados.',
}: Props) {
  return (
    <section className="rounded-3xl border border-dashed border-white/10 bg-slate-900/50 p-10 text-center shadow-xl shadow-black/20">
      <DatabaseZap className="mx-auto mb-4 h-10 w-10 text-slate-500" />
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">{description}</p>
    </section>
  );
}
