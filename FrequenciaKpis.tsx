import React from 'react';
import { AlertTriangle, BriefcaseBusiness, FileText, Hospital, Plane, Users } from 'lucide-react';
import type { FrequenciaKpisData } from '../../types/frequencia';

interface Props {
  data: FrequenciaKpisData;
}

const items = (data: FrequenciaKpisData) => [
  {
    label: 'Servidores',
    value: data.totalServidores,
    icon: Users,
    tone: 'from-cyan-500/15 to-cyan-400/5 text-cyan-300',
  },
  {
    label: 'Ativos',
    value: data.servidoresAtivos,
    icon: BriefcaseBusiness,
    tone: 'from-emerald-500/15 to-emerald-400/5 text-emerald-300',
  },
  {
    label: 'Faltas',
    value: data.totalFaltas,
    icon: AlertTriangle,
    tone: 'from-rose-500/15 to-rose-400/5 text-rose-300',
  },
  {
    label: 'Atestados',
    value: data.totalAtestados,
    icon: Hospital,
    tone: 'from-amber-500/15 to-amber-400/5 text-amber-300',
  },
  {
    label: 'Férias',
    value: data.totalFerias,
    icon: Plane,
    tone: 'from-sky-500/15 to-sky-400/5 text-sky-300',
  },
  {
    label: 'Sem registro',
    value: data.totalSemRegistro,
    icon: FileText,
    tone: 'from-slate-500/15 to-slate-400/5 text-slate-300',
  },
];

export default function FrequenciaKpis({ data }: Props) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {items(data).map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className={`rounded-3xl border border-white/10 bg-gradient-to-br ${item.tone} p-5 shadow-lg shadow-black/20`}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.label}</span>
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-3xl font-bold text-white">{item.value}</div>
          </div>
        );
      })}
    </section>
  );
}
