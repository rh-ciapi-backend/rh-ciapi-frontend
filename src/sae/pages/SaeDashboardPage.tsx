import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, Clock3, HeartPulse, RefreshCw, Stethoscope, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { saeUsuariosService } from '../services/saeUsuariosService';
import { saeAgendamentosService } from '../services/saeAgendamentosService';
import { saeAdministrativoService } from '../services/saeAdministrativoService';
import './sae-institucional-claro.css';

type Indicadores = { usuariosAtivos: number | null; agendamentosHoje: number | null; atendimentosMes: number | null; sinaisVitais: number | null; agenda: Array<{id:string; horario:string; usuario:string; servico:string; status:string}> };
const vazio: Indicadores = {usuariosAtivos:null,agendamentosHoje:null,atendimentosMes:null,sinaisVitais:null,agenda:[]};
const hojeLocal = () => new Intl.DateTimeFormat('en-CA', {timeZone:'America/Boa_Vista', year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const saudacao = () => { const hora = Number(new Intl.DateTimeFormat('en-GB',{timeZone:'America/Boa_Vista',hour:'2-digit',hour12:false}).format(new Date())); return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'; };
function nomePrimeiro(user: ReturnType<typeof useAuth>['user']) { const meta = user?.user_metadata; const nome = meta?.full_name || meta?.name || meta?.display_name; return String(nome || user?.email?.split('@')[0] || 'Servidor').trim().split(/\s+/)[0]; }
export default function SaeDashboardPage() {
 const {user} = useAuth();
 const [dados,setDados] = useState<Indicadores>(vazio);
 const [carregando,setCarregando] = useState(true);
 const [avisos,setAvisos] = useState<string[]>([]);
 const [versao,setVersao] = useState(0);
 useEffect(()=>{
  let ativo=true;
  const executar=async()=>{
   setCarregando(true);
   const resultados = await Promise.allSettled([
    saeUsuariosService.listar(), saeAgendamentosService.listar(),
    saeAdministrativoService.listarAtendimentos(),saeAdministrativoService.listarSinaisVitais(),
   ]);
   if(!ativo)return;
   const mensagens:string[]=[];
   resultados.forEach((r,i)=>{ if(r.status==='rejected') mensagens.push(['Usuários','Agendamentos','Atendimentos','Sinais vitais'][i] + ': ' + (r.reason instanceof Error?r.reason.message:'não foi possível consultar')); });
   const usuarios=resultados[0].status==='fulfilled'?resultados[0].value:null;
   const agenda=resultados[1].status==='fulfilled'?resultados[1].value:null;
   const atendimentos=resultados[2].status==='fulfilled'?resultados[2].value:null;
   const sinais=resultados[3].status==='fulfilled'?resultados[3].value:null;
   const hoje=hojeLocal(), competencia=hoje.slice(0,7);
   setDados({
    usuariosAtivos:usuarios?usuarios.filter(u=>u.situacao==='ATIVO').length:null,
    agendamentosHoje:agenda?agenda.filter(a=>String(a.data||'').slice(0,10)===hoje).length:null,
    atendimentosMes:atendimentos?atendimentos.filter(a=>String(a.data||'').slice(0,7)===competencia).length:null,
    sinaisVitais:sinais?sinais.filter(s=>String(s.data||'').slice(0,7)===competencia).length:null,
    agenda:agenda?agenda.filter(a=>String(a.data||'').slice(0,10)===hoje).sort((a,b)=>String(a.servicos[0]?.horaInicio||'').localeCompare(String(b.servicos[0]?.horaInicio||''))).slice(0,12).map(a=>({id:a.id,horario:String(a.servicos[0]?.horaInicio||'—').slice(0,5),usuario:a.nomeUsuario,servico:a.servicos.map(s=>s.servicoNome).filter(Boolean).join(', ')||'—',status:a.status})):[],
   });
   setAvisos(mensagens);setCarregando(false);
  }; void executar();return()=>{ativo=false};
 },[versao]);
 const data=useMemo(()=>new Date().toLocaleDateString('pt-BR',{timeZone:'America/Boa_Vista',weekday:'long',day:'2-digit',month:'long',year:'numeric'}),[]);
 const metricas=[{nome:'Usuários ativos',valor:dados.usuariosAtivos,descricao:'Cadastros ativos',Icon:Users},{nome:'Agendamentos hoje',valor:dados.agendamentosHoje,descricao:'Agenda do dia',Icon:CalendarDays},{nome:'Atendimentos no mês',valor:dados.atendimentosMes,descricao:'Produção mensal',Icon:Stethoscope},{nome:'Sinais vitais no mês',valor:dados.sinaisVitais,descricao:'Registros mensais',Icon:HeartPulse}];
 return <section className="sae-refresh space-y-5 sm:space-y-6">
  <header className="app-surface flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">SAE CIAPI · Visão geral</p><h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{saudacao()}, {nomePrimeiro(user)}</h1><p className="mt-2 flex items-center gap-2 text-sm text-slate-400"><Clock3 size={15}/><span className="capitalize">{data}</span></p></div><button type="button" onClick={()=>setVersao(x=>x+1)} disabled={carregando} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-white disabled:opacity-50"><RefreshCw size={16} className={carregando?'animate-spin':''}/>Atualizar indicadores</button></header>
  {avisos.length>0&&<div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Algumas consultas não foram concluídas:</strong><ul className="mt-2 list-disc pl-5">{avisos.map(x=><li key={x}>{x}</li>)}</ul></div>}
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metricas.map(({nome,valor,descricao,Icon})=><article key={nome} className="app-surface flex items-start justify-between gap-3 p-5"><div><p className="text-xs font-bold text-slate-500">{nome}</p><p className="mt-3 text-3xl font-bold text-white">{carregando?'…':valor===null?'—':valor.toLocaleString('pt-BR')}</p><p className="mt-2 text-xs text-slate-400">{descricao}</p></div><div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Icon size={21}/></div></article>)}</div>
  <div className="grid gap-4 xl:grid-cols-[1.5fr_0.7fr]"><section className="app-surface overflow-hidden"><div className="flex items-center gap-2 border-b border-slate-200 p-5"><CalendarDays size={19} className="text-primary"/><h2 className="font-bold text-white">Agendamentos do dia</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[580px] text-left text-sm"><thead><tr className="bg-slate-50 text-xs uppercase text-slate-500"><th className="p-3">Hora</th><th className="p-3">Usuário</th><th className="p-3">Serviço</th><th className="p-3">Status</th></tr></thead><tbody>{dados.agenda.map(a=><tr key={a.id} className="border-t border-slate-100"><td className="p-3">{a.horario}</td><td className="p-3 font-semibold">{a.usuario}</td><td className="p-3">{a.servico}</td><td className="p-3">{a.status}</td></tr>)}</tbody></table>{!carregando&&!dados.agenda.length&&<p className="p-8 text-center text-sm text-slate-500">Nenhum agendamento encontrado para hoje.</p>}</div></section><section className="app-surface p-5"><div className="flex items-center gap-2"><Activity size={19} className="text-primary"/><h2 className="font-bold text-white">Resumo operacional</h2></div><p className="mt-3 text-sm text-slate-500">Os números são obtidos dos serviços já utilizados nos módulos do SAE. Falhas de consulta são identificadas, sem substituir dados por totais fictícios.</p><div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-900"><strong>Competência atual:</strong> {hojeLocal().slice(5,7)}/{hojeLocal().slice(0,4)}</div></section></div>
 </section>;
}
