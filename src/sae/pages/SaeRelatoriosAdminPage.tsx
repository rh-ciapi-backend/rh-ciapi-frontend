import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Download,
  FileDown,
  FileText,
  FilterX,
  Loader2,
  MapPin,
  Search,
  Users,
} from 'lucide-react';

import {
  saeAdministrativoService,
  type SaeAdminDocumento,
  type SaeAdminUsuario,
} from './saeAdministrativoService';
import { saeDocumentosService } from '../services/saeDocumentosService';

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const escapeCsv = (value: unknown) => {
  const text = String(value ?? '').replace(/"/g, '""');
  return `"${text}"`;
};

const baixarCsv = (filename: string, headers: string[], rows: unknown[][]) => {
  const content = '\uFEFF' + [
    headers.map(escapeCsv).join(';'),
    ...rows.map((row) => row.map(escapeCsv).join(';')),
  ].join('\r\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function SaeRelatoriosAdminPage() {
  const [usuarios, setUsuarios] = useState<SaeAdminUsuario[]>([]);
  const [documentos, setDocumentos] = useState<SaeAdminDocumento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [busca, setBusca] = useState('');
  const [bairro, setBairro] = useState('TODOS');
  const [sexo, setSexo] = useState('TODOS');
  const [turno, setTurno] = useState('TODOS');
  const [situacao, setSituacao] = useState('TODOS');
  const [idadeMin, setIdadeMin] = useState('');
  const [idadeMax, setIdadeMax] = useState('');
  const [profissionalId, setProfissionalId] = useState('TODOS');
  const [statusDocumento, setStatusDocumento] = useState('TODOS');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    Promise.all([
      saeAdministrativoService.listarUsuarios(),
      saeAdministrativoService.listarDocumentos(),
    ])
      .then(([users, docs]) => {
        setUsuarios(users);
        setDocumentos(docs);
      })
      .catch((error) =>
        setErro(error instanceof Error ? error.message : 'Falha ao carregar os relatórios.'),
      )
      .finally(() => setCarregando(false));
  }, []);

  const bairros = useMemo(
    () =>
      Array.from(new Set(usuarios.map((item) => item.bairro).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [usuarios],
  );

  const profissionais = useMemo(() => {
    const map = new Map<string, string>();
    documentos.forEach((doc) => {
      if (doc.profissionalId) map.set(doc.profissionalId, doc.profissionalNome);
    });
    return Array.from(map.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [documentos]);

  const filtrados = useMemo(() => {
    const termo = normalize(busca);
    const min = idadeMin ? Number(idadeMin) : null;
    const max = idadeMax ? Number(idadeMax) : null;

    return usuarios.filter((item) => {
      if (
        termo &&
        ![item.nome, item.prontuario, item.bairro, item.telefone]
          .some((value) => normalize(value).includes(termo))
      ) return false;
      if (bairro !== 'TODOS' && item.bairro !== bairro) return false;
      if (sexo !== 'TODOS' && item.sexo !== sexo) return false;
      if (turno !== 'TODOS' && item.turno !== turno) return false;
      if (situacao !== 'TODOS' && item.situacao !== situacao) return false;
      if (min !== null && (item.idade === null || item.idade < min)) return false;
      if (max !== null && (item.idade === null || item.idade > max)) return false;
      return true;
    });
  }, [usuarios, busca, bairro, sexo, turno, situacao, idadeMin, idadeMax]);

  const idsFiltrados = useMemo(
    () => new Set(filtrados.map((item) => item.id)),
    [filtrados],
  );

  const docsFiltrados = useMemo(
    () =>
      documentos.filter((doc) => {
        if (!idsFiltrados.has(doc.usuarioId)) return false;
        if (profissionalId !== 'TODOS' && doc.profissionalId !== profissionalId) return false;
        if (statusDocumento !== 'TODOS' && doc.status !== statusDocumento) return false;
        const data = (doc.createdAt || '').slice(0, 10);
        if (dataInicio && data < dataInicio) return false;
        if (dataFim && data > dataFim) return false;
        return true;
      }),
    [documentos, idsFiltrados, profissionalId, statusDocumento, dataInicio, dataFim],
  );

  const idadeMedia = useMemo(() => {
    const ages = filtrados.map((u) => u.idade).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (!ages.length) return 0;
    return Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
  }, [filtrados]);

  const faixas = useMemo(() => {
    const result = [
      { label: 'Até 59', total: 0 },
      { label: '60–69', total: 0 },
      { label: '70–79', total: 0 },
      { label: '80–89', total: 0 },
      { label: '90+', total: 0 },
    ];
    filtrados.forEach((u) => {
      const i = u.idade ?? -1;
      if (i < 0) return;
      if (i <= 59) result[0].total++;
      else if (i <= 69) result[1].total++;
      else if (i <= 79) result[2].total++;
      else if (i <= 89) result[3].total++;
      else result[4].total++;
    });
    return result;
  }, [filtrados]);

  const porBairro = useMemo(() => {
    const map = new Map<string, number>();
    filtrados.forEach((u) => {
      const key = u.bairro || 'Não informado';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, 'pt-BR'))
      .slice(0, 12);
  }, [filtrados]);

  const relatoriosPorProfissional = useMemo(() => {
    const map = new Map<string, number>();
    docsFiltrados.forEach((doc) => {
      const key = doc.profissionalNome || 'Não informado';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total);
  }, [docsFiltrados]);

  const limpar = () => {
    setBusca('');
    setBairro('TODOS');
    setSexo('TODOS');
    setTurno('TODOS');
    setSituacao('TODOS');
    setIdadeMin('');
    setIdadeMax('');
    setProfissionalId('TODOS');
    setStatusDocumento('TODOS');
    setDataInicio('');
    setDataFim('');
  };

  const exportar = () => {
    const reportsByUser = new Map<string, number>();
    docsFiltrados.forEach((doc) => {
      reportsByUser.set(doc.usuarioId, (reportsByUser.get(doc.usuarioId) || 0) + 1);
    });

    baixarCsv(
      `sae-usuarios-filtrados-${new Date().toISOString().slice(0, 10)}.csv`,
      ['PRONTUÁRIO', 'NOME', 'IDADE', 'SEXO', 'BAIRRO', 'TURNO', 'SITUAÇÃO', 'TELEFONE', 'ENDEREÇO', 'RELATÓRIOS'],
      filtrados.map((u) => [
        u.prontuario,
        u.nome,
        u.idade ?? '',
        u.sexo,
        u.bairro,
        u.turno,
        u.situacao,
        u.telefone,
        u.endereco,
        reportsByUser.get(u.id) || 0,
      ]),
    );
  };

  const baixarModelo = () => {
    baixarCsv(
      'modelo-relatorio-usuarios-sae.csv',
      ['PRONTUÁRIO', 'NOME', 'IDADE', 'SEXO', 'BAIRRO', 'TURNO', 'SITUAÇÃO', 'TELEFONE', 'ENDEREÇO', 'RELATÓRIOS'],
      [],
    );
  };

  if (carregando) {
    return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="app-surface p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">SAE Administrativo</p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Relatórios consolidados</h1>
            <p className="mt-2 text-sm text-slate-400">
              Filtre usuários, bairros, idade e produção profissional. Exporte exatamente o resultado filtrado.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex">
            <button onClick={baixarModelo} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-dark px-4 text-sm font-bold text-slate-300 hover:bg-slate-800">
              <FileDown size={17} /> Modelo da planilha
            </button>
            <button onClick={exportar} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white hover:bg-primary-hover">
              <Download size={17} /> Baixar dados filtrados
            </button>
          </div>
        </div>
      </section>

      {erro && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" /> {erro}
        </div>
      )}

      <section className="app-surface p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <label className="space-y-2 xl:col-span-2">
            <span className="text-xs font-bold uppercase tracking-[0.13em] text-slate-400">Busca</span>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, prontuário, bairro..." className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 pl-10 pr-3 text-sm text-white outline-none" />
            </div>
          </label>

          <Filter label="Bairro">
            <select value={bairro} onChange={(e) => setBairro(e.target.value)} className="input-admin">
              <option value="TODOS">Todos</option>
              {bairros.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Filter>

          <Filter label="Sexo">
            <select value={sexo} onChange={(e) => setSexo(e.target.value)} className="input-admin">
              <option value="TODOS">Todos</option>
              {Array.from(new Set(usuarios.map((u) => u.sexo).filter(Boolean))).sort().map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Filter>

          <Filter label="Turno">
            <select value={turno} onChange={(e) => setTurno(e.target.value)} className="input-admin">
              <option value="TODOS">Todos</option>
              {Array.from(new Set(usuarios.map((u) => u.turno).filter(Boolean))).sort().map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Filter>

          <Filter label="Situação">
            <select value={situacao} onChange={(e) => setSituacao(e.target.value)} className="input-admin">
              <option value="TODOS">Todas</option>
              {Array.from(new Set(usuarios.map((u) => u.situacao).filter(Boolean))).sort().map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Filter>

          <Filter label="Idade mínima">
            <input type="number" min="0" value={idadeMin} onChange={(e) => setIdadeMin(e.target.value)} className="input-admin" />
          </Filter>

          <Filter label="Idade máxima">
            <input type="number" min="0" value={idadeMax} onChange={(e) => setIdadeMax(e.target.value)} className="input-admin" />
          </Filter>

          <Filter label="Profissional / relatório">
            <select value={profissionalId} onChange={(e) => setProfissionalId(e.target.value)} className="input-admin">
              <option value="TODOS">Todos</option>
              {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </Filter>

          <Filter label="Status do relatório">
            <select value={statusDocumento} onChange={(e) => setStatusDocumento(e.target.value)} className="input-admin">
              <option value="TODOS">Todos</option>
              <option value="RASCUNHO">Rascunho</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="ASSINADO">Assinado</option>
            </select>
          </Filter>

          <Filter label="Relatório de">
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="input-admin" />
          </Filter>
          <Filter label="Relatório até">
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="input-admin" />
          </Filter>

          <div className="flex items-end">
            <button onClick={limpar} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-dark px-4 text-sm font-bold text-slate-300 hover:bg-slate-800">
              <FilterX size={16} /> Limpar
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Usuários" value={filtrados.length} icon={Users} />
        <Kpi label="Idade média" value={idadeMedia} icon={BarChart3} suffix=" anos" />
        <Kpi label="Relatórios" value={docsFiltrados.length} icon={FileText} />
        <Kpi label="Bairros" value={new Set(filtrados.map((u) => u.bairro).filter(Boolean)).size} icon={MapPin} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Distribution title="Faixa etária" items={faixas} total={filtrados.length} />
        <Distribution title="Principais bairros" items={porBairro} total={filtrados.length} />
        <Distribution title="Relatórios por profissional" items={relatoriosPorProfissional} total={docsFiltrados.length} />
      </div>

      <section className="app-surface overflow-hidden">
        <div className="border-b border-border-dark p-4 sm:p-5">
          <h2 className="font-bold text-white">Usuários filtrados</h2>
          <p className="mt-1 text-xs text-slate-500">{filtrados.length} registro(s). Ex.: selecione “Pricumã” no filtro Bairro para obter somente os moradores desse bairro.</p>
        </div>
        <div className="responsive-scroll">
          <table className="min-w-[920px] w-full text-left text-sm">
            <thead className="bg-slate-900/40 text-[11px] uppercase tracking-[0.12em] text-slate-500">
              <tr><th className="px-4 py-3">Pront.</th><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Idade</th><th className="px-4 py-3">Sexo</th><th className="px-4 py-3">Bairro</th><th className="px-4 py-3">Turno</th><th className="px-4 py-3">Situação</th><th className="px-4 py-3">Telefone</th></tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {filtrados.slice(0, 300).map((u) => (
                <tr key={u.id} className="text-slate-300"><td className="px-4 py-3">{u.prontuario || '—'}</td><td className="px-4 py-3 font-medium text-white">{u.nome}</td><td className="px-4 py-3">{u.idade ?? '—'}</td><td className="px-4 py-3">{u.sexo || '—'}</td><td className="px-4 py-3">{u.bairro || '—'}</td><td className="px-4 py-3">{u.turno || '—'}</td><td className="px-4 py-3">{u.situacao || '—'}</td><td className="px-4 py-3">{u.telefone || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="app-surface overflow-hidden">
        <div className="border-b border-border-dark p-4 sm:p-5">
          <h2 className="font-bold text-white">Relatórios dos profissionais</h2>
          <p className="mt-1 text-xs text-slate-500">Visualize a produção e baixe o documento produzido ou o arquivo assinado.</p>
        </div>
        <div className="divide-y divide-border-dark">
          {docsFiltrados.slice(0, 100).map((doc) => (
            <div key={doc.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold text-white">{doc.titulo}</div>
                <div className="mt-1 text-xs text-slate-500">{doc.profissionalNome} • {doc.usuarioNome} • Pront. {doc.prontuario || '—'} • {doc.status}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button onClick={() => saeDocumentosService.baixarDocx(doc.id, doc.titulo).catch((e) => setErro(e.message))} className="min-h-10 rounded-xl border border-primary/20 bg-primary/10 px-3 text-xs font-bold text-blue-200">Word</button>
                {doc.status === 'ASSINADO' && (
                  <button onClick={() => saeDocumentosService.baixarAssinado(doc.id).catch((e) => setErro(e.message))} className="min-h-10 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-200">Assinado</button>
                )}
              </div>
            </div>
          ))}
          {!docsFiltrados.length && <div className="p-8 text-center text-sm text-slate-500">Nenhum relatório para os filtros selecionados.</div>}
        </div>
      </section>

      <style>{`.input-admin{height:44px;width:100%;border-radius:12px;border:1px solid #26344a;background:rgba(15,23,42,.5);padding:0 12px;font-size:14px;color:#fff;outline:none}`}</style>
    </div>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="text-xs font-bold uppercase tracking-[0.13em] text-slate-400">{label}</span>{children}</label>;
}

function Kpi({ label, value, icon: Icon, suffix = '' }: { label: string; value: number; icon: React.ElementType; suffix?: string }) {
  return <div className="app-surface p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-white">{value}{suffix}</p></div><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Icon size={19} /></div></div></div>;
}

function Distribution({ title, items, total }: { title: string; items: Array<{ label: string; total: number }>; total: number }) {
  return <section className="app-surface p-4 sm:p-5"><h3 className="font-bold text-white">{title}</h3><div className="mt-4 space-y-3">{items.length ? items.map((item) => { const pct = total ? Math.round((item.total / total) * 100) : 0; return <div key={item.label}><div className="mb-1 flex items-center justify-between gap-3 text-xs"><span className="truncate text-slate-300">{item.label}</span><strong className="text-white">{item.total}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(pct, item.total ? 4 : 0)}%` }} /></div></div>; }) : <p className="text-sm text-slate-500">Sem dados.</p>}</div></section>;
}
