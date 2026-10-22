import React, { useState } from 'react';
import { Activity, ChevronDown, ClipboardList, FileText, Home, LogOut, Map, Menu, Settings, Stethoscope, Users, CalendarDays, Clock3, X, HeartPulse } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Item = { id: string; label: string; icon: React.ElementType };
const primary: Item[] = [
  { id: 'dashboard', label: 'Início', icon: Home },
  { id: 'servidores', label: 'Servidores', icon: Users },
  { id: 'frequencia', label: 'Frequência', icon: Clock3 },
  { id: 'ferias', label: 'Férias', icon: CalendarDays },
  { id: 'mapas', label: 'Mapas', icon: Map },
  { id: 'atestados', label: 'Atestados', icon: Stethoscope },
  { id: 'requerimentos', label: 'Requerimentos', icon: ClipboardList },
];
const admin: Item[] = [
  { id: 'admin', label: 'Administração', icon: Settings },
  { id: 'admin-usuarios', label: 'Usuários', icon: Users },
  { id: 'admin-categorias', label: 'Categorias', icon: FileText },
  { id: 'admin-setores', label: 'Setores', icon: FileText },
  { id: 'admin-logs', label: 'Logs', icon: FileText },
  { id: 'diagnostico', label: 'Diagnóstico', icon: Activity },
];
export function InstitutionalNav({ activeTab, onNavigate, onLogout }: { activeTab: string; onNavigate: (tab: string) => void; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const { acesso, setAmbiente } = useAuth();
  const permittedSAE = acesso?.ambientes_permitidos.includes('SAE') ?? false;
  const navigate = (id: string) => { onNavigate(id); setOpen(false); setAdminOpen(false); };
  return <nav className="institutional-nav" aria-label="Menu principal do RH">
    <div className="institutional-nav__inner">
      <button type="button" className="institutional-nav__toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Alternar menu">{open ? <X size={19}/> : <Menu size={19}/>} Menu</button>
      <div className={`institutional-nav__links ${open ? 'is-open' : ''}`}>
        {primary.map(({id,label,icon:Icon}) => <button type="button" key={id} className={activeTab===id?'is-active':''} onClick={() => navigate(id)} aria-current={activeTab===id?'page':undefined}><Icon size={16}/>{label}</button>)}
        <div className="institutional-nav__group"><button type="button" className={admin.some(i=>i.id===activeTab)?'is-active':''} onClick={() => setAdminOpen(!adminOpen)} aria-expanded={adminOpen}><Settings size={16}/> Administração <ChevronDown size={14}/></button>
          {adminOpen && <div className="institutional-nav__dropdown">{admin.map(({id,label,icon:Icon}) => <button key={id} type="button" onClick={() => navigate(id)}><Icon size={15}/>{label}</button>)}</div>}
        </div>
        {permittedSAE && <button type="button" onClick={() => setAmbiente('sae')}><HeartPulse size={16}/> Abrir SAE</button>}
        <button type="button" className="institutional-nav__exit" onClick={onLogout}><LogOut size={16}/> Sair</button>
      </div>
    </div>
  </nav>;
}
