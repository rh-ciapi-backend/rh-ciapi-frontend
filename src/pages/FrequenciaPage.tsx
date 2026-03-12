import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  Download,
  FileText,
  FileSpreadsheet,
  Search,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ClipboardList,
  Clock3,
  ShieldAlert,
  Eye
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import {
  carregarDadosConsolidadosFrequencia,
  baixarFrequenciaArquivo,
  type ConsolidacaoFrequenciaResult,
  type ServidorFrequencia
} from '../services/frequenciaService';

type ExportFormat = 'docx' | 'pdf';

type Suggestion = {
  id: string;
  nome: string;
  cpf: string;
  matricula: string;
  categoria: string;
  setor: string;
  cargo: string;
  status: string;
  raw: any;
};

type StatusChipTone =
  | 'default'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'red'
  | 'purple'
  | 'slate';

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
  { value: 12, label: 'Dezembro' }
];

const CURRENT_DATE = new Date();
const DEFAULT_MONTH = CURRENT_DATE.getMonth() + 1;
const DEFAULT_YEAR = CURRENT_DATE.getFullYear();

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function onlyDigits(value: string | null | undefined): string {
  return String(value ?? '').replace(/\D+/g, '');
}

function normalizeSpaces(value: any): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function maskCpf(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length !== 11) return value || '';
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function monthLabel(month: number): string {
  return MONTHS.find((m) => m.value === month)?.label ?? String(month);
}

function buildYearOptions(centerYear = DEFAULT_YEAR): number[] {
  const list: number[] = [];
  for (let y = centerYear - 3; y <= centerYear + 3; y += 1) list.push(y);
  return list;
}

function buildStatusTone(status: string): StatusChipTone {
  switch (status) {
    case 'FERIAS':
      return 'green';
    case 'ATESTADO':
      return 'yellow';
    case 'FERIADO':
      return 'blue';
    case 'PONTO_FACULTATIVO':
      return 'purple';
    case 'FALTA':
      return 'red';
    case 'SABADO':
    case 'DOMINGO':
      return 'slate';
    default:
      return 'default';
  }
}

function chipClassName(tone: StatusChipTone): string {
  switch (tone) {
    case 'blue':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
    case 'green':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    case 'yellow':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    case 'red':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
    case 'purple':
      return 'border-violet-500/30 bg-violet-500/10 text-violet-300';
    case 'slate':
      return 'border-slate-500/30 bg-slate-500/10 text-slate-300';
    default:
      return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
  }
}

function suggestionToServidor(item: Suggestion): ServidorFrequencia {
  return {
    id: item.id,
    servidor: item.id,
    uuid: item.id,
    servidor_id: item.id,
    nome: item.nome,
    nomeCompleto: item.nome,
    nome_completo: item.nome,
    cpf: onlyDigits(item.cpf),
    matricula: item.matricula,
    categoria: item.categoria,
    setor: item.setor,
    cargo: item.cargo,
    status: item.status,
    raw: item.raw
  };
}

function statusLabel(item: Suggestion) {
  return item.status === 'ATIVO' ? 'ATIVO' : item.status || 'SEM STATUS';
}

