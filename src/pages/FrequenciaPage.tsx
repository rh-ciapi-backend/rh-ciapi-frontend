import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Download, FileText, Loader2, Printer, Search, RefreshCw, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { listarFrequenciaMensal, baixarFrequenciaArquivo, type FrequenciaMensalItem, type FrequenciaDayItem, type FrequenciaExportPayload } from '../services/frequenciaService';
import { criarEvento, excluirEvento, listarEventos, type EventoCalendario, type EventoInput, type TipoEvento } from '../services/eventosService';
import { servidoresService, type ServidorComVinculo } from '../services/servidoresService';
import './frequencia-tres-guias.css';

type Guia = 'pesquisar' | 'feriados' | 'exportar';
type ActionProps = { initialAction?: string | null; onActionHandled?: () => void };
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const now = new Date();
const initialYear = now.getFullYear();
const initialMonth = now.getMonth() + 1;
const text = (v: unknown) => String(v ?? '').trim();
const norm = (v: unknown) => text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const dateBr = (d:string) => { const [y,m,day]=d.split('-'); return y&&m&&day?`${day}/${m}/${y}`:d; };
const iso = (y:number,m:number) => `${y}-${String(m).padStart(2,'0')}`;
const next = (y:number,m:number,offset:number) => { const d=new Date(y,m-1+offset,1); return {ano:d.getFullYear(),mes:d.getMonth()+1}; };
const label = (y:number,m:number) => `${MESES[m-1]} de ${y}`;
const parseState = (action?:string|null):Guia => action==='feriados'?'feriados':action==='exportar'?'exportar':'pesquisar';
const Btn=({children,onClick,disabled,variant='default'}:{children:React.ReactNode;onClick:()=>void;disabled?:boolean;variant?:'default'|'primary'|'danger'})=><button type="button" onClick={onClick} disabled={disabled} className={`cf-btn cf-btn--${variant}`} >{children}</button>;
function MonthChooser({ano,mes,onChange}:{ano:number;mes:number;onChange:(ano:number,mes:number)=>void}) { return <div className="cf-row"><label>Mês<select value={mes} onChange={e=>onChange(ano,Number(e.target.value))}>{MESES.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select></label><label>Ano<input type="number" min="2020" max="2100" value={ano} onChange={e=>onChange(Number(e.target.value)||initialYear,mes)}/></label></div>; }
function Ficha({item,ano,mes}:{item:FrequenciaMensalItem;ano:number;mes:number}) {
  const s=item.servidor;
  const entries=useMemo(()=>{
    const map=new Map<number,FrequenciaDayItem>();
    (item.dayItems||[]).forEach(d=>map.set(Number(d.dia),d));
    return Array.from({length:new Date(ano,mes,0).getDate()},(_,i)=>{
      const dia=i+1;
      const weekday=new Date(ano,mes-1,dia).getDay();
      const entry=map.get(dia);
      const weekend=weekday===0?'DOMINGO':weekday===6?'SÁBADO':'';
      return {dia,first:entry?.turno1,second:entry?.turno2,weekend,final:text(entry?.statusFinal)};
    });
  },[item,ano,mes]);
  const value=(v:unknown)=>text(v)||'—';
  const weekendOr=(v:unknown,weekend:string)=>text(v)||weekend;
  return <article className="cf-paper cf-official-sheet" aria-label="Folha individual de frequência">
    <header className="cf-paper-head">
      <img src="/ciapi/brasao-frequencia.png" alt="Brasão do Estado de Roraima" className="cf-official-crest" />
      <h2>FOLHA INDIVIDUAL DE FREQUÊNCIA</h2>
    </header>
    <div className="cf-official-meta">
      <div className="cf-official-meta-line"><span><b>Unidade:</b> CENTRO INTEGRADO DE ATENÇÃO À PESSOA IDOSA</span><span><b>Lotação:</b> SETRABES</span></div>
      <div className="cf-official-meta-line"><span><b>Servidor (a):</b> {value(s?.nome)}</span><span><b>Matrícula:</b> {value(s?.matricula)}</span></div>
      <div className="cf-official-meta-line"><span><b>Categoria:</b> {value(s?.categoria)}</span><span><b>CPF:</b> {value(s?.cpf)}</span></div>
      <div className="cf-official-meta-line"><span className="cf-full"><b>Cargo:</b> {value(s?.cargo)}</span></div>
      <div className="cf-official-meta-line cf-official-meta-three"><span><b>Frequência:</b></span><span><b>C.H-Diária:</b> —</span><span><b>C.H-Semanal:</b> —</span></div>
      <div className="cf-official-meta-line"><span><b>MÊS:</b> {MESES[mes-1]?.toUpperCase()}</span><span><b>Ano:</b> {ano}</span></div>
    </div>
    <div className="cf-tablewrap"><table className="cf-sheet cf-official-grid"><colgroup>
      <col style={{width:'7%'}}/>
      {[0,1].flatMap(turn=>['9%','8%','13%','10%','7%'].map((width,i)=><col key={`${turn}-${i}`} style={{width}}/>))}
    </colgroup><thead><tr className="cf-turn-head"><th rowSpan={2}>DIA</th><th colSpan={5}>1º TURNO</th><th colSpan={5}>2º TURNO</th></tr><tr>{[0,1].flatMap(t=>['HORA ENTRADA','HORA SAÍDA','RUBRICA DO SERVIDOR','OCORRÊNCIA','ABONO DO CHEFE'].map((heading,i)=><th key={`${t}-${i}`}>{heading}</th>))}</tr></thead>
    <tbody>{entries.map(r=><tr key={r.dia}>
      <td className="cf-day-number">{r.dia}</td>
      {[r.first,r.second].flatMap((turn,index)=>{
        const isWeekend=!!r.weekend;
        const rubrica=weekendOr(turn?.rubrica,r.weekend);
        const ocorrencia=weekendOr(turn?.ocorrencia,r.final&&!isWeekend?r.final:'');
        return [
          <td key={`${index}a`}>{isWeekend?'——':''}</td>,
          <td key={`${index}b`}>{isWeekend?'——':''}</td>,
          <td key={`${index}c`}>{rubrica==='—'?'':rubrica}</td>,
          <td key={`${index}d`}>{ocorrencia==='—'?'':ocorrencia}</td>,
          <td key={`${index}e`}></td>
        ];
      })}
    </tr>)}</tbody></table></div>
    <footer className="cf-paper-sign cf-official-signatures">
      <div><span className="cf-signature-line"/><small>Assinatura do servidor</small></div>
      <div><span className="cf-signature-line"/><small>RAIMUNDA ARTEMES FREITAS DAS NEVES</small><small>Mat 0164392-4-02</small><small>Gerente do Centro Integrado de Atenção à Pessoa Idosa</small></div>
    </footer>
    <p className="cf-hint cf-print-hidden">Consulta em tela. Confira os dados e utilize o PDF oficial para emissão institucional.</p>
  </article>;
}
export default function FrequenciaPage({initialAction,onActionHandled}:ActionProps){
  const [guia,setGuia]=useState<Guia>(parseState(initialAction));
  const [ano,setAno]=useState(initialYear); const [mes,setMes]=useState(initialMonth);
  const [items,setItems]=useState<FrequenciaMensalItem[]>([]);const [cadastros,setCadastros]=useState<ServidorComVinculo[]>([]);const [cadastrosError,setCadastrosError]=useState('');const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [query,setQuery]=useState('');const [searched,setSearched]=useState(false);const [selected,setSelected]=useState('');const [revision,setRevision]=useState(0);const [busy,setBusy]=useState(false);
  const [exportQuery,setExportQuery]=useState('');const [categoria,setCategoria]=useState('');const [setor,setSetor]=useState('');
  const [inicioAno,setInicioAno]=useState(initialYear);const [inicioMes,setInicioMes]=useState(initialMonth);const [fimAno,setFimAno]=useState(initialYear);const [fimMes,setFimMes]=useState(initialMonth);const [periodo,setPeriodo]=useState(false); const [modo,setModo]=useState<'individual'|'lote'>('lote');const [formato,setFormato]=useState<'pdf'|'docx'>('pdf');const [escopo,setEscopo]=useState<'todos_ativos'|'todos'|'categoria'|'setor'>('todos_ativos');const [estrategia,setEstrategia]=useState<'zip'|'documento_unico'>('zip');
  const [eventos,setEventos]=useState<EventoCalendario[]>([]);const [eventLoading,setEventLoading]=useState(false);const [eventDate,setEventDate]=useState(`${iso(initialYear,initialMonth)}-01`);const [eventTitle,setEventTitle]=useState('');const [eventDesc,setEventDesc]=useState('');const [eventType,setEventType]=useState<TipoEvento>('FERIADO');const [eventActive,setEventActive]=useState(true);
  useEffect(()=>{if(initialAction){setGuia(parseState(initialAction));onActionHandled?.();}},[initialAction,onActionHandled]);
  const changeMonth=(y:number,m:number)=>{setAno(y);setMes(m);setSearched(false);setSelected('');setEventDate(`${iso(y,m)}-01`);};
  const load=useCallback(async()=>{setLoading(true);setError('');try{const result=await listarFrequenciaMensal({ano,mes,status:'TODOS'});setItems(Array.isArray(result?.data)?result.data:[]);}catch(e:any){setItems([]);setError(e?.message||'Não foi possível consultar as frequências.');}finally{setLoading(false);}},[ano,mes,revision]);
  useEffect(()=>{if(guia==='pesquisar'||guia==='exportar')void load();},[load,guia]);
  useEffect(()=>{let active=true;servidoresService.listar().then(rows=>{if(active){setCadastros(Array.isArray(rows)?rows:[]);setCadastrosError('');}}).catch(e=>{if(active)setCadastrosError(e?.message||'Não foi possível carregar o cadastro de servidores.');});return()=>{active=false;};},[]);
  const loadEvents=useCallback(async()=>{setEventLoading(true);setError('');try{const rows=await listarEventos({ano,mes});setEventos(Array.isArray(rows)?rows:[]);}catch(e:any){setError(e?.message||'Erro ao carregar feriados.');}finally{setEventLoading(false);}},[ano,mes,revision]);
  useEffect(()=>{if(guia==='feriados')void loadEvents();},[guia,loadEvents]);
  // Busca diretamente no cadastro existente: não depende de marcações de frequência no mês.
  const found=useMemo(()=>{
    const needle=norm(query);if(!needle)return [] as FrequenciaMensalItem[];
    const matches=cadastros.filter(s=>[s.nomeCompleto,s.nome,s.matricula,s.matriculaSegunda,s.cpf].some(v=>norm(String(v||'')).includes(needle)));
    const known=new Set(matches.map(s=>String(s.id)));
    const fromMonthly=items.filter(i=>{const s=i.servidor;return s&&(known.has(String(s.id))||[s.nome,s.matricula,s.cpf].some(v=>norm(String(v||'')).includes(needle)));});
    const keys=new Set(fromMonthly.map(i=>String(i.servidor?.id)));
    const fallback=matches.filter(s=>!keys.has(String(s.id))).map(s=>({
      servidor:{id:s.id,nome:s.nomeCompleto||s.nome,cpf:s.cpf,matricula:s.matricula,categoria:s.categoria,setor:s.setor,cargo:s.cargo,status:s.status},
      dayItems:[]
    } as FrequenciaMensalItem));
    return [...fromMonthly,...fallback];
  },[items,cadastros,query]);
  const chosen=useMemo(()=>found.find(i=>String(i.servidor?.id)===selected)|| (found.length===1?found[0]:null),[found,selected]);
  const exportMatches=useMemo(()=>{
    const q=norm(exportQuery);return q?cadastros.filter(s=>[s.nomeCompleto,s.nome,s.matricula,s.matriculaSegunda,s.cpf].some(v=>norm(String(v||'')).includes(q))).slice(0,30):[];
  },[cadastros,exportQuery]);
  const chosenForExport=useMemo(()=>{
    if(modo!=='individual')return null;
    const person=cadastros.find(s=>String(s.id)===selected);
    if(person)return {id:person.id,cpf:person.cpf,nome:person.nomeCompleto||person.nome,matricula:person.matricula};
    return chosen?.servidor||null;
  },[cadastros,chosen,modo,selected]);
  const categorias=useMemo(()=>Array.from(new Set(cadastros.map(i=>text(i.categoria)).filter(Boolean))).sort(),[cadastros]);
  const setores=useMemo(()=>Array.from(new Set(cadastros.map(i=>text(i.setor)).filter(Boolean))).sort(),[cadastros]);
  const changeGuia=(g:Guia)=>{setGuia(g);setError('');};
  const exportOne=async(y:number,m:number)=>{const payload:FrequenciaExportPayload={ano:y,mes:m,formato,modoExportacao:modo,escopoExportacao:modo==='individual'?'servidor_selecionado':escopo,estrategiaLote:formato==='pdf'?'zip':estrategia,servidorId:modo==='individual'?chosenForExport?.id:undefined,servidorCpf:modo==='individual'?chosenForExport?.cpf:undefined,categoria:categoria||undefined,setor:setor||undefined,status:escopo==='todos_ativos'?'ATIVO':undefined}; await baixarFrequenciaArquivo(payload, (chosenForExport||undefined) as any);};
  const exportRun=async()=>{if(modo==='individual'&&!chosenForExport){setError('Pesquise e selecione um servidor no campo ao lado.');return;}if(modo==='lote'&&escopo==='categoria'&&!categoria){setError('Selecione a categoria.');return;}if(modo==='lote'&&escopo==='setor'&&!setor){setError('Selecione o setor.');return;}const from=periodo?inicioAno*12+inicioMes:ano*12+mes;const to=periodo?fimAno*12+fimMes:from;if(to<from||to-from>11){setError('Escolha um período de até 12 competências, com data final igual ou posterior à inicial.');return;}setBusy(true);setError('');try{for(let i=from;i<=to;i++){const year=Math.floor((i-1)/12);const month=i-year*12;await exportOne(year,month);}}catch(e:any){setError(e?.message||'Falha ao exportar.');}finally{setBusy(false);}};
  const saveEvent=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{const payload:EventoInput={data:eventDate,tipo:eventType,titulo:eventTitle.trim(),descricao:eventDesc.trim(),ativo:eventActive};await criarEvento(payload);setEventTitle('');setEventDesc('');await loadEvents();setRevision(v=>v+1);}catch(err:any){setError(err?.message||'Falha ao salvar o evento. Confirme sua autenticação.');}finally{setBusy(false);}};
  const deleteEvent=async(id:string)=>{if(!window.confirm('Excluir este evento?'))return;setBusy(true);setError('');try{await excluirEvento(id);await loadEvents();setRevision(v=>v+1);}catch(e:any){setError(e?.message||'Não foi possível excluir.');}finally{setBusy(false);}};
  return <main className="cf-root"><header className="cf-top"><div><span className="cf-eyebrow">CIAPI RH / CONTROLE DE PESSOAL</span><h1>Frequência</h1><p>Consulta individual, calendário institucional e emissão de documentos.</p></div><Btn onClick={()=>setRevision(v=>v+1)}><RefreshCw size={15}/> Atualizar</Btn></header>
  {error&&<div className="cf-alert" role="alert">{error}</div>}
  {guia==='pesquisar'&&<><section className="cf-panel"><div className="cf-panel-title"><Search size={20}/><h2>Localizar frequência do servidor</h2></div><form className="cf-search-form" onSubmit={e=>{e.preventDefault();setSearched(true);setSelected('');}}><label>Nome, CPF ou matrícula<input value={query} onChange={e=>{setQuery(e.target.value);setSearched(false);setSelected('');}} placeholder="Ex.: Joab" required/></label><MonthChooser ano={ano} mes={mes} onChange={changeMonth}/><div className="cf-buttons"><button className="cf-btn cf-btn--primary" disabled={loading||!query.trim()} type="submit"><Search size={16}/> Pesquisar</button><Btn onClick={()=>{setQuery('');setSearched(false);setSelected('');}}>Limpar</Btn></div></form></section>
  {loading&&<div className="cf-panel">Carregando frequência…</div>}{cadastrosError&&<div className="cf-alert">{cadastrosError}</div>}{searched&&!loading&&(!found.length?<div className="cf-panel cf-empty">Nenhum servidor encontrado. Confira o nome, CPF ou matrícula.</div>:<><section className="cf-panel"><h2>Resultado da pesquisa · {found.length} servidor(es)</h2>{found.length>1&&<div className="cf-results">{found.map(i=><button type="button" className={String(i.servidor?.id)===selected?'active':''} key={String(i.servidor?.id)} onClick={()=>setSelected(String(i.servidor?.id))}><strong>{i.servidor?.nome}</strong><small>{i.servidor?.matricula} · {i.servidor?.categoria}</small></button>)}</div>}</section>{chosen&&<section className="cf-panel cf-sheet-host"><div className="cf-toolbar"><h2>{chosen.servidor?.nome}</h2><div className="cf-buttons cf-print-hidden"><Btn onClick={()=>changeMonth(next(ano,mes,-1).ano,next(ano,mes,-1).mes)}><ChevronLeft size={15}/> Anterior</Btn><Btn onClick={()=>changeMonth(next(ano,mes,1).ano,next(ano,mes,1).mes)}>Próximo <ChevronRight size={15}/></Btn><Btn onClick={()=>window.print()}><Printer size={16}/> Imprimir tela</Btn><Btn variant="primary" disabled={busy} onClick={async()=>{setBusy(true);try{await baixarFrequenciaArquivo({ano,mes,formato:'pdf',modoExportacao:'individual',escopoExportacao:'servidor_selecionado',servidorId:chosen.servidor?.id,servidorCpf:chosen.servidor?.cpf},chosen.servidor||undefined);}catch(e:any){setError(e?.message||'Erro ao baixar.');}finally{setBusy(false);}}}><Download size={15}/> PDF oficial</Btn></div></div>{!(chosen.dayItems||[]).length&&<div className="cf-note">Este servidor foi encontrado no cadastro, mas não há ocorrências de frequência retornadas para esta competência. A folha abaixo é uma estrutura em branco para consulta; utilize o PDF oficial quando necessário.</div>}<Ficha item={chosen} ano={ano} mes={mes}/></section>}</>)}</>}
  {guia==='feriados'&&<div className="cf-events"><section className="cf-panel"><div className="cf-panel-title"><CalendarDays size={20}/><h2>Gerenciar feriados e eventos</h2></div><p>Registros permanentes na base de dados, usados no calendário e nas exportações.</p><MonthChooser ano={ano} mes={mes} onChange={changeMonth}/><form className="cf-form" onSubmit={saveEvent}><label>Data<input type="date" value={eventDate} onChange={e=>setEventDate(e.target.value)} required/></label><label>Tipo<select value={eventType} onChange={e=>setEventType(e.target.value as TipoEvento)}><option value="FERIADO">Feriado</option><option value="PONTO_FACULTATIVO">Ponto facultativo</option><option value="EVENTO">Evento</option></select></label><label>Título<input value={eventTitle} onChange={e=>setEventTitle(e.target.value)} placeholder="Nome do feriado" required/></label><label>Descrição<textarea value={eventDesc} onChange={e=>setEventDesc(e.target.value)} rows={3}/></label><label className="cf-check"><input type="checkbox" checked={eventActive} onChange={e=>setEventActive(e.target.checked)}/> Ativo no calendário</label><button type="submit" className="cf-btn cf-btn--primary" disabled={busy}><Plus size={16}/> Salvar evento</button></form></section><section className="cf-panel"><div className="cf-toolbar"><h2>Eventos — {label(ano,mes)}</h2><Btn onClick={()=>void loadEvents()}><RefreshCw size={15}/> Atualizar lista</Btn></div>{eventLoading?<p>Carregando…</p>:!eventos.length?<div className="cf-empty">Nenhum evento cadastrado para a competência.</div>:<div className="cf-event-list">{eventos.map(e=><div className="cf-event" key={e.id}><div><b>{dateBr(e.data)}</b> <span className="cf-tag">{e.tipo.replace('_',' ')}</span><h3>{e.titulo}</h3><p>{e.descricao}</p></div><Btn variant="danger" disabled={busy} onClick={()=>void deleteEvent(e.id)}><Trash2 size={15}/> Excluir</Btn></div>)}</div>}</section></div>}
  {guia==='exportar'&&<section className="cf-panel"><div className="cf-panel-title"><Download size={20}/><h2>Exportação de frequências</h2></div><p>Escolha os filtros abaixo. Não é necessário navegar por listas de servidores.</p><div className="cf-form cf-export"><fieldset><legend>Tipo de arquivo</legend><label className="cf-check"><input type="radio" checked={formato==='pdf'} onChange={()=>setFormato('pdf')}/> PDF</label><label className="cf-check"><input type="radio" checked={formato==='docx'} onChange={()=>setFormato('docx')}/> Word (DOCX)</label></fieldset><fieldset><legend>Modalidade</legend><label className="cf-check"><input type="radio" checked={modo==='lote'} onChange={()=>setModo('lote')}/> Em lote</label><label className="cf-check"><input type="radio" checked={modo==='individual'} onChange={()=>setModo('individual')}/> Servidor escolhido na pesquisa</label></fieldset>{modo==='individual'&&<div className="cf-export-person"><label>Pesquisar servidor para exportação<input placeholder="Digite o nome, CPF ou matrícula" value={exportQuery} onChange={e=>{setExportQuery(e.target.value);setSelected('');}} /></label>{exportQuery.trim()&&<div className="cf-export-choices">{exportMatches.length?exportMatches.map(s=><button type="button" key={String(s.id)} className={selected===String(s.id)?'active':''} onClick={()=>{setSelected(String(s.id));setExportQuery(`${s.nomeCompleto||s.nome} (${s.matricula})`);}}>{s.nomeCompleto||s.nome} · {s.matricula}</button>):<p>Nenhum servidor encontrado.</p>}</div>}{chosenForExport&&<p className="cf-selected-person">Selecionado: {chosenForExport.nome} · {chosenForExport.matricula}</p>}</div>}<fieldset><legend>Competência</legend><label className="cf-check"><input type="radio" checked={!periodo} onChange={()=>setPeriodo(false)}/> Mês selecionado</label><label className="cf-check"><input type="radio" checked={periodo} onChange={()=>setPeriodo(true)}/> Intervalo de meses</label></fieldset>{!periodo?<MonthChooser ano={ano} mes={mes} onChange={changeMonth}/>:<div className="cf-period"><div><b>De</b><MonthChooser ano={inicioAno} mes={inicioMes} onChange={(y,m)=>{setInicioAno(y);setInicioMes(m);}}/></div><div><b>Até</b><MonthChooser ano={fimAno} mes={fimMes} onChange={(y,m)=>{setFimAno(y);setFimMes(m);}}/></div></div>}
  {modo==='lote'&&<><fieldset><legend>Escopo</legend>{([['todos_ativos','Ativos'],['todos','Todos'],['categoria','Por categoria'],['setor','Por setor']] as const).map(([v,t])=><label key={v} className="cf-check"><input type="radio" checked={escopo===v} onChange={()=>setEscopo(v)}/>{t}</label>)}</fieldset><div className="cf-row"><label>Categoria<select value={categoria} onChange={e=>setCategoria(e.target.value)}><option value="">Todas as categorias</option>{categorias.map(c=><option key={c}>{c}</option>)}</select></label><label>Setor<select value={setor} onChange={e=>setSetor(e.target.value)}><option value="">Todos os setores</option>{setores.map(s=><option key={s}>{s}</option>)}</select></label></div><fieldset><legend>Arquivos do lote</legend><label className="cf-check"><input type="radio" checked={estrategia==='zip'} onChange={()=>setEstrategia('zip')}/> ZIP separado</label><label className="cf-check"><input type="radio" checked={estrategia==='documento_unico'} onChange={()=>setEstrategia('documento_unico')}/> Documento único (DOCX)</label></fieldset></>}
  <div className="cf-note">O backend atual exporta uma competência por requisição. No modo período, serão feitos downloads por mês; não é gerado um PDF único para todo o intervalo. Alguns navegadores pedem autorização para múltiplos downloads.</div><div className="cf-buttons"><Btn variant="primary" onClick={()=>void exportRun()} disabled={busy||loading}><Download size={16}/>{busy?'Gerando arquivos…':'Baixar frequências'}</Btn></div></div></section>}
  </main>;
}
