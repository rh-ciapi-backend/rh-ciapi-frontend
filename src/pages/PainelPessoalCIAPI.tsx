import React, { useMemo, useState } from 'react';
import { Activity, Download, RefreshCw, Search, Users, UserCheck, UserX, BarChart3, Printer, AlertCircle } from 'lucide-react';
import type { ServidorComVinculo } from '../services/servidoresService';
import './painel-pessoal-ciapi.css';

type Props = {
  servidores: ServidorComVinculo[];
  carregando: boolean;
  onAtualizar: () => void | Promise<void>;
  onConsultar: (situacao: 'TODOS' | 'ATIVO' | 'INATIVO', categoria?: string) => void;
};
type Registro = { id: string; nome: string; matricula: string; categoria: string; cargo: string; setor: string; status: string; vinculos: number };
const str = (v: unknown) => String(v ?? '').trim();
const normalizar = (v: unknown) => str(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const categorias = [
  { label: 'Federais SETRABES', tokens: ['FEDERAIS SETRABES', 'FEDERAL SETRABES', 'FEDERAIS'] },
  { label: 'Comissionados', tokens: ['COMISSIONADOS', 'COMISSIONADO'] },
  { label: 'Efetivos SETRABES', tokens: ['EFETIVO SETRABES', 'EFETIVOS SETRABES'] },
  { label: 'Efetivos SESAU', tokens: ['EFETIVO SESAU', 'EFETIVOS SESAU'] },
  { label: 'Seletivos SETRABES', tokens: ['SELETIVO SETRABES', 'SELETIVOS SETRABES'] },
  { label: 'Seletivos SESAU', tokens: ['SELETIVO SESAU', 'SELETIVOS SESAU'] },
];
function categoriaCanonica(valor: unknown): string {
  const nome = normalizar(valor).replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
  return categorias.find(c => c.tokens.includes(nome))?.label || (str(valor) ? 'Sem categoria padronizada' : 'Não informada');
}
function csvEsc(s: unknown) { return `"${str(s).replace(/"/g, '""')}"`; }
function baixarCsv(nome: string, linhas: (string | number)[][]) {
  const conteudo = '\uFEFF' + linhas.map(l => l.map(csvEsc).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = nome; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function PainelPessoalCIAPI({ servidores, carregando, onAtualizar, onConsultar }: Props) {
  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState<'TODOS' | 'ATIVO' | 'INATIVO'>('ATIVO');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [setorFiltro, setSetorFiltro] = useState('');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(() => new Date());
  const registros = useMemo<Registro[]>(() => servidores.map((s, idx) => ({
    id: str(s.id) || String(idx), nome: str(s.nomeCompleto || s.nome), matricula: str(s.matricula),
    categoria: categoriaCanonica(s.categoria), cargo: str(s.cargo), setor: str(s.setor),
    status: normalizar(s.status), vinculos: str(s.matriculaSegunda) && str(s.matriculaSegunda) !== str(s.matricula) ? 2 : 1,
  })), [servidores]);
  const ativos = useMemo(() => registros.filter(s => s.status === 'ATIVO'), [registros]);
  const setores = useMemo(() => Array.from(new Set(registros.map(s => s.setor).filter(Boolean))).sort(), [registros]);
  const distrib = useMemo(() => categorias.map(c => ({ nome: c.label, qtd: ativos.filter(s => s.categoria === c.label).length })), [ativos]);
  const desconhecidos = ativos.filter(s => !categorias.some(c => c.label === s.categoria)).length;
  const filtrados = useMemo(() => registros.filter(s =>
    (situacao === 'TODOS' || s.status === situacao) &&
    (!categoriaFiltro || s.categoria === categoriaFiltro) &&
    (!setorFiltro || s.setor === setorFiltro) &&
    (!busca.trim() || normalizar(`${s.nome} ${s.matricula} ${s.cargo}`).includes(normalizar(busca)))
  ), [registros, situacao, categoriaFiltro, setorFiltro, busca]);
  const cards = [
    { titulo: 'Servidores ativos', valor: ativos.length, ico: UserCheck, filtro: 'ATIVO' as const },
    { titulo: 'Servidores inativos', valor: registros.filter(s => s.status === 'INATIVO').length, ico: UserX, filtro: 'INATIVO' as const },
    { titulo: 'Total de servidores', valor: registros.length, ico: Users, filtro: 'TODOS' as const },
  ];
  const atualizar = async () => { await onAtualizar(); setUltimaAtualizacao(new Date()); };
  const exportar = () => baixarCsv('ciapi_painel_pessoal.csv', [
    ['Nome', 'Matrícula', 'Categoria', 'Cargo', 'Setor', 'Situação', 'Vínculos'],
    ...filtrados.map(s => [s.nome,s.matricula,s.categoria,s.cargo,s.setor,s.status,s.vinculos]),
  ]);
  return <div className="ciapi-pessoal-v2">
    <header className="ciapi-pessoal-v2-head"><div><p className="cp-kicker">CIAPI RH · GESTÃO DE PESSOAS</p><h2>Painel de Pessoal</h2><p>Quadro funcional atualizado a partir do cadastro de servidores.</p></div>
      <div className="cp-buttons"><button type="button" onClick={() => void atualizar()} disabled={carregando}><RefreshCw size={16}/> Atualizar dados</button><button type="button" onClick={exportar}><Download size={16}/> Exportar Excel (CSV)</button><button type="button" onClick={() => window.print()}><Printer size={16}/> Imprimir / PDF</button></div>
    </header>
    <p className="cp-update" role="status">Última atualização solicitada: {ultimaAtualizacao.toLocaleString('pt-BR')}{carregando ? ' · Consultando...' : ''}</p>
    <section className="cp-kpis" aria-label="Indicadores de pessoal">{cards.map(c => <button type="button" className="cp-card" key={c.titulo} onClick={() => { setSituacao(c.filtro); setCategoriaFiltro(''); }}><c.ico size={22}/><span>{c.titulo}</span><strong>{c.valor}</strong><small>Clique para filtrar</small></button>)}
      {distrib.map(c => <button type="button" className="cp-card" key={c.nome} onClick={() => { setSituacao('ATIVO'); setCategoriaFiltro(c.nome); }}><BarChart3 size={20}/><span>{c.nome}</span><strong>{c.qtd}</strong><small>Servidores ativos</small></button>)}
    </section>
    <section className="cp-panel"><div className="cp-panel-title"><h3>Distribuição por categoria funcional</h3><span>Base: {ativos.length} servidores ativos</span></div>
      <div className="cp-bars">{[...distrib, { nome: 'Não classificados', qtd: desconhecidos }].map(d => <div className="cp-bar" key={d.nome}><span>{d.nome}</span><div className="cp-track"><div style={{ width: `${ativos.length ? d.qtd / ativos.length * 100 : 0}%` }}/></div><b>{d.qtd} · {ativos.length ? (d.qtd / ativos.length * 100).toFixed(1) : '0,0'}%</b></div>)}</div>
      {desconhecidos > 0 && <p className="cp-notice"><AlertCircle size={15}/> Existem {desconhecidos} ativos com categoria ausente ou não padronizada. Eles não foram redistribuídos automaticamente.</p>}
    </section>
    <section className="cp-panel"><div className="cp-panel-title"><h3>Consultar quadro funcional</h3><span>{filtrados.length} registro(s) nos filtros</span></div>
      <div className="cp-filters"><label>Buscar servidor<input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome, matrícula ou cargo" /></label><label>Situação<select value={situacao} onChange={e => setSituacao(e.target.value as typeof situacao)}><option value="ATIVO">Ativos</option><option value="INATIVO">Inativos</option><option value="TODOS">Todos</option></select></label><label>Categoria<select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}><option value="">Todas</option>{[...categorias.map(c => c.label),'Sem categoria padronizada','Não informada'].map(c => <option key={c}>{c}</option>)}</select></label><label>Setor<select value={setorFiltro} onChange={e => setSetorFiltro(e.target.value)}><option value="">Todos</option>{setores.map(s => <option key={s}>{s}</option>)}</select></label><button type="button" onClick={() => {setBusca('');setSituacao('ATIVO');setCategoriaFiltro('');setSetorFiltro('');}}>Limpar filtros</button></div>
      <p className="cp-muted">Quantidade de pessoas cadastradas: {registros.length}. Vínculos informados: {registros.reduce((sum,s) => sum + s.vinculos, 0)}. O segundo vínculo é contado separadamente apenas neste indicador.</p>
      <div className="cp-table-wrap"><table><thead><tr><th>Servidor</th><th>Matrícula</th><th>Categoria</th><th>Setor</th><th>Situação</th></tr></thead><tbody>{filtrados.slice(0,200).map(s => <tr key={s.id}><td>{s.nome || 'Não informado'}</td><td>{s.matricula}</td><td>{s.categoria}</td><td>{s.setor || '—'}</td><td>{s.status}</td></tr>)}</tbody></table></div>
      {filtrados.length > 200 && <p className="cp-muted">Exibindo os primeiros 200 registros. Use a exportação para obter todos os resultados filtrados.</p>}
      <div className="cp-buttons cp-under"><button type="button" onClick={() => onConsultar(situacao)}>Abrir consulta de servidores</button></div>
    </section>
    <section className="cp-panel cp-unavailable"><h3>Indicadores administrativos complementares</h3><p>Férias vigentes, licenças, afastamentos, contratos próximos ao vencimento e áreas de atuação exigem dados dos respectivos módulos ou uma classificação administrativa validada. Esses totais não serão apresentados como zero nem estimados até a integração ser confirmada.</p></section>
  </div>;
}
