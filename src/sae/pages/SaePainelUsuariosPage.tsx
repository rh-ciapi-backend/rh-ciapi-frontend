import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Users, UserCheck, UserX, Sun, Sunset, Search } from 'lucide-react';
import { saeUsuariosService } from '../services/saeUsuariosService';
import type { SaeUsuarioResumo } from '../types/saeUsuario';

interface Props { onAbrirUsuario:(id:string)=>void }
const norm=(v:unknown)=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export default function SaePainelUsuariosPage({onAbrirUsuario}:Props){
 const [usuarios,setUsuarios]=useState<SaeUsuarioResumo[]>([]);
 const [busy,setBusy]=useState(true);const [erro,setErro]=useState('');
 const [q,setQ]=useState(''); const [situacao,setSituacao]=useState<'TODOS'|'ATIVO'|'INATIVO'>('TODOS');
 const [turno,setTurno]=useState('TODOS');const [rev,setRev]=useState(0);
 useEffect(()=>{let ok=true;setBusy(true);setErro('');saeUsuariosService.listar().then(r=>{if(ok)setUsuarios(r)}).catch(e=>{if(ok)setErro(e instanceof Error?e.message:'Falha ao carregar usuários')}).finally(()=>{if(ok)setBusy(false)});return()=>{ok=false};},[rev]);
 const ativos=usuarios.filter(u=>u.situacao==='ATIVO');
 const n={total:usuarios.length,ativos:ativos.length,inativos:usuarios.filter(u=>u.situacao==='INATIVO').length,manha:ativos.filter(u=>norm(u.turno)==='manha').length,tarde:ativos.filter(u=>norm(u.turno)==='tarde').length};
 const filtered=useMemo(()=>usuarios.filter(u=>(situacao==='TODOS'||u.situacao===situacao)&&(turno==='TODOS'||norm(u.turno)===norm(turno))&&(!q.trim()||norm(u.nome).includes(norm(q))||norm(u.prontuario).includes(norm(q)))),[usuarios,situacao,turno,q]);
 const cards=[['Total de usuários',n.total,Users],['Usuários ativos',n.ativos,UserCheck],['Usuários inativos',n.inativos,UserX],['Turno manhã (ativos)',n.manha,Sun],['Turno tarde (ativos)',n.tarde,Sunset]] as const;
 return <div className="sae-painel-usuarios">
 <header className="sae-painel-head"><div><small>SAE CIAPI · GESTÃO DE USUÁRIOS</small><h1>Painel de Usuários</h1><p>Indicadores calculados dos cadastros existentes, sem valores fixos.</p></div><button type="button" onClick={()=>setRev(x=>x+1)} disabled={busy}><RefreshCw size={16}/> Atualizar dados</button></header>
 {erro&&<p role="alert" className="sae-painel-error">{erro}</p>}
 <div className="sae-painel-grid">{cards.map(([label,num,Icon])=><div className="sae-painel-card" key={label}><Icon size={20}/><span>{label}</span><strong>{busy?'…':num.toLocaleString('pt-BR')}</strong></div>)}</div>
 <section className="sae-painel-list"><header><h2>Consulta consolidada</h2><span>{filtered.length} resultado(s)</span></header><div className="sae-painel-filters"><label><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Pesquisar nome ou prontuário" /></label><select value={situacao} onChange={e=>setSituacao(e.target.value as typeof situacao)}><option value="TODOS">Todas as situações</option><option value="ATIVO">Ativos</option><option value="INATIVO">Inativos</option></select><select value={turno} onChange={e=>setTurno(e.target.value)}><option value="TODOS">Todos os turnos</option><option value="MANHÃ">Manhã</option><option value="TARDE">Tarde</option></select></div>
 {busy?<p className="sae-painel-empty">Carregando dados...</p>:<div className="sae-painel-results">{filtered.slice(0,100).map(u=><button key={u.id} type="button" onClick={()=>onAbrirUsuario(u.id)}><b>{u.nome}</b><span>Prontuário {u.prontuario||'—'} · {u.situacao} · {u.turno||'Não informado'}</span></button>)}{filtered.length>100&&<p className="sae-painel-empty">Mostrando os primeiros 100 registros. Utilize a pesquisa para localizar outros usuários.</p>}{!filtered.length&&<p className="sae-painel-empty">Nenhum resultado para os filtros selecionados.</p>}</div>}</section>
 </div>
}
