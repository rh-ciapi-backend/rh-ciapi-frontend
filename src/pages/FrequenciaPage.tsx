import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  Eye,
  FileText,
  Loader2,
  Search,
  ShieldAlert,
  User,
  X
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

type PreviewDayItem = {
  dia: number;
  weekdayLabel: string;
  finalStatus: string;
  rubrica: string;
  ocorrencia1: string;
  ocorrencia2: string;
  observacoes: string;
  avisos: string[];
};

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

const TODAY = new Date();
const DEFAULT_MONTH = TODAY.getMonth() + 1;
const DEFAULT_YEAR = TODAY.getFullYear();

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function normalizeSpaces(value: any): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function onlyDigits(value: any): string {
  return String(value ?? '').replace(/\D+/g, '');
}

function asArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
}

function safeObjectValues<T = any>(value: any): T[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  try {
    return Object.values(value) as T[];
  } catch {
    return [];
  }
}

function toFiniteNumber(value: any, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function monthLabel(month: number): string {
  return MONTHS.find((item) => item.value === month)?.label ?? String(month);
}

function buildYearOptions(centerYear = DEFAULT_YEAR): number[] {
  const years: number[] = [];
  for (let year = centerYear - 3; year <= centerYear + 3; year += 1) {
    years.push(year);
  }
  return years;
}

function maskCpf(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length !== 11) return value || '';
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function normalizeSuggestion(row: any): Suggestion | null {
  const nome = normalizeSpaces(row?.nomeCompleto || row?.nome_completo || row?.nome);
  if (!nome) return null;

  const cpf = onlyDigits(row?.cpf);
  const matricula = normalizeSpaces(row?.matricula);
  const id = normalizeSpaces(
    row?.servidor ||
      row?.id ||
      row?.uuid ||
      row?.servidor_id ||
      row?.cpf ||
      `${nome}-${matricula || 'sem-id'}`
  );

  return {
    id: id || `${nome}-${cpf || matricula || 'sem-id'}`,
    nome,
    cpf,
    matricula,
    categoria: normalizeSpaces(row?.categoria || row?.categoria_canonica),
    setor: normalizeSpaces(row?.setor || row?.lotacao || row?.lotacao_interna),
    cargo: normalizeSpaces(row?.cargo),
    status: normalizeSpaces(row?.status || 'ATIVO').toUpperCase(),
    raw: row
  };
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

function normalizePreviewDays(preview: ConsolidacaoFrequenciaResult | null): PreviewDayItem[] {
  if (!preview || typeof preview !== 'object') return [];

  const rawDayMap = (preview as any)?.dayMap;
  const merged = [...asArray<any>(rawDayMap), ...safeObjectValues<any>(rawDayMap)];

  const mapped = merged
    .map((item) => {
      const dia = toFiniteNumber(item?.dia, Number.NaN);
      if (!Number.isFinite(dia) || dia <= 0) return null;

      return {
        dia,
        weekdayLabel: normalizeSpaces(item?.weekdayLabel || item?.semana || item?.diaSemana),
        finalStatus: normalizeSpaces(item?.finalStatus || item?.status || 'NORMAL').toUpperCase(),
        rubrica: normalizeSpaces(item?.rubrica),
        ocorrencia1: normalizeSpaces(item?.ocorrencia1 || item?.o1 || item?.turno1),
        ocorrencia2: normalizeSpaces(item?.ocorrencia2 || item?.o2 || item?.turno2),
        observacoes: normalizeSpaces(item?.observacoes || item?.observacao),
        avisos: asArray<any>(item?.avisos).map((a) => normalizeSpaces(a)).filter(Boolean)
      } as PreviewDayItem;
    })
    .filter((item): item is PreviewDayItem => Boolean(item))
    .sort((a, b) => a.dia - b.dia);

  return mapped.filter(
    (item, index, arr) => arr.findIndex((entry) => entry.dia === item.dia) === index
  );
}

function chipClassName(status: string): string {
  const value = String(status || '').toUpperCase();

  switch (value) {
    case 'FERIAS':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    case 'ATESTADO':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    case 'FERIADO':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
    case 'FALTA':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
    case 'PONTO_FACULTATIVO':
      return 'border-violet-500/30 bg-violet-500/10 text-violet-300';
    case 'SABADO':
    case 'DOMINGO':
      return 'border-slate-500/30 bg-slate-500/10 text-slate-300';
    default:
      return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
  }
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-slate-950/20 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            {label}
          </div>
          <div className="mt-3 truncate text-2xl font-semibold text-white">{value}</div>
          {helper ? <div className="mt-1 text-xs text-slate-400">{helper}</div> : null}
        </div>
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ToggleCard({
  checked,
  onChange,
  title,
  description
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 transition hover:border-cyan-400/20 hover:bg-slate-950/80">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-white/10 bg-slate-950 text-cyan-500 focus:ring-cyan-500/30"
      />
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-100">{title}</div>
        <div className="mt-1 text-xs leading-5 text-slate-400">{description}</div>
      </div>
    </label>
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
  const searchRequestIdRef = useRef(0);

  const yearOptions = useMemo(() => buildYearOptions(), []);
  const previewDays = useMemo(() => normalizePreviewDays(preview), [preview]);

  const counts = useMemo(() => {
    return previewDays.reduce(
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
        warnings: asArray<any>((preview as any)?.warnings).length
      }
    );
  }, [previewDays, preview]);

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

  useEffect(() => {
    if (!errorMessage && !successMessage) return;

    const timer = window.setTimeout(() => {
      setErrorMessage('');
      setSuccessMessage('');
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [errorMessage, successMessage]);

  const searchServidores = useCallback(
    async (term: string) => {
      const trimmed = normalizeSpaces(term);
      const requestId = ++searchRequestIdRef.current;

      if (trimmed.length < 3) {
        setSuggestions([]);
        setDropdownOpen(false);
        setLoadingSuggestions(false);
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

        if (requestId !== searchRequestIdRef.current) return;

        if (error) {
          throw error;
        }

        const mapped = asArray<any>(data)
          .map(normalizeSuggestion)
          .filter((item): item is Suggestion => Boolean(item));

        const deduped = mapped.filter(
          (item, index, arr) =>
            arr.findIndex(
              (entry) => entry.id === item.id || (!!item.cpf && entry.cpf === item.cpf)
            ) === index
        );

        setSuggestions(deduped);
        setDropdownOpen(true);
      } catch (error) {
        if (requestId !== searchRequestIdRef.current) return;
        console.error('Erro ao buscar servidores:', error);
        setSuggestions([]);
        setDropdownOpen(true);
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setLoadingSuggestions(false);
        }
      }
    },
    [somenteAtivos]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchServidores(buscaServidor);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [buscaServidor, searchServidores]);

  const handleSelectServidor = useCallback((item: Suggestion) => {
    setSelectedServidor(item);
    setBuscaServidor(item.nome);
    setDropdownOpen(false);
    setPreview(null);
    setErrorMessage('');
    setSuccessMessage('');
  }, []);

  const handleClearServidor = useCallback(() => {
    setSelectedServidor(null);
    setBuscaServidor('');
    setSuggestions([]);
    setDropdownOpen(false);
    setPreview(null);
    setErrorMessage('');
    setSuccessMessage('');
  }, []);

  const handleLoadPreview = useCallback(async () => {
    if (!selectedServidor) {
      setErrorMessage('Selecione um servidor para visualizar a frequência.');
      setSuccessMessage('');
      return;
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
    } catch (error: any) {
      setPreview(null);
      setErrorMessage(
        normalizeSpaces(error?.message) || 'Não foi possível carregar a consolidação.'
      );
    } finally {
      setLoadingPreview(false);
    }
  }, [selectedServidor, mes, ano, includePontoFacultativo, faltaVaiParaRubrica]);

  const handleExport = useCallback(
    async (formato: ExportFormat) => {
      if (!selectedServidor) {
        setErrorMessage('Selecione um servidor antes de exportar.');
        setSuccessMessage('');
        return;
      }

      setExportingFormat(formato);
      setErrorMessage('');
      setSuccessMessage('');

      try {
        await baixarFrequenciaArquivo({
          servidor: suggestionToServidor(selectedServidor),
          mes,
          ano,
          incluirPontoFacultativo: includePontoFacultativo,
          faltaVaiParaRubrica,
          formato
        });

        setSuccessMessage(`Arquivo ${formato.toUpperCase()} gerado com sucesso.`);
      } catch (error: any) {
        setErrorMessage(normalizeSpaces(error?.message) || 'Não foi possível exportar.');
      } finally {
        setExportingFormat(null);
      }
    },
    [selectedServidor, mes, ano, includePontoFacultativo, faltaVaiParaRubrica]
  );

  const servidorResumo = useMemo(() => {
    if (!selectedServidor) return null;

    return {
      nome: selectedServidor.nome || 'Servidor',
      cpf: maskCpf(selectedServidor.cpf || ''),
      matricula: selectedServidor.matricula || '—',
      categoria: selectedServidor.categoria || 'Sem categoria',
      setor: selectedServidor.setor || 'Sem setor',
      cargo: selectedServidor.cargo || 'Sem cargo'
    };
  }, [selectedServidor]);

  const previewWarnings = useMemo(() => {
    return asArray<any>((preview as any)?.warnings)
      .map((item) => normalizeSpaces(item))
      .filter(Boolean);
  }, [preview]);

  return (
    <div className="min-h-full bg-[#07111f] text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 xl:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-cyan-500/15 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0a1d33] p-6 shadow-2xl shadow-cyan-950/30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_30%)]" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                <ClipboardList className="h-4 w-4" />
                Gestão de Frequência
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                  Folha mensal de frequência
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                  Consulte a consolidação mensal com férias, atestados, feriados, ponto facultativo e faltas em um painel único.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Sábados</div>
                <div className="mt-1 text-2xl font-semibold text-white">{counts.sabados}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Domingos</div>
                <div className="mt-1 text-2xl font-semibold text-white">{counts.domingos}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Férias/Atestado</div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {counts.ferias + counts.atestados}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Avisos</div>
                <div className="mt-1 text-2xl font-semibold text-white">{counts.warnings}</div>
              </div>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-300" />
            <div className="flex-1">{errorMessage}</div>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="rounded-lg p-1 text-rose-300 transition hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {successMessage ? (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" />
            <div className="flex-1">{successMessage}</div>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="rounded-lg p-1 text-emerald-300 transition hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px,1fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Servidor</h2>
                  <p className="text-sm text-slate-400">Busque por nome, matrícula ou CPF.</p>
                </div>
              </div>

              <div className="mt-5 space-y-4" ref={suggestionsBoxRef}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Buscar servidor
                  </label>
                  <div className="relative">
                    <input
                      value={buscaServidor}
                      onChange={(e) => setBuscaServidor(e.target.value)}
                      onFocus={() => {
                        if (buscaServidor.trim().length >= 3) {
                          setDropdownOpen(true);
                        }
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

                    {dropdownOpen && buscaServidor.trim().length >= 3 ? (
                      <div className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl shadow-slate-950/40 backdrop-blur">
                        {loadingSuggestions ? (
                          <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Buscando servidores...
                          </div>
                        ) : suggestions.length === 0 ? (
                          <div className="px-3 py-3 text-sm text-slate-400">
                            Nenhum servidor encontrado.
                          </div>
                        ) : (
                          suggestions.map((item, index) => (
                            <button
                              key={`${item.id}-${item.cpf || index}`}
                              type="button"
                              onClick={() => handleSelectServidor(item)}
                              className="flex w-full flex-col rounded-xl px-3 py-3 text-left transition hover:bg-white/5"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="truncate font-medium text-white">{item.nome}</div>
                                <span
                                  className={cn(
                                    'rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em]',
                                    item.status === 'ATIVO'
                                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                      : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
                                  )}
                                >
                                  {item.status || 'SEM STATUS'}
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
                </div>

                <ToggleCard
                  checked={somenteAtivos}
                  onChange={setSomenteAtivos}
                  title="Mostrar apenas servidores ativos"
                  description="Prioriza quem está em exercício e reduz o volume da busca."
                />

                {servidorResumo ? (
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 text-white">
                          <User className="h-4 w-4 flex-shrink-0 text-cyan-300" />
                          <span className="truncate font-semibold">{servidorResumo.nome}</span>
                        </div>
                        <div className="text-xs text-slate-300">
                          CPF {servidorResumo.cpf || '—'} • Matrícula {servidorResumo.matricula}
                        </div>
                        <div className="text-xs text-slate-400">
                          {servidorResumo.categoria} • {servidorResumo.setor}
                        </div>
                        <div className="text-xs text-slate-500">{servidorResumo.cargo}</div>
                      </div>

                      <button
                        type="button"
                        onClick={handleClearServidor}
                        className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                      >
                        <X className="h-3.5 w-3.5" />
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
                  <h2 className="text-lg font-semibold text-white">Período e regras</h2>
                  <p className="text-sm text-slate-400">Ajuste o mês e as regras da consolidação.</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Mês</label>
                  <select
                    value={mes}
                    onChange={(e) => setMes(toFiniteNumber(e.target.value, DEFAULT_MONTH))}
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
                    onChange={(e) => setAno(toFiniteNumber(e.target.value, DEFAULT_YEAR))}
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
                <ToggleCard
                  checked={includePontoFacultativo}
                  onChange={setIncludePontoFacultativo}
                  title="Incluir ponto facultativo na rubrica"
                  description="Mantém os eventos opcionais dentro da consolidação mensal."
                />

                <ToggleCard
                  checked={faltaVaiParaRubrica}
                  onChange={setFaltaVaiParaRubrica}
                  title="Registrar falta na rubrica do servidor"
                  description="Desative quando quiser levar a falta para o campo de ocorrência."
                />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => void handleLoadPreview()}
                  disabled={!selectedServidor || loadingPreview}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                    !selectedServidor || loadingPreview
                      ? 'cursor-not-allowed border border-white/10 bg-white/5 text-slate-500'
                      : 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15'
                  )}
                >
                  {loadingPreview ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  Visualizar
                </button>

                <button
                  type="button"
                  onClick={() => void handleExport('docx')}
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
                  DOCX
                </button>

                <button
                  type="button"
                  onClick={() => void handleExport('pdf')}
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
                  PDF
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <StatCard
                  icon={<Clock3 className="h-5 w-5" />}
                  label="Período selecionado"
                  value={`${monthLabel(mes)} / ${ano}`}
                  helper="Sábados e domingos seguem o mês escolhido."
                />
                <StatCard
                  icon={<ShieldAlert className="h-5 w-5" />}
                  label="Regra da falta"
                  value={faltaVaiParaRubrica ? 'Rubrica' : 'Ocorrência'}
                  helper="Compatível com a lógica já aprovada."
                />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20 backdrop-blur">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Resumo da consolidação</h2>
                  <p className="text-sm text-slate-400">Painel de conferência antes da exportação.</p>
                </div>

                {preview ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    {normalizeSpaces((preview as any)?.servidor?.nome || (preview as any)?.servidor?.nomeCompleto || 'Servidor')} • {monthLabel(toFiniteNumber((preview as any)?.mes, mes))} / {toFiniteNumber((preview as any)?.ano, ano)}
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
                    Selecione um servidor e clique em <strong>Visualizar</strong> para conferir a consolidação do mês.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                      icon={<CalendarDays className="h-5 w-5" />}
                      label="Dias do mês"
                      value={toFiniteNumber((preview as any)?.totalDiasMes, previewDays.length)}
                      helper={
                        toFiniteNumber((preview as any)?.hiddenRowsFrom, 0) > 0
                          ? `Linhas ocultadas: ${toFiniteNumber((preview as any)?.hiddenRowsFrom, 0)}-${toFiniteNumber((preview as any)?.hiddenRowsTo, 0)}`
                          : 'Sem linhas excedentes'
                      }
                    />
                    <StatCard
                      icon={<FileText className="h-5 w-5" />}
                      label="Feriados"
                      value={counts.feriados}
                      helper="Exibidos na rubrica"
                    />
                    <StatCard
                      icon={<FileText className="h-5 w-5" />}
                      label="Faltas"
                      value={counts.faltas}
                      helper={faltaVaiParaRubrica ? 'Na rubrica' : 'Na ocorrência'}
                    />
                    <StatCard
                      icon={<Clock3 className="h-5 w-5" />}
                      label="Ponto facultativo"
                      value={counts.ponto}
                      helper={includePontoFacultativo ? 'Ativado' : 'Desativado'}
                    />
                  </div>

                  <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-slate-950/80">
                          <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-slate-400">
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
                          {previewDays.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                A consolidação foi carregada, mas não retornou dias válidos para exibição.
                              </td>
                            </tr>
                          ) : (
                            previewDays.map((item) => (
                              <tr key={item.dia} className="align-top transition hover:bg-white/[0.03]">
                                <td className="px-4 py-3 font-semibold text-white">{item.dia}</td>
                                <td className="px-4 py-3 text-slate-300">{item.weekdayLabel || '—'}</td>
                                <td className="px-4 py-3">
                                  <span
                                    className={cn(
                                      'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]',
                                      chipClassName(item.finalStatus)
                                    )}
                                  >
                                    {item.finalStatus || 'NORMAL'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-100">{item.rubrica || '—'}</td>
                                <td className="px-4 py-3 text-slate-300">{item.ocorrencia1 || '—'}</td>
                                <td className="px-4 py-3 text-slate-300">{item.ocorrencia2 || '—'}</td>
                                <td className="px-4 py-3 text-slate-400">{item.observacoes || '—'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {previewWarnings.length > 0 ? (
                    <div className="mt-5 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                        <AlertCircle className="h-4 w-4" />
                        Avisos da consolidação
                      </div>

                      <ul className="mt-3 space-y-2 text-sm text-amber-100/90">
                        {previewWarnings.map((warning, index) => (
                          <li
                            key={`${warning}-${index}`}
                            className="rounded-2xl bg-black/10 px-3 py-2"
                          >
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
