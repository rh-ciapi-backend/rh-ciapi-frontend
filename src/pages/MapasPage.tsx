import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Download, FileArchive, FileText, RefreshCw, Search, Users } from 'lucide-react';
import { mapasService } from '../services/mapasService';
import type { MapaFilters, MapaPreviewResponse } from '../types/mapas';
import './mapas-setores-claro.css';

/**
 * Cada guia representa uma categoria de mapa institucional. Nenhuma linha é
 * cadastrada localmente: sempre usamos mapasService.listarPreview().
 */
const GRUPOS = [
  { chave: 'COMISSIONADOS', titulo: 'Comissionados', subtitulo: 'SETRABES', familia: 'setrabes' },
  { chave: 'FEDERAIS SETRABES', titulo: 'Federais', subtitulo: 'SETRABES', familia: 'setrabes' },
  { chave: 'EFETIVO SETRABES', titulo: 'Efetivos', subtitulo: 'SETRABES', familia: 'setrabes' },
  { chave: 'SELETIVO SETRABES', titulo: 'Seletivos', subtitulo: 'SETRABES', familia: 'setrabes' },
  { chave: 'EFETIVO SESAU', titulo: 'Efetivos', subtitulo: 'SESAU', familia: 'sesau' },
  { chave: 'SELETIVO SESAU', titulo: 'Seletivos', subtitulo: 'SESAU', familia: 'sesau' },
] as const;

type Grupo = typeof GRUPOS[number];
type Linha = Record<string, unknown>;
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const PRIMEIRO_GRUPO = GRUPOS[0];

function str(value: unknown): string { return value === null || value === undefined ? '' : String(value).trim(); }
function obter(row: Linha, ...campos: string[]) {
  for (const campo of campos) {
    const value = row[campo];
    if (value !== null && value !== undefined && str(value)) return str(value);
  }
  return '—';
}
function normalizar(value: unknown) { return str(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); }
function cell(value: string) { return value === '—' ? '' : value; }
function countPages(rows: number) { return rows ? Math.ceil(rows / 100) : 0; }
const filtrosIniciais: MapaFilters = {
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
  categoria: PRIMEIRO_GRUPO.chave,
  setor: '',
  status: 'ATIVO',
  layout: 'automatico',
  modoExportacao: 'arquivo_unico',
};

