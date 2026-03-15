import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';
import {
  baixarFrequenciaArquivo,
  buildResumoFrequencia,
  getCompetenciaLabel,
  listarFrequenciaMensal,
  type FrequenciaDayItem,
  type FrequenciaMensalItem,
} from '../services/frequenciaService';

type ExportFormat = 'docx' | 'pdf' | 'csv';

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const STATUS_OPTIONS = [
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'INATIVO', label: 'Inativo' },
  { value: '', label: 'Todos' },
];

function getCurrentMonth() {
  const now = new Date();
  return now.getMonth() + 1;
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function safeString(value: unknown, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function getDayBadgeClass(day: FrequenciaDayItem) {
  if (day.sourceFlags?.isFerias) {
    return 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20';
  }
  if (day.sourceFlags?.isHoliday) {
    return 'bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20';
  }
  if (day.sourceFlags?.isFacultativo) {
    return 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20';
  }
  if (day.sourceFlags?.hasFalta) {
    return 'bg-red-500/10 text-red-300 ring-1 ring-red-500/20';
  }
  if (day.sourceFlags?.hasAtestado) {
    return 'bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20';
  }
  if (day.sourceFlags?.isWeekend) {
    return 'bg-slate-700/70 text-slate-300 ring-1 ring-slate-600';
  }
  return 'bg-slate-800 text-slate-200 ring-1 ring-slate-700';
}

export default function FrequenciaPage() {
  const [ano, setAno] = useState<number>(getCurrentYear());
  const [mes, setMes] = useState<number>(getCurrentMonth());
  const [setor, setSetor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [status, setStatus] = useState('ATIVO');
  const [busca, setBusca] = useState('');

  const [rows, setRows] = useState<FrequenciaMensalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const selectedItem = useMemo(() => {
    return (
      rows.find((item) => String(item.servidor?.id ?? '') === String(selectedId)) ||
      rows[0] ||
      null
    );
  }, [rows, selectedId]);

  const filteredRows = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((item) => {
      const nome = safeString(item.servidor?.nome).toLowerCase();
      const cpf = safeString(item.servidor?.cpf).toLowerCase();
      const matricula = safeString(item.servidor?.matricula).toLowerCase();
      const setorServidor = safeString(item.servidor?.setor).toLowerCase();
      return (
        nome.includes(term) ||
        cpf.includes(term) ||
        matricula.includes(term) ||
        setorServidor.includes(term)
      );
    });
  }, [rows, busca]);

  const resumo = useMemo(() => {
    return selectedItem ? buildResumoFrequencia(selectedItem) : null;
  }, [selectedItem]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await listarFrequenciaMensal({
        ano,
        mes,
        categoria: categoria || undefined,
        setor: setor || undefined,
        status: status || undefined,
      });

      setRows(result.data || []);

      if (result.data?.length) {
        const hasCurrent = result.data.some(
          (item) => String(item.servidor?.id ?? '') === String(selectedId)
        );

        if (!hasCurrent) {
          setSelectedId(String(result.data[0].servidor?.id ?? ''));
        }
      } else {
        setSelectedId('');
      }
    } catch (err) {
      setRows([]);
      setSelectedId('');
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar os dados da frequência.'
      );
    } finally {
      setLoading(false);
    }
  }, [ano, mes, categoria, setor, status, selectedId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = useCallback(
    async (formato: ExportFormat) => {
      if (!selectedItem) {
        setError('Selecione um servidor antes de exportar.');
        return;
      }

      setExporting(formato);
      setError('');

      try {
        await baixarFrequenciaArquivo(
          {
            ano,
            mes,
            servidorId: selectedItem.servidor?.id,
            servidorCpf: selectedItem.servidor?.cpf,
            categoria: categoria || undefined,
            setor: setor || undefined,
            status: status || undefined,
            formato,
          },
          selectedItem.servidor
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : `Não foi possível exportar a frequência em ${formato.toUpperCase()}.`
        );
      } finally {
        setExporting(null);
      }
    },
    [ano, mes, selectedItem, categoria, setor, status]
  );

  return (
    <div className="min-h-full w-full bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
                <CalendarDays size={14} />
                Dashboard Executivo
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Frequência Mensal
              </h1>
              <p className="max-w-3xl text-sm text-slate-400">
                Consolidação mensal da frequência com férias, atestados, faltas,
                feriados, pontos facultativos e exportação oficial em DOCX, PDF
                e CSV.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handleExport('docx')}
                disabled={!selectedItem || exporting !== null}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-blue-500/50 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting === 'docx' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FileText size={16} />
                )}
                Exportar DOCX
              </button>

              <button
                type="button"
                onClick={() => handleExport('pdf')}
                disabled={!selectedItem || exporting !== null}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-emerald-500/50 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting === 'pdf' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                Exportar PDF
              </button>

              <button
                type="button"
                onClick={() => handleExport('csv')}
                disabled={!selectedItem || exporting !== null}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-amber-500/50 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting === 'csv' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FileSpreadsheet size={16} />
                )}
                Exportar CSV
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Filtros</h2>
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Atualizar
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Ano
                </label>
                <input
                  value={ano}
                  onChange={(e) => setAno(Number(e.target.value || getCurrentYear()))}
                  type="number"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Mês
                </label>
                <select
                  value={mes}
                  onChange={(e) => setMes(Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                >
                  {MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Categoria
                </label>
                <input
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Filtrar por categoria"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Setor
                </label>
                <input
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  placeholder="Filtrar por setor"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                >
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item.label} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-800 pt-5">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                Buscar servidor
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Nome, CPF, matrícula..."
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-800 pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Servidores</h3>
                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                  {filteredRows.length}
                </span>
              </div>

              <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
                {loading ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4 text-sm text-slate-400">
                    <Loader2 size={16} className="animate-spin" />
                    Carregando servidores...
                  </div>
                ) : filteredRows.length ? (
                  filteredRows.map((item) => {
                    const isActive =
                      String(item.servidor?.id ?? '') === String(selectedItem?.servidor?.id ?? '');

                    return (
                      <button
                        key={String(item.servidor?.id ?? item.servidor?.cpf ?? item.servidor?.nome)}
                        type="button"
                        onClick={() => setSelectedId(String(item.servidor?.id ?? ''))}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          isActive
                            ? 'border-blue-500/40 bg-blue-500/10'
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl bg-slate-800 p-2 text-slate-300">
                            <User size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                              {item.servidor?.nome || 'Servidor sem nome'}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-400">
                              {item.servidor?.matricula || 'Sem matrícula'} •{' '}
                              {item.servidor?.cpf || 'Sem CPF'}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {item.servidor?.setor || 'Sem setor'}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4 text-sm text-slate-400">
                    Nenhum servidor encontrado para os filtros atuais.
                  </div>
                )}
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
                    Competência
                  </div>
                  <h2 className="text-2xl font-semibold text-white">
                    {getCompetenciaLabel(ano, mes)}
                  </h2>

                  <div className="space-y-1">
                    <p className="text-lg font-medium text-slate-100">
                      {selectedItem?.servidor?.nome || 'Nenhum servidor selecionado'}
                    </p>
                    <p className="text-sm text-slate-400">
                      Matrícula: {selectedItem?.servidor?.matricula || '—'} • CPF:{' '}
                      {selectedItem?.servidor?.cpf || '—'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedItem?.servidor?.cargo || 'Sem cargo'} •{' '}
                      {selectedItem?.servidor?.categoria || 'Sem categoria'} •{' '}
                      {selectedItem?.servidor?.setor || 'Sem setor'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Dias do mês
                    </div>
                    <div className="mt-2 text-xl font-semibold text-white">
                      {selectedItem?.totalDiasMes || 0}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      C.H. diária
                    </div>
                    <div className="mt-2 text-xl font-semibold text-white">
                      {selectedItem?.servidor?.chDiaria || '—'}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      C.H. semanal
                    </div>
                    <div className="mt-2 text-xl font-semibold text-white">
                      {selectedItem?.servidor?.chSemanal || '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {resumo ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                {[
                  ['Fins de semana', resumo.finsDeSemana],
                  ['Feriados', resumo.feriados],
                  ['Facultativos', resumo.facultativos],
                  ['Férias', resumo.ferias],
                  ['Atestados', resumo.atestados],
                  ['Faltas', resumo.faltas],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4"
                  >
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      {label}
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">
                      {value as number}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Calendário mensal</h3>
                  <p className="text-sm text-slate-400">
                    Visualização consolidada por dia com rubrica e ocorrências.
                  </p>
                </div>
              </div>

              {selectedItem?.dayItems?.length ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {selectedItem.dayItems.map((day) => (
                    <article
                      key={`${day.data}-${day.dia}`}
                      className={`rounded-2xl px-4 py-4 ${getDayBadgeClass(day)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-wide opacity-70">
                            Dia
                          </div>
                          <div className="mt-1 text-xl font-semibold">{day.dia}</div>
                        </div>
                        <div className="text-right text-xs opacity-70">{day.data}</div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3">
                        <div className="rounded-xl bg-black/10 px-3 py-3">
                          <div className="text-[11px] uppercase tracking-wide opacity-70">
                            1º Turno
                          </div>
                          <div className="mt-2 space-y-1 text-sm">
                            <p>
                              <span className="opacity-70">Rubrica:</span>{' '}
                              {day.turno1?.rubrica || '—'}
                            </p>
                            <p>
                              <span className="opacity-70">Ocorrência:</span>{' '}
                              {day.turno1?.ocorrencia || '—'}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl bg-black/10 px-3 py-3">
                          <div className="text-[11px] uppercase tracking-wide opacity-70">
                            2º Turno
                          </div>
                          <div className="mt-2 space-y-1 text-sm">
                            <p>
                              <span className="opacity-70">Rubrica:</span>{' '}
                              {day.turno2?.rubrica || '—'}
                            </p>
                            <p>
                              <span className="opacity-70">Ocorrência:</span>{' '}
                              {day.turno2?.ocorrencia || '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-8 text-center text-sm text-slate-400">
                  Selecione um servidor para visualizar a consolidação mensal.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
