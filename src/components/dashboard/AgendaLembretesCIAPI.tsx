import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Plus, Trash2, X } from 'lucide-react';
import './agenda-lembretes-ciapi.css';

type Lembrete = { id: string; titulo: string; data: string; hora: string };
const chave = (userId: string) => `ciapi-rh-lembretes-v1:${userId}`;
const isValid = (v: unknown): v is Lembrete => !!v && typeof v === 'object' && typeof (v as Lembrete).id === 'string' && typeof (v as Lembrete).titulo === 'string' && typeof (v as Lembrete).data === 'string' && typeof (v as Lembrete).hora === 'string';
export default function AgendaLembretesCIAPI({userId}:{userId:string}) {
 const [lembretes,setLembretes]=useState<Lembrete[]>([]);
 const [aberto,setAberto]=useState(false);
 const [titulo,setTitulo]=useState('');
 const [data,setData]=useState('');
 const [hora,setHora]=useState('09:00');
 const [carregado,setCarregado]=useState(false);
 useEffect(()=>{
  try { const raw=localStorage.getItem(chave(userId));const parsed=raw?JSON.parse(raw):[];setLembretes(Array.isArray(parsed)?parsed.filter(isValid):[]); }
  catch {setLembretes([]);} finally {setCarregado(true);}
 },[userId]);
 useEffect(()=>{if(!carregado)return;try{localStorage.setItem(chave(userId),JSON.stringify(lembretes));}catch{}},[lembretes,userId,carregado]);
 const ordenados=useMemo(()=>[...lembretes].sort((a,b)=>`${a.data}T${a.hora}`.localeCompare(`${b.data}T${b.hora}`)),[lembretes]);
 const adicionar=(e:React.FormEvent)=>{e.preventDefault();if(!titulo.trim()||!data)return;setLembretes(prev=>[...prev,{id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,titulo:titulo.trim(),data,hora}]);setTitulo('');setData('');setHora('09:00');setAberto(false);};
 return <section className="ciapi-agenda ciapi-home-panel"><div className="ciapi-home-panel-head"><div><h2><CalendarDays size={20}/> Agenda e Lembretes <span className="ciapi-agenda-count">{lembretes.length}</span></h2><p>Seus compromissos e lembretes importantes.</p></div><button className="ciapi-agenda-add" type="button" onClick={()=>setAberto(v=>!v)}><Plus size={16}/> Novo lembrete</button></div>
 {aberto&&<form className="ciapi-agenda-form" onSubmit={adicionar}><label>Assunto<input value={titulo} onChange={e=>setTitulo(e.target.value)} maxLength={120} required placeholder="Ex.: Reunião de equipe"/></label><div className="ciapi-agenda-form-row"><label>Data<input type="date" value={data} onChange={e=>setData(e.target.value)} required/></label><label>Horário<input type="time" value={hora} onChange={e=>setHora(e.target.value)} required/></label></div><div className="ciapi-agenda-actions"><button type="button" onClick={()=>setAberto(false)}><X size={15}/> Cancelar</button><button type="submit">Salvar lembrete</button></div></form>}
 <div className="ciapi-agenda-list">{ordenados.length===0?<div className="ciapi-agenda-empty"><CalendarDays size={25}/><strong>Nenhum lembrete cadastrado</strong><p>Adicione reuniões, prazos ou compromissos.</p></div>:ordenados.map(item=><div className="ciapi-agenda-item" key={item.id}><span className="ciapi-agenda-item-icon"><CalendarDays size={18}/></span><div><strong>{item.titulo}</strong><small>{item.data.split('-').reverse().join('/')} • {item.hora}</small></div><button type="button" onClick={()=>setLembretes(prev=>prev.filter(v=>v.id!==item.id))} aria-label={`Excluir ${item.titulo}`} title="Excluir lembrete"><Trash2 size={16}/></button></div>)}</div>
 <p className="ciapi-agenda-disclaimer">Lembretes salvos neste navegador. Não são sincronizados com o Supabase.</p></section>;
}
