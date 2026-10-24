import React from 'react';
import { PanelLeftClose, PanelLeftOpen, Search, Users, CalendarDays, Map, Clock3, FileText, Settings, Stethoscope, ClipboardList } from 'lucide-react';

type Entry = { label:string; tab:string; action?:string };
const sections: Record<string,{title:string; entries:Entry[]}> = {
  servidores:{title:'Servidores',entries:[{label:'Pesquisar servidores',tab:'servidores',action:'open'},{label:'Novo servidor',tab:'servidores',action:'add'},{label:'Painel de Pessoal',tab:'servidores',action:'painel-pessoal'}]},
  frequencia:{title:'Frequência',entries:[{label:'Consultar frequência',tab:'frequencia',action:'open'},{label:'Faltas T1 / T2',tab:'frequencia',action:'open'},{label:'Atestados',tab:'atestados',action:'open'},{label:'Mapas / Exportações',tab:'frequencia',action:'open'}]},
  ferias:{title:'Férias',entries:[{label:'Pesquisar férias',tab:'ferias',action:'open'},{label:'Plano de férias',tab:'ferias',action:'open'},{label:'Férias não marcadas',tab:'ferias',action:'open'},{label:'Períodos registrados',tab:'ferias',action:'open'},{label:'Exportar férias',tab:'ferias',action:'open'}]},
  mapas:{title:'Mapas',entries:[{label:'Mapa de frequência',tab:'mapas',action:'open'},{label:'Mapa SESAU',tab:'mapas',action:'open'},{label:'Mapa padrão',tab:'mapas',action:'open'},{label:'Mapas por categoria / setor',tab:'mapas',action:'open'},{label:'Exportar mapas',tab:'mapas',action:'open'}]},
  atestados:{title:'Atestados',entries:[{label:'Consultar atestados',tab:'atestados',action:'open'},{label:'Lançamentos',tab:'atestados',action:'open'}]},
  requerimentos:{title:'Requerimentos',entries:[{label:'Consultar requerimentos',tab:'requerimentos',action:'open'},{label:'Recebidos',tab:'requerimentos',action:'open'}]},
  relatorios:{title:'Relatórios',entries:[{label:'Indicadores',tab:'dashboard',action:'open'},{label:'Mapas e relatórios',tab:'mapas',action:'open'},{label:'Frequência',tab:'frequencia',action:'open'},{label:'Férias',tab:'ferias',action:'open'}]},
  admin:{title:'Administração',entries:[{label:'Painel administrativo',tab:'admin',action:'open'},{label:'Usuários',tab:'admin-usuarios',action:'open'},{label:'Setores',tab:'admin-setores',action:'open'},{label:'Logs',tab:'admin-logs',action:'open'}]},
  diagnostico:{title:'Diagnóstico',entries:[{label:'Diagnóstico do sistema',tab:'diagnostico',action:'open'}]},
};
const icons: Record<string,React.ElementType> = {servidores:Users,frequencia:Clock3,ferias:CalendarDays,mapas:Map,atestados:Stethoscope,requerimentos:ClipboardList,relatorios:FileText,admin:Settings,diagnostico:Search};
export function ContextualModuleMenu({module,activeTab,collapsed,onToggle,onSelect,isAdmin}:{module:string;activeTab:string;collapsed:boolean;onToggle:()=>void;onSelect:(tab:string,action?:string)=>void;isAdmin:boolean}){
  const section=sections[module]; if(!section) return null;
  const Icon=icons[module]||Search;
  const entries=section.entries.filter(e=>isAdmin || !e.tab.startsWith('admin-'));
  return <aside className={`ciapi-side${collapsed?' ciapi-side--collapsed':''}`} aria-label={`Opções de ${section.title}`}>
    <div className="ciapi-side__heading"><Icon size={20}/>{!collapsed&&<strong>{section.title}</strong>}<button type="button" onClick={onToggle} aria-label={collapsed?'Expandir menu':'Recolher menu'}>{collapsed?<PanelLeftOpen size={17}/>:<PanelLeftClose size={17}/>}</button></div>
    {!collapsed&&<div className="ciapi-side__items">{entries.map((entry,i)=><button key={`${entry.tab}-${i}`} type="button" className={'ciapi-side__item'} onClick={()=>onSelect(entry.tab,entry.action)}>{entry.label}<span aria-hidden="true">›</span></button>)}</div>}
  </aside>;
}
