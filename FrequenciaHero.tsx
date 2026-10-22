import React from 'react';
import { CalendarDays, ShieldCheck, Sparkles } from 'lucide-react';

interface Props {
  mesLabel: string;
  totalServidores: number;
}

export default function FrequenciaHero({ mesLabel, totalServidores }: Props) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.15),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_35%)]" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            <Sparkles className="h-4 w-4" />
            Gestão de frequência
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Controle mensal de frequência com visual moderno, leitura rápida e base pronta para exportação oficial
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
            Acompanhe servidores, selecione o mês, visualize a grade diária e inspecione cada ocorrência sem perder a
            compatibilidade com o fluxo real do CIAPI RH.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
              <CalendarDays className="h-4 w-4" />
              Competência
            </div>
            <div className="text-lg font-semibold text-white">{mesLabel}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
              <ShieldCheck className="h-4 w-4" />
              Servidores carregados
            </div>
            <div className="text-lg font-semibold text-white">{totalServidores}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
