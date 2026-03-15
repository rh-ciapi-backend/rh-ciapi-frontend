import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CalendarDays,
  Download,
  FileText,
  Filter,
  Hash,
  Loader2,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import {
  baixarFrequenciaArquivo,
  frequenciaService,
  type FrequenciaDay,
  type FrequenciaServidor,
} from '../services/frequenciaService';

type StatsCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
};

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
  return value
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

function countDiasComRegistro(dias: FrequenciaDay[]) {
  return dias.filter((day) => day.rubrica || day.ocorrencia1 || day.ocorrencia2 || day.statusFinal).length;
}

function countDiasComOcorrencia(dias: FrequenciaDay[]) {
  return dias.filter((day) => day.ocorrencia1 || day.ocorrencia2).length;
}

function countDiasComRubrica(dias: FrequenciaDay[]) {
  return dias.filter((day) => day.rubrica).length;
}

function statusColor(status: string) {
  const s = normalizeText(status);
  if (s.includes('ativo')) return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20';
  if (s.includes('inativo')) return 'bg-rose-500/15 text-rose-300 border-rose-400/20';
  if (s.includes('afast')) return 'bg-amber-500/15 text-amber-300 border-amber-400/20';
  return 'bg-slate-500/15 text-slate-300 border-slate-400/20';
}

function dayBadge(day: FrequenciaDay) {
  const text = normalizeText(day.statusFinal || day.rubrica || day.ocorrencia1 || day.ocorrencia2);
  if (text.includes('feriado')) return 'border-violet-400/20 bg-violet-500/10';
  if (text.includes('ponto')) return 'border-sky-400/20 bg-sky-500/10';
  if (text.includes('atestado')) return 'border-amber-400/20 bg-amber-500/10';
  if (text.includes('falta')) return 'border-rose-400/20 bg-rose-500/10';
  if (text.includes('ferias') || text.includes('férias')) return 'border-emerald-400/20 bg-emerald-500/10';
  if (text.includes('sábado') || text.includes('sabado') || text.includes('domingo')) {
    return 'border-slate-500/20 bg-slate-500/10';
  }
  if (text) return 'border-cyan-400/20 bg-cyan-500/10';
  return 'border-white/10 bg-[#101927]';
}

function dayAccentText(day: FrequenciaDay) {
  const text = normalizeText(day.statusFinal || day.rubrica || day.ocorrencia1 || day.ocorrencia2);
  if (text.includes('feriado')) return 'text-violet-200';
  if (text.includes('ponto')) return 'text-sky-200';
  if (text.includes('atestado')) return 'text-amber-200';
  if (text.includes('falta')) return 'text-rose-200';
  if (text.includes('ferias') || text.includes('férias')) return 'text-emerald-200';
  if (text.includes('sábado') || text.includes('sabado') || text.includes('domingo')) return 'text-slate-300';
  if (text) return 'text-cyan-200';
  return 'text-white';
}

function dayWeekText(day: FrequenciaDay) {
  const text = normalizeText(day.statusFinal || day.rubrica || day.ocorrencia1 || day.ocorrencia2);
  if (text.includes('feriado')) return 'text-violet-300';
  if (text.includes('ponto')) return 'text-sky-300';
  if (text.includes('atestado')) return 'text-amber-300';
  if (text.includes('falta')) return 'text-rose-300';
  if (text.includes('ferias') || text.includes('férias')) return 'text-emerald-300';
  if (text.includes('sábado') || text.includes('sabado') || text.includes('domingo')) return 'text-slate-400';
  if (text) return 'text-cyan-300';
  return 'text-slate-400';
}

