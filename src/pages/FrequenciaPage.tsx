import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CalendarDays,
  Download,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Filter,
  Hash,
  Layers3,
  Loader2,
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

type StatsCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
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

function StatsCard({ title, value, subtitle, icon }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#101826] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{value}</h3>
        </div>
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-cyan-300">
          {icon}
        </div>
      </div>
      <p className="text-sm text-slate-400">{subtitle}</p>
    </div>
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

function countDiasComRubrica(dias: FrequenciaDayItem[]) {
  return dias.filter((day) => day.turno1?.rubrica || day.turno2?.rubrica).length;
}

function statusColor(status: string) {
  const s = normalizeText(status);
  if (s.includes('ativo')) return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20';
  if (s.includes('inativo')) return 'bg-rose-500/15 text-rose-300 border-rose-400/20';
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
      card: 'border-violet-400/20 bg-[linear-gradient(180deg,rgba(139,92,246,0.12),rgba(15,23,42,0.92))]',
      accent: 'text-violet-200',
      muted: 'text-violet-300/80',
      pill: 'border-violet-400/20 bg-violet-500/12 text-violet-200',
      dot: 'bg-violet-300',
    };
  }

  if (text.includes('ponto') || text.includes('facultativo')) {
    return {
      card: 'border-sky-400/20 bg-[linear-gradient(180deg,rgba(14,165,233,0.12),rgba(15,23,42,0.92))]',
      accent: 'text-sky-200',
      muted: 'text-sky-300/80',
      pill: 'border-sky-400/20 bg-sky-500/12 text-sky-200',
      dot: 'bg-sky-300',
    };
  }

  if (text.includes('atestado')) {
    return {
      card: 'border-amber-400/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.12),rgba(15,23,42,0.92))]',
      accent: 'text-amber-200',
      muted: 'text-amber-300/80',
      pill: 'border-amber-400/20 bg-amber-500/12 text-amber-200',
      dot: 'bg-amber-300',
    };
  }

  if (text.includes('falta')) {
    return {
      card: 'border-rose-400/20 bg-[linear-gradient(180deg,rgba(244,63,94,0.12),rgba(15,23,42,0.92))]',
      accent: 'text-rose-200',
      muted: 'text-rose-300/80',
      pill: 'border-rose-400/20 bg-rose-500/12 text-rose-200',
      dot: 'bg-rose-300',
    };
  }

  if (text.includes('ferias') || text.includes('férias')) {
    return {
      card: 'border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(15,23,42,0.92))]',
      accent: 'text-emerald-200',
      muted: 'text-emerald-300/80',
      pill: 'border-emerald-400/20 bg-emerald-500/12 text-emerald-200',
      dot: 'bg-emerald-300',
    };
  }

  if (text.includes('sábado') || text.includes('sabado') || text.includes('domingo')) {
    return {
      card: 'border-slate-500/20 bg-[linear-gradient(180deg,rgba(100,116,139,0.10),rgba(15,23,42,0.92))]',
      accent: 'text-slate-200',
      muted: 'text-slate-400',
      pill: 'border-slate-500/20 bg-slate-500/12 text-slate-300',
      dot: 'bg-slate-400',
    };
  }

  if (text) {
    return {
      card: 'border-cyan-400/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.10),rgba(15,23,42,0.92))]',
      accent: 'text-cyan-200',
      muted: 'text-cyan-300/80',
      pill: 'border-cyan-400/20 bg-cyan-500/12 text-cyan-200',
      dot: 'bg-cyan-300',
    };
  }

  return {
    card: 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(15,23,42,0.94))]',
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
    <div className="rounded-xl border border-white/8 bg-black/10 px-3 py-2">
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
        setError(err?.message || 'Falha ao carregar os dados da frequência.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [ano, mes, filterCategoria, filterSetor, filterStatus]);

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

  const stats = useMemo(() => {
    const totalServidores = filteredItems.length;
    const ativos = filteredItems.filter((item) =>
      normalizeText(item.servidor?.status || '').includes('ativo')
    ).length;
    const totalDiasComRegistro = filteredItems.reduce(
      (sum, item) => sum + countDiasComRegistro(item.dayItems || []),
      0
    );
    const totalOcorrencias = filteredItems.reduce(
      (sum, item) => sum + countDiasComOcorrencia(item.dayItems || []),
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

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="mx-auto max-w-[1700px] p-4 md:p-6 xl:p-8">
        <div className="mb-6 rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),linear-gradient(135deg,#0b1320_0%,#0f1d31_55%,#12243c_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
                  <ShieldCheck className="h-4 w-4" />
                  Dashboard Executivo
                </div>

                <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  Gestão de Frequência
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                  Painel consolidado para análise mensal da frequência dos servidores, com filtros,
                  estatísticas, calendário individual e exportações integradas.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  onClick={() => handleExport('docx')}
                  disabled={!!exporting || (exportMode === 'individual' && !selectedServidor)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
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

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_520px]">
              <div className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-cyan-200">
                    <Layers3 className="h-3.5 w-3.5" />
                    Exportação inteligente
                  </span>
                  <span>{exportPreviewLabel}</span>
                </div>
                <p className="mt-3 text-sm text-slate-300">{exportStrategyHint}</p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                <div className={`grid grid-cols-1 gap-3 ${exportMode === 'lote' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Tipo de exportação
                    </label>
                    <select
                      value={exportMode}
                      onChange={(e) => setExportMode(e.target.value as ExportMode)}
                      className="w-full rounded-2xl border border-white/10 bg-[#09111d] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
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
                      className="w-full rounded-2xl border border-white/10 bg-[#09111d] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-60"
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
                        className="w-full rounded-2xl border border-white/10 bg-[#09111d] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
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
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-100">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Falha ao carregar ou exportar frequência</p>
              <p className="mt-1 text-sm text-rose-200/90">{error}</p>
            </div>
          </div>
        ) : null}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Servidores"
            value={stats.totalServidores}
            subtitle="Registros após filtros aplicados"
            icon={<Users className="h-5 w-5" />}
          />
          <StatsCard
            title="Ativos"
            value={stats.ativos}
            subtitle="Servidores com status ativo"
            icon={<BadgeCheck className="h-5 w-5" />}
          />
          <StatsCard
            title="Dias com registro"
            value={stats.totalDiasComRegistro}
            subtitle="Rubricas e ocorrências consolidadas"
            icon={<CalendarDays className="h-5 w-5" />}
          />
          <StatsCard
            title="Ocorrências"
            value={stats.totalOcorrencias}
            subtitle="Turnos com marcações detectadas"
            icon={<Hash className="h-5 w-5" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-[#0d1624] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
              <div className="mb-5 flex items-center gap-2 text-sm font-medium text-white">
                <Filter className="h-4 w-4 text-cyan-300" />
                Filtros
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                    Busca
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Nome, CPF, matrícula..."
                      className="w-full rounded-2xl border border-white/10 bg-[#09111d] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Mês
                    </label>
                    <select
                      value={mes}
                      onChange={(e) => setMes(Number(e.target.value))}
                      className="w-full rounded-2xl border border-white/10 bg-[#09111d] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
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
                      className="w-full rounded-2xl border border-white/10 bg-[#09111d] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
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
                    className="w-full rounded-2xl border border-white/10 bg-[#09111d] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
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
                    className="w-full rounded-2xl border border-white/10 bg-[#09111d] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
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
                    className="w-full rounded-2xl border border-white/10 bg-[#09111d] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
                  >
                    <option value="TODOS">Todos</option>
                    <option value="ATIVO">ATIVO</option>
                    <option value="INATIVO">INATIVO</option>
                    <option value="AFASTADO">AFASTADO</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#0d1624] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">Servidores</h2>
                  <p className="text-xs text-slate-400">{filteredItems.length} encontrado(s)</p>
                </div>
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-cyan-300" /> : null}
              </div>

              <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
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
                        'w-full rounded-2xl border p-4 text-left transition',
                        active
                          ? 'border-cyan-400/30 bg-cyan-500/10'
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
                          <span className="block text-[10px] uppercase tracking-[0.14em] text-slate-500">CPF</span>
                          <span className="mt-1 block text-slate-200">{formatCpf(servidor.cpf)}</span>
                        </div>
                        <div className="rounded-xl bg-[#09111d] px-3 py-2">
                          <span className="block text-[10px] uppercase tracking-[0.14em] text-slate-500">Matrícula</span>
                          <span className="mt-1 block text-slate-200">{safeDisplay(servidor.matricula)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-[#0d1624] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
              {selectedServidor ? (
                <>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
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
                      <div className="rounded-2xl border border-white/10 bg-[#09111d] p-4">
                        <div className="mb-2 flex items-center gap-2 text-slate-400">
                          <Hash className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-[0.16em]">Matrícula</span>
                        </div>
                        <p className="text-sm font-medium text-white">{safeDisplay(selectedServidor.matricula)}</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-[#09111d] p-4">
                        <div className="mb-2 flex items-center gap-2 text-slate-400">
                          <ShieldCheck className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-[0.16em]">CPF</span>
                        </div>
                        <p className="text-sm font-medium text-white">{formatCpf(selectedServidor.cpf)}</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-[#09111d] p-4">
                        <div className="mb-2 flex items-center gap-2 text-slate-400">
                          <Building2 className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-[0.16em]">Setor</span>
                        </div>
                        <p className="text-sm font-medium text-white">{safeDisplay(selectedServidor.setor)}</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-[#09111d] p-4">
                        <div className="mb-2 flex items-center gap-2 text-slate-400">
                          <FileText className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-[0.16em]">Cargo</span>
                        </div>
                        <p className="text-sm font-medium text-white">{safeDisplay(selectedServidor.cargo)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-[#09111d] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Dias com registro</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {countDiasComRegistro(selectedDias)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#09111d] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Dias com rubrica</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {countDiasComRubrica(selectedDias)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#09111d] p-4">
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

            <div className="rounded-[28px] border border-white/10 bg-[#0d1624] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Calendário mensal · {MONTHS[mes - 1]} / {ano}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Visualização diária premium da rubrica e das ocorrências do servidor selecionado.
                  </p>
                </div>

                <div className="rounded-full border border-white/10 bg-[#09111d] px-3 py-1.5 text-xs text-slate-300">
                  {selectedDias.length} dia(s) carregado(s)
                </div>
              </div>

              {!selectedDias.length ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
                  <CalendarDays className="mx-auto h-10 w-10 text-slate-600" />
                  <p className="mt-4 text-base font-medium text-white">Sem dias carregados</p>
                  <p className="mt-2 text-sm text-slate-400">
                    O servidor selecionado não trouxe registros de dias nesse retorno da API.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {selectedDias.map((day) => {
                    const tone = resolveDayTone(day);
                    const pill = buildStatusPill(day);

                    return (
                      <div
                        key={`${selectedServidor?.id}-${day.dia}-${day.data}`}
                        className={[
                          'group rounded-[22px] border p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition duration-200',
                          'hover:-translate-y-[1px] hover:border-white/15 hover:shadow-[0_14px_30px_rgba(0,0,0,0.26)]',
                          tone.card,
                        ].join(' ')}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/15 shadow-inner">
                              <span className={`text-lg font-semibold leading-none ${tone.accent}`}>
                                {String(day.dia).padStart(2, '0')}
                              </span>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${tone.muted}`}>
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

                        <div className="rounded-2xl border border-white/8 bg-black/10 px-3 py-3">
                          <div className="mb-1 flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Rubrica</p>
                          </div>
                          <p
                            className={`truncate text-sm font-semibold ${
                              compactDisplay(day.turno1?.rubrica || day.turno2?.rubrica) === '—'
                                ? 'text-slate-400'
                                : tone.accent
                            }`}
                            title={compactDisplay(day.turno1?.rubrica || day.turno2?.rubrica)}
                          >
                            {compactDisplay(day.turno1?.rubrica || day.turno2?.rubrica)}
                          </p>
                        </div>

                        <div className="mt-2.5 grid grid-cols-2 gap-2">
                          <CalendarMiniField label="O1" value={compactDisplay(day.turno1?.ocorrencia)} />
                          <CalendarMiniField label="O2" value={compactDisplay(day.turno2?.ocorrencia)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
