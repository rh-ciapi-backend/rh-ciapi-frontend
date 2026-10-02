import React, {
  useEffect,
  useState,
} from 'react';
import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Settings,
  Stethoscope,
  Users,
  X,
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
  restrictedProfessional?: boolean;
}

const MENU: Array<{
  id: SaeTab;
  label: string;
  icon: React.ElementType;
}> = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'usuarios',
    label: 'Usuários',
    icon: Users,
  },
  {
    id: 'triagem',
    label: 'Triagem',
    icon: ClipboardList,
  },
  {
    id: 'agendamentos',
    label: 'Agendamentos',
    icon: CalendarDays,
  },
  {
    id: 'atendimentos',
    label: 'Atendimentos',
    icon: Stethoscope,
  },
  {
    id: 'sinais-vitais',
    label: 'Sinais Vitais',
    icon: Activity,
  },
  {
    id: 'mapas',
    label: 'Mapas',
    icon: Map,
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    icon: BarChart3,
  },
];

export default function SaeSidebar({
  activeTab,
  onChange,
  onLogout,
  restrictedProfessional = false,
}: SaeSidebarProps) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [activeTab]);

  const handleChange = (
    tab: SaeTab,
  ) => {
    onChange(tab);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    setMobileOpen(false);
    onLogout();
  };

  const visibleMenu = restrictedProfessional
    ? MENU.filter((item) => item.id === 'relatorios' || item.id === 'mapas')
    : MENU;

  const content = (
    isMobile: boolean,
  ) => (
    <>
      <div className="border-b border-border-dark px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-bold text-white shadow-lg shadow-primary/20">
            C
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-base font-bold leading-tight text-white">
              CIAPI
            </p>

            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              SAE
            </p>
          </div>

          {isMobile && (
            <button
              type="button"
              onClick={() =>
                setMobileOpen(false)
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-dark text-slate-400 transition hover:bg-slate-800/70 hover:text-white"
              title="Fechar menu"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5 scrollbar-hide">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
          Principal
        </p>

        <nav className="space-y-1">
          {visibleMenu.map((item) => {
            const Icon = item.icon;
            const active =
              activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  handleChange(item.id)
                }
                className={[
                  'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all',
                  active
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-white',
                ].join(' ')}
              >
                <Icon size={19} />
                <span>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {!restrictedProfessional && (
          <>
            <p className="mb-3 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
              Sistema
            </p>

            <button
              type="button"
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-400 transition-all hover:bg-slate-800/70 hover:text-white"
            >
              <Settings size={19} />
              <span>
                Configurações
              </span>
            </button>
          </>
        )}
      </div>

      <div className="border-t border-border-dark p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-400 transition-all hover:bg-rose-500/10"
        >
          <LogOut size={19} />
          <span>Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setMobileOpen(true)
        }
        className="fixed left-3 top-3 z-[70] flex h-10 w-10 items-center justify-center rounded-xl border border-border-dark bg-[#101b2d]/95 text-slate-300 shadow-xl backdrop-blur transition hover:border-primary/40 hover:text-white lg:hidden"
        title="Abrir menu"
        aria-label="Abrir menu"
        aria-expanded={mobileOpen}
      >
        <Menu size={20} />
      </button>

      <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 flex-col border-r border-border-dark bg-[#101b2d] lg:flex">
        {content(false)}
      </aside>

      <div
        className={[
          'fixed inset-0 z-[80] lg:hidden',
          mobileOpen
            ? 'pointer-events-auto'
            : 'pointer-events-none',
        ].join(' ')}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() =>
            setMobileOpen(false)
          }
          className={[
            'absolute inset-0 bg-black/65 backdrop-blur-[2px] transition-opacity duration-200',
            mobileOpen
              ? 'opacity-100'
              : 'opacity-0',
          ].join(' ')}
        />

        <aside
          className={[
            'absolute inset-y-0 left-0 flex w-[min(86vw,300px)] flex-col border-r border-border-dark bg-[#101b2d] shadow-2xl transition-transform duration-300',
            mobileOpen
              ? 'translate-x-0'
              : '-translate-x-full',
          ].join(' ')}
        >
          {content(true)}
        </aside>
      </div>
    </>
  );
}
