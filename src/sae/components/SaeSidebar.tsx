import React from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarDays,
  Stethoscope,
  Activity,
  Map,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';

export type SaeTab =
  | 'dashboard'
  | 'usuarios'
  | 'triagem'
  | 'agendamentos'
  | 'atendimentos'
  | 'sinais-vitais'
  | 'mapas'
  | 'relatorios';

interface SaeSidebarProps {
  activeTab: SaeTab;
  onChange: (tab: SaeTab) => void;
  onLogout: () => void;
}

const MENU: Array<{
  id: SaeTab;
  label: string;
  icon: React.ElementType;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'usuarios', label: 'Usuários', icon: Users },
  { id: 'triagem', label: 'Triagem', icon: ClipboardList },
  { id: 'agendamentos', label: 'Agendamentos', icon: CalendarDays },
  { id: 'atendimentos', label: 'Atendimentos', icon: Stethoscope },
  { id: 'sinais-vitais', label: 'Sinais Vitais', icon: Activity },
  { id: 'mapas', label: 'Mapas', icon: Map },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
];

export default function SaeSidebar({
  activeTab,
  onChange,
  onLogout,
}: SaeSidebarProps) {
  return (
    <aside className="sticky top-0 flex h-screen w-[250px] shrink-0 flex-col border-r border-border-dark bg-[#101b2d]">
      <div className="border-b border-border-dark px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-xl font-bold text-white shadow-lg shadow-primary/20">
            C
          </div>

          <div className="min-w-0">
            <p className="text-base font-bold leading-tight text-white">
              CIAPI
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              SAE
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
          Principal
        </p>

        <nav className="space-y-1">
          {MENU.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={[
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all',
                  active
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white',
                ].join(' ')}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <p className="mb-3 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
          Sistema
        </p>

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-400 transition-all hover:bg-slate-800/70 hover:text-white"
        >
          <Settings size={19} />
          <span>Configurações</span>
        </button>
      </div>

      <div className="border-t border-border-dark p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-400 transition-all hover:bg-rose-500/10"
        >
          <LogOut size={19} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
