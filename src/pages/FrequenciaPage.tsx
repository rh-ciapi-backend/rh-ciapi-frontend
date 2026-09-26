import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Download,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Filter,
  Hash,
  Layers3,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import {
  baixarFrequenciaArquivo,
  listarFrequenciaMensal,
  type FrequenciaDayItem,
  type FrequenciaMensalItem,
  type FrequenciaServidor,
  type FrequenciaExportPayload,
} from '../services/frequenciaService';
import type { FrequenciaBatchStrategy } from '../types/frequencia';
import type { EventoCalendario } from '../services/eventosService';
import GerenciarFeriadosModal from '../components/frequencia/GerenciarFeriadosModal';

type StatsCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  action: string;
  onClick: () => void;
  active?: boolean;
};

type ExportMode = 'individual' | 'lote';
type ExportScope =
  | 'servidor_selecionado'
  | 'todos_ativos'
  | 'todos_inativos'
  | 'todos'
  | 'categoria'
  | 'setor'
  | 'filtros_atuais';

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

const EXPORT_SCOPE_OPTIONS: Array<{ value: ExportScope; label: string }> = [
  { value: 'servidor_selecionado', label: 'Servidor selecionado' },
  { value: 'todos_ativos', label: 'Todos os ativos' },
  { value: 'todos_inativos', label: 'Todos os inativos' },
  { value: 'todos', label: 'Todos' },
  { value: 'categoria', label: 'Por categoria' },
  { value: 'setor', label: 'Por setor' },
  { value: 'filtros_atuais', label: 'Pelos filtros atuais' },
];

const BATCH_STRATEGY_OPTIONS: Array<{ value: FrequenciaBatchStrategy; label: string }> = [
  { value: 'documento_unico', label: 'Documento único' },
  { value: 'zip', label: 'Arquivos separados (ZIP)' },
];

