import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Clock3,
  Map,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Layers3,
  Building2,
  FileText,
  Stethoscope,
} from 'lucide-react';
import ciapiLogo from './layout/ciapi_logo.png';

type AppTab =
  | 'dashboard'
  | 'servidores'
  | 'atestados'
  | 'ferias'
  | 'frequencia'
  | 'mapas'
  | 'requerimentos'
  | 'admin'
  | 'admin-usuarios'
  | 'admin-categorias'
  | 'admin-setores'
  | 'admin-logs'
  | 'diagnostico';

type SidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
};

type NavItem = {
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const mainItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'servidores', label: 'Servidores', icon: Users },
  { id: 'atestados', label: 'Atestados', icon: Stethoscope },
  { id: 'ferias', label: 'Férias', icon: CalendarDays },
  { id: 'frequencia', label: 'Frequência', icon: Clock3 },
  { id: 'mapas', label: 'Mapas', icon: Map },
  { id: 'requerimentos', label: 'Requerimentos', icon: FileText },
];

const adminItems: NavItem[] = [
  { id: 'admin', label: 'Visão Geral', icon: Shield },
  { id: 'admin-usuarios', label: 'Usuários', icon: Users },
  { id: 'admin-categorias', label: 'Categorias', icon: Layers3 },
  { id: 'admin-setores', label: 'Setores', icon: Building2 },
  { id: 'admin-logs', label: 'Logs', icon: FileText },
];

const utilityItems: NavItem[] = [
  { id: 'diagnostico', label: 'Diagnóstico', icon: Activity },
];

function isAdminTab(tab: string) {
  return (
    tab === 'admin' ||
    tab === 'admin-usuarios' ||
    tab === 'admin-categorias' ||
    tab === 'admin-setores' ||
    tab === 'admin-logs'
  );
}

function SidebarButton({
  item,
  active,
  collapsed,
  onClick,
  nested = false,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  nested?: boolean;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={[
        'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200',
        nested && !collapsed ? 'pl-5' : '',
        active
          ? 'bg-primary text-white shadow-md shadow-primary/15'
          : 'text-slate-400 hover:bg-white/[0.05] hover:text-white',
        collapsed ? 'justify-center px-2' : '',
      ].join(' ')}
    >
      <Icon
        size={18}
        className={
          active
            ? 'text-white'
            : 'text-slate-500 transition-colors group-hover:text-slate-200'
        }
      />

      {!collapsed && (
        <span className="truncate text-sm font-medium">
          {item.label}
        </span>
      )}
    </button>
  );
}

export function Sidebar({
  activeTab,
  setActiveTab,
  onLogout,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [adminOpen, setAdminOpen] = useState(isAdminTab(activeTab));

  const shouldShowAdminOpen = useMemo(() => {
    if (collapsed) return false;
    if (isAdminTab(activeTab)) return true;
    return adminOpen;
  }, [collapsed, activeTab, adminOpen]);

  const handleAdminRootClick = () => {
    if (collapsed) {
      setCollapsed(false);
      setAdminOpen(true);
      setActiveTab('admin');
      return;
    }

    setAdminOpen((prev) => !prev);

    if (!isAdminTab(activeTab)) {
      setActiveTab('admin');
    }
  };

  return (
    <aside
      className={[
        'sticky top-0 flex h-screen shrink-0 flex-col border-r border-border-dark/70 bg-[#111a2b] transition-all duration-300',
        collapsed ? 'w-[76px]' : 'w-[250px]',
      ].join(' ')}
    >
      <div className="flex h-20 items-center border-b border-border-dark/60 px-4">
        <div
          className={[
            'flex min-w-0 items-center gap-3',
            collapsed ? 'w-full justify-center' : 'flex-1',
          ].join(' ')}
        >
          <div
            className={[
              'shrink-0 overflow-hidden rounded-xl bg-white shadow-sm',
              collapsed ? 'h-9 w-9' : 'h-10 w-10',
            ].join(' ')}
          >
            <img
              src={ciapiLogo}
              alt="Logo institucional CIAPI"
              className="h-full w-full object-contain p-1"
            />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-white">
                CIAPI RH
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Gestão de Pessoas
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
            title="Recolher menu"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5 scrollbar-hide">
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Principal
          </p>
        )}

        <nav className="space-y-1">
          {mainItems.map((item) => (
            <SidebarButton
              key={item.id}
              item={item}
              active={activeTab === item.id}
              collapsed={collapsed}
              onClick={() => setActiveTab(item.id)}
            />
          ))}

          <div className="pt-5">
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Sistema
              </p>
            )}

            <button
              type="button"
              onClick={handleAdminRootClick}
              title={collapsed ? 'Administração' : undefined}
              className={[
                'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200',
                isAdminTab(activeTab)
                  ? 'bg-primary text-white shadow-md shadow-primary/15'
                  : 'text-slate-400 hover:bg-white/[0.05] hover:text-white',
                collapsed ? 'justify-center px-2' : '',
              ].join(' ')}
            >
              <Settings
                size={18}
                className={
                  isAdminTab(activeTab)
                    ? 'text-white'
                    : 'text-slate-500 group-hover:text-slate-200'
                }
              />

              {!collapsed && (
                <>
                  <span className="flex-1 truncate text-sm font-medium">
                    Administração
                  </span>

                  <ChevronRight
                    size={15}
                    className={[
                      'text-slate-500 transition-transform',
                      shouldShowAdminOpen ? 'rotate-90' : '',
                    ].join(' ')}
                  />
                </>
              )}
            </button>

            {shouldShowAdminOpen && (
              <div className="mt-1 space-y-1">
                {adminItems.map((item) => (
                  <SidebarButton
                    key={item.id}
                    item={item}
                    nested
                    active={activeTab === item.id}
                    collapsed={collapsed}
                    onClick={() => setActiveTab(item.id)}
                  />
                ))}
              </div>
            )}

            <div className="mt-1 space-y-1">
              {utilityItems.map((item) => (
                <SidebarButton
                  key={item.id}
                  item={item}
                  active={activeTab === item.id}
                  collapsed={collapsed}
                  onClick={() => setActiveTab(item.id)}
                />
              ))}
            </div>
          </div>
        </nav>
      </div>

      <div className="border-t border-border-dark/60 p-3">
        <div className="space-y-1">
          {collapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex w-full items-center justify-center rounded-xl p-2.5 text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
              title="Expandir menu"
            >
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
            >
              <ChevronLeft size={18} />
              <span className="text-sm font-medium">Recolher menu</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? 'Sair' : undefined}
            className={[
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300',
              collapsed ? 'justify-center px-2' : '',
            ].join(' ')}
          >
            <LogOut size={18} />

            {!collapsed && (
              <span className="text-sm font-medium">
                Sair
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
