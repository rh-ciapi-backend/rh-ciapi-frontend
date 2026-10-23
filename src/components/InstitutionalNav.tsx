import React, { useEffect, useRef, useState } from 'react';
import {
  Activity, CalendarDays, ChevronDown, ClipboardList, Clock3, FileText,
  HeartPulse, Home, LogOut, Map, Menu, Settings, Stethoscope, Users, X,
  UserPlus, ListFilter, UserRound, Layers3, Building2, ScrollText,
  BarChart3, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './institutional-horizontal-nav.css';

type NavTarget = { label: string; tab: string; action?: string; icon: React.ElementType };
type NavGroup = { id: string; label: string; icon: React.ElementType; target?: NavTarget; children?: NavTarget[] };

// Every destination maps to an existing App.tsx tab. No new API endpoints or data tables.
const groups: NavGroup[] = [
  { id: 'dashboard', label: 'Início', icon: Home, target: { label: 'Dashboard', tab: 'dashboard', icon: Home } },
  { id: 'servidores', label: 'Servidores', icon: Users, children: [
    { label: 'Consultar servidores', tab: 'servidores', icon: Users },
    { label: 'Novo servidor', tab: 'servidores', action: 'add', icon: UserPlus },
    { label: 'Categorias', tab: 'admin-categorias', icon: Layers3 },
    { label: 'Setores / Lotação', tab: 'admin-setores', icon: Building2 },
  ]},
  { id: 'frequencia', label: 'Frequência', icon: Clock3, children: [
    { label: 'Frequência mensal', tab: 'frequencia', icon: Clock3 },
    { label: 'Faltas e registros', tab: 'frequencia', icon: ListFilter },
    { label: 'Atestados', tab: 'atestados', icon: Stethoscope },
  ]},
  { id: 'ferias', label: 'Férias', icon: CalendarDays, children: [
    { label: 'Plano de férias', tab: 'ferias', icon: CalendarDays },
    { label: 'Consultar períodos', tab: 'ferias', icon: ListFilter },
  ]},
  { id: 'mapas', label: 'Mapas', icon: Map, children: [
    { label: 'Mapas de servidores', tab: 'mapas', icon: Map },
    { label: 'Modelos e exportações', tab: 'mapas', icon: FileText },
  ]},
  { id: 'atestados', label: 'Atestados', icon: Stethoscope, target: { label: 'Gestão de atestados', tab: 'atestados', icon: Stethoscope } },
  { id: 'requerimentos', label: 'Requerimentos', icon: ClipboardList, target: { label: 'Requerimentos', tab: 'requerimentos', icon: ClipboardList } },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3, children: [
    { label: 'Indicadores e dashboard', tab: 'dashboard', icon: BarChart3 },
    { label: 'Mapas e relatórios', tab: 'mapas', icon: FileText },
    { label: 'Frequência / exportações', tab: 'frequencia', icon: Clock3 },
    { label: 'Férias / exportações', tab: 'ferias', icon: CalendarDays },
  ]},
  { id: 'admin', label: 'Administração', icon: Settings, children: [
    { label: 'Visão geral', tab: 'admin', icon: Settings },
    { label: 'Usuários', tab: 'admin-usuarios', icon: UserRound },
    { label: 'Categorias', tab: 'admin-categorias', icon: Layers3 },
    { label: 'Setores', tab: 'admin-setores', icon: Building2 },
    { label: 'Logs', tab: 'admin-logs', icon: ScrollText },
    { label: 'Diagnóstico', tab: 'diagnostico', icon: Activity },
  ]},
  { id: 'diagnostico', label: 'Diagnóstico', icon: Activity, target: { label: 'Diagnóstico', tab: 'diagnostico', icon: Activity } },
];

const adminTabs = new Set(['admin', 'admin-usuarios', 'admin-categorias', 'admin-setores', 'admin-logs']);
export function InstitutionalNav({ activeTab, selectedModule, onOpenModule, onNavigate, onLogout }: {
  activeTab: string;
  selectedModule?: string;
  onOpenModule?: (module: string, tab: string) => void;
  onNavigate: (tab: string, action?: string) => void;
  onLogout: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const { acesso, setAmbiente } = useAuth();
  const allowedSAE = Boolean(acesso?.ambientes_permitidos?.includes('SAE'));
  const isMaster = Boolean(acesso?.is_master || acesso?.perfil === 'MASTER');
  const isAdmin = isMaster || acesso?.perfil === 'ADMINISTRADOR';

  useEffect(() => { setExpanded(null); setMobileOpen(false); }, [activeTab]);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setExpanded(null);
    };
    const esc = (event: KeyboardEvent) => { if (event.key === 'Escape') { setExpanded(null); setMobileOpen(false); } };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', esc); };
  }, []);

  const select = (item: NavTarget) => {
    onNavigate(item.tab, item.action);
    setExpanded(null);
    setMobileOpen(false);
  };
  const groupActive = (g: NavGroup) => (selectedModule || activeTab) === g.id ||
    (g.id === 'admin' && adminTabs.has(activeTab)) ||
    (g.id !== 'relatorios' && Boolean(g.children?.some(i => i.tab === activeTab)));

  return (
    <nav ref={root} className="ciapi-hnav" aria-label="Navegação principal do CIAPI RH">
      <div className="ciapi-hnav__inner">
        <button type="button" className="ciapi-hnav__mobile-toggle" aria-expanded={mobileOpen}
          onClick={() => { setMobileOpen(!mobileOpen); setExpanded(null); }}>
          {mobileOpen ? <X size={19} /> : <Menu size={19} />} Menu do sistema
        </button>
        <div className={`ciapi-hnav__items${mobileOpen ? ' ciapi-hnav__items--open' : ''}`}>
          {groups.filter(g => g.id !== 'admin' || isAdmin).map(g => {
            const Icon = g.icon;
            const visible = expanded === g.id;
            return <div className="ciapi-hnav__group" key={g.id}>
              <button className={`ciapi-hnav__trigger${groupActive(g) ? ' ciapi-hnav__trigger--active' : ''}`}
                type="button" aria-expanded={g.children ? visible : undefined}
                aria-haspopup={g.children ? 'menu' : undefined}
                onClick={() => {
                  if (onOpenModule) {
                    const tab = g.id === 'relatorios' ? 'dashboard' : g.id;
                    onOpenModule(g.id, tab);
                    setExpanded(null); setMobileOpen(false);
                  } else if (g.children) setExpanded(visible ? null : g.id);
                  else if (g.target) select(g.target);
                }}>
                <Icon size={16} aria-hidden="true"/><span>{g.label}</span>{g.children && <ChevronDown size={13} aria-hidden="true"/>}
              </button>
              {g.children && !onOpenModule && visible && <div className="ciapi-hnav__dropdown" role="menu" aria-label={g.label}>
                {g.children.map((item, index) => {
                  const ItemIcon = item.icon;
                  return <button key={`${item.tab}-${index}`} role="menuitem" type="button" onClick={() => select(item)}>
                    <ItemIcon size={15} aria-hidden="true"/><span>{item.label}</span>
                  </button>;
                })}
              </div>}
            </div>;
          })}
          {allowedSAE && <button type="button" className="ciapi-hnav__trigger ciapi-hnav__sae"
            onClick={() => { setExpanded(null); setMobileOpen(false); setAmbiente('sae'); }}>
            <HeartPulse size={16}/> Ambiente SAE
          </button>}
          <button type="button" className="ciapi-hnav__trigger ciapi-hnav__logout" onClick={onLogout}>
            <LogOut size={16}/> Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
