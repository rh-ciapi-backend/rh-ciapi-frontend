import React from 'react';
import { MousePointerClick, UserSearch } from 'lucide-react';

type Props = {
  title?: string;
  description?: string;
};

export default function FrequenciaEmptyState({
  title = 'Nenhum servidor selecionado',
  description = 'Escolha um servidor na coluna lateral para abrir a grade mensal, visualizar detalhes por dia e preparar a futura exportação da frequência oficial.',
}: Props) {
  return (
    <section className="flex min-h-[620px] items-center justify-center rounded-3xl border border-dashed border-slate-700/70 bg-slate-900/60 p-6 shadow-xl shadow-black/10 backdrop-blur-sm">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
          <UserSearch className="h-7 w-7" />
        </div>

        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-800/70 px-4 py-2 text-xs text-slate-300">
          <MousePointerClick className="h-4 w-4 text-cyan-300" />
          Selecione um servidor para começar
        </div>
      </div>
    </section>
  );
}
