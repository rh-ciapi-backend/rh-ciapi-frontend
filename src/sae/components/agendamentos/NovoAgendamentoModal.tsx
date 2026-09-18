import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarPlus2, CheckCircle2, Loader2, Plus, Search, Trash2, UserRound, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { saeAgendamentosService } from '../../services/saeAgendamentosService';
import type {
  SaeAgendamentoCatalogoProfissional,
  SaeAgendamentoCatalogoServico,
  SaeAgendamentoSlotDisponivel,
  SaeAgendamentoUsuarioOpcao,
  SaeNovoAgendamentoPayload,
  SaeTipoAtendimento,
  SaeTipoUsuario,
} from '../../types/saeAgendamento';

interface Props { aberto: boolean; onClose: () => void; onCriado: () => void | Promise<void>; }
interface LinhaServico {
  idLocal: string; servicoId: string; profissionalId: string; horaInicio: string; horaFim: string;
  observacao: string; carregandoSlots: boolean; slots: SaeAgendamentoSlotDisponivel[]; erroSlots: string | null;
}
const TIPOS_USUARIO: SaeTipoUsuario[] = ['MATRICULADO','TRIAGEM','SERVIDOR','EXTERNO'];
const TIPOS_ATENDIMENTO: SaeTipoAtendimento[] = ['AVALIAÇÃO','REAVALIAÇÃO','RETORNO','ROTINA'];
const INPUT = 'h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/20';
const novaLinha = (): LinhaServico => ({ idLocal: `${Date.now()}-${Math.random().toString(16).slice(2)}`, servicoId:'', profissionalId:'', horaInicio:'', horaFim:'', observacao:'', carregandoSlots:false, slots:[], erroSlots:null });
const hojeLocal = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const horaCurta = (v?: string|null) => v ? String(v).slice(0,5) : '—';

