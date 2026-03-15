import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Download,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
} from 'lucide-react';
import {
  exportarFrequenciaArquivo,
  listarFrequenciaPorMes,
  type ExportarFrequenciaPayload,
  type FormatoExportacaoFrequencia,
  type FrequenciaDiaItem,
  type FrequenciaServidorItem,
} from '../services/frequenciaService';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

type ToastState = {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
} | null;

type FiltrosLocais = {
  busca: string;
  categoria: string;
  setor: string;
  status: string;
};

function getCurrentYearMonth() {
  const now = new Date();
  return {
    ano: now.getFullYear(),
    mes: now.getMonth() + 1,
  };
}

function sanitizeAno(value: number): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 2000 || num > 2100) return new Date().getFullYear();
  return Math.trunc(num);
}

function sanitizeMes(value: number): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 1 || num > 12) return new Date().getMonth() + 1;
  return Math.trunc(num);
}

function formatarDataISO(ano: number, mes: number, dia: number) {
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  if (text.includes(';') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function baixarArquivoLocal(blob: Blob, nomeArquivo: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

function normalizarTexto(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .trim();
}

function badgeClass(status?: string) {
  const s = normalizarTexto(status);
  if (s.includes('FALTA')) return 'bg-red-500/15 text-red-300 border-red-500/30';
  if (s.includes('ATESTADO')) return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  if (s.includes('FERIAS')) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (s.includes('FERIADO')) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  if (s.includes('PONTO')) return 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30';
  if (s.includes('ANIVERSARIO')) return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
  if (s.includes('ATIVO')) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (s.includes('INATIVO')) return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
  return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
}

function resumoDoDia(item?: FrequenciaDiaItem) {
  if (!item) return 'Sem registro';
  if (item.rubrica) return item.rubrica;
  if (item.ocorrencia1 || item.ocorrencia2) {
    return [item.ocorrencia1, item.ocorrencia2].filter(Boolean).join(' | ');
  }
  return item.statusFinal || 'Sem registro';
}

function getServidorKey(item: FrequenciaServidorItem) {
  return String(item.cpf || item.id || item.servidorId || item.matricula || item.nome || '');
}

function getServidorMeta(item: FrequenciaServidorItem) {
  const categoria = item.categoria || 'Sem categoria';
  const setor = item.setor || 'Sem setor';
  const cpf = item.cpf || '—';
  const matricula = item.matricula || '—';
  return { categoria, setor, cpf, matricula };
}

function initialsFromName(name?: string) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  const initials = parts.map((part) => part[0]?.toUpperCase() || '').join('');
  return initials || 'SR';
}

export default function FrequenciaPage() {
  const current = getCurrentYearMonth();

  const [ano, setAno] = useState<number>(current.ano);
  const [mes, setMes] = useState<number>(current.mes);
  const [filtros, setFiltros] = useState<FiltrosLocais>({
    busca: '',
    categoria: '',
    setor: '',
    status: 'ATIVO',
  });
  const [loading, setLoading] = useState(false);
  const [exportandoFormato, setExportandoFormato] = useState<FormatoExportacaoFrequencia | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [erroTela, setErroTela] = useState('');
  const [itens, setItens] = useState<FrequenciaServidorItem[]>([]);
  const [servidorSelecionadoKey, setServidorSelecionadoKey] = useState('');
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroTela('');

    try {
      const data = await listarFrequenciaPorMes({
        ano: sanitizeAno(ano),
        mes: sanitizeMes(mes),
        categoria: filtros.categoria || undefined,
        setor: filtros.setor || undefined,
        status: filtros.status || undefined,
        busca: filtros.busca || undefined,
      });

      const lista = Array.isArray(data) ? data : [];
      setItens(lista);

      if (lista.length === 0) {
        setServidorSelecionadoKey('');
        setDiaSelecionado(null);
        return;
      }

      const currentKeyExists = lista.some((item) => getServidorKey(item) === servidorSelecionadoKey);
      if (!currentKeyExists) {
        setServidorSelecionadoKey(getServidorKey(lista[0]));
      }
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : 'Não foi possível carregar os dados da frequência.';
      setErroTela(mensagem);
      setItens([]);
      setServidorSelecionadoKey('');
      setDiaSelecionado(null);
    } finally {
      setLoading(false);
    }
  }, [ano, filtros.busca, filtros.categoria, filtros.setor, filtros.status, mes, servidorSelecionadoKey]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    for (const item of itens) {
      if (item.categoria) set.add(item.categoria);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [itens]);

  const setores = useMemo(() => {
    const set = new Set<string>();
    for (const item of itens) {
      if (item.setor) set.add(item.setor);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [itens]);

  const servidoresFiltrados = useMemo(() => {
    const buscaNorm = normalizarTexto(filtros.busca);

    return itens.filter((item) => {
      const meta = getServidorMeta(item);

      const okBusca =
        !buscaNorm ||
        normalizarTexto(item.nome).includes(buscaNorm) ||
        normalizarTexto(meta.cpf).includes(buscaNorm) ||
        normalizarTexto(meta.matricula).includes(buscaNorm);

      const okCategoria =
        !filtros.categoria || normalizarTexto(item.categoria) === normalizarTexto(filtros.categoria);

      const okSetor = !filtros.setor || normalizarTexto(item.setor) === normalizarTexto(filtros.setor);

      const okStatus = !filtros.status || normalizarTexto(item.status) === normalizarTexto(filtros.status);

      return okBusca && okCategoria && okSetor && okStatus;
    });
  }, [filtros.busca, filtros.categoria, filtros.setor, filtros.status, itens]);

  const servidorSelecionado = useMemo(() => {
    return (
      servidoresFiltrados.find((item) => getServidorKey(item) === servidorSelecionadoKey) ??
      servidoresFiltrados[0] ??
      null
    );
  }, [servidorSelecionadoKey, servidoresFiltrados]);

  useEffect(() => {
    if (!servidorSelecionado) {
      setDiaSelecionado(null);
      return;
    }

    const total = new Date(sanitizeAno(ano), sanitizeMes(mes), 0).getDate();
    if (!diaSelecionado || diaSelecionado < 1 || diaSelecionado > total) {
      setDiaSelecionado(1);
    }
  }, [ano, diaSelecionado, mes, servidorSelecionado]);

  const diasDoMes = useMemo(() => new Date(sanitizeAno(ano), sanitizeMes(mes), 0).getDate(), [ano, mes]);

  const dayMap = useMemo(() => {
    const map = new Map<number, FrequenciaDiaItem>();
    for (const item of servidorSelecionado?.dias ?? []) {
      if (typeof item?.dia === 'number' && Number.isFinite(item.dia)) {
        map.set(item.dia, item);
      }
    }
    return map;
  }, [servidorSelecionado]);

  const exportPayloadBase = useMemo<ExportarFrequenciaPayload | null>(() => {
    if (!servidorSelecionado) return null;

    return {
      ano: sanitizeAno(ano),
      mes: sanitizeMes(mes),
      servidorCpf: servidorSelecionado.cpf || undefined,
      servidorId: servidorSelecionado.id || servidorSelecionado.servidorId || undefined,
      categoria: servidorSelecionado.categoria || undefined,
      setor: servidorSelecionado.setor || undefined,
      status: servidorSelecionado.status || undefined,
      busca: filtros.busca || undefined,
      incluirPontoFacultativo: true,
    };
  }, [ano, filtros.busca, mes, servidorSelecionado]);

  const handleExportarArquivo = useCallback(
    async (formato: FormatoExportacaoFrequencia) => {
      if (!exportPayloadBase) {
        setToast({
          type: 'warning',
          message: 'Selecione um servidor para exportar a frequência.',
        });
        return;
      }

      try {
        setExportandoFormato(formato);
        await exportarFrequenciaArquivo(exportPayloadBase, formato);
        setToast({
          type: 'success',
          message:
            formato === 'pdf'
              ? 'PDF gerado e baixado com sucesso.'
              : formato === 'docx'
              ? 'DOCX gerado e baixado com sucesso.'
              : 'CSV gerado e baixado com sucesso.',
        });
      } catch (error) {
        const mensagem = error instanceof Error ? error.message : 'Falha ao exportar a frequência.';
        setToast({ type: 'error', message: mensagem });
      } finally {
        setExportandoFormato(null);
      }
    },
    [exportPayloadBase],
  );

  const handleExportarCsvLocal = useCallback(() => {
    if (!servidorSelecionado) {
      setToast({ type: 'warning', message: 'Selecione um servidor para exportar o CSV.' });
      return;
    }

    const headers = [
      'Servidor',
      'CPF',
      'Matrícula',
      'Categoria',
      'Setor',
      'Status',
      'Ano',
      'Mês',
      'Dia',
      'Data',
      'Rubrica',
      'Ocorrência 1',
      'Ocorrência 2',
      'Status Final',
      'Observações',
    ];

    const rows: string[] = [headers.map(csvEscape).join(';')];

    for (let dia = 1; dia <= diasDoMes; dia += 1) {
      const item = dayMap.get(dia);
      rows.push(
        [
          servidorSelecionado.nome,
          servidorSelecionado.cpf,
          servidorSelecionado.matricula,
          servidorSelecionado.categoria,
          servidorSelecionado.setor,
          servidorSelecionado.status,
          String(ano),
          String(mes),
          String(dia),
          formatarDataISO(ano, mes, dia),
          item?.rubrica ?? '',
          item?.ocorrencia1 ?? '',
          item?.ocorrencia2 ?? '',
          item?.statusFinal ?? '',
          Array.isArray(item?.observacoes) ? item?.observacoes.join(' | ') : '',
        ]
          .map(csvEscape)
          .join(';'),
      );
    }

    const csvContent = `\uFEFF${rows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const nomeArquivo = `frequencia_${(servidorSelecionado.nome || 'servidor')
      .replace(/\s+/g, '_')
      .toLowerCase()}_${ano}-${String(mes).padStart(2, '0')}.csv`;

    baixarArquivoLocal(blob, nomeArquivo);
    setToast({ type: 'success', message: 'CSV local exportado com sucesso.' });
  }, [ano, dayMap, diasDoMes, mes, servidorSelecionado]);

  const statusCount = useMemo(() => {
    let faltas = 0;
    let atestados = 0;
    let ferias = 0;
    let feriados = 0;

    for (const item of servidorSelecionado?.dias ?? []) {
      const status = normalizarTexto(item.statusFinal || item.rubrica || '');
      const o1 = normalizarTexto(item.ocorrencia1 || '');
      const o2 = normalizarTexto(item.ocorrencia2 || '');

      if (status.includes('FALTA') || o1.includes('FALTA') || o2.includes('FALTA')) faltas += 1;
      if (status.includes('ATESTADO') || o1.includes('ATESTADO') || o2.includes('ATESTADO')) atestados += 1;
      if (status.includes('FERIAS')) ferias += 1;
      if (status.includes('FERIADO') || status.includes('PONTO')) feriados += 1;
    }

    return { faltas, atestados, ferias, feriados };
  }, [servidorSelecionado]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_28%),linear-gradient(180deg,#020817_0%,#081120_38%,#07101c_100%)] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(8,17,32,0.95))] p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200">
                <CalendarDays className="h-4 w-4" />
                Dashboard executivo
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Controle Mensal de Frequência
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-400 md:text-base">
                Acompanhe servidores, filtre a competência e visualize ocorrências mensais com clareza,
                mantendo a base pronta para exportação oficial e sem perder estabilidade operacional.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Competência</div>
                <div className="mt-1 text-xl font-semibold text-white">{MONTHS[mes - 1]}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Ano</div>
                <div className="mt-1 text-xl font-semibold text-white">{ano}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Servidores</div>
                <div className="mt-1 text-xl font-semibold text-white">{servidoresFiltrados.length}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Selecionado</div>
                <div className="mt-1 truncate text-sm font-semibold text-white">
                  {servidorSelecionado?.nome || 'Nenhum'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {toast ? (
          <div
            className={`mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lg ${
              toast.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : toast.type === 'warning'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                : toast.type === 'error'
                ? 'border-red-500/30 bg-red-500/10 text-red-200'
                : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
            }`}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{toast.message}</span>
          </div>
        ) : null}

        {erroTela ? (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 shadow-lg">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{erroTela}</span>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-sky-300" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Filtros</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFiltros({ busca: '', categoria: '', setor: '', status: 'ATIVO' });
                    setMes(getCurrentYearMonth().mes);
                    setAno(getCurrentYearMonth().ano);
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
                >
                  Limpar
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Busca</label>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input
                      value={filtros.busca}
                      onChange={(e) => setFiltros((prev) => ({ ...prev, busca: e.target.value }))}
                      placeholder="Nome, CPF ou matrícula"
                      className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Mês</label>
                    <select
                      value={mes}
                      onChange={(e) => setMes(sanitizeMes(Number(e.target.value)))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400/40"
                    >
                      {MONTHS.map((label, index) => (
                        <option key={label} value={index + 1}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Ano</label>
                    <input
                      type="number"
                      value={ano}
                      onChange={(e) => setAno(sanitizeAno(Number(e.target.value)))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Categoria</label>
                  <select
                    value={filtros.categoria}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, categoria: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400/40"
                  >
                    <option value="">Todas</option>
                    {categorias.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Setor</label>
                  <select
                    value={filtros.setor}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, setor: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400/40"
                  >
                    <option value="">Todos</option>
                    {setores.map((setor) => (
                      <option key={setor} value={setor}>
                        {setor}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Status</label>
                  <select
                    value={filtros.status}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400/40"
                  >
                    <option value="">Todos</option>
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => void carregar()}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm font-medium text-sky-200 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Atualizar
                  </button>

                  <button
                    type="button"
                    onClick={handleExportarCsvLocal}
                    disabled={!servidorSelecionado}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download className="h-4 w-4" />
                    CSV local
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-300">
                Servidores
              </h2>

              <div className="max-h-[580px] space-y-3 overflow-y-auto pr-1">
                {loading ? (
                  <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : servidoresFiltrados.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-400">
                    Nenhum servidor encontrado.
                  </div>
                ) : (
                  servidoresFiltrados.map((item) => {
                    const key = getServidorKey(item);
                    const selected = key === getServidorKey(servidorSelecionado || ({} as FrequenciaServidorItem));
                    const meta = getServidorMeta(item);

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setServidorSelecionadoKey(key)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          selected
                            ? 'border-sky-400/30 bg-sky-500/10 shadow-lg shadow-sky-900/10'
                            : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-sm font-semibold text-slate-200">
                            {initialsFromName(item.nome)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-white">{item.nome}</div>
                            <div className="mt-1 truncate text-xs text-slate-400">
                              {meta.categoria} • {meta.setor}
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-300">
                                CPF: {meta.cpf}
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-300">
                                MAT: {meta.matricula}
                              </span>
                              <span className={`rounded-full border px-2.5 py-1 text-[11px] ${badgeClass(item.status)}`}>
                                {item.status || 'Sem status'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(14,165,233,0.08))] p-5 shadow-xl shadow-black/20">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Servidor</div>
                <div className="mt-2 truncate text-lg font-semibold text-white">
                  {servidorSelecionado?.nome || 'Nenhum servidor'}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(239,68,68,0.08))] p-5 shadow-xl shadow-black/20">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Faltas</div>
                <div className="mt-2 text-3xl font-semibold text-white">{statusCount.faltas}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(59,130,246,0.08))] p-5 shadow-xl shadow-black/20">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Atestados</div>
                <div className="mt-2 text-3xl font-semibold text-white">{statusCount.atestados}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(16,185,129,0.08))] p-5 shadow-xl shadow-black/20">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Férias / Feriados</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {statusCount.ferias + statusCount.feriados}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/80 shadow-xl shadow-black/20">
              <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Painel do servidor</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Visualização detalhada da frequência, ocorrências e exportação.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleExportarArquivo('pdf')}
                    disabled={!servidorSelecionado || exportandoFormato !== null}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {exportandoFormato === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Exportar PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleExportarArquivo('docx')}
                    disabled={!servidorSelecionado || exportandoFormato !== null}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {exportandoFormato === 'docx' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    Exportar DOCX
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleExportarArquivo('csv')}
                    disabled={!servidorSelecionado || exportandoFormato !== null}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {exportandoFormato === 'csv' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Exportar CSV
                  </button>
                </div>
              </div>

              {!servidorSelecionado ? (
                <div className="px-6 py-10 text-center text-sm text-slate-400">
                  Selecione um servidor para visualizar os detalhes.
                </div>
              ) : (
                <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div>
                    <div className="mb-5 flex flex-wrap items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-lg font-semibold text-slate-200">
                        <UserRound className="h-6 w-6" />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-xl font-semibold text-white">{servidorSelecionado.nome}</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                            CPF: {servidorSelecionado.cpf || '—'}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                            Matrícula: {servidorSelecionado.matricula || '—'}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                            {servidorSelecionado.categoria || 'Sem categoria'}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                            {servidorSelecionado.setor || 'Sem setor'}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-xs ${badgeClass(servidorSelecionado.status)}`}>
                            {servidorSelecionado.status || 'Sem status'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: diasDoMes }, (_, i) => i + 1).map((dia) => {
                        const item = dayMap.get(dia);
                        const selected = diaSelecionado === dia;
                        const weekday = new Date(ano, mes - 1, dia).getDay();
                        const isWeekend = weekday === 0 || weekday === 6;
                        const status = item?.statusFinal || item?.rubrica || '';
                        const resumo = resumoDoDia(item);

                        return (
                          <button
                            key={dia}
                            type="button"
                            onClick={() => setDiaSelecionado(dia)}
                            className={`rounded-2xl border p-3 text-left transition ${
                              selected
                                ? 'border-sky-400/40 bg-sky-500/10 shadow-lg shadow-sky-900/10'
                                : isWeekend
                                ? 'border-white/10 bg-slate-950/80 hover:bg-slate-900'
                                : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-semibold text-white">{dia}</span>
                              {status ? (
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] ${badgeClass(status)}`}>
                                  {status}
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-2 line-clamp-3 text-xs text-slate-400">{resumo}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Dia selecionado</div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        {diaSelecionado ? `${String(diaSelecionado).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}` : '—'}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Resumo do dia</div>
                      <div className="mt-3 space-y-3 text-sm text-slate-300">
                        <div>
                          <span className="text-slate-500">Rubrica:</span>{' '}
                          <span className="text-white">{dayMap.get(diaSelecionado || 0)?.rubrica || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Ocorrência 1:</span>{' '}
                          <span className="text-white">{dayMap.get(diaSelecionado || 0)?.ocorrencia1 || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Ocorrência 2:</span>{' '}
                          <span className="text-white">{dayMap.get(diaSelecionado || 0)?.ocorrencia2 || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Status final:</span>{' '}
                          <span className="text-white">{dayMap.get(diaSelecionado || 0)?.statusFinal || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Observações:</span>{' '}
                          <span className="text-white">
                            {dayMap.get(diaSelecionado || 0)?.observacoes?.length
                              ? dayMap.get(diaSelecionado || 0)?.observacoes?.join(' | ')
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Resumo do mês</div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                          <div className="text-slate-500">Faltas</div>
                          <div className="mt-1 text-xl font-semibold text-white">{statusCount.faltas}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                          <div className="text-slate-500">Atestados</div>
                          <div className="mt-1 text-xl font-semibold text-white">{statusCount.atestados}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                          <div className="text-slate-500">Férias</div>
                          <div className="mt-1 text-xl font-semibold text-white">{statusCount.ferias}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                          <div className="text-slate-500">Feriados/Ponto</div>
                          <div className="mt-1 text-xl font-semibold text-white">{statusCount.feriados}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
