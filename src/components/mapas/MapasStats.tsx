import React from 'react';
import { AlertTriangle, CheckCircle2, FileWarning, Users } from 'lucide-react';
import { MapaStats } from '../../types/mapas';

interface Props {
  stats: MapaStats;
}

const cards = [
  { key: 'totalServidores', label: 'Servidores encontrados', icon: Users },
  { key: 'totalPendencias', label: 'Pendências', icon: AlertTriangle },
  { key: 'totalComObservacao', label: 'Com observação', icon: FileWarning },
  { key: 'totalAptosExportacao', label: 'Aptos para exportação', icon: CheckCircle2 },
] as const;

export function MapasStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ key, label, icon: Icon }) => (
        <div key={key} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-3 text-3xl font-bold text-white">{stats[key]}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-cyan-300">
              <Icon size={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
