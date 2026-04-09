import React from 'react';
import { FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export function MapasHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/70 p-6 md:p-8 shadow-2xl"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
            <ShieldCheck size={14} />
            Gestão de mapas
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Mapa de Frequência</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
              Consolidação institucional da frequência mensal com pré-visualização, diagnóstico minucioso e exportação
              oficial em DOCX, PDF e ZIP.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
          <div className="rounded-2xl bg-blue-500/20 p-3 text-blue-300">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Módulo institucional</p>
            <p className="text-sm font-semibold text-white">Exportação documental com validação</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
