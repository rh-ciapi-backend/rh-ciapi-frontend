import React, { useState } from 'react';
import { Activity, BarChart3, CalendarDays, ChevronDown, ClipboardList, Home, LogOut, Map, Menu, Stethoscope, UserCog, Users, X } from 'lucide-react';
import type { SaeTab } from './SaeSidebar';

type Visao = 'NOVA' | 'PENDENTES' | 'CONCLUIDAS' | 'HISTORICO';
type Props = {
  activeTab:SaeTab;
  onChange:(tab:SaeTab)=>void;
  onLogout:()=>void;
  restrictedProfessional?:boolean;
  visaoTriagem?:Visao;
  onSelecionarTriagem?:(visao:Visao)=>void;
};
const items = [
  { id:'dashboard', label:'Início', Icon:Home },
  { id:'usuarios', label:'Usuários', Icon:Users },
  { id:'triagem', label:'Triagem', Icon:ClipboardList },
  { id:'agendamentos', label:'Agendamentos', Icon:CalendarDays },
  { id:'atendimentos', label:'Atendimentos', Icon:Stethoscope },
  { id:'mapas', label:'Mapas', Icon:Map },
  { id:'profissionais', label:'Profissionais', Icon:UserCog },
  { id:'relatorios', label:'Relatórios', Icon:BarChart3 },
] as const;
const triagens = [
 ['NOVA','Nova triagem'],['PENDENTES','Triagens pendentes'],
 ['CONCLUIDAS','Triagens concluídas'],['HISTORICO','Histórico'],
] as const;
export default function SaeHorizontalNav({activeTab,onChange,onLogout,restrictedProfessional=false,visaoTriagem='PENDENTES',onSelecionarTriagem}:Props){
 const [mobileOpen,setMobileOpen]=useState(false);
 const [triagemOpen,setTriagemOpen]=useState(false);
 const visible=restrictedProfessional?items.filter(item=>item.id==='mapas'||item.id==='relatorios'):items;
 const navigate=(id:SaeTab)=>{onChange(id);setMobileOpen(false);setTriagemOpen(false);};
 return <nav className="sae-hnav" aria-label="Navegação principal SAE">
   <div className="sae-hnav-inner">
     <button type="button" className="sae-hnav-toggle" onClick={()=>setMobileOpen(x=>!x)} aria-expanded={mobileOpen} aria-label="Abrir ou fechar menu">{mobileOpen?<X size={19}/>:<Menu size={19}/>} Menu</button>
     <div className={'sae-hnav-links'+(mobileOpen?' is-open':'')}>
       {visible.map(({id,label,Icon})=><div key={id} className="sae-hnav-item">
         <button type="button" className={'sae-hnav-link'+(activeTab===id?' is-active':'')} aria-current={activeTab===id?'page':undefined} onClick={()=>navigate(id as SaeTab)}><Icon size={16}/>{label}</button>
         {id==='triagem'&&!restrictedProfessional&&<><button type="button" className="sae-hnav-caret" aria-label="Opções de triagem" aria-expanded={triagemOpen} onClick={()=>setTriagemOpen(v=>!v)}><ChevronDown size={14}/></button>{triagemOpen&&<div className="sae-hnav-dropdown">{triagens.map(([value,text])=><button type="button" key={value} className={visaoTriagem===value?'is-active':''} onClick={()=>{onSelecionarTriagem?.(value);setMobileOpen(false);setTriagemOpen(false)}}>{text}</button>)}</div>}</>}
       </div>)}
       <button type="button" className="sae-hnav-exit" onClick={onLogout}><LogOut size={16}/> Sair</button>
     </div>
   </div>
 </nav>;
}
