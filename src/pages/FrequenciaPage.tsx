import DashboardIcon from '../components/dashboard/DashboardIcon';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Download, FileText, Loader2, Printer, Search, RefreshCw, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { listarFrequenciaMensal, baixarFrequenciaArquivo, type FrequenciaMensalItem, type FrequenciaDayItem, type FrequenciaExportPayload } from '../services/frequenciaService';
import { criarEvento, excluirEvento, listarEventos, type EventoCalendario, type EventoInput, type TipoEvento } from '../services/eventosService';
import { servidoresService, type ServidorComVinculo } from '../services/servidoresService';
import './frequencia-tres-guias.css';
import { carregarAssinaturas, salvarAssinaturas, ASSINATURAS_INICIAIS, type AssinaturasFrequencia, type AutoridadeAssinatura } from '../services/assinaturasFrequenciaService';

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
function Ficha({item,ano,mes,assinante}:{item:FrequenciaMensalItem;ano:number;mes:number;assinante:AutoridadeAssinatura}) {
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
      <div className="cf-official-meta-line cf-official-meta-three"><span><…9557 tokens truncated…bel="Mês" value={filtros.mes} onChange={e=>setFiltros(f=>({...f,mes:Number(e.target.value)}))}>{MESES.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select>
        <input aria-label="Ano" type="number" min={2020} max={2100} value={filtros.ano} onChange={e=>setFiltros(f=>({...f,ano:Number(e.target.value)}))}/>
        <button type="button" className="ciapi-mapas-button subtle" onClick={()=>setRecarregar(v=>v+1)}>Atualizar</button>
      </div>
      <div className="ciapi-mapas-paper">
        <div className="ciapi-mapas-paper-heading">
          <p>GOVERNO DO ESTADO DE RORAIMA</p><p>SECRETARIA DO TRABALHO E BEM-ESTAR SOCIAL</p>
          <h3>MAPA DE FREQUÊNCIA DOS SERVIDORES {grupo.titulo.toUpperCase()} — {grupo.subtitulo}</h3>
          <p>COMPETÊNCIA: {MESES[(filtros.mes || 1) - 1]?.toUpperCase()}/{filtros.ano}</p>
        </div>
        {carregando ? <div className="ciapi-mapas-empty">Carregando os registros do RH CIAPI...</div>
        : <div className="ciapi-mapas-table-scroll"><table className="ciapi-mapas-table">
          <thead><tr>{(isSesau ? ['Nº','Matrícula','Matrícula SIGRH / Início','Servidor','CPF','Cargo','Frequência','Faltas','Lotação / Setor','CH / Observação'] : ['Nº','Matrícula','Servidor','CPF','Cargo','Frequência','Faltas','Observação']).map((h, i) => <th key={h} className={i === 0 ? 'ciapi-mapas-numero' : undefined}>{h}</th>)}</tr></thead>
          <tbody>{!exibidas.length ? <tr><td colSpan={isSesau ? 10 : 8} className="ciapi-mapas-empty">Nenhum registro retornado para os filtros selecionados.</td></tr>
          : exibidas.map((r, index) => {
            const nome = obter(r, 'nome', 'nome_servidor', 'nomeServidor', 'servidor', 'nome_completo', 'nomeCompleto');
            const matricula = obter(r, 'matricula', 'matricula_servidor', 'matriculaServidor');
            const cpf = obter(r, 'cpf');
            const cargo = obter(r, 'cargo', 'funcao');
            const freq = obter(r, 'frequencia', 'frequencias', 'freq');
            const faltas = obter(r, 'faltas', 'totalFaltas', 'total_faltas');
            const obsOriginal = obter(r, 'observacao', 'observacoes');
            const ocorrencias = eventosPorMatricula.get(matricula.replace(/\D/g,'')) || [];
            const complemento = ocorrencias.map(o => `${o.tipo}: ${o.descricao}`).join(' | ');
            const obs = [obsOriginal === '—' ? '' : obsOriginal, complemento].filter(Boolean).join(' | ') || '—';
            const faltasRegistradas = ocorrencias.filter(o=>o.tipo==='FALTA').length;
            const setor = obter(r, 'lotacao', 'setor', 'setorInterno', 'setor_interno');
            const carga = obter(r, 'cargaHoraria', 'carga_horaria', 'chSemanal', 'ch_semanal');
            const inicio = obter(r, 'inicioAtividades', 'inicio_atividades', 'dataInicio', 'data_inicio');
            const sig = obter(r, 'matriculaSigrh', 'matricula_sigrh', 'matriculaSIGRH');
            return <tr key={`${matricula}-${index}`}>
              <td className="ciapi-mapas-numero">{String((pagina-1)*100+index+1).padStart(2,'0')}</td><td>{cell(matricula)}</td>
              {isSesau && <td>{cell(sig !== '—' ? sig : inicio)}</td>}
              <td className="nome">{cell(nome)}</td><td>{cell(cpf)}</td><td>{cell(cargo)}</td>
              <td>{cell(freq)}</td><td>{cell(faltas)}{faltasRegistradas ? ` · ${faltasRegistradas} lançamento(s) adicional(is)` : ''}</td>
              {isSesau && <td>{cell(setor)}</td>}
              <td className="observacao" title={obs}>{cell(isSesau && carga !== '—' ? `${carga}${obs !== '—' ? ' · ' + obs : ''}` : obs)}<button type="button" className="ciapi-mapas-editar" onClick={()=>abrirEdicao(matricula,nome)}>Editar / lançar</button></td>
            </tr>;
          })}</tbody></table></div>}
        <div className="ciapi-mapas-footnote">A tabela utiliza os registros retornados pelo sistema. O documento oficial é gerado pelos botões de exportação.</div>
      </div>
      <div className="ciapi-mapas-footer">
        <span>{filtradas.length} registro(s) na consulta{paginas > 1 ? ` · página ${pagina} de ${paginas}` : ''}</span>
        {paginas > 1 && <div className="ciapi-mapas-buttons"><button className="ciapi-mapas-button subtle" onClick={() => setPagina(x => Math.max(1,x-1))} disabled={pagina === 1}>Anterior</button><button className="ciapi-mapas-button subtle" onClick={() => setPagina(x => Math.min(paginas,x+1))} disabled={pagina === paginas}>Próximo</button></div>}
      </div>
      {mostrarDiagnostico && preview && <aside className="ciapi-mapas-diagnostic"><strong>Validação do mapa</strong><p>Registros inválidos: {preview.diagnostics?.registrosInvalidos?.length ?? 0} · Páginas previstas: {preview.diagnostics?.paginasPrevistas ?? '—'}</p>{(preview.diagnostics?.alertas || []).map((a, i) => <p key={i}>{String(a)}</p>)}</aside>}
    </section>}
    {editando && <div className="ciapi-mapas-dialog-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !salvandoRegistro) setEditando(null); }}>
      <section className="ciapi-mapas-dialog" role="dialog" aria-modal="true" aria-labelledby="ciapi-dialog-titulo">
        <h3 id="ciapi-dialog-titulo">Registrar ocorrência do servidor</h3>
        <p><strong>{editando.nome}</strong> · Matrícula {editando.matricula}</p>
        <p>Competência: {MESES[filtros.mes-1]}/{filtros.ano}</p>
        <label>Tipo de registro
          <select value={tipoRegistro} onChange={e => setTipoRegistro(e.target.value as 'OBSERVACAO'|'ATESTADO'|'FALTA')}>
            <option value="OBSERVACAO">Observação</option><option value="ATESTADO">Atestado (registro informativo)</option><option value="FALTA">Falta (registro informativo)</option>
          </select>
        </label>
        <label>Data
          <input type="date" value={dataRegistro} min={`${filtros.ano}-${String(filtros.mes).padStart(2,'0')}-01`}
            max={`${filtros.ano}-${String(filtros.mes).padStart(2,'0')}-${new Date(filtros.ano, filtros.mes, 0).getDate()}`}
            onChange={e => setDataRegistro(e.target.value)}/>
        </label>
        {tipoRegistro === 'FALTA' && <label>Turno
          <select value={turnoRegistro} onChange={e => setTurnoRegistro(e.target.value as 'T1'|'T2'|'AMBOS')}>
            <option value="T1">1º turno</option><option value="T2">2º turno</option><option value="AMBOS">Ambos</option>
          </select>
        </label>}
        <label>Descrição
          <textarea rows={4} maxLength={4000} value={textoRegistro} onChange={e => setTextoRegistro(e.target.value)} placeholder="Descreva a ocorrência..." />
        </label>
        {tipoRegistro !== 'OBSERVACAO' && <p className="ciapi-mapas-alerta">Este lançamento registra apenas o histórico complementar. Para atualizar a frequência oficial, utilize o módulo Frequência ou Atestados.</p>}
        {erroEdicao && <div className="ciapi-mapas-error" role="alert"><AlertTriangle size={16}/>{erroEdicao}</div>}
        <div className="ciapi-mapas-dialog-actions">
          <button type="button" disabled={salvandoRegistro} onClick={() => setEditando(null)}>Cancelar</button>
          <button type="button" disabled={salvandoRegistro || !textoRegistro.trim() || !dataRegistro} onClick={salvarRegistro}>
            {salvandoRegistro ? 'Salvando...' : 'Salvar ocorrência'}
          </button>
        </div>
        <p className="ciapi-mapas-dialog-hint">Os registros salvos aparecem no histórico do servidor. Esta versão permite novos lançamentos; correções de registros anteriores dependem de procedimento auditável.</p>
      </section>
    </div>}
  </main>;
}
