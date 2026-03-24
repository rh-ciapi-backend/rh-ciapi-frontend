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
  exact?: boolean;
};

const mainItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'servidores', label: 'Servidores', icon: Users },
  { id: 'atestados', label: 'Atestados', icon: Stethoscope },
  { id: 'ferias', label: 'Férias', icon: CalendarDays },
  { id: 'frequencia', label: 'Frequência', icon: Clock3 },
  { id: 'mapas', label: 'Mapas', icon: Map },
];

const adminItems: NavItem[] = [
  { id: 'admin', label: 'Visão Geral', icon: Shield },
  { id: 'admin-usuarios', label: 'Usuários', icon: Users },
  { id: 'admin-categorias', label: 'Categorias', icon: Layers3 },
  { id: 'admin-setores', label: 'Setores', icon: Building2 },
  { id: 'admin-logs', label: 'Logs', icon: FileText },
];

const utilityItems: NavItem[] = [{ id: 'diagnostico', label: 'Diagnóstico', icon: Activity }];

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
        'group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200',
        nested ? 'ml-2' : '',
        active
          ? 'border-primary/30 bg-primary text-white shadow-lg shadow-primary/20'
          : 'border-transparent bg-transparent text-slate-300 hover:border-border-dark hover:bg-slate-800/60 hover:text-white',
        collapsed ? 'justify-center px-2' : '',
      ].join(' ')}
    >
      <Icon
        size={18}
        className={active ? 'text-white' : 'text-slate-400 group-hover:text-white'}
      />
      {!collapsed && <span className="truncate text-sm font-semibold">{item.label}</span>}
    </button>
  );
}

export function Sidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
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
        'flex min-h-screen flex-col border-r border-border-dark bg-[#16233a] transition-all duration-300',
        collapsed ? 'w-[88px]' : 'w-[280px]',
      ].join(' ')}
    >
      <div className="flex items-center justify-between border-b border-border-dark px-4 py-5">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
          <div
            className={[
              'overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20',
              collapsed ? 'h-10 w-10' : 'h-12 w-12',
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
              <div className="truncate text-lg font-extrabold tracking-tight text-white">
                CIAPI RH
              </div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Painel Administrativo
              </div>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="rounded-xl border border-border-dark bg-slate-800/60 p-2 text-slate-400 transition hover:text-white"
            title="Recolher menu"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-2">
          {mainItems.map((item) => (
            <SidebarButton
              key={item.id}
              item={item}
              active={activeTab === item.id}
              collapsed={collapsed}
              onClick={() => setActiveTab(item.id)}
            />
          ))}

          <div className="pt-3">
            <button
              type="button"
              onClick={handleAdminRootClick}
              title={collapsed ? 'Administração' : undefined}
              className={[
                'group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200',
                isAdminTab(activeTab)
                  ? 'border-primary/30 bg-primary text-white shadow-lg shadow-primary/20'
                  : 'border-transparent bg-transparent text-slate-300 hover:border-border-dark hover:bg-slate-800/60 hover:text-white',
                collapsed ? 'justify-center px-2' : '',
              ].join(' ')}
            >
              <Settings
                size={18}
                className={
                  isAdminTab(activeTab) ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }
              />

              {!collapsed && (
                <>
                  <span className="flex-1 truncate text-sm font-semibold">Administração</span>
                  <ChevronRight
                    size={16}
                    className={`transition-transform ${shouldShowAdminOpen ? 'rotate-90' : ''}`}
                  />
                </>
              )}
            </button>

            {shouldShowAdminOpen && (
              <div className="mt-2 space-y-2">
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
          </div>

          <div className="pt-3">
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
        </nav>
      </div>

      <div className="border-t border-border-dark px-3 py-4">
        <div className="space-y-2">
          {collapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex w-full items-center justify-center rounded-2xl border border-border-dark bg-slate-800/60 p-3 text-slate-300 transition hover:text-white"
              title="Expandir menu"
            >
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border-dark bg-slate-800/40 px-3 py-3 text-slate-300 transition hover:text-white"
            >
              <ChevronLeft size={18} />
              <span className="text-sm font-semibold">Recolher</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? 'Sair' : undefined}
            className={[
              'flex w-full items-center gap-3 rounded-2xl border border-rose-500/10 bg-transparent px-3 py-3 text-rose-400 transition hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-300',
              collapsed ? 'justify-center px-2' : '',
            ].join(' ')}
          >
            <LogOut size={18} />
            {!collapsed && <span className="text-sm font-semibold">Sair</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
