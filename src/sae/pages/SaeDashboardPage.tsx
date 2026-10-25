import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, Clock3, HeartPulse, RefreshCw, Stethoscope, Users, Plus, Trash2, Check, ClipboardList } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { saeUsuariosService } from '../services/saeUsuariosService';
import { saeAgendamentosService } from '../services/saeAgendamentosService';
import { saeAdministrativoService } from '../services/saeAdministrativoService';
import './sae-institucional-claro.css';
import './sae-dashboard-home.css';

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
 const lembreteKey = `ciapi-sae-lembretes:${user?.id || 'anonimo'}`;
 const [lembretes, setLembretes] = useState<Array<{id:string;titulo:string;data:string;feito:boolean}>>([]);
 const [novoTitulo, setNovoTitulo] = useState('');
 const [novaData, setNovaData] = useState('');
 const [formAberto, setFormAberto] = useState(false);
 useEffect(() => {
  try {
   const raw = window.localStorage.getItem(lembreteKey);
   const value: unknown = raw ? JSON.parse(raw) : [];
   setLembretes(Array.isArray(value) ? value.filter((v): v is {id:string;titulo:string;data:string;feito:boolean} =>
    typeof v === 'object' && v !== null && typeof v.id === 'string' && typeof v.titulo === 'string' && typeof v.data === 'string' && typeof v.feito === 'boolean') : []);
  } catch { setLembretes([]); }
 }, [lembreteKey]);
 const guardarLembretes = (value: typeof lembretes) => {
  setLembretes(value);
  try { window.localStorage.setItem(lembreteKey, JSON.stringify(value)); } catch { /* indisponível */ }
 };
 const criarLembrete = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!novoTitulo.trim() || !novaData) return;
  guardarLembretes([...lembretes, {id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,titulo: novoTitulo.trim(),data: novaData,feito:false}]);
  setNovoTitulo('');setNovaData('');setFormAberto(false);
 };
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
   const listaLembretes = [...lembretes].sort((a,b) => Number(a.feito)-Number(b.feito) || a.data.localeCompare(b.data));
  return (
    <section className="sae-home" aria-label="Início do SAE CIAPI">
      <div className="sae-home-banner">
        <div className="sae-home-banner-content">
          <p className="sae-home-eyebrow">SAE CIAPI · VISÃO GERAL</p>
          <h1>{saudacao()}, {nomePrimeiro(user)}! <span aria-hidden="true">👋</span></h1>
          <p>Valorização, respeito e cuidado com as pessoas.</p>
          <div className="sae-home-date"><Clock3 size={16} /><span className="capitalize">{data}</span></div>
        </div>
        <div className="sae-home-banner-motto">Centro Integrado de Atenção à Pessoa Idosa</div>
      </div>

      {avisos.length > 0 && <div className="sae-home-warning" role="alert"><strong>Algumas consultas não foram concluídas:</strong><ul>{avisos.map(x => <li key={x}>{x}</li>)}</ul></div>}

      <div className="sae-home-metrics">
        {metricas.map(({nome,valor,descricao,Icon}) => <article className="sae-home-metric" key={nome}>
          <div><p className="sae-home-metric-label">{nome}</p><strong>{carregando ? '…' : valor === null ? '—' : valor.toLocaleString('pt-BR')}</strong><p>{descricao}</p></div>
          <span className="sae-home-metric-icon"><Icon size={22}/></span>
        </article>)}
      </div>

      <div className="sae-home-section-heading"><h2>Atividades do SAE</h2><button type="button" onClick={() => setVersao(v=>v+1)} disabled={carregando}><RefreshCw size={16} className={carregando ? 'animate-spin' : ''}/> Atualizar dados</button></div>
      <div className="sae-home-columns">
        <section className="sae-home-panel">
          <div className="sae-home-panel-heading"><div><h3><CalendarDays size={20}/> Agendamentos do dia</h3><p>Compromissos cadastrados para hoje.</p></div><span className="sae-home-count">{dados.agenda.length}</span></div>
          <div className="sae-home-table-scroll"><table className="sae-home-table"><thead><tr><th>Hora</th><th>Usuário</th><th>Serviço</th><th>Situação</th></tr></thead><tbody>{dados.agenda.map(a => <tr key={a.id}><td>{a.horario}</td><td>{a.usuario}</td><td>{a.servico}</td><td>{a.status}</td></tr>)}</tbody></table></div>
          {!carregando && dados.agenda.length === 0 && <div className="sae-home-empty"><CalendarDays size={24}/><p>Nenhum agendamento encontrado para hoje.</p></div>}
          {carregando && <div className="sae-home-empty">Atualizando agendamentos…</div>}
        </section>

        <section className="sae-home-panel">
          <div className="sae-home-panel-heading"><div><h3><ClipboardList size={20}/> Agenda e lembretes</h3><p>Anotações administrativas deste navegador.</p></div><button type="button" onClick={() => setFormAberto(v=>!v)} className="sae-home-add"><Plus size={16}/> Novo</button></div>
          {formAberto && <form className="sae-home-form" onSubmit={criarLembrete}>
            <label>Descrição<input maxLength={180} value={novoTitulo} onChange={e=>setNovoTitulo(e.target.value)} placeholder="Ex.: Conferir documentos" required/></label>
            <label>Data<input type="date" value={novaData} onChange={e=>setNovaData(e.target.value)} required/></label>
            <div><button type="submit">Salvar lembrete</button><button type="button" onClick={()=>setFormAberto(false)}>Cancelar</button></div>
          </form>}
          {listaLembretes.length === 0 ? <div className="sae-home-empty"><ClipboardList size={24}/><p>Nenhum lembrete cadastrado.</p><small>Use “Novo” para registrar seu primeiro lembrete.</small></div> :
          <ul className="sae-home-reminders">{listaLembretes.map(item => <li key={item.id} className={item.feito ? 'is-done' : ''}><button type="button" title={item.feito?'Reabrir':'Concluir'} aria-label={item.feito?'Reabrir lembrete':'Concluir lembrete'} onClick={()=>guardarLembretes(lembretes.map(v=>v.id===item.id?{...v,feito:!v.feito}:v))}><Check size={16}/></button><div><strong>{item.titulo}</strong><small>{item.data.split('-').reverse().join('/')}</small></div><button type="button" className="sae-home-trash" title="Excluir lembrete" aria-label="Excluir lembrete" onClick={()=>guardarLembretes(lembretes.filter(v=>v.id!==item.id))}><Trash2 size={16}/></button></li>)}</ul>}
          <p className="sae-home-storage">Lembretes salvos apenas neste navegador; não são sincronizados com o Supabase. Não registre dados pessoais ou clínicos neste campo.</p>
        </section>
      </div>
      <div className="sae-home-footer"><Activity size={16}/><span>Indicadores dos serviços existentes do SAE · Competência {hojeLocal().slice(5,7)}/{hojeLocal().slice(0,4)}</span></div>
    </section>
  );
}
