import React, { useMemo } from 'react';
import { CalendarDays, ClipboardList, FileText, Map as MapIcon, Plus, Stethoscope, Users } from 'lucide-react';
import type { Servidor } from '../../types';

type Props={servidores:Servidor[];onNavigate:(tab:string,action?:string)=>void};
const norm=(v:unknown)=>String(v??'').trim();
function dateMonthDay(v:unknown):[number,number]|null {
 const s=norm(v);if(!s)return null;
 const iso=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
 if(iso)return [Number(iso[2]),Number(iso[3])];
 const br=s.match(/^(\d{2})\/(\d{2})(?:\/\d{4})?/);
 return br?[Number(br[2]),Number(br[1])]:null;
}
export default function DashboardComplementos({servidores,onNavigate}:Props){
 const proximos=useMemo(()=>{
   const hoje=new Date();hoje.setHours(12,0,0,0);
   return servidores.filter(s=>norm(s.status).toUpperCase()==='ATIVO').flatMap(s=>{
     const md=dateMonthDay(s.aniversario || s.dataNascimento);if(!md)return [];
     let data=new Date(hoje.getFullYear(),md[0]-1,md[1],12);
     if(data<hoje)data=new Date(hoje.getFullYear()+1,md[0]-1,md[1],12);
     const dias=Math.round((data.getTime()-hoje.getTime())/86400000);
     return dias>0&&dias<=7?[{servidor:s,dias,data}]:[];
   }).sort((a,b)=>a.dias-b.dias);
 },[servidores]);
 const links=[{nome:'Novo servidor',icon:Plus,tab:'servidores',action:'add'},
 {nome:'Frequência',icon:CalendarDays,tab:'frequencia',action:'pesquisar'},
 {nome:'Férias',icon:CalendarDays,tab:'ferias',action:'open'},
 {nome:'Mapas',icon:MapIcon,tab:'mapas',action:'mapa-comissionados-setrabes'},
 {nome:'Requerimentos',icon:FileText,tab:'requerimentos',action:'open'},
 {nome:'Atestados',icon:Stethoscope,tab:'atestados',action:'open'}];
 return <div className="rh-home-complementos">
  <section className="rh-home-section"><h3>Próximos aniversários</h3><p>Servidores ativos que aniversariam nos próximos 7 dias</p>
   {proximos.length ? <ul>{proximos.map(({servidor,dias,data},i)=><li key={String(servidor.id||i)}><strong>{norm(servidor.nomeCompleto||servidor.nome)}</strong><span>{data.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} · em {dias} {dias===1?'dia':'dias'}</span></li>)}</ul> : <div className="rh-home-empty">Nenhum aniversário identificado para os próximos sete dias.</div>}
  </section>
  <section className="rh-home-section"><h3>Ações rápidas</h3><p>Acesso aos módulos existentes do RH CIAPI</p><div className="rh-home-actions">{links.map(({nome,icon:Icon,tab,action})=><button key={nome} type="button" onClick={()=>onNavigate(tab,action)}><Icon size={18}/>{nome}</button>)}</div></section>
  <section className="rh-home-section"><h3><ClipboardList size={18}/> Avisos e comunicados</h3><p>Informações institucionais</p><div className="rh-home-empty">Nenhum comunicado integrado a esta visão. Consulte os módulos institucionais para informações oficiais.</div></section>
  <section className="rh-home-section"><h3>Minha agenda</h3><p>Compromissos institucionais</p><div className="rh-home-empty">Não há uma fonte de compromissos pessoais conectada a esta página.</div></section>
  <section className="rh-home-section rh-home-quote"><h3>Frase do dia</h3><p>O respeito e o cuidado com as pessoas começam em cada atitude.</p></section>
 </div>;
}
