// src/pages/FrequenciaPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Download,
  FileText,
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
  window.URL.revokeObjectURL(url);
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

  const [loading, setLoading] = useState<boolean>(false);
  const [exportandoFormato, setExportandoFormato] = useState<FormatoExportacaoFrequencia | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [erroTela, setErroTela] = useState<string>('');
  const [itens, setItens] = useState<FrequenciaServidorItem[]>([]);
  const [servidorSelecionadoCpf, setServidorSelecionadoCpf] = useState<string>('');
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroTela('');

    try {
      const data = await listarFrequenciaPorMes({
        ano,
        mes,
        categoria: filtros.categoria || undefined,
        setor: filtros.setor || undefined,
        status: filtros.status || undefined,
        busca: filtros.busca || undefined,
      });

      setItens(Array.isArray(data) ? data : []);

      if (Array.isArray(data) && data.length > 0) {
        const cpfAtualExiste = data.some((item) => item.cpf && item.cpf === servidorSelecionadoCpf);
        if (!cpfAtualExiste) {
          setServidorSelecionadoCpf(data[0]?.cpf ?? '');
        }
      } else {
        setServidorSelecionadoCpf('');
        setDiaSelecionado(null);
      }
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : 'Não foi possível carregar os dados da frequência.';
      setErroTela(mensagem);
      setItens([]);
      setServidorSelecionadoCpf('');
      setDiaSelecionado(null);
    } finally {
      setLoading(false);
    }
  }, [ano, mes, filtros.busca, filtros.categoria, filtros.setor, filtros.status, servidorSelecionadoCpf]);

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
      const okBusca =
        !buscaNorm ||
        normalizarTexto(item.nome).includes(buscaNorm) ||
        normalizarTexto(item.cpf).includes(buscaNorm) ||
        normalizarTexto(item.matricula).includes(buscaNorm);

      const okCategoria =
        !filtros.categoria || normalizarTexto(item.categoria) === normalizarTexto(filtros.categoria);

      const okSetor = !filtros.setor || normalizarTexto(item.setor) === normalizarTexto(filtros.setor);

      const okStatus =
        !filtros.status || normalizarTexto(item.status) === normalizarTexto(filtros.status);

      return okBusca && okCategoria && okSetor && okStatus;
    });
  }, [filtros.busca, filtros.categoria, filtros.setor, filtros.status, itens]);

  const servidorSelecionado = useMemo(() => {
    return (
      servidoresFiltrados.find((item) => item.cpf && item.cpf === servidorSelecionadoCpf) ??
      servidoresFiltrados[0] ??
      null
    );
  }, [servidorSelecionadoCpf, servidoresFiltrados]);

  const diasDoMes = useMemo(() => {
    return new Date(ano, mes, 0).getDate();
  }, [ano, mes]);

  const dayMap = useMemo(() => {
    const map = new Map<number, FrequenciaDiaItem>();
    for (const item of servidorSelecionado?.dias ?? []) {
      if (typeof item.dia === 'number') {
        map.set(item.dia, item);
      }
    }
    return map;
  }, [servidorSelecionado]);

  const exportPayloadBase = useMemo<ExportarFrequenciaPayload | null>(() => {
    if (!servidorSelecionado) return null;

    return {
      ano,
      mes,
      servidorCpf: servidorSelecionado.cpf || undefined,
      servidorId: servidorSelecionado.id || undefined,
      categoria: servidorSelecionado.categoria || undefined,
      setor: servidorSelecionado.setor || undefined,
      status: servidorSelecionado.status || undefined,
      incluirPontoFacultativo: true,
    };
  }, [ano, mes, servidorSelecionado]);

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
              : 'DOCX gerado e baixado com sucesso.',
        });
      } catch (error) {
        const mensagem =
          error instanceof Error ? error.message : 'Falha ao exportar a frequência.';
        setToast({
          type: 'error',
          message: mensagem,
        });
      } finally {
        setExportandoFormato(null);
      }
    },
    [exportPayloadBase],
  );

  const handleExportarCsvLocal = useCallback(() => {
    if (!servidorSelecionado) {
      setToast({
        type: 'warning',
        message: 'Selecione um servidor para exportar o CSV.',
      });
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

    const rows: string[] = [];
    rows.push(headers.map(csvEscape).join(';'));

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
          item?.observacoes?.join(' | ') ?? '',
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

    setToast({
      type: 'success',
      message: 'CSV local exportado com sucesso.',
    });
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
      if (status.includes('FERIAS') || status.includes('FÉRIAS')) ferias += 1;
      if (status.includes('FERIADO') || status.includes('PONTO')) feriados += 1;
    }

    return { faltas, atestados, ferias, feriados };
  }, [servidorSelecionado]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                <CalendarDays className="h-4 w-4" />
                Frequência mensal
              </div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Gestão de Frequência
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-400 md:text-base">
                A nova interface permanece estável, usa o service oficial como ponte para DOCX/PDF
                e mantém o CSV local separado no frontend.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-400">Servidores</div>
                <div className="mt-1 text-2xl font-semibold">{servidoresFiltrados.length}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-400">Faltas</div>
                <div className="mt-1 text-2xl font-semibold text-red-300">{statusCount.faltas}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-400">Atestados</div>
                <div className="mt-1 text-2xl font-semibold text-blue-300">
                  {statusCount.atestados}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-400">Férias/Feriados</div>
                <div className="mt-1 text-2xl font-semibold text-emerald-300">
                  {statusCount.ferias + statusCount.feriados}
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

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
              <div className="mb-4 flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                  Filtros
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Busca</label>
                  <input
                    value={filtros.busca}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, busca: e.target.value }))}
                    placeholder="Nome, CPF ou matrícula"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none ring-0 transition focus:border-cyan-400/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Mês</label>
                    <select
                      value={mes}
                      onChange={(e) => setMes(Number(e.target.value))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
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
                      min={2020}
                      max={2100}
                      value={ano}
                      onChange={(e) => setAno(Number(e.target.value))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Categoria</label>
                  <select
                    value={filtros.categoria}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, categoria: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
                  >
                    <option value="">Todas</option>
                    {categorias.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Setor</label>
                  <select
                    value={filtros.setor}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, setor: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
                  >
                    <option value="">Todos</option>
                    {setores.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Status</label>
                  <select
                    value={filtros.status}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40"
                  >
                    <option value="">Todos</option>
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => void carregar()}
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Atualizar
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                    Servidores
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Selecione um servidor para exportar DOCX, PDF ou CSV.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {servidoresFiltrados.length}
                </div>
              </div>

              <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {loading ? (
                  <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-12 text-sm text-slate-400">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando servidores...
                  </div>
                ) : servidoresFiltrados.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-slate-500">
                    Nenhum servidor encontrado para os filtros atuais.
                  </div>
                ) : (
                  servidoresFiltrados.map((item) => {
                    const ativo = item.cpf === servidorSelecionado?.cpf;
                    return (
                      <button
                        key={`${item.cpf}-${item.id ?? item.nome}`}
                        type="button"
                        onClick={() => {
                          setServidorSelecionadoCpf(item.cpf);
                          setDiaSelecionado(null);
                        }}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          ativo
                            ? 'border-cyan-400/40 bg-cyan-400/10 shadow-lg shadow-cyan-950/20'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-cyan-300">
                            <UserRound className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-slate-100">
                              {item.nome || 'Servidor sem nome'}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              CPF: {item.cpf || '—'} • Matrícula: {item.matricula || '—'}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.categoria ? (
                                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                                  {item.categoria}
                                </span>
                              ) : null}
                              {item.setor ? (
                                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                                  {item.setor}
                                </span>
                              ) : null}
                              {item.status ? (
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[11px] ${badgeClass(
                                    item.status,
                                  )}`}
                                >
                                  {item.status}
                                </span>
                              ) : null}
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

          <section className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    {MONTHS[mes - 1]} de {ano}
                  </div>
                  <h2 className="mt-1 text-xl font-semibold text-slate-100">
                    {servidorSelecionado?.nome || 'Selecione um servidor'}
                  </h2>
                  <div className="mt-2 text-sm text-slate-400">
                    {servidorSelecionado
                      ? `${servidorSelecionado.categoria || 'Sem categoria'} • ${
                          servidorSelecionado.setor || 'Sem setor'
                        } • CPF ${servidorSelecionado.cpf || '—'}`
                      : 'Escolha um servidor na lista lateral para visualizar e exportar a folha.'}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => void handleExportarArquivo('docx')}
                    disabled={!servidorSelecionado || exportandoFormato !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {exportandoFormato === 'docx' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    Exportar DOCX
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleExportarArquivo('pdf')}
                    disabled={!servidorSelecionado || exportandoFormato !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-3 text-sm font-medium text-fuchsia-200 transition hover:bg-fuchsia-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {exportandoFormato === 'pdf' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Exportar PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleExportarCsvLocal}
                    disabled={!servidorSelecionado || exportandoFormato !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </button>
                </div>
              </div>
            </div>

            {erroTela ? (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-red-200 shadow-xl shadow-black/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <div className="font-medium">Falha ao carregar a frequência</div>
                    <div className="mt-1 text-sm text-red-200/80">{erroTela}</div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                    Grade mensal
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Rubrica, ocorrências por turno e status final do servidor selecionado.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                  {diasDoMes} dias
                </div>
              </div>

              {!servidorSelecionado ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-14 text-center text-sm text-slate-500">
                  Nenhum servidor selecionado.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {Array.from({ length: diasDoMes }, (_, index) => {
                    const dia = index + 1;
                    const item = dayMap.get(dia);
                    const data = new Date(ano, mes - 1, dia);
                    const weekday = data.toLocaleDateString('pt-BR', { weekday: 'short' });

                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => setDiaSelecionado(dia)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          diaSelecionado === dia
                            ? 'border-cyan-400/40 bg-cyan-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs uppercase tracking-wide text-slate-500">
                              {weekday.replace('.', '')}
                            </div>
                            <div className="mt-1 text-2xl font-semibold text-slate-100">{dia}</div>
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] ${badgeClass(item?.statusFinal)}`}>
                            {item?.statusFinal || 'SEM REGISTRO'}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-xs">
                          <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-slate-300">
                            <span className="text-slate-500">Rubrica:</span>{' '}
                            {item?.rubrica || '—'}
                          </div>
                          <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-slate-300">
                            <span className="text-slate-500">O1:</span>{' '}
                            {item?.ocorrencia1 || '—'}
                          </div>
                          <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-slate-300">
                            <span className="text-slate-500">O2:</span>{' '}
                            {item?.ocorrencia2 || '—'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {servidorSelecionado && diaSelecionado ? (
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                      Detalhes do dia
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Dia {diaSelecionado} • {MONTHS[mes - 1]} de {ano}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDiaSelecionado(null)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
                  >
                    Fechar
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Rubrica</div>
                    <div className="mt-2 text-sm text-slate-100">
                      {dayMap.get(diaSelecionado)?.rubrica || '—'}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Ocorrência 1</div>
                    <div className="mt-2 text-sm text-slate-100">
                      {dayMap.get(diaSelecionado)?.ocorrencia1 || '—'}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Ocorrência 2</div>
                    <div className="mt-2 text-sm text-slate-100">
                      {dayMap.get(diaSelecionado)?.ocorrencia2 || '—'}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Status final</div>
                    <div className="mt-2 text-sm text-slate-100">
                      {resumoDoDia(dayMap.get(diaSelecionado))}
                    </div>
                  </div>
                </div>

                {dayMap.get(diaSelecionado)?.observacoes?.length ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Observações</div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-200">
                      {dayMap.get(diaSelecionado)?.observacoes?.map((obs, index) => (
                        <li key={`${diaSelecionado}-obs-${index}`} className="rounded-xl bg-slate-950/60 px-3 py-2">
                          {obs}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