function buildStatusPill(day: FrequenciaDay) {
  const value = compactDisplay(day.statusFinal !== day.rubrica ? day.statusFinal : '');
  const text = normalizeText(day.statusFinal || day.rubrica || day.ocorrencia1 || day.ocorrencia2);

  if (value === '—') {
    return {
      label: 'Sem status',
      className: 'border-white/10 bg-white/[0.04] text-slate-400',
    };
  }

  if (text.includes('feriado')) {
    return { label: value, className: 'border-violet-400/20 bg-violet-500/10 text-violet-200' };
  }
  if (text.includes('ponto')) {
    return { label: value, className: 'border-sky-400/20 bg-sky-500/10 text-sky-200' };
  }
  if (text.includes('atestado')) {
    return { label: value, className: 'border-amber-400/20 bg-amber-500/10 text-amber-200' };
  }
  if (text.includes('falta')) {
    return { label: value, className: 'border-rose-400/20 bg-rose-500/10 text-rose-200' };
  }
  if (text.includes('ferias') || text.includes('férias')) {
    return { label: value, className: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' };
  }

  return {
    label: value,
    className: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200',
  };
}

export default function FrequenciaPage() {
  const today = new Date();
  const [ano, setAno] = useState<number>(today.getFullYear());
  const [mes, setMes] = useState<number>(today.getMonth() + 1);
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('TODAS');
  const [filterSetor, setFilterSetor] = useState('TODOS');
  const [filterStatus, setFilterStatus] = useState('TODOS');

  const [items, setItems] = useState<FrequenciaServidor[]>([]);
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

        const result = await frequenciaService.listarPorMes({ ano, mes });

        if (!active) return;

        const safeItems = Array.isArray(result?.items) ? result.items : [];
        setItems(safeItems);

        setSelectedId((current) => {
          if (!safeItems.length) return '';
          const exists = safeItems.some((item) => item.id === current);
          return exists ? current : safeItems[0].id;
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
  }, [ano, mes]);

  const categorias = useMemo(() => {
    return Array.from(
      new Set(
        items
          .map((item) => safeDisplay(item.categoria, 'NÃO INFORMADA'))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [items]);

  const setores = useMemo(() => {
    return Array.from(
      new Set(
        items
          .map((item) => safeDisplay(item.setor, 'NÃO INFORMADO'))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = normalizeText(search);

    return items.filter((item) => {
      const matchesSearch =
        !term ||
        normalizeText(item.nome).includes(term) ||
        normalizeText(item.cpf).includes(term) ||
        normalizeText(item.matricula).includes(term) ||
        normalizeText(item.setor).includes(term) ||
        normalizeText(item.categoria).includes(term);

      const matchesCategoria =
        filterCategoria === 'TODAS' || safeDisplay(item.categoria, 'NÃO INFORMADA') === filterCategoria;

      const matchesSetor =
        filterSetor === 'TODOS' || safeDisplay(item.setor, 'NÃO INFORMADO') === filterSetor;

      const matchesStatus =
        filterStatus === 'TODOS' || safeDisplay(item.status, 'NÃO INFORMADO') === filterStatus;

      return matchesSearch && matchesCategoria && matchesSetor && matchesStatus;
    });
  }, [items, search, filterCategoria, filterSetor, filterStatus]);

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedId('');
      return;
    }

    const exists = filteredItems.some((item) => item.id === selectedId);
    if (!exists) {
      setSelectedId(filteredItems[0].id);
    }
  }, [filteredItems, selectedId]);

  const selectedServidor = useMemo(() => {
    return filteredItems.find((item) => item.id === selectedId) || filteredItems[0] || null;
  }, [filteredItems, selectedId]);

  const stats = useMemo(() => {
    const totalServidores = filteredItems.length;
    const ativos = filteredItems.filter((item) => normalizeText(item.status).includes('ativo')).length;
    const totalDiasComRegistro = filteredItems.reduce((sum, item) => sum + countDiasComRegistro(item.dias), 0);
    const totalOcorrencias = filteredItems.reduce((sum, item) => sum + countDiasComOcorrencia(item.dias), 0);

    return {
      totalServidores,
      ativos,
      totalDiasComRegistro,
      totalOcorrencias,
    };
  }, [filteredItems]);

  async function handleExport(formato: 'docx' | 'pdf' | 'csv') {
    try {
      setExporting(formato);

      await baixarFrequenciaArquivo({
        ano,
        mes,
        formato,
        servidorId: selectedServidor?.id,
        servidorCpf: selectedServidor?.cpf,
        categoria: filterCategoria !== 'TODAS' ? filterCategoria : undefined,
        setor: filterSetor !== 'TODOS' ? filterSetor : undefined,
        status: filterStatus !== 'TODOS' ? filterStatus : undefined,
      });
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
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
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
                disabled={!!exporting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting === 'docx' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Exportar DOCX
              </button>

              <button
                onClick={() => handleExport('pdf')}
                disabled={!!exporting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Exportar PDF
              </button>

              <button
                onClick={() => handleExport('csv')}
                disabled={!!exporting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting === 'csv' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Exportar CSV
              </button>
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
                  const active = item.id === selectedId;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={[
                        'w-full rounded-2xl border p-4 text-left transition',
                        active
                          ? 'border-cyan-400/30 bg-cyan-500/10'
                          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{item.nome}</p>
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {safeDisplay(item.categoria, 'NÃO INFORMADA')}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${statusColor(
                            item.status
                          )}`}
                        >
                          {safeDisplay(item.status, 'NÃO INFORMADO')}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <div className="rounded-xl bg-[#09111d] px-3 py-2">
                          <span className="block text-[10px] uppercase tracking-[0.14em] text-slate-500">CPF</span>
                          <span className="mt-1 block text-slate-200">{formatCpf(item.cpf)}</span>
                        </div>
                        <div className="rounded-xl bg-[#09111d] px-3 py-2">
                          <span className="block text-[10px] uppercase tracking-[0.14em] text-slate-500">Matrícula</span>
                          <span className="mt-1 block text-slate-200">{safeDisplay(item.matricula)}</span>
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
                              selectedServidor.status
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
                        {countDiasComRegistro(selectedServidor.dias)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#09111d] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Dias com rubrica</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {countDiasComRubrica(selectedServidor.dias)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#09111d] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Ocorrências de turno</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {countDiasComOcorrencia(selectedServidor.dias)}
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
                    Visualização diária compacta da rubrica e das ocorrências do servidor selecionado.
                  </p>
                </div>

                <div className="rounded-full border border-white/10 bg-[#09111d] px-3 py-1.5 text-xs text-slate-300">
                  {selectedServidor?.dias?.length || 0} dia(s) carregado(s)
                </div>
              </div>

              {!selectedServidor?.dias?.length ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
                  <CalendarDays className="mx-auto h-10 w-10 text-slate-600" />
                  <p className="mt-4 text-base font-medium text-white">Sem dias carregados</p>
                  <p className="mt-2 text-sm text-slate-400">
                    O servidor selecionado não trouxe registros de dias nesse retorno da API.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {selectedServidor.dias.map((day) => {
                    const pill = buildStatusPill(day);

                    return (
                      <div
                        key={`${selectedServidor.id}-${day.dia}-${day.dataISO}`}
                        className={`rounded-2xl border p-3 transition hover:border-white/15 ${dayBadge(day)}`}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-end gap-2">
                              <span className={`text-lg font-semibold leading-none ${dayAccentText(day)}`}>
                                {String(day.dia).padStart(2, '0')}
                              </span>
                              <span className={`text-xs font-medium uppercase tracking-[0.14em] ${dayWeekText(day)}`}>
                                {compactDisplay(day.weekdayLabel)}
                              </span>
                            </div>
                          </div>

                          <div className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-[10px] text-slate-400">
                            {day.dataISO}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="rounded-xl border border-white/8 bg-black/10 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Rubrica</p>
                            <p className="mt-1 truncate text-sm font-medium text-slate-100">
                              {compactDisplay(day.rubrica)}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-xl border border-white/8 bg-black/10 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">O1</p>
                              <p className="mt-1 truncate text-sm text-slate-200">
                                {compactDisplay(day.ocorrencia1)}
                              </p>
                            </div>

                            <div className="rounded-xl border border-white/8 bg-black/10 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">O2</p>
                              <p className="mt-1 truncate text-sm text-slate-200">
                                {compactDisplay(day.ocorrencia2)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                              Status final
                            </span>
                            <span
                              className={`max-w-[70%] truncate rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${pill.className}`}
                              title={pill.label}
                            >
                              {pill.label}
                            </span>
                          </div>

                          {day.observacoes?.length ? (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {day.observacoes.slice(0, 2).map((obs, index) => (
                                <span
                                  key={`${day.dia}-obs-${index}`}
                                  className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-slate-300"
                                  title={obs}
                                >
                                  {obs}
                                </span>
                              ))}
                              {day.observacoes.length > 2 ? (
                                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-slate-400">
                                  +{day.observacoes.length - 2}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
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
