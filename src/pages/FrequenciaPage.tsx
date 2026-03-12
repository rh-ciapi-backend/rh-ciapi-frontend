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


function serverToSuggestion(row: any): Suggestion {
  const id =
    String(
      row?.id ??
        row?.servidor ??
        row?.uuid ??
        row?.servidor_id ??
        row?.cpf ??
        Math.random().toString(36).slice(2)
    );

  return {
    id,
    nome: normalizeSpaces(row?.nomeCompleto ?? row?.nome_completo ?? row?.nome),
    cpf: onlyDigits(row?.cpf),
    matricula: normalizeSpaces(row?.matricula),
    categoria: normalizeSpaces(row?.categoria),
    setor: normalizeSpaces(row?.setor),
    cargo: normalizeSpaces(row?.cargo),
    status: normalizeSpaces(row?.status || 'ATIVO'),
    raw: row
  };
}

function suggestionToServidor(s: Suggestion): ServidorFrequencia {
  return {
    id: s.raw?.id ?? s.raw?.servidor ?? s.raw?.uuid ?? s.id,
    servidor: s.raw?.servidor,
    uuid: s.raw?.uuid,
    servidor_id: s.raw?.servidor_id,
    nome: s.raw?.nome ?? s.nome,
    nomeCompleto: s.raw?.nomeCompleto ?? s.raw?.nome_completo ?? s.nome,
    nome_completo: s.raw?.nome_completo ?? s.nome,
    cpf: s.cpf,
    matricula: s.matricula,
    categoria: s.categoria,
    setor: s.setor,
    cargo: s.cargo,
    chDiaria: s.raw?.chDiaria ?? s.raw?.ch_diaria ?? '',
    ch_diaria: s.raw?.ch_diaria ?? s.raw?.chDiaria ?? '',
    chSemanal: s.raw?.chSemanal ?? s.raw?.ch_semanal ?? '',
    ch_semanal: s.raw?.ch_semanal ?? s.raw?.chSemanal ?? '',
    status: s.status
  };
}

function resumoContadores(preview: ConsolidacaoFrequenciaResult | null) {
  const base = {
    sabados: 0,
    domingos: 0,
    feriados: 0,
    ferias: 0,
    atestados: 0,
    faltas: 0,
    pontos: 0,
    warnings: preview?.warnings?.length ?? 0
  };

  if (!preview) return base;

  Object.values(preview.dayMap).forEach((item) => {
    switch (item.finalStatus) {
      case 'SABADO':
        base.sabados += 1;
        break;
      case 'DOMINGO':
        base.domingos += 1;
        break;
      case 'FERIADO':
        base.feriados += 1;
        break;
      case 'FERIAS':
        base.ferias += 1;
        break;
      case 'ATESTADO':
        base.atestados += 1;
        break;
      case 'FALTA':
        base.faltas += 1;
        break;
      case 'PONTO_FACULTATIVO':
        base.pontos += 1;
        break;
      default:
        break;
    }
  });

  return base;
}

