import React from 'react';
import { PanelLeftClose, PanelLeftOpen, Search, Users, CalendarDays, Map, Clock3, FileText, Settings, Stethoscope, ClipboardList } from 'lucide-react';

type Entry = { label:string; tab:string; action?:string };
const sections: Record<string,{title:string; entries:Entry[]}> = {
  servidores:{title:'Servidores',entries:[{label:'Pesquisar servidor',tab:'servidores',action:'pesquisar'},{label:'Servidores inativos',tab:'servidores',action:'inativos'},{label:'Novo servidor',tab:'servidores',action:'add'},{label:'Painel de Pessoal',tab:'servidores',action:'painel-pessoal'}]},
  frequencia:{title:'Frequência',entries:[{label:'Pesquisar frequência',tab:'frequencia',action:'pesquisar'},{label:'Gerenciar feriados',tab:'frequencia',action:'feriados'},{label:'Exportação',tab:'frequencia',action:'exportar'}]},
  ferias:{title:'Férias',entries:[{label:'Pesquisar férias',tab:'ferias',action:'open'},{label:'Plano de férias',tab:'ferias',action:'open'},{label:'Férias não marcadas',tab:'ferias',action:'open'},{label:'Períodos registrados',tab:'ferias',action:'open'},{label:'Exportar férias',tab:'ferias',action:'open'}]},
  mapas:{title:'Mapas',entries:[
    {label:'Comissionados SETRABES',tab:'mapas',action:'mapa-comissionados-setrabes'},
    {label:'Federais SETRABES',tab:'mapas',action:'mapa-federais-setrabes'},
    {label:'Efetivos SETRABES',tab:'mapas',action:'mapa-efetivos-setrabes'},
    {label:'Seletivos SETRABES',tab:'mapas',action:'mapa-seletivos-setrabes'},
    {label:'Efetivos SESAU',tab:'mapas',action:'mapa-efetivos-sesau'},
    {label:'Seletivos SESAU',tab:'mapas',action:'mapa-seletivos-sesau'},
    {label:'Exportar mapas',tab:'mapas',action:'mapas-exportar'},
  ]},
  atestados:{title:'Atestados',entries:[
    {label:'Lançar novo atestado',tab:'atestados',action:'atestado-novo'},
    {label:'Comissionados SETRABES',tab:'atestados',action:'atestado-comissionados-setrabes'},
    {label:'Servidores Federais',tab:'atestados',action:'atestado-federais-setrabes'},
    {label:'Efetivos SESAU',tab:'atestados',action:'atestado-efetivos-sesau'},
    {label:'Seletivos SETRABES',tab:'atestados',action:'atestado-seletivos-setrabes'},
    {label:'Efetivos SETRABES',tab:'atestados',action:'atestado-efetivos-setrabes'},
    {label:'Seletivos SESAU',tab:'atestados',action:'atestado-seletivos-sesau'},
  ]},
  requerimentos:{title:'Requerimentos',entries:[{label:'Servidor Estadual',tab:'requerimentos',action:'estadual'},{label:'Servidor Federal',tab:'requerimentos',action:'federal'},{label:'Insalubridade',tab:'requerimentos',action:'insalubridade'}]},
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