export default function NovoAgendamentoModal({ aberto, onClose, onCriado }: Props) {
  const [servicos,setServicos]=useState<SaeAgendamentoCatalogoServico[]>([]);
  const [profissionais,setProfissionais]=useState<SaeAgendamentoCatalogoProfissional[]>([]);
  const [carregandoCatalogo,setCarregandoCatalogo]=useState(false);
  const [salvando,setSalvando]=useState(false);
  const [tipoUsuario,setTipoUsuario]=useState<SaeTipoUsuario>('MATRICULADO');
  const [tipoAtendimento,setTipoAtendimento]=useState<SaeTipoAtendimento>('ROTINA');
  const [data,setData]=useState('');
  const [buscaUsuario,setBuscaUsuario]=useState('');
  const [usuariosEncontrados,setUsuariosEncontrados]=useState<SaeAgendamentoUsuarioOpcao[]>([]);
  const [usuarioSelecionado,setUsuarioSelecionado]=useState<SaeAgendamentoUsuarioOpcao|null>(null);
  const [buscandoUsuarios,setBuscandoUsuarios]=useState(false);
  const [nomeAvulso,setNomeAvulso]=useState('');
  const [prontuarioInformado,setProntuarioInformado]=useState('');
  const [sexoAvulso,setSexoAvulso]=useState('');
  const [dataNascimentoAvulso,setDataNascimentoAvulso]=useState('');
  const [observacao,setObservacao]=useState('');
  const [linhas,setLinhas]=useState<LinhaServico[]>([novaLinha()]);
  const [erro,setErro]=useState<string|null>(null);
  const [sucesso,setSucesso]=useState<string|null>(null);

  const resetar=()=>{ setTipoUsuario('MATRICULADO'); setTipoAtendimento('ROTINA'); setData(''); setBuscaUsuario(''); setUsuariosEncontrados([]); setUsuarioSelecionado(null); setNomeAvulso(''); setProntuarioInformado(''); setSexoAvulso(''); setDataNascimentoAvulso(''); setObservacao(''); setLinhas([novaLinha()]); setErro(null); setSucesso(null); };
  const carregarCatalogo=async()=>{ try { setCarregandoCatalogo(true); setErro(null); const r=await saeAgendamentosService.listarCatalogo(); setServicos(r.servicos||[]); setProfissionais(r.profissionais||[]); } catch(e){ setErro(e instanceof Error?e.message:'Não foi possível carregar serviços e profissionais.'); } finally { setCarregandoCatalogo(false); } };
  useEffect(()=>{ if(!aberto)return; resetar(); carregarCatalogo(); },[aberto]);
  useEffect(()=>{ if(tipoUsuario!=='MATRICULADO'){ setBuscaUsuario(''); setUsuariosEncontrados([]); setUsuarioSelecionado(null); } },[tipoUsuario]);
  useEffect(()=>{ if(!aberto||tipoUsuario!=='MATRICULADO')return; const termo=buscaUsuario.trim(); if(termo.length<2||usuarioSelecionado){ setUsuariosEncontrados([]); return; } const t=window.setTimeout(async()=>{ try{ setBuscandoUsuarios(true); const r=await saeAgendamentosService.buscarUsuarios(termo); setUsuariosEncontrados(r.usuarios||[]); }catch(e){ setErro(e instanceof Error?e.message:'Não foi possível buscar os usuários.'); }finally{ setBuscandoUsuarios(false); } },350); return()=>window.clearTimeout(t); },[aberto,buscaUsuario,tipoUsuario,usuarioSelecionado]);

  const servicosSelecionados=useMemo(()=>new Set(linhas.map(l=>l.servicoId).filter(Boolean)),[linhas]);
  const profissionaisDoServico=(sid:string)=>profissionais.filter(p=>p.servicoIds.includes(sid));
  const atualizarLinha=(id:string,patch:Partial<LinhaServico>)=>setLinhas(a=>a.map(l=>l.idLocal===id?{...l,...patch}:l));
  const carregarSlots=async(l:LinhaServico)=>{ if(!data||!l.servicoId||!l.profissionalId){ atualizarLinha(l.idLocal,{slots:[],horaInicio:'',horaFim:'',erroSlots:null}); return; } try{ atualizarLinha(l.idLocal,{carregandoSlots:true,slots:[],horaInicio:'',horaFim:'',erroSlots:null}); const r=await saeAgendamentosService.consultarDisponibilidade(l.profissionalId,l.servicoId,data); atualizarLinha(l.idLocal,{slots:r.slots||[],carregandoSlots:false,erroSlots:r.slots?.length?null:'Nenhum horário disponível para esta data.'}); }catch(e){ atualizarLinha(l.idLocal,{carregandoSlots:false,slots:[],erroSlots:e instanceof Error?e.message:'Não foi possível consultar os horários.'}); } };
  useEffect(()=>{ if(!aberto||!data)return; linhas.forEach(l=>{ if(l.servicoId&&l.profissionalId) carregarSlots(l); }); },[data]);
  const selecionarServico=(l:LinhaServico,sid:string)=>atualizarLinha(l.idLocal,{servicoId:sid,profissionalId:'',horaInicio:'',horaFim:'',slots:[],erroSlots:null});
  const selecionarProfissional=async(l:LinhaServico,pid:string)=>{ const a={...l,profissionalId:pid,horaInicio:'',horaFim:'',slots:[],erroSlots:null}; atualizarLinha(l.idLocal,a); if(pid&&l.servicoId&&data) await carregarSlots(a); };
  const selecionarSlot=(l:LinhaServico,v:string)=>{ const s=l.slots.find(x=>`${x.horaInicio}|${x.horaFim}`===v); atualizarLinha(l.idLocal,{horaInicio:s?.horaInicio||'',horaFim:s?.horaFim||''}); };
  const validar=()=>{ if(!data)throw new Error('Informe a data do agendamento.'); if(tipoUsuario==='MATRICULADO'&&!usuarioSelecionado)throw new Error('Selecione o usuário matriculado.'); if(tipoUsuario!=='MATRICULADO'&&!nomeAvulso.trim())throw new Error('Informe o nome da pessoa.'); for(const l of linhas){ if(!l.servicoId)throw new Error('Selecione o serviço em todos os itens.'); if(!l.profissionalId)throw new Error('Selecione o profissional em todos os serviços.'); if(!l.horaInicio||!l.horaFim)throw new Error('Selecione um horário disponível para todos os serviços.'); } };
  const salvar=async()=>{ try{ validar(); setSalvando(true); setErro(null); const payload:SaeNovoAgendamentoPayload={ data,tipoUsuario,usuarioId:tipoUsuario==='MATRICULADO'?usuarioSelecionado?.id||null:null,prontuarioInformado:tipoUsuario==='MATRICULADO'?usuarioSelecionado?.prontuario||null:prontuarioInformado.trim()||null,nomeAvulso:tipoUsuario==='MATRICULADO'?null:nomeAvulso.trim()||null,sexoAvulso:tipoUsuario==='MATRICULADO'?null:sexoAvulso||null,dataNascimentoAvulso:tipoUsuario==='MATRICULADO'?null:dataNascimentoAvulso||null,tipoAtendimento,observacao:observacao.trim()||null,servicos:linhas.map(l=>({servicoId:l.servicoId,profissionalId:l.profissionalId,horaInicio:l.horaInicio,horaFim:l.horaFim,observacao:l.observacao.trim()||null}))}; await saeAgendamentosService.criar(payload); setSucesso('Agendamento criado com sucesso.'); await onCriado(); window.setTimeout(onClose,700); }catch(e){ setErro(e instanceof Error?e.message:'Não foi possível criar o agendamento.'); }finally{ setSalvando(false); } };
  if(!aberto)return null;

  return <AnimatePresence><div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5">
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={()=>!salvando&&onClose()} />
    <motion.div initial={{opacity:0,y:18,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:18,scale:.98}} className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-border-dark bg-card-dark shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-border-dark px-5 py-4 sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">SAE</p><h2 className="mt-1 text-xl font-bold text-white">Novo agendamento</h2><p className="mt-1 text-xs text-slate-500">Selecione o usuário, os serviços e somente horários disponíveis na agenda oficial.</p></div><button type="button" onClick={onClose} disabled={salvando} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-dark bg-slate-900/40 text-slate-400 hover:text-white disabled:opacity-50"><X size={18}/></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {erro&&<div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300"><AlertCircle size={17}/><span>{erro}</span></div>}
        {sucesso&&<div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300"><CheckCircle2 size={17}/><span>{sucesso}</span></div>}
        <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
          <section className="rounded-[18px] border border-border-dark bg-slate-900/20 p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><UserRound size={16} className="text-primary"/><h3 className="text-sm font-bold text-white">Usuário e atendimento</h3></div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Tipo de usuário"><select value={tipoUsuario} onChange={e=>setTipoUsuario(e.target.value as SaeTipoUsuario)} className={INPUT}>{TIPOS_USUARIO.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Atendimento"><select value={tipoAtendimento} onChange={e=>setTipoAtendimento(e.target.value as SaeTipoAtendimento)} className={INPUT}>{TIPOS_ATENDIMENTO.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Data"><input type="date" min={hojeLocal()} value={data} onChange={e=>setData(e.target.value)} className={INPUT}/></Field></div>
            {tipoUsuario==='MATRICULADO'?<div className="mt-4"><Field label="Buscar matriculado">{usuarioSelecionado?<div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[.06] p-3"><div><p className="text-sm font-semibold text-white">{usuarioSelecionado.nome}</p><p className="mt-1 text-xs text-slate-500">Prontuário {usuarioSelecionado.prontuario||'—'}</p></div><button type="button" onClick={()=>{setUsuarioSelecionado(null);setBuscaUsuario('')}} className="rounded-lg border border-border-dark px-3 py-2 text-xs font-bold text-slate-400 hover:text-white">Trocar</button></div>:<div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input value={buscaUsuario} onChange={e=>setBuscaUsuario(e.target.value)} placeholder="Nome ou prontuário..." className={`${INPUT} pl-9`}/>{buscandoUsuarios&&<Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary"/>}</div>}</Field>{!usuarioSelecionado&&usuariosEncontrados.length>0&&<div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-border-dark bg-slate-950/30">{usuariosEncontrados.map(u=><button key={u.id} type="button" onClick={()=>{setUsuarioSelecionado(u);setBuscaUsuario(u.nome);setUsuariosEncontrados([])}} className="block w-full border-b border-border-dark px-4 py-3 text-left last:border-b-0 hover:bg-slate-800/40"><p className="text-sm font-semibold text-white">{u.nome}</p><p className="mt-1 text-xs text-slate-500">Prontuário {u.prontuario||'—'}</p></button>)}</div>}</div>:<div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Nome"><input value={nomeAvulso} onChange={e=>setNomeAvulso(e.target.value)} className={INPUT} placeholder="Nome completo"/></Field><Field label="Prontuário / referência"><input value={prontuarioInformado} onChange={e=>setProntuarioInformado(e.target.value)} className={INPUT} placeholder="Opcional"/></Field><Field label="Sexo"><select value={sexoAvulso} onChange={e=>setSexoAvulso(e.target.value)} className={INPUT}><option value="">Não informado</option><option value="FEMININO">Feminino</option><option value="MASCULINO">Masculino</option></select></Field><Field label="Data de nascimento"><input type="date" value={dataNascimentoAvulso} onChange={e=>setDataNascimentoAvulso(e.target.value)} className={INPUT}/></Field></div>}
            <div className="mt-4"><Field label="Observação geral"><textarea value={observacao} onChange={e=>setObservacao(e.target.value)} rows={3} className={`${INPUT} h-auto min-h-[84px] resize-none py-3`} placeholder="Opcional"/></Field></div>
          </section>
          <section className="rounded-[18px] border border-border-dark bg-slate-900/20 p-4 sm:p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h3 className="text-sm font-bold text-white">Serviços do agendamento</h3><p className="mt-1 text-xs text-slate-500">Um agendamento pode conter vários serviços.</p></div><button type="button" onClick={()=>setLinhas(a=>[...a,novaLinha()])} className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-bold text-primary"><Plus size={14}/>Adicionar serviço</button></div>
            {carregandoCatalogo?<div className="flex min-h-[260px] items-center justify-center"><Loader2 size={25} className="animate-spin text-primary"/></div>:<div className="mt-5 space-y-4">{linhas.map((l,i)=>{const profs=profissionaisDoServico(l.servicoId);return <div key={l.idLocal} className="rounded-2xl border border-border-dark bg-slate-950/20 p-4"><div className="mb-4 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">Serviço {i+1}</p><button type="button" onClick={()=>setLinhas(a=>a.length===1?[novaLinha()]:a.filter(x=>x.idLocal!==l.idLocal))} className="rounded-lg border border-rose-500/15 bg-rose-500/5 p-2 text-rose-300"><Trash2 size={14}/></button></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Serviço"><select value={l.servicoId} onChange={e=>selecionarServico(l,e.target.value)} className={INPUT}><option value="">Selecione...</option>{servicos.map(s=><option key={s.id} value={s.id} disabled={servicosSelecionados.has(s.id)&&l.servicoId!==s.id}>{s.nome}{s.sigla?` (${s.sigla})`:''}</option>)}</select></Field><Field label="Profissional"><select value={l.profissionalId} disabled={!l.servicoId} onChange={e=>selecionarProfissional(l,e.target.value)} className={`${INPUT} disabled:opacity-50`}><option value="">Selecione...</option>{profs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}</select></Field><Field label="Horário disponível"><select value={l.horaInicio&&l.horaFim?`${l.horaInicio}|${l.horaFim}`:''} disabled={!data||!l.servicoId||!l.profissionalId||l.carregandoSlots} onChange={e=>selecionarSlot(l,e.target.value)} className={`${INPUT} disabled:opacity-50`}><option value="">{l.carregandoSlots?'Consultando...':'Selecione...'}</option>{l.slots.map(s=><option key={`${s.horaInicio}-${s.horaFim}`} value={`${s.horaInicio}|${s.horaFim}`}>{horaCurta(s.horaInicio)}–{horaCurta(s.horaFim)}{s.turno?` • ${s.turno}`:''}</option>)}</select>{l.erroSlots&&<p className="mt-2 text-[11px] text-amber-300">{l.erroSlots}</p>}</Field><Field label="Observação do serviço"><input value={l.observacao} onChange={e=>atualizarLinha(l.idLocal,{observacao:e.target.value})} className={INPUT} placeholder="Opcional"/></Field></div></div>})}</div>}
          </section>
        </div>
      </div>
      <footer className="flex flex-col-reverse gap-2 border-t border-border-dark px-5 py-4 sm:flex-row sm:justify-end sm:px-6"><button type="button" onClick={onClose} disabled={salvando} className="rounded-xl border border-border-dark bg-slate-900/40 px-4 py-2.5 text-sm font-semibold text-slate-300">Cancelar</button><button type="button" onClick={salvar} disabled={salvando||carregandoCatalogo} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50">{salvando?<Loader2 size={16} className="animate-spin"/>:<CalendarPlus2 size={16}/>} {salvando?'Agendando...':'Confirmar agendamento'}</button></footer>
    </motion.div>
  </div></AnimatePresence>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <div><label className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">{label}</label>{children}</div>}