const FrequenciaPage: React.FC = () => {
  const [mes, setMes] = useState<number>(DEFAULT_MONTH);
  const [ano, setAno] = useState<number>(DEFAULT_YEAR);
  const [buscaServidor, setBuscaServidor] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedServidor, setSelectedServidor] = useState<Suggestion | null>(null);
  const [preview, setPreview] = useState<ConsolidacaoFrequenciaResult | null>(null);
  const [includePontoFacultativo, setIncludePontoFacultativo] = useState<boolean>(true);
  const [faltaVaiParaRubrica, setFaltaVaiParaRubrica] = useState<boolean>(true);
  const [somenteAtivos, setSomenteAtivos] = useState<boolean>(true);

  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const years = useMemo(() => buildYearOptions(), []);
  const counts = useMemo(() => resumoContadores(preview), [preview]);

  useEffect(() => {
    function handleClickOutside(ev: MouseEvent) {
      if (!searchBoxRef.current) return;
      if (!searchBoxRef.current.contains(ev.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchServidores = useCallback(
    async (term: string) => {
      const query = normalizeSpaces(term);
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      setLoadingSuggestions(true);
      setErrorMessage('');

      try {
        let dbQuery = supabase
          .from('servidores')
          .select('*')
          .limit(12);

        if (somenteAtivos) {
          dbQuery = dbQuery.eq('status', 'ATIVO');
        }

        const likeTerm = `%${query}%`;

        const { data, error } = await dbQuery.or(
          `nome.ilike.${likeTerm},nome_completo.ilike.${likeTerm},nomeCompleto.ilike.${likeTerm},matricula.ilike.${likeTerm},cpf.ilike.${likeTerm}`
        );

        if (error) throw error;

        const normalized = (Array.isArray(data) ? data : [])
          .map(serverToSuggestion)
          .filter((item) => item.nome || item.cpf || item.matricula)
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

        setSuggestions(normalized);
        setDropdownOpen(true);
      } catch (error: any) {
        setSuggestions([]);
        setErrorMessage(error?.message || 'Não foi possível buscar servidores.');
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

        if (!preview || preview.ano !== ano || preview.mes !== mes || preview.servidor.cpf !== onlyDigits(selectedServidor.cpf)) {
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

        {(errorMessage || successMessage) && (
          <div
            className={cn(
              'rounded-2xl border px-4 py-3 text-sm shadow-lg',
              errorMessage
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            )}
          >
            <div className="flex items-start gap-3">
              {errorMessage ? (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              )}
              <span>{errorMessage || successMessage}</span>
            </div>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl shadow-black/20">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Parâmetros da folha</h2>
                <p className="text-sm text-slate-400">
                  Escolha servidor, mês e regras institucionais antes da exportação.
                </p>
              </div>
              <CalendarDays className="h-6 w-6 text-cyan-300" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-300">Mês</span>
                <select
                  value={mes}
                  onChange={(e) => setMes(Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                >
                  {MONTHS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-300">Ano</span>
                <select
                  value={ano}
                  onChange={(e) => setAno(Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>

              <div ref={searchBoxRef} className="space-y-2 md:col-span-2 xl:col-span-1">
                <span className="text-sm font-medium text-slate-300">Servidor</span>
                <div className="relative">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 transition focus-within:border-cyan-400">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      value={buscaServidor}
                      onChange={(e) => {
                        setBuscaServidor(e.target.value);
                        if (!e.target.value.trim()) {
                          setSelectedServidor(null);
                          setSuggestions([]);
                        }
                      }}
                      onFocus={() => suggestions.length > 0 && setDropdownOpen(true)}
                      placeholder="Digite 3 letras, CPF ou matrícula"
                      className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                    />
                    {loadingSuggestions && <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />}
                  </div>

                  {dropdownOpen && suggestions.length > 0 && (
                    <div className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-slate-700 bg-slate-950 p-2 shadow-2xl">
                      {suggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectServidor(item)}
                          className="flex w-full flex-col gap-1 rounded-xl px-3 py-3 text-left transition hover:bg-slate-900"
                        >
                          <span className="text-sm font-semibold text-white">{item.nome}</span>
                          <span className="text-xs text-slate-400">
                            {item.matricula ? `Matrícula: ${item.matricula}` : 'Sem matrícula'}
                            {item.cpf ? ` • CPF: ${maskCpf(item.cpf)}` : ''}
                          </span>
                          <span className="text-xs text-slate-500">
                            {item.categoria || 'Sem categoria'}
                            {item.setor ? ` • ${item.setor}` : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedServidor && (
              <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-cyan-300">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-semibold">Servidor selecionado</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">{selectedServidor.nome}</div>
                      <div className="mt-1 text-sm text-slate-300">
                        {selectedServidor.matricula ? `Matrícula: ${selectedServidor.matricula}` : 'Matrícula não informada'}
                        {selectedServidor.cpf ? ` • CPF: ${maskCpf(selectedServidor.cpf)}` : ''}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        {selectedServidor.categoria || 'Sem categoria'}
                        {selectedServidor.setor ? ` • ${selectedServidor.setor}` : ''}
                        {selectedServidor.cargo ? ` • ${selectedServidor.cargo}` : ''}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearServidor}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200"
                  >
                    Limpar seleção
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                <input
                  type="checkbox"
                  checked={includePontoFacultativo}
                  onChange={(e) => setIncludePontoFacultativo(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500"
                />
                <div>
                  <div className="text-sm font-medium text-slate-200">Incluir ponto facultativo</div>
                  <div className="text-xs text-slate-500">Joga na rubrica quando habilitado</div>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                <input
                  type="checkbox"
                  checked={faltaVaiParaRubrica}
                  onChange={(e) => setFaltaVaiParaRubrica(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500"
                />
                <div>
                  <div className="text-sm font-medium text-slate-200">Falta na rubrica</div>
                  <div className="text-xs text-slate-500">Desmarque para mandar para ocorrência</div>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                <input
                  type="checkbox"
                  checked={somenteAtivos}
                  onChange={(e) => setSomenteAtivos(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500"
                />
                <div>
                  <div className="text-sm font-medium text-slate-200">Somente ativos</div>
                  <div className="text-xs text-slate-500">Filtra a busca de servidores</div>
                </div>
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={loadPreview}
                disabled={loadingPreview || !selectedServidor}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Visualizar consolidação
              </button>

              <button
                type="button"
                onClick={() => exportarArquivo('docx')}
                disabled={!!exportingFormat || !selectedServidor}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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
                onClick={() => exportarArquivo('pdf')}
                disabled={!!exportingFormat || !selectedServidor}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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

          <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl shadow-black/20">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Resumo da folha</h2>
                <p className="text-sm text-slate-400">
                  Diagnóstico rápido antes da exportação.
                </p>
              </div>
              <RefreshCw className="h-6 w-6 text-cyan-300" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Feriados', value: counts.feriados, tone: 'blue' as StatusChipTone },
                { label: 'Férias', value: counts.ferias, tone: 'green' as StatusChipTone },
                { label: 'Atestados', value: counts.atestados, tone: 'yellow' as StatusChipTone },
                { label: 'Faltas', value: counts.faltas, tone: 'red' as StatusChipTone },
                { label: 'Ponto facultativo', value: counts.pontos, tone: 'purple' as StatusChipTone },
                { label: 'Avisos', value: counts.warnings, tone: 'slate' as StatusChipTone }
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    'rounded-2xl border px-4 py-4',
                    chipClassName(item.tone)
                  )}
                >
                  <div className="text-xs uppercase tracking-[0.16em]">{item.label}</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Clock3 className="h-4 w-4 text-cyan-300" />
                Competência atual
              </div>
              <div className="mt-3 text-xl font-bold text-white">
                {monthLabel(mes)} / {ano}
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Sábados, domingos, férias, atestados e feriados são calculados automaticamente conforme o mês.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <ShieldAlert className="h-4 w-4 text-amber-300" />
                Regras institucionais aplicadas
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>• Rubrica recebe sábado, domingo, feriado, férias, atestado e ponto facultativo.</li>
                <li>• Linhas excedentes são removidas conforme o último dia real do mês.</li>
                <li>• Conflitos são registrados em aviso sem quebrar a exportação.</li>
              </ul>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl shadow-black/20">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Pré-visualização mensal</h2>
              <p className="text-sm text-slate-400">
                Confira a rubrica e as ocorrências por dia antes de gerar o documento oficial.
              </p>
            </div>

            {preview && (
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                <FileSpreadsheet className="h-4 w-4" />
                {preview.totalDiasMes} dias no mês
              </div>
            )}
          </div>

          {!preview ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                <CalendarDays className="h-7 w-7" />
              </div>
              <div className="text-lg font-semibold text-white">Nenhuma consolidação carregada</div>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
                Selecione um servidor e clique em <strong>Visualizar consolidação</strong> para montar a folha
                mensal antes da exportação.
              </p>
            </div>
          ) : (
            <>
              {preview.warnings.length > 0 && (
                <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-200">
                    <AlertCircle className="h-4 w-4" />
                    Avisos encontrados
                  </div>
                  <div className="max-h-36 space-y-2 overflow-auto text-sm text-amber-100/90">
                    {preview.warnings.map((warning, index) => (
                      <div key={`${warning}-${index}`} className="rounded-xl bg-black/10 px-3 py-2">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {dayItems.map((item) => {
                  const tone = buildStatusTone(item.finalStatus);

                  return (
                    <div
                      key={item.dia}
                      className={cn(
                        'rounded-2xl border bg-slate-900/60 p-4 transition hover:-translate-y-0.5 hover:shadow-lg',
                        item.conflitos.length > 0
                          ? 'border-amber-500/30'
                          : 'border-slate-800'
                      )}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                            Dia {item.dia}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-white">
                            {item.weekdayLabel}
                          </div>
                        </div>

                        <span
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
                            chipClassName(tone)
                          )}
                        >
                          {item.finalStatus === 'NORMAL' ? 'NORMAL' : item.rubrica || item.finalStatus}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Rubrica</div>
                          <div className="mt-1 min-h-[20px] font-medium text-slate-100">
                            {item.rubrica || '—'}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs uppercase tracking-[0.14em] text-slate-500">1º turno</div>
                            <div className="mt-1 min-h-[20px] text-slate-300">
                              {item.ocorrencia1 || '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-[0.14em] text-slate-500">2º turno</div>
                            <div className="mt-1 min-h-[20px] text-slate-300">
                              {item.ocorrencia2 || '—'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Observações</div>
                          <div className="mt-1 min-h-[38px] text-xs leading-5 text-slate-400">
                            {item.observacoes || 'Sem observações'}
                          </div>
                        </div>

                        {item.conflitos.length > 0 && (
                          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                            {item.conflitos.join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default FrequenciaPage;