type MapasPageProps = { initialAction?: string | null };
export default function MapasPage({ initialAction }: MapasPageProps) {
  const [grupo, setGrupo] = useState<Grupo>(PRIMEIRO_GRUPO);
  const [aba, setAba] = useState<string>(PRIMEIRO_GRUPO.chave);
  const [mapasParaExportar, setMapasParaExportar] = useState<string[]>([PRIMEIRO_GRUPO.chave]);
  const [formatoExportacao, setFormatoExportacao] = useState<'pdf'|'docx'|'zip'>('pdf');
  const [filtros, setFiltros] = useState<MapaFilters>(filtrosIniciais);
  const [preview, setPreview] = useState<MapaPreviewResponse | null>(null);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [exportando, setExportando] = useState('');
  const [erro, setErro] = useState('');
  const [recarregar, setRecarregar] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [mostrarDiagnostico, setMostrarDiagnostico] = useState(false);
  const [validando, setValidando] = useState(false);

  const selecionarGrupo = (novo: Grupo) => {
    setGrupo(novo);
    setAba(novo.chave);
    setBusca('');
    setPagina(1);
    setMostrarDiagnostico(false);
    setFiltros(f => ({...f, categoria: novo.chave, layout: 'automatico'}));
  };

  useEffect(() => {
    if (!initialAction) return;
    if (initialAction === 'mapa-exportar') {
      setAba('exportar');
      setErro('');
      return;
    }
    const codigo = initialAction.startsWith('mapa-') ? initialAction.slice(5) : initialAction;
    const selecionado = GRUPOS.find(g => g.chave === codigo);
    if (selecionado) selecionarGrupo(selecionado);
  }, [initialAction]);

  useEffect(() => {
    let ativo = true;
    setPreview(null);
    setErro('');
    setCarregando(true);
    mapasService.listarPreview(filtros)
      .then(dados => { if (ativo) setPreview(dados); })
      .catch((e: unknown) => { if (ativo) setErro(e instanceof Error ? e.message : 'Não foi possível consultar o mapa.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [filtros, recarregar]);

  const linhas = useMemo(() => (preview?.linhas || []) as unknown as Linha[], [preview]);
  const filtradas = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo) return linhas;
    return linhas.filter(row => Object.values(row).some(value =>
      (typeof value === 'string' || typeof value === 'number') && normalizar(value).includes(termo)
    ));
  }, [linhas, busca]);
  const paginas = countPages(filtradas.length);
  const exibidas = filtradas.slice((pagina - 1) * 100, pagina * 100);
  const isSesau = grupo.familia === 'sesau';
  const selectGrupo = useCallback((chave: string) => {
    const novo = GRUPOS.find(g => g.chave === chave);
    if (novo) selecionarGrupo(novo);
  }, []);
  const mudarFiltro = (patch: Partial<MapaFilters>) => {
    setPagina(1);
    setFiltros(f => ({...f, ...patch, categoria: grupo.chave}));
  };
  const baixar = async (formato: 'pdf'|'docx'|'zip') => {
    setErro('');
    setExportando(formato);
    try {
      if (formato === 'pdf') await mapasService.exportarPdf(filtros);
      else if (formato === 'docx') await mapasService.exportarDocx(filtros);
      else await mapasService.exportarZip(filtros);
    } catch(e: unknown) { setErro(e instanceof Error ? e.message : 'Erro ao exportar o mapa.'); }
    finally { setExportando(''); }
  };
  const baixarSelecionados = async () => {
    if (!mapasParaExportar.length) { setErro('Selecione pelo menos um mapa para exportar.'); return; }
    setErro(''); setExportando('selecionados');
    const falhas: string[] = [];
    try {
      for (const chave of mapasParaExportar) {
        const grupoAtual = GRUPOS.find(g => g.chave === chave);
        if (!grupoAtual) continue;
        const parametros: MapaFilters = {
          ...filtros, categoria: chave,
          layout: 'automatico',
          modoExportacao: formatoExportacao === 'zip' ? 'arquivos_separados' : 'arquivo_unico',
        };
        try {
          if (formatoExportacao === 'pdf') await mapasService.exportarPdf(parametros);
          else if (formatoExportacao === 'docx') await mapasService.exportarDocx(parametros);
          else await mapasService.exportarZip(parametros);
        } catch (error) {
          falhas.push(`${grupoAtual.titulo} ${grupoAtual.subtitulo}: ${error instanceof Error ? error.message : 'falha ao exportar'}`);
        }
      }
      if (falhas.length) setErro(`Algumas exportações falharam: ${falhas.join(' | ')}`);
    } finally { setExportando(''); }
  };
  const marcarMapa = (chave: string) => setMapasParaExportar(lista => lista.includes(chave) ? lista.filter(c => c !== chave) : [...lista, chave]);
  const todosMarcados = mapasParaExportar.length === GRUPOS.length;
  const validar = async () => {
    setValidando(true);
    setErro('');
    try {
      const response = await mapasService.validar(filtros);
      setPreview(prev => ({ ...response, linhas: prev?.linhas?.length ? prev.linhas : response.linhas }));
      setMostrarDiagnostico(true);
    } catch(e: unknown) { setErro(e instanceof Error ? e.message : 'Erro ao validar o mapa.'); }
    finally { setValidando(false); }
  };

  return <main className="ciapi-mapas-page">
    {aba === 'exportar' ? <section className="ciapi-mapas-workspace ciapi-mapas-export" role="tabpanel">
      <div className="ciapi-mapas-panel-title"><div><div className="ciapi-mapas-eyebrow">EXPORTAÇÃO DE MAPAS</div>
        <h2>Exportar mapas de frequência</h2><p>Marque uma categoria, várias categorias ou todos os mapas. Os arquivos são gerados com os dados do banco.</p></div></div>
      <div className="ciapi-mapas-export-section"><strong>Mapas para exportação</strong>
        <label className="ciapi-mapas-check-all"><input type="checkbox" checked={todosMarcados}
          onChange={e => setMapasParaExportar(e.target.checked ? GRUPOS.map(g => g.chave) : [])}/>
          Todos os mapas (6 categorias)</label>
        <div className="ciapi-mapas-choice-grid">{GRUPOS.map(item => <label key={item.chave}>
          <input type="checkbox" checked={mapasParaExportar.includes(item.chave)} onChange={() => marcarMapa(item.chave)}/>
          {item.titulo} {item.subtitulo}</label>)}</div>
      </div>
      <div className="ciapi-mapas-export-section"><strong>Competência e filtros</strong>
        <div className="ciapi-mapas-filters">
          <label><span>Mês</span><select value={filtros.mes} onChange={e => setFiltros(f => ({...f, mes: Number(e.target.value)}))}>{MESES.map((m,i) => <option key={m} value={i+1}>{m}</option>)}</select></label>
          <label><span>Ano</span><input type="number" min={2020} max={2100} value={filtros.ano} onChange={e => setFiltros(f => ({...f,ano:Number(e.target.value)||new Date().getFullYear()}))}/></label>
          <label><span>Setor / lotação (opcional)</span><input placeholder="Todos os setores" value={filtros.setor||''} onChange={e => setFiltros(f => ({...f,setor:e.target.value}))}/></label>
          <label><span>Situação</span><select value={filtros.status||''} onChange={e => setFiltros(f => ({...f,status:e.target.value}))}><option value="ATIVO">Ativos</option><option value="INATIVO">Inativos</option><option value="">Todos</option></select></label>
        </div>
      </div>
      <div className="ciapi-mapas-export-section"><strong>Formato do arquivo</strong>
        <div className="ciapi-mapas-radio-row">{(['pdf','docx','zip'] as const).map(tipo => <label key={tipo}>
          <input type="radio" checked={formatoExportacao === tipo} onChange={() => setFormatoExportacao(tipo)}/>
          {tipo==='docx'?'Word (DOCX)':tipo.toUpperCase()}</label>)}</div>
      </div>
      <p className="ciapi-mapas-export-note">{mapasParaExportar.length} mapa(s) selecionado(s). Ao selecionar todos, o sistema solicita até seis downloads individuais. Seu navegador pode pedir autorização para downloads múltiplos. O ZIP usa o gerador existente e não necessariamente consolida todas as categorias num único arquivo.</p>
      {erro && <div className="ciapi-mapas-error" role="alert"><AlertTriangle size={17}/>{erro}</div>}
      <button type="button" className="ciapi-mapas-button primary" onClick={baixarSelecionados} disabled={!!exportando||!mapasParaExportar.length}>
        <Download size={16}/> {exportando ? 'Gerando arquivos...' : `Baixar ${mapasParaExportar.length} mapa(s)`}</button>
    </section> : <section className="ciapi-mapas-workspace ciapi-mapas-map-only" role="tabpanel">

      {erro && <div className="ciapi-mapas-error" role="alert"><AlertTriangle size={17}/>{erro}</div>}
      <div className="ciapi-mapas-paper">
        <div className="ciapi-mapas-paper-heading">
          <p>GOVERNO DO ESTADO DE RORAIMA</p><p>SECRETARIA DO TRABALHO E BEM-ESTAR SOCIAL</p>
          <h3>MAPA DE FREQUÊNCIA DOS SERVIDORES {grupo.titulo.toUpperCase()} — {grupo.subtitulo}</h3>
          <p>COMPETÊNCIA: {MESES[(filtros.mes || 1) - 1]?.toUpperCase()}/{filtros.ano}</p>
        </div>
        {carregando ? <div className="ciapi-mapas-empty">Carregando os registros do RH CIAPI...</div>
        : <div className="ciapi-mapas-table-scroll"><table className="ciapi-mapas-table">
          <thead><tr>{(isSesau ? ['Nº','Matrícula','Matrícula SIGRH / Início','Servidor','CPF','Cargo','Frequência','Faltas','Lotação / Setor','CH / Observação'] : ['Nº','Matrícula','Servidor','CPF','Cargo','Frequência','Faltas','Observação']).map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{!exibidas.length ? <tr><td colSpan={isSesau ? 10 : 8} className="ciapi-mapas-empty">Nenhum registro retornado para os filtros selecionados.</td></tr>
          : exibidas.map((r, index) => {
            const nome = obter(r, 'nome', 'nome_servidor', 'nomeServidor', 'servidor', 'nome_completo', 'nomeCompleto');
            const matricula = obter(r, 'matricula', 'matricula_servidor', 'matriculaServidor');
            const cpf = obter(r, 'cpf');
            const cargo = obter(r, 'cargo', 'funcao');
            const freq = obter(r, 'frequencia', 'frequencias', 'freq');
            const faltas = obter(r, 'faltas', 'totalFaltas', 'total_faltas');
            const obs = obter(r, 'observacao', 'observacoes');
            const setor = obter(r, 'lotacao', 'setor', 'setorInterno', 'setor_interno');
            const carga = obter(r, 'cargaHoraria', 'carga_horaria', 'chSemanal', 'ch_semanal');
            const inicio = obter(r, 'inicioAtividades', 'inicio_atividades', 'dataInicio', 'data_inicio');
            const sig = obter(r, 'matriculaSigrh', 'matricula_sigrh', 'matriculaSIGRH');
            return <tr key={`${matricula}-${index}`}>
              <td>{String((pagina-1)*100+index+1).padStart(2,'0')}</td><td>{cell(matricula)}</td>
              {isSesau && <td>{cell(sig !== '—' ? sig : inicio)}</td>}
              <td className="nome">{cell(nome)}</td><td>{cell(cpf)}</td><td>{cell(cargo)}</td>
              <td>{cell(freq)}</td><td>{cell(faltas)}</td>
              {isSesau && <td>{cell(setor)}</td>}
              <td className="observacao" title={obs}>{cell(isSesau && carga !== '—' ? `${carga}${obs !== '—' ? ' · ' + obs : ''}` : obs)}</td>
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
  </main>;
}