function StatsCard({ title, value, subtitle, icon, action, onClick, active = false }: StatsCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={subtitle}
      className={`w-full rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 ${active ? 'border-blue-500 bg-blue-500/10' : 'border-[#26344a] bg-[#172033] hover:border-blue-500/40 hover:bg-[#1e293b]'}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{value}</h3>
        </div>
        <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400">
          {icon}
        </div>
      </div>
      <p className="min-h-[2.5rem] text-sm text-slate-400">{subtitle}</p>
      <p className="mt-2 text-xs font-medium text-blue-300">{action}</p>
    </button>
  );
}

function normalizeText(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatCpf(cpf?: string) {
  const digits = String(cpf || '').replace(/\D/g, '');
  if (digits.length !== 11) return cpf || 'Não informado';
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function safeDisplay(value?: string, fallback = 'Não informado') {
  const text = String(value || '').trim();
  return text || fallback;
}

function compactDisplay(value?: string) {
  const text = String(value || '').trim();
  return text || '—';
}

function getWeekdayLabel(dateIso?: string) {
  if (!dateIso) return 'Dia';
  const date = new Date(`${dateIso}T12:00:00`);
  const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return labels[date.getDay()] || 'Dia';
}

function countDiasComRegistro(dias: FrequenciaDayItem[]) {
  return dias.filter(
    (day) =>
      day.turno1?.rubrica ||
      day.turno2?.rubrica ||
      day.turno1?.ocorrencia ||
      day.turno2?.ocorrencia ||
      day.statusFinal
  ).length;
}

function countDiasComOcorrencia(dias: FrequenciaDayItem[]) {
  return dias.filter((day) => day.turno1?.ocorrencia || day.turno2?.ocorrencia).length;
}

function countTurnosComOcorrencia(dias: FrequenciaDayItem[]) {
  return dias.reduce((total, day) =>
    total + Number(Boolean(day.turno1?.ocorrencia)) + Number(Boolean(day.turno2?.ocorrencia)), 0);
}

function countDiasComRubrica(dias: FrequenciaDayItem[]) {
  return dias.filter((day) => day.turno1?.rubrica || day.turno2?.rubrica).length;
}

function statusColor(status: string) {
  const s = normalizeText(status);
  if (s.includes('inativo')) return 'bg-rose-500/15 text-rose-300 border-rose-400/20';
  if (s.includes('ativo')) return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20';
  if (s.includes('afast')) return 'bg-amber-500/15 text-amber-300 border-amber-400/20';
  return 'bg-slate-500/15 text-slate-300 border-slate-400/20';
}

function resolveDayTone(day: FrequenciaDayItem) {
  const text = normalizeText(
    day.statusFinal ||
      day.turno1?.rubrica ||
      day.turno2?.rubrica ||
      day.turno1?.ocorrencia ||
      day.turno2?.ocorrencia
  );

  if (text.includes('feriado')) {
    return {
      card: 'border-[#26344a] bg-[#1e293b]',
      accent: 'text-violet-200',
      muted: 'text-violet-300/80',
      pill: 'border-violet-400/20 bg-violet-500/12 text-violet-200',
      dot: 'bg-violet-300',
    };
  }

  if (text.includes('ponto') || text.includes('facultativo')) {
    return {
      card: 'border-[#26344a] bg-[#1e293b]',
      accent: 'text-sky-200',
      muted: 'text-sky-300/80',
      pill: 'border-sky-400/20 bg-sky-500/12 text-sky-200',
      dot: 'bg-sky-300',
    };
  }

  if (text.includes('atestado')) {
    return {
      card: 'border-[#26344a] bg-[#1e293b]',
      accent: 'text-amber-200',
      muted: 'text-amber-300/80',
      pill: 'border-amber-400/20 bg-amber-500/12 text-amber-200',
      dot: 'bg-amber-300',
    };
  }

  if (text.includes('falta')) {
    return {
      card: 'border-[#26344a] bg-[#1e293b]',
      accent: 'text-rose-200',
      muted: 'text-rose-300/80',
      pill: 'border-rose-400/20 bg-rose-500/12 text-rose-200',
      dot: 'bg-rose-300',
    };
  }

  if (text.includes('ferias') || text.includes('férias')) {
    return {
      card: 'border-[#26344a] bg-[#1e293b]',
      accent: 'text-emerald-200',
      muted: 'text-emerald-300/80',
      pill: 'border-emerald-400/20 bg-emerald-500/12 text-emerald-200',
      dot: 'bg-emerald-300',
    };
  }

  if (text.includes('sábado') || text.includes('sabado') || text.includes('domingo')) {
    return {
      card: 'border-[#26344a] bg-[#1e293b]',
      accent: 'text-slate-200',
      muted: 'text-slate-400',
      pill: 'border-slate-500/20 bg-slate-500/12 text-slate-300',
      dot: 'bg-slate-400',
    };
  }

  if (text) {
    return {
      card: 'border-[#26344a] bg-[#1e293b]',
      accent: 'text-blue-300',
      muted: 'text-blue-400/80',
      pill: 'border-blue-400/20 bg-blue-500/10 text-blue-300',
      dot: 'bg-blue-400',
    };
  }

  return {
    card: 'border-[#26344a] bg-[#1e293b]',
    accent: 'text-white',
    muted: 'text-slate-400',
    pill: 'border-white/10 bg-white/[0.04] text-slate-400',
    dot: 'bg-slate-500',
  };
}

function buildStatusPill(day: FrequenciaDayItem) {
  const source =
    day.statusFinal ||
    day.turno1?.rubrica ||
    day.turno2?.rubrica ||
    day.turno1?.ocorrencia ||
    day.turno2?.ocorrencia;

  const value = compactDisplay(source);
  const tone = resolveDayTone(day);

  if (value === '—') {
    return {
      label: 'Sem status',
      className: 'border-white/10 bg-white/[0.04] text-slate-400',
    };
  }

  return {
    label: value,
    className: tone.pill,
  };
}

function CalendarMiniField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#26344a] bg-[#172033] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-[13px] font-medium text-slate-100">{value}</p>
    </div>
  );
}

export default function FrequenciaPage() {
  const today = new Date();
  const [ano, setAno] = useState<number>(today.getFullYear());
  const [mes, setMes] = useState<number>(today.getMonth() + 1);
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('TODAS');
  const [filterSetor, setFilterSetor] = useState('TODOS');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [exportMode, setExportMode] = useState<ExportMode>('individual');
  const [exportScope, setExportScope] = useState<ExportScope>('servidor_selecionado');
  const [batchStrategy, setBatchStrategy] =
    useState<FrequenciaBatchStrategy>('documento_unico');

  const [items, setItems] = useState<FrequenciaMensalItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isEventosModalOpen, setIsEventosModalOpen] = useState(false);
  const [isServidoresExpanded, setIsServidoresExpanded] = useState(true);
  const [isCalendarioExpanded, setIsCalendarioExpanded] = useState(true);
  const [calendarioFiltro, setCalendarioFiltro] = useState<'todos' | 'registro' | 'ocorrencia'>('todos');
  const [eventosCount, setEventosCount] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

  const refreshFrequencia = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const result = await listarFrequenciaMensal({
          ano,
          mes,
          categoria: filterCategoria !== 'TODAS' ? filterCategoria : undefined,
          setor: filterSetor !== 'TODOS' ? filterSetor : undefined,
          status: filterStatus !== 'TODOS' ? filterStatus : undefined,
        });

        if (!active) return;

        const safeItems = Array.isArray(result?.data) ? result.data : [];
        setItems(safeItems);

        const feriadoDays = safeItems.flatMap((item) => item.dayItems || []);
        const totalComEvento = feriadoDays.filter((day) => {
          const text = normalizeText(
            day.statusFinal ||
              day.turno1?.rubrica ||
              day.turno2?.rubrica ||
              day.turno1?.ocorrencia ||
              day.turno2?.ocorrencia
          );
          return text.includes('feriado') || text.includes('facultativo');
        }).length;

        setEventosCount(totalComEvento);

        setSelectedId((current) => {
          if (!safeItems.length) return '';
          const exists = safeItems.some(
            (item) => String(item.servidor?.id ?? '') === String(current)
          );
          return exists ? current : String(safeItems[0].servidor?.id ?? '');
        });
      } catch (err: any) {
        if (!active) return;
        setItems([]);
        setSelectedId('');
        setEventosCount(0);
        setError(err?.message || 'Falha ao carregar os dados da frequência.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [ano, mes, filterCategoria, filterSetor, filterStatus, reloadToken]);

  const categorias = useMemo(() => {
    const values = items
      .map((item) => safeDisplay(item.servidor?.categoria, 'NÃO INFORMADA'))
      .filter(Boolean) as string[];

    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [items]);

  const setores = useMemo(() => {
    const values = items
      .map((item) => safeDisplay(item.servidor?.setor, 'NÃO INFORMADO'))
      .filter(Boolean) as string[];

    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = normalizeText(search);

    return items.filter((item) => {
      const servidor = item.servidor || ({} as FrequenciaServidor);

      const matchesSearch =
        !term ||
        normalizeText(servidor.nome || '').includes(term) ||
        normalizeText(servidor.cpf || '').includes(term) ||
        normalizeText(servidor.matricula || '').includes(term) ||
        normalizeText(servidor.setor || '').includes(term) ||
        normalizeText(servidor.categoria || '').includes(term);

      const matchesCategoria =
        filterCategoria === 'TODAS' ||
        safeDisplay(servidor.categoria, 'NÃO INFORMADA') === filterCategoria;

      const matchesSetor =
        filterSetor === 'TODOS' ||
        safeDisplay(servidor.setor, 'NÃO INFORMADO') === filterSetor;

      const matchesStatus =
        filterStatus === 'TODOS' ||
        safeDisplay(servidor.status, 'NÃO INFORMADO') === filterStatus;

      return matchesSearch && matchesCategoria && matchesSetor && matchesStatus;
    });
  }, [items, search, filterCategoria, filterSetor, filterStatus]);

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedId('');
      return;
    }

    const exists = filteredItems.some(
      (item) => String(item.servidor?.id ?? '') === String(selectedId)
    );

    if (!exists) {
      setSelectedId(String(filteredItems[0].servidor?.id ?? ''));
    }
  }, [filteredItems, selectedId]);

  useEffect(() => {
    if (exportMode === 'individual') {
      setExportScope('servidor_selecionado');
    } else if (exportScope === 'servidor_selecionado') {
      setExportScope('filtros_atuais');
    }
  }, [exportMode, exportScope]);

  const selectedItem = useMemo(() => {
    return (
      filteredItems.find((item) => String(item.servidor?.id ?? '') === String(selectedId)) ||
      filteredItems[0] ||
      null
    );
  }, [filteredItems, selectedId]);

  const selectedServidor = selectedItem?.servidor || null;
  const selectedDias = selectedItem?.dayItems || [];
  const calendarioDias = calendarioFiltro === 'todos' ? selectedDias : selectedDias.filter((day) =>
    calendarioFiltro === 'registro'
      ? Boolean(day.turno1?.rubrica || day.turno2?.rubrica || day.turno1?.ocorrencia || day.turno2?.ocorrencia || day.statusFinal)
      : Boolean(day.turno1?.ocorrencia || day.turno2?.ocorrencia)
  );

  const mostrarCalendario = (filtro: 'registro' | 'ocorrencia') => {
    setCalendarioFiltro((atual) => atual === filtro ? 'todos' : filtro);
    setIsCalendarioExpanded(true);
    window.requestAnimationFrame(() => document.getElementById('calendario-mensal')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const mostrarServidores = (status: 'TODOS' | 'ATIVO') => {
    setFilterStatus(status);
    setIsServidoresExpanded(true);
    window.requestAnimationFrame(() => document.getElementById('lista-servidores-frequencia')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const stats = useMemo(() => {
    const totalServidores = filteredItems.length;
    const ativos = filteredItems.filter((item) =>
      normalizeText(item.servidor?.status || '') === 'ativo'
    ).length;
    const totalDiasComRegistro = filteredItems.reduce(
      (sum, item) => sum + countDiasComRegistro(item.dayItems || []),
      0
    );
    const totalOcorrencias = filteredItems.reduce(
      (sum, item) => sum + countTurnosComOcorrencia(item.dayItems || []),
      0
    );

    return {
      totalServidores,
      ativos,
      totalDiasComRegistro,
      totalOcorrencias,
    };
  }, [filteredItems]);

  const exportPreviewLabel = useMemo(() => {
    if (exportMode === 'individual') {
      return selectedServidor ? `1 servidor selecionado` : 'Selecione um servidor';
    }

    switch (exportScope) {
      case 'todos_ativos':
        return `${filteredItems.filter((item) => normalizeText(item.servidor?.status || '').includes('ativo')).length} servidor(es) ativos visíveis`;
      case 'todos_inativos':
        return `${filteredItems.filter((item) => normalizeText(item.servidor?.status || '').includes('inativo')).length} servidor(es) inativos visíveis`;
      case 'todos':
        return `${items.length} servidor(es) retornados pela competência`;
      case 'categoria':
        return `${filteredItems.length} servidor(es) da categoria atual`;
      case 'setor':
        return `${filteredItems.length} servidor(es) do setor atual`;
      case 'filtros_atuais':
      default:
        return `${filteredItems.length} servidor(es) conforme filtros atuais`;
    }
  }, [exportMode, exportScope, filteredItems, items.length, selectedServidor]);

  const exportStrategyHint = useMemo(() => {
    if (exportMode !== 'lote') return 'Exportação individual do servidor selecionado.';
    if (batchStrategy === 'documento_unico') {
      return 'Lote em um único arquivo Word, ideal para impressão direta.';
    }
    return 'Lote em arquivos separados compactados em ZIP.';
  }, [exportMode, batchStrategy]);

  function buildExportPayload(formato: 'docx' | 'pdf' | 'csv'): FrequenciaExportPayload {
    if (formato === 'csv') {
      return {
        ano,
        mes,
        formato,
        modoExportacao: 'individual',
        escopoExportacao: 'servidor_selecionado',
        servidorId: selectedServidor?.id,
        servidorCpf: selectedServidor?.cpf,
        categoria: filterCategoria !== 'TODAS' ? filterCategoria : undefined,
        setor: filterSetor !== 'TODOS' ? filterSetor : undefined,
        status: filterStatus !== 'TODOS' ? filterStatus : undefined,
      };
    }

    if (exportMode === 'individual') {
      return {
        ano,
        mes,
        formato,
        modoExportacao: 'individual',
        escopoExportacao: 'servidor_selecionado',
        servidorId: selectedServidor?.id,
        servidorCpf: selectedServidor?.cpf,
        categoria: filterCategoria !== 'TODAS' ? filterCategoria : undefined,
        setor: filterSetor !== 'TODOS' ? filterSetor : undefined,
        status: filterStatus !== 'TODOS' ? filterStatus : undefined,
      };
    }

    const basePayload: FrequenciaExportPayload = {
      ano,
      mes,
      formato,
      modoExportacao: 'lote',
      escopoExportacao: exportScope,
      estrategiaLote: formato === 'pdf' ? 'zip' : batchStrategy,
      categoria: filterCategoria !== 'TODAS' ? filterCategoria : undefined,
      setor: filterSetor !== 'TODOS' ? filterSetor : undefined,
      status: filterStatus !== 'TODOS' ? filterStatus : undefined,
      usarFiltrosAtuais: exportScope === 'filtros_atuais',
      apenasAtivos: exportScope === 'todos_ativos',
    };

    if (exportScope === 'todos_ativos') {
      basePayload.status = 'ATIVO';
    }

    if (exportScope === 'todos_inativos') {
      basePayload.status = 'INATIVO';
    }

    if (exportScope === 'todos') {
      basePayload.status = undefined;
      basePayload.categoria = undefined;
      basePayload.setor = undefined;
    }

    if (exportScope === 'categoria' && !basePayload.categoria) {
      basePayload.categoria = selectedServidor?.categoria;
    }

    if (exportScope === 'setor' && !basePayload.setor) {
      basePayload.setor = selectedServidor?.setor;
    }

    if (exportScope === 'filtros_atuais') {
      basePayload.servidoresCpf = filteredItems
        .map((item) => item.servidor?.cpf || '')
        .filter(Boolean);
      basePayload.servidoresIds = filteredItems
        .map((item) => item.servidor?.id)
        .filter((value) => value !== undefined && value !== null && `${value}` !== '');
    }

    return basePayload;
  }

  async function handleExport(formato: 'docx' | 'pdf' | 'csv') {
    try {
      if (formato === 'csv' && !selectedServidor) {
        setError('Selecione um servidor antes de exportar.');
        return;
      }

      if (exportMode === 'individual' && formato !== 'csv' && !selectedServidor) {
        setError('Selecione um servidor antes de exportar.');
        return;
      }

      if (exportMode === 'lote' && formato === 'csv') {
        setError('O CSV permanece individual. Para lote, use DOCX ou PDF.');
        return;
      }

      if (
        exportMode === 'lote' &&
        exportScope === 'categoria' &&
        !(filterCategoria !== 'TODAS' || selectedServidor?.categoria)
      ) {
        setError('Selecione uma categoria ou escolha um servidor com categoria preenchida.');
        return;
      }

      if (
        exportMode === 'lote' &&
        exportScope === 'setor' &&
        !(filterSetor !== 'TODOS' || selectedServidor?.setor)
      ) {
        setError('Selecione um setor ou escolha um servidor com setor preenchido.');
        return;
      }

      if (exportMode === 'lote' && exportScope === 'filtros_atuais' && !filteredItems.length) {
        setError('Nenhum servidor encontrado nos filtros atuais para exportação em lote.');
        return;
      }

      setError('');
      setExporting(`${exportMode}-${formato}`);

      await baixarFrequenciaArquivo(buildExportPayload(formato), selectedServidor || undefined);
    } catch (err: any) {
      setError(err?.message || `Falha ao exportar ${formato.toUpperCase()}.`);
    } finally {
      setExporting('');
    }
  }

  function handleEventosSaved(eventos: EventoCalendario[]) {
    setEventosCount(Array.isArray(eventos) ? eventos.length : 0);
    refreshFrequencia();
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">FREQUÊNCIA</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">Frequência Mensal</h1>
            <p className="mt-1 text-sm text-slate-400">Gere, acompanhe e exporte a frequência dos servidores.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIsEventosModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-[#26344a] bg-[#172033] px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-[#1e293b]">
              <CalendarDays className="h-4 w-4" /> Gerenciar feriados
            </button>
            <a href="#exportacao-frequencia" className="inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2563eb]">
              <Download className="h-4 w-4" /> Exportar
            </a>
          </div>
        </header>

        {error ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-100">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Falha ao carregar ou exportar frequência</p>
              <p className="mt-1 text-sm text-rose-200/90">{error}</p>
            </div>
          </div>
        ) : null}
        <section aria-label="Filtros da frequência" className="mb-6 rounded-2xl border border-[#26344a] bg-[#172033] p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Filter className="h-4 w-4 text-blue-400" /> Filtros</h2>
            <span className="text-xs text-slate-400">{MONTHS[mes - 1]} de {ano}</span>
          </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="xl:col-span-2">
                  <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                    Busca
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Nome, CPF, matrícula..."
                      className="w-full rounded-xl border border-[#26344a] bg-[#0b1220] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Mês
                    </label>
                    <select
                      value={mes}
                      onChange={(e) => setMes(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-3 text-sm text-white outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                    >
                      {MONTHS.map((label, index) => (
                        <option key={label} value={index + 1}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Ano
                    </label>
                    <input
                      type="number"
                      min={2020}
                      max={2100}
                      value={ano}
                      onChange={(e) => setAno(Number(e.target.value) || today.getFullYear())}
                      className="w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-3 text-sm text-white outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                    Categoria
                  </label>
                  <select
                    value={filterCategoria}
                    onChange={(e) => setFilterCategoria(e.target.value)}
                    className="w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-3 text-sm text-white outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                  >
                    <option value="TODAS">Todas</option>
                    {categorias.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                    Setor
                  </label>
                  <select
                    value={filterSetor}
                    onChange={(e) => setFilterSetor(e.target.value)}
                    className="w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-3 text-sm text-white outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                  >
                    <option value="TODOS">Todos</option>
                    {setores.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-3 text-sm text-white outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                  >
                    <option value="TODOS">Todos</option>
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                    <option value="AFASTADO">AFASTADO</option>
                  </select>
                </div>
              </div>
        </section>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Ativos"
            value={stats.ativos}
            subtitle="Servidores ativos dentro dos filtros atuais."
            icon={<BadgeCheck className="h-5 w-5" />}
            action="Ver servidores ativos"
            active={filterStatus === 'ATIVO'}
            onClick={() => mostrarServidores('ATIVO')}
          />
          <StatsCard
            title="Servidores"
            value={stats.totalServidores}
            subtitle="Cadastros encontrados após os filtros aplicados."
            icon={<Users className="h-5 w-5" />}
            action="Ver todos os status"
            active={filterStatus === 'TODOS'}
            onClick={() => mostrarServidores('TODOS')}
          />
          <StatsCard
            title="Dias com registro"
            value={stats.totalDiasComRegistro}
            subtitle="Soma dos dias com rubrica, ocorrência ou status; inclui os servidores filtrados."
            icon={<CalendarDays className="h-5 w-5" />}
            action="Ver dias preenchidos no calendário"
            active={calendarioFiltro === 'registro'}
            onClick={() => mostrarCalendario('registro')}
          />
          <StatsCard
            title="Ocorrências de turno"
            value={stats.totalOcorrencias}
            subtitle="Total de turnos com ocorrência; um dia pode contar duas vezes."
            icon={<Hash className="h-5 w-5" />}
            action="Ver dias com ocorrência"
            active={calendarioFiltro === 'ocorrencia'}
            onClick={() => mostrarCalendario('ocorrencia')}
          />
        </div>
        <section id="exportacao-frequencia" aria-label="Exportação da frequência" className="mb-6 rounded-2xl border border-[#26344a] bg-[#172033] p-4 md:p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Exportação</h2>
              <p className="mt-1 text-xs text-slate-400">{exportPreviewLabel} · {exportStrategyHint}</p>
            </div>
            <span className="text-xs text-slate-400">{eventosCount} ocorrência(s) de calendário detectada(s)</span>
          </div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0 flex-1">
                <div
                  className={`grid grid-cols-1 gap-3 ${
                    exportMode === 'lote' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
                  }`}
                >
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Tipo de exportação
                    </label>
                    <select
                      value={exportMode}
                      onChange={(e) => setExportMode(e.target.value as ExportMode)}
                      className="w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-3 text-sm text-white outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                    >
                      <option value="individual">Individual</option>
                      <option value="lote">Lote</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Escopo
                    </label>
                    <select
                      value={exportMode === 'individual' ? 'servidor_selecionado' : exportScope}
                      onChange={(e) => setExportScope(e.target.value as ExportScope)}
                      disabled={exportMode === 'individual'}
                      className="w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-3 text-sm text-white outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {EXPORT_SCOPE_OPTIONS.filter((option) =>
                        exportMode === 'individual'
                          ? option.value === 'servidor_selecionado'
                          : option.value !== 'servidor_selecionado'
                      ).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {exportMode === 'lote' ? (
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                        Saída do lote
                      </label>
                      <select
                        value={batchStrategy}
                        onChange={(e) => setBatchStrategy(e.target.value as FrequenciaBatchStrategy)}
                        className="w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-3 text-sm text-white outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                      >
                        {BATCH_STRATEGY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:w-auto">
                <button
                  onClick={() => handleExport('docx')}
                  disabled={!!exporting || (exportMode === 'individual' && !selectedServidor)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#26344a] bg-[#1e293b] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {exporting === `${exportMode}-docx` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : exportMode === 'lote' && batchStrategy === 'zip' ? (
                    <FileArchive className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {exportMode === 'lote'
                    ? batchStrategy === 'documento_unico'
                      ? 'Exportar DOCX único'
                      : 'Exportar lote DOCX'
                    : 'Exportar DOCX'}
                </button>

                <button
                  onClick={() => handleExport('pdf')}
                  disabled={!!exporting || (exportMode === 'individual' && !selectedServidor)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#26344a] bg-[#1e293b] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {exporting === `${exportMode}-pdf` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : exportMode === 'lote' ? (
                    <Layers3 className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {exportMode === 'lote' ? 'Exportar lote PDF' : 'Exportar PDF'}
                </button>

                <button
                  onClick={() => handleExport('csv')}
                  disabled={!!exporting || !selectedServidor || exportMode === 'lote'}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-100 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {exporting === 'individual-csv' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  Exportar CSV
                </button>
              </div>
          </div>
        </section>

        <div className="mb-5 rounded-2xl border border-[#26344a] bg-[#172033] p-5 md:p-6">
              {selectedServidor ? (
                <>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
                        <UserRound className="h-8 w-8" />
                      </div>

                      <div>
                        <h2 className="text-2xl font-semibold text-white">{selectedServidor.nome}</h2>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${statusColor(
                              selectedServidor.status || ''
                            )}`}
                          >
                            {safeDisplay(selectedServidor.status, 'NÃO INFORMADO')}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-slate-300">
                            {safeDisplay(selectedServidor.categoria, 'NÃO INFORMADA')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl border border-[#26344a] bg-[#0b1220] p-4">
                        <div className="mb-2 flex items-center gap-2 text-slate-400">
                          <Hash className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-[0.16em]">Matrícula</span>
                        </div>
                        <p className="text-sm font-medium text-white">
                          {safeDisplay(selectedServidor.matricula)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#26344a] bg-[#0b1220] p-4">
                        <div className="mb-2 flex items-center gap-2 text-slate-400">
                          <ShieldCheck className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-[0.16em]">CPF</span>
                        </div>
                        <p className="text-sm font-medium text-white">{formatCpf(selectedServidor.cpf)}</p>
                      </div>

                      <div className="rounded-xl border border-[#26344a] bg-[#0b1220] p-4">
                        <div className="mb-2 flex items-center gap-2 text-slate-400">
                          <Building2 className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-[0.16em]">Setor</span>
                        </div>
                        <p className="text-sm font-medium text-white">{safeDisplay(selectedServidor.setor)}</p>
                      </div>

                      <div className="rounded-xl border border-[#26344a] bg-[#0b1220] p-4">
                        <div className="mb-2 flex items-center gap-2 text-slate-400">
                          <FileText className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-[0.16em]">Cargo</span>
                        </div>
                        <p className="text-sm font-medium text-white">{safeDisplay(selectedServidor.cargo)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-[#26344a] bg-[#0b1220] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Dias com registro</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {countDiasComRegistro(selectedDias)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#26344a] bg-[#0b1220] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Dias com rubrica</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {countDiasComRubrica(selectedDias)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#26344a] bg-[#0b1220] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Ocorrências de turno</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {countDiasComOcorrencia(selectedDias)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
                  <p className="text-base font-medium text-white">Nenhum servidor selecionado</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Ajuste os filtros ou aguarde o carregamento da lista.
                  </p>
                </div>
              )}
            </div>

        <div
          className={`grid grid-cols-1 items-start gap-5 ${
            isServidoresExpanded
              ? 'xl:grid-cols-[300px_minmax(0,1fr)]'
              : 'xl:grid-cols-[64px_minmax(0,1fr)]'
          }`}
        >
          <aside id="lista-servidores-frequencia" className="min-w-0 self-start scroll-mt-24">
            <div className={`rounded-2xl border border-[#26344a] bg-[#172033] ${isServidoresExpanded ? 'p-4' : 'p-2'}`}>
              <div className={`flex items-center ${isServidoresExpanded ? 'mb-4 justify-between gap-2' : 'justify-center'}`}>
                {isServidoresExpanded ? (
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-white">Servidores</h2>
                    <p className="text-xs text-slate-400">{filteredItems.length} encontrado(s)</p>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  {loading && isServidoresExpanded ? <Loader2 className="h-4 w-4 animate-spin text-blue-400" /> : null}
                  <button
                    type="button"
                    onClick={() => setIsServidoresExpanded((expanded) => !expanded)}
                    aria-label={isServidoresExpanded ? 'Minimizar lista de servidores' : 'Maximizar lista de servidores'}
                    aria-expanded={isServidoresExpanded}
                    title={isServidoresExpanded ? 'Minimizar lista de servidores' : 'Maximizar lista de servidores'}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#26344a] bg-[#0b1220] text-slate-300 transition hover:border-blue-400/40 hover:text-white"
                  >
                    {isServidoresExpanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isServidoresExpanded ? <div className="max-h-[680px] space-y-2 overflow-y-auto pr-1">
                {!loading && !filteredItems.length ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center">
                    <p className="text-sm text-slate-300">Nenhum servidor encontrado.</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Ajuste os filtros ou confira o retorno da API.
                    </p>
                  </div>
                ) : null}

                {filteredItems.map((item) => {
                  const servidor = item.servidor || ({} as FrequenciaServidor);
                  const active = String(servidor.id ?? '') === String(selectedId);

                  return (
                    <button
                      key={String(servidor.id ?? servidor.cpf ?? servidor.nome)}
                      onClick={() => setSelectedId(String(servidor.id ?? ''))}
                      className={[
                        'w-full rounded-xl border p-3 text-left transition',
                        active
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{servidor.nome}</p>
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {safeDisplay(servidor.categoria, 'NÃO INFORMADA')}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${statusColor(
                            servidor.status || ''
                          )}`}
                        >
                          {safeDisplay(servidor.status, 'NÃO INFORMADO')}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <div className="rounded-xl bg-[#09111d] px-3 py-2">
                          <span className="block text-[10px] uppercase tracking-[0.14em] text-slate-500">
                            CPF
                          </span>
                          <span className="mt-1 block text-slate-200">{formatCpf(servidor.cpf)}</span>
                        </div>
                        <div className="rounded-xl bg-[#09111d] px-3 py-2">
                          <span className="block text-[10px] uppercase tracking-[0.14em] text-slate-500">
                            Matrícula
                          </span>
                          <span className="mt-1 block text-slate-200">
                            {safeDisplay(servidor.matricula)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div> : null}
            </div>
          </aside>

            <div id="calendario-mensal" className="min-w-0 self-start scroll-mt-24 rounded-2xl border border-[#26344a] bg-[#172033] p-5">
              <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${isCalendarioExpanded ? 'mb-4' : ''}`}>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Calendário mensal · {MONTHS[mes - 1]} / {ano}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Rubricas e ocorrências do servidor selecionado.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEventosModalOpen(true)}
                    className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-100 transition hover:bg-blue-500/20"
                  >
                    Gerenciar feriados
                  </button>

                  <div className="rounded-full border border-white/10 bg-[#09111d] px-3 py-1.5 text-xs text-slate-300">
                    {calendarioDias.length} de {selectedDias.length} dia(s)
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCalendarioExpanded((expanded) => !expanded)}
                    aria-label={isCalendarioExpanded ? 'Minimizar calendário' : 'Maximizar calendário'}
                    aria-expanded={isCalendarioExpanded}
                    aria-controls="calendario-mensal-conteudo"
                    title={isCalendarioExpanded ? 'Minimizar calendário' : 'Maximizar calendário'}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#26344a] bg-[#0b1220] text-slate-300 transition hover:border-blue-400/40 hover:text-white"
                  >
                    {isCalendarioExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div id="calendario-mensal-conteudo" hidden={!isCalendarioExpanded}>
              {!calendarioDias.length ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
                  <CalendarDays className="mx-auto h-10 w-10 text-slate-600" />
                  <p className="mt-4 text-base font-medium text-white">Sem dias carregados</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {selectedDias.length ? 'Nenhum dia corresponde ao indicador selecionado.' : 'O servidor selecionado não trouxe registros de dias nesse retorno da API.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {calendarioDias.map((day) => {
                    const tone = resolveDayTone(day);
                    const pill = buildStatusPill(day);

                    return (
                      <div
                        key={`${selectedServidor?.id}-${day.dia}-${day.data}`}
                        className={[
                          'group rounded-xl border p-3.5 transition-colors duration-200',
                          'hover:border-[#3b82f6]/40',
                          tone.card,
                        ].join(' ')}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/15 shadow-inner">
                              <span className={`text-lg font-semibold leading-none text-white`}>
                                {String(day.dia).padStart(2, '0')}
                              </span>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-semibold uppercase tracking-[0.18em] text-slate-400`}
                                >
                                  {getWeekdayLabel(day.data)}
                                </span>
                                <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                              </div>
                              <p className="mt-1 text-[11px] text-slate-400">{day.data}</p>
                            </div>
                          </div>

                          <span
                            className={`max-w-[45%] truncate rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${pill.className}`}
                            title={pill.label}
                          >
                            {pill.label}
                          </span>
                        </div>

                        <div className="rounded-xl border border-[#26344a] bg-[#172033] px-3 py-3">
                          <div className="mb-1 flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Rubrica</p>
                          </div>
                          <p
                            className={`truncate text-sm font-semibold ${
                              compactDisplay(day.turno1?.rubrica || day.turno2?.rubrica) === '—'
                                ? 'text-slate-400'
                                : 'text-slate-100'
                            }`}
                            title={compactDisplay(day.turno1?.rubrica || day.turno2?.rubrica)}
                          >
                            {compactDisplay(day.turno1?.rubrica || day.turno2?.rubrica)}
                          </p>
                        </div>

                        <div className="mt-2.5 grid grid-cols-2 gap-2">
                          <CalendarMiniField
                            label="O1"
                            value={compactDisplay(day.turno1?.ocorrencia)}
                          />
                          <CalendarMiniField
                            label="O2"
                            value={compactDisplay(day.turno2?.ocorrencia)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            </div>
        </div>
      </div>

      <GerenciarFeriadosModal
        open={isEventosModalOpen}
        ano={ano}
        mes={mes}
        onClose={() => setIsEventosModalOpen(false)}
        onSaved={handleEventosSaved}
      />
    </div>
  );
}
