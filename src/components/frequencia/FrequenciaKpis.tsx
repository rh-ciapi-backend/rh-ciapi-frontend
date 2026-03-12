import React from 'react';
import {
  AlertTriangle,
  BriefcaseMedical,
  CalendarClock,
  CalendarRange,
  ClipboardCheck,
  FileWarning,
  Users,
} from 'lucide-react';
import type { FrequenciaKpiItem } from '../../types/frequencia';

type Props = {
  items: FrequenciaKpiItem[];
};

const ICONS = [
  Users,
  ClipboardCheck,
  AlertTriangle,
  FileWarning,
  BriefcaseMedical,
  CalendarRange,
  CalendarClock,
];

const TONE_CLASS: Record<NonNullable<FrequenciaKpiItem['tone']>, string> = {
  primary: 'border-cyan-500/20 bg-cyan-500/8 text-cyan-200',
  success: 'border-emerald-500/20 bg-emerald-500/8 text-emerald-200',
  warning: 'border-amber-500/20 bg-amber-500/8 text-amber-200',
  danger: 'border-rose-500/20 bg-rose-500/8 text-rose-200',
  info: 'border-blue-500/20 bg-blue-500/8 text-blue-200',
  neutral: 'border-slate-700/70 bg-slate-900/70 text-slate-200',
  violet: 'border-violet-500/20 bg-violet-500/8 text-violet-200',
};

export default function FrequenciaKpis({ items }: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {items.map((item, index) => {
        const Icon = ICONS[index % ICONS.length];
        const tone = item.tone || 'neutral';

        return (
          <div
            key={item.id}
            className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-4 shadow-lg shadow-black/5 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {item.hint || 'Leitura consolidada da competência'}
                </p>
              </div>

              <div
                className={[
                  'rounded-2xl border p-2.5',
                  TONE_CLASS[tone],
                ].join(' ')}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