function StatCard({
  icon,
  label,
  value,
  helper
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-slate-950/20 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{label}</div>
          <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
          {helper ? <div className="mt-1 text-xs text-slate-400">{helper}</div> : null}
        </div>
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function FrequenciaPage() {
  const [buscaServidor, setBuscaServidor] = useState('');
  const [selectedServidor, setSelectedServidor] = useState<Suggestion | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [mes, setMes] = useState<number>(DEFAULT_MONTH);
  const [ano, setAno] = useState<number>(DEFAULT_YEAR);
  const [includePontoFacultativo, setIncludePontoFacultativo] = useState(true);
  const [faltaVaiParaRubrica, setFaltaVaiParaRubrica] = useState(true);
  const [somenteAtivos, setSomenteAtivos] = useState(true);

  const [preview, setPreview] = useState<ConsolidacaoFrequenciaResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const suggestionsBoxRef = useRef<HTMLDivElement | null>(null);

  const yearOptions = useMemo(() => buildYearOptions(), []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!suggestionsBoxRef.current) return;
      if (!suggestionsBoxRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchServidores = useCallback(
    async (term: string) => {
      const trimmed = normalizeSpaces(term);

      if (trimmed.length < 3) {
        setSuggestions([]);
        setDropdownOpen(false);
        return;
      }

      setLoadingSuggestions(true);

      try {
        let query = supabase
          .from('servidores')
          .select('*')
          .or(
            [
              `nome.ilike.%${trimmed}%`,
              `nome_completo.ilike.%${trimmed}%`,
              `nomeCompleto.ilike.%${trimmed}%`,
              `matricula.ilike.%${trimmed}%`,
              `cpf.ilike.%${trimmed}%`
            ].join(',')
          )
          .limit(12);

        if (somenteAtivos) {
          query = query.eq('status', 'ATIVO');
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        const mapped: Suggestion[] = Array.isArray(data)
          ? data
              .map((row: any) => ({
                id: String(
                  row?.servidor ||
                    row?.id ||
                    row?.uuid ||
                    row?.servidor_id ||
                    row?.cpf ||
                    crypto.randomUUID()
                ),
                nome: normalizeSpaces(row?.nomeCompleto || row?.nome_completo || row?.nome),
                cpf: normalizeSpaces(row?.cpf),
                matricula: normalizeSpaces(row?.matricula),
                categoria: normalizeSpaces(row?.categoria || row?.categoria_canonica),
                setor: normalizeSpaces(row?.setor || row?.lotacao_interna || row?.lotacao),
                cargo: normalizeSpaces(row?.cargo),
                status: normalizeSpaces(row?.status || 'ATIVO'),
                raw: row
              }))
              .filter((row) => row.nome && row.cpf)
          : [];

        setSuggestions(mapped);
        setDropdownOpen(mapped.length > 0);
      } catch (error) {
        console.error('Erro ao buscar servidores para frequência:', error);
        setSuggestions([]);
        setDropdownOpen(false);
      } finally {
        setLoadingSuggestions(false);
      }
    },
    [somenteAtivos]
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      searchServidores(buscaServidor);
    }, 280);

    return () => window.clearTimeout(handle);
  }, [buscaServidor, searchServidores]);

  const handleSelectServidor = useCallback((item: Suggestion) => {
    setSelectedServidor(item);
    setBuscaServidor(item.nome);
    setDropdownOpen(false);
    setSuccessMessage('');
    setErrorMessage('');
    setPreview(null);
  }, []);

  const handleClearServidor = useCallback(() => {
    setSelectedServidor(null);
    setBuscaServidor('');
    setSuggestions([]);
    setPreview(null);
    setDropdownOpen(false);
    setSuccessMessage('');
    setErrorMessage('');
  }, []);

  const loadPreview = useCallback(async () => {
    if (!selectedServidor) {
      setErrorMessage('Selecione um servidor para visualizar a frequência.');
      return null;
    }

    setLoadingPreview(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await carregarDadosConsolidadosFrequencia({
        servidor: suggestionToServidor(selectedServidor),
        mes,
        ano,
        incluirPontoFacultativo: includePontoFacultativo,
        faltaVaiParaRubrica
      });

      setPreview(result);
      setSuccessMessage(`Pré-visualização carregada para ${selectedServidor.nome}.`);
      return result;
    } catch (error: any) {
      const msg = error?.message || 'Não foi possível carregar a consolidação da frequência.';
      setPreview(null);
      setErrorMessage(msg);
      return null;
    } finally {
      setLoadingPreview(false);
    }
  }, [selectedServidor, mes, ano, includePontoFacultativo, faltaVaiParaRubrica]);

  const exportarArquivo = useCallback(
    async (formato: ExportFormat) => {
      if (!selectedServidor) {
        setErrorMessage('Selecione um servidor antes de exportar.');
        return;
      }

      setExportingFormat(formato);
      setErrorMessage('');
      setSuccessMessage('');

      try {
        const servidor = suggestionToServidor(selectedServidor);

        await baixarFrequenciaArquivo({
          servidor,
          mes,
          ano,
          incluirPontoFacultativo: includePontoFacultativo,
          faltaVaiParaRubrica,
          formato
        });

        const nomeServidor = normalizeSpaces(servidor.nomeCompleto ?? servidor.nome) || 'servidor';
        setSuccessMessage(`Arquivo ${formato.toUpperCase()} gerado com sucesso para ${nomeServidor}.`);

        if (
          !preview ||
          preview.ano !== ano ||
          preview.mes !== mes ||
          preview.servidor.cpf !== onlyDigits(selectedServidor.cpf)
        ) {
          void loadPreview();
        }
      } catch (error: any) {
        setErrorMessage(error?.message || 'Não foi possível exportar a frequência.');
      } finally {
        setExportingFormat(null);
      }
    },
    [selectedServidor, mes, ano, includePontoFacultativo, faltaVaiParaRubrica, preview, loadPreview]
  );

  const dayItems = useMemo(() => {
    if (!preview) return [];
    return Object.values(preview.dayMap).sort((a, b) => a.dia - b.dia);
  }, [preview]);

  const counts = useMemo(() => {
    if (!preview) {
      return {
        sabados: 0,
        domingos: 0,
        ferias: 0,
        atestados: 0,
        feriados: 0,
        faltas: 0,
        ponto: 0,
        warnings: 0
      };
    }

    return dayItems.reduce(
      (acc, item) => {
        if (item.finalStatus === 'SABADO') acc.sabados += 1;
        if (item.finalStatus === 'DOMINGO') acc.domingos += 1;
        if (item.finalStatus === 'FERIAS') acc.ferias += 1;
        if (item.finalStatus === 'ATESTADO') acc.atestados += 1;
        if (item.finalStatus === 'FERIADO') acc.feriados += 1;
        if (item.finalStatus === 'FALTA') acc.faltas += 1;
        if (item.finalStatus === 'PONTO_FACULTATIVO') acc.ponto += 1;
        acc.warnings += item.avisos.length;
        return acc;
      },
      {
        sabados: 0,
        domingos: 0,
        ferias: 0,
        atestados: 0,
        feriados: 0,
        faltas: 0,
        ponto: 0,
        warnings: 0
      }
    );
  }, [preview, dayItems]);

  return (
    <div className="min-h-full bg-[#07111f] text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 xl:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-500/15 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0a1d33] p-6 shadow-2xl shadow-cyan-950/30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_30%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                <ClipboardList className="h-4 w-4" />
                Gestão de Frequência
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                  Folha mensal de frequência
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                  Consolide férias, atestados, feriados, ponto facultativo e faltas em uma única folha,
                  com exportação DOCX/PDF fiel ao modelo institucional.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Sábados</div>
                <div className="mt-1 text-2xl font-semibold text-white">{counts.sabados}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Domingos</div>
                <div className="mt-1 text-2xl font-semibold text-white">{counts.domingos}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Férias/Atestado</div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {counts.ferias + counts.atestados}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Avisos</div>
                <div className="mt-1 text-2xl font-semibold text-white">{counts.warnings}</div>
              </div>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-300" />
            <div>{errorMessage}</div>
          </div>
        ) : null}

        {successMessage ? (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" />
            <div>{successMessage}</div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[400px,1fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Servidor</h2>
                  <p className="text-sm text-slate-400">
                    Digite ao menos 3 letras para localizar um servidor.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4" ref={suggestionsBoxRef}>
                <label className="block text-sm font-medium text-slate-300">Buscar servidor</label>
                <div className="relative">
                  <input
                    value={buscaServidor}
                    onChange={(e) => setBuscaServidor(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0) setDropdownOpen(true);
                    }}
                    placeholder="Ex.: Joa, matrícula ou CPF"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 pr-11 text-sm text-white outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    {loadingSuggestions ? (
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                    ) : (
                      <Search className="h-4 w-4 text-slate-500" />
                    )}
                  </div>

                  {dropdownOpen ? (
                    <div className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl shadow-slate-950/40 backdrop-blur">
                      {suggestions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-400">Nenhum servidor encontrado.</div>
                      ) : (
                        suggestions.map((item) => (
                          <button
                            key={`${item.id}-${item.cpf}`}
                            type="button"
                            onClick={() => handleSelectServidor(item)}
                            className="flex w-full flex-col rounded-xl px-3 py-3 text-left transition hover:bg-white/5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-medium text-white">{item.nome || 'Sem nome'}</div>
                              <span
                                className={cn(
                                  'rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em]',
                                  item.status === 'ATIVO'
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                    : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
                                )}
                              >
                                {statusLabel(item)}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              CPF {maskCpf(item.cpf)} • Matrícula {item.matricula || '—'}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {item.categoria || 'Sem categoria'} • {item.setor || 'Sem setor'}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>

                <label className="flex items-center gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={somenteAtivos}
                    onChange={(e) => setSomenteAtivos(e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-slate-950 text-cyan-500 focus:ring-cyan-500/30"
                  />
                  Mostrar apenas servidores ativos
                </label>

                {selectedServidor ? (
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-white">
                          <User className="h-4 w-4 text-cyan-300" />
                          <span className="font-semibold">{selectedServidor.nome}</span>
                        </div>
                        <div className="text-xs text-slate-300">
                          CPF {maskCpf(selectedServidor.cpf)} • Matrícula {selectedServidor.matricula || '—'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {selectedServidor.categoria || 'Sem categoria'} •{' '}
                          {selectedServidor.setor || 'Sem setor'}
                        </div>
                        <div className="text-xs text-slate-500">{selectedServidor.cargo || 'Sem cargo'}</div>
                      </div>

                      <button
                        type="button"
                        onClick={handleClearServidor}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-4 text-sm text-slate-400">
                    Nenhum servidor selecionado.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Período</h2>
                  <p className="text-sm text-slate-400">Defina o mês e o ano da folha.</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Mês</label>
                  <select
                    value={mes}
                    onChange={(e) => setMes(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {MONTHS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Ano</label>
                  <select
                    value={ano}
                    onChange={(e) => setAno(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={includePontoFacultativo}
                    onChange={(e) => setIncludePontoFacultativo(e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-slate-950 text-cyan-500 focus:ring-cyan-500/30"
                  />
                  Incluir ponto facultativo na rubrica
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={faltaVaiParaRubrica}
                    onChange={(e) => setFaltaVaiParaRubrica(e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-slate-950 text-cyan-500 focus:ring-cyan-500/30"
                  />
                  Registrar falta na rubrica do servidor
                </label>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void loadPreview()}
                  disabled={!selectedServidor || loadingPreview}
                  className={cn(
                    'inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                    !selectedServidor || loadingPreview
                      ? 'cursor-not-allowed border border-white/10 bg-white/5 text-slate-500'
                      : 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15'
                  )}
                >
                  {loadingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  Visualizar consolidação
                </button>

                <button
                  type="button"
                  onClick={() => void exportarArquivo('docx')}
                  disabled={!selectedServidor || exportingFormat !== null}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                    !selectedServidor || exportingFormat !== null
                      ? 'cursor-not-allowed border border-white/10 bg-white/5 text-slate-500'
                      : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15'
                  )}
                >
                  {exportingFormat === 'docx' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Exportar DOCX
                </button>

                <button
                  type="button"
                  onClick={() => void exportarArquivo('pdf')}
                  disabled={!selectedServidor || exportingFormat !== null}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                    !selectedServidor || exportingFormat !== null
                      ? 'cursor-not-allowed border border-white/10 bg-white/5 text-slate-500'
                      : 'border border-sky-500/30 bg-sky-500/10 text-sky-100 hover:bg-sky-500/15'
                  )}
                >
                  {exportingFormat === 'pdf' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Exportar PDF
                </button>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <StatCard
                icon={<Clock3 className="h-5 w-5" />}
                label="Período selecionado"
                value={`${monthLabel(mes)} / ${ano}`}
                helper="Sábados e domingos são calculados dinamicamente conforme o mês."
              />
              <StatCard
                icon={<ShieldAlert className="h-5 w-5" />}
                label="Regra de falta"
                value={faltaVaiParaRubrica ? 'Rubrica' : 'Ocorrência'}
                helper="Mantém compatibilidade com a lógica institucional."
              />
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20 backdrop-blur">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Resumo da consolidação</h2>
                  <p className="text-sm text-slate-400">
                    Visualização consolidada da folha antes da exportação.
                  </p>
                </div>

                {preview ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    {preview.servidor.nome} • {monthLabel(preview.mes)} / {preview.ano}
                  </div>
                ) : null}
              </div>

              {!preview ? (
                <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-slate-950/50 p-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <div className="mt-4 text-lg font-semibold text-white">Nenhuma prévia carregada</div>
                  <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    Selecione um servidor e clique em <strong>Visualizar consolidação</strong> para revisar
                    sábados, domingos, férias, atestados, feriados, pontos facultativos e faltas.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                      icon={<CalendarDays className="h-5 w-5" />}
                      label="Dias do mês"
                      value={preview.totalDiasMes}
                      helper={
                        preview.hiddenRowsFrom > 0
                          ? `Linhas ocultadas: ${preview.hiddenRowsFrom}-${preview.hiddenRowsTo}`
                          : 'Sem linhas excedentes'
                      }
                    />
                    <StatCard
                      icon={<FileSpreadsheet className="h-5 w-5" />}
                      label="Feriados"
                      value={counts.feriados}
                      helper="Levados para rubrica do servidor"
                    />
                    <StatCard
                      icon={<FileText className="h-5 w-5" />}
                      label="Faltas"
                      value={counts.faltas}
                      helper={faltaVaiParaRubrica ? 'Aplicadas na rubrica' : 'Aplicadas em ocorrência'}
                    />
                    <StatCard
                      icon={<RefreshCw className="h-5 w-5" />}
                      label="Ponto facultativo"
                      value={counts.ponto}
                      helper={includePontoFacultativo ? 'Ativado' : 'Desativado'}
                    />
                  </div>

                  <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-slate-950/80">
                          <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-400">
                            <th className="px-4 py-3">Dia</th>
                            <th className="px-4 py-3">Semana</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Rubrica</th>
                            <th className="px-4 py-3">Ocorrência 1</th>
                            <th className="px-4 py-3">Ocorrência 2</th>
                            <th className="px-4 py-3">Observações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-slate-950/35 text-sm">
                          {dayItems.map((item) => (
                            <tr key={item.dia} className="align-top">
                              <td className="px-4 py-3 font-semibold text-white">{item.dia}</td>
                              <td className="px-4 py-3 text-slate-300">{item.weekdayLabel}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={cn(
                                    'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]',
                                    chipClassName(buildStatusTone(item.finalStatus))
                                  )}
                                >
                                  {item.finalStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-100">{item.rubrica || '—'}</td>
                              <td className="px-4 py-3 text-slate-300">{item.ocorrencia1 || '—'}</td>
                              <td className="px-4 py-3 text-slate-300">{item.ocorrencia2 || '—'}</td>
                              <td className="px-4 py-3 text-slate-400">{item.observacoes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {preview.warnings.length > 0 ? (
                    <div className="mt-5 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                        <AlertCircle className="h-4 w-4" />
                        Avisos da consolidação
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-amber-100/90">
                        {preview.warnings.map((warning, index) => (
                          <li key={`${warning}-${index}`} className="rounded-2xl bg-black/10 px-3 py-2">
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
