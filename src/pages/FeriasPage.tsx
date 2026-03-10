import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, CalendarRange, Loader2, X, Save } from 'lucide-react';
import { FeriasStatsCards } from '../components/ferias/FeriasStatsCards';
import { FeriasFilters, FeriasFiltroState } from '../components/ferias/FeriasFilters';
import { FeriasCalendar, FeriasCalendarItem } from '../components/ferias/FeriasCalendar';
import { FeriasList, FeriasListItem } from '../components/ferias/FeriasList';
import * as feriasServiceModule from '../services/feriasService';
import * as servidoresServiceModule from '../services/servidoresService';

type FeriasStatus = 'PROGRAMADAS' | 'EM_ANDAMENTO' | 'FINALIZADAS';

interface ServidorOption {
  id: string;
  nome: string;
  matricula?: string;
  cpf?: string;
  setor?: string;
}

interface FeriasRecord {
  id: string;
  servidorId?: string;
  servidorNome: string;
  matricula?: string;
  cpf?: string;
  setor?: string;
  inicio: string;
  fim: string;
  dias: number;
  status: FeriasStatus;
  observacao?: string;
}

interface FormState {
  id?: string;
  servidorId: string;
  servidorNome: string;
  matricula: string;
  cpf: string;
  setor: string;
  inicio: string;
  fim: string;
  observacao: string;
}

const feriasService: any = (feriasServiceModule as any).feriasService ?? feriasServiceModule;
const servidoresService: any = (servidoresServiceModule as any).servidoresService ?? servidoresServiceModule;

const today = new Date();
const defaultYear = today.getFullYear();
const defaultMonth = today.getMonth() + 1;

const initialFilters: FeriasFiltroState = {
  busca: '',
  ano: defaultYear,
  mes: defaultMonth,
  setor: '',
  status: 'TODOS',
};

const emptyForm: FormState = {
  servidorId: '',
  servidorNome: '',
  matricula: '',
  cpf: '',
  setor: '',
  inicio: '',
  fim: '',
  observacao: '',
};

function normalizeString(value: unknown) {
  return String(value ?? '').trim();
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatISODate(date: Date) {
  return date.toLocaleDateString('en-CA');
}

function calculateDays(start?: string, end?: string) {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s || !e) return 0;
  const diff = Math.round((e.getTime() - s.getTime()) / 86400000);
  return diff >= 0 ? diff + 1 : 0;
}

function computeStatus(inicio?: string, fim?: string): FeriasStatus {
  const now = parseDate(formatISODate(new Date()))!;
  const start = parseDate(inicio);
  const end = parseDate(fim);
  if (!start || !end) return 'PROGRAMADAS';
  if (now >= start && now <= end) return 'EM_ANDAMENTO';
  if (now > end) return 'FINALIZADAS';
  return 'PROGRAMADAS';
}

function safeArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.registros)) return value.registros;
  if (Array.isArray(value?.ferias)) return value.ferias;
  return [];
}

function normalizeServidor(item: any): ServidorOption {
  return {
    id: normalizeString(item?.id || item?.servidor || item?.uuid || item?.cpf),
    nome: normalizeString(item?.nomeCompleto || item?.nome || item?.nome_completo || item?.servidor_nome),
    matricula: normalizeString(item?.matricula),
    cpf: normalizeString(item?.cpf),
    setor: normalizeString(item?.setor || item?.lotacao || item?.lotacao_interna),
  };
}

function normalizeFerias(item: any): FeriasRecord {
  const inicio = normalizeString(item?.inicio || item?.dataInicio || item?.data_inicio || item?.inicio_periodo);
  const fim = normalizeString(item?.fim || item?.dataFim || item?.data_fim || item?.fim_periodo);
  const dias = Number(item?.dias || item?.quantidadeDias || item?.dias_corridos || calculateDays(inicio, fim));

  return {
    id: normalizeString(item?.id || item?.uuid || `${item?.cpf || item?.servidor_id || 'ferias'}-${inicio}-${fim}`),
    servidorId: normalizeString(item?.servidorId || item?.servidor_id || item?.servidor || item?.cpf),
    servidorNome: normalizeString(item?.servidorNome || item?.nomeServidor || item?.servidor_nome || item?.nome || item?.nome_completo),
    matricula: normalizeString(item?.matricula),
    cpf: normalizeString(item?.cpf),
    setor: normalizeString(item?.setor || item?.lotacao || item?.lotacao_interna),
    inicio,
    fim,
    dias: Number.isFinite(dias) ? dias : 0,
    status: computeStatus(inicio, fim),
    observacao: normalizeString(item?.observacao || item?.obs || item?.descricao),
  };
}

function applyFilters(registros: FeriasRecord[], filtros: FeriasFiltroState) {
  const term = filtros.busca.trim().toLowerCase();

  return registros.filter((item) => {
    const inicio = parseDate(item.inicio);
    const matchesTerm = !term || [item.servidorNome, item.matricula, item.cpf, item.observacao, item.setor]
      .join(' ')
      .toLowerCase()
      .includes(term);

    const matchesYear = !inicio || inicio.getFullYear() === filtros.ano;
    const matchesMonth = filtros.mes === 0 || (!inicio ? false : inicio.getMonth() + 1 === filtros.mes);
    const matchesSetor = !filtros.setor || item.setor === filtros.setor;
    const matchesStatus = filtros.status === 'TODOS' || item.status === filtros.status;

    return matchesTerm && matchesYear && matchesMonth && matchesSetor && matchesStatus;
  });
}

function buildStats(registros: FeriasRecord[], filtros: FeriasFiltroState) {
  const now = parseDate(formatISODate(new Date()))!;
  const emFeriasAgora = registros.filter((item) => {
    const inicio = parseDate(item.inicio);
    const fim = parseDate(item.fim);
    return !!inicio && !!fim && now >= inicio && now <= fim;
  }).length;

  const previstasMes = registros.filter((item) => {
    const inicio = parseDate(item.inicio);
    return !!inicio && inicio.getFullYear() === filtros.ano && (filtros.mes === 0 || inicio.getMonth() + 1 === filtros.mes);
  }).length;

  const saldoProgramadoAno = registros.filter((item) => parseDate(item.inicio)?.getFullYear() === filtros.ano).length;
  const coberturaPlanejada = saldoProgramadoAno === 0 ? 0 : Math.min(100, (saldoProgramadoAno / Math.max(1, registros.length)) * 100);

  return {
    totalRegistros: registros.length,
    emFeriasAgora,
    previstasMes,
    saldoProgramadoAno,
    coberturaPlanejada,
  };
}

function buildCalendarItems(registros: FeriasRecord[]): FeriasCalendarItem[] {
  return registros.map((item) => ({
    id: item.id,
    servidorNome: item.servidorNome,
    setor: item.setor,
    inicio: item.inicio,
    fim: item.fim,
    status: item.status,
  }));
}

function toListItems(registros: FeriasRecord[]): FeriasListItem[] {
  return registros.map((item) => ({
    id: item.id,
    servidorNome: item.servidorNome,
    matricula: item.matricula,
    cpf: item.cpf,
    setor: item.setor,
    inicio: item.inicio,
    fim: item.fim,
    dias: item.dias,
    status: item.status,
    observacao: item.observacao,
  }));
}

function Modal({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function FeriasPage() {
  const [filtros, setFiltros] = useState<FeriasFiltroState>(initialFilters);
  const [registros, setRegistros] = useState<FeriasRecord[]>([]);
  const [servidores, setServidores] = useState<ServidorOption[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [dayPreview, setDayPreview] = useState<{ date: string; records: FeriasCalendarItem[] } | null>(null);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setError('');

    try {
      const [feriasResponse, servidoresResponse] = await Promise.all([
        feriasService.listar?.({ ano: filtros.ano })
          ?? feriasService.list?.({ ano: filtros.ano })
          ?? feriasService.getAll?.({ ano: filtros.ano })
          ?? Promise.resolve([]),
        servidoresService.listar?.({ limit: 1000 })
          ?? servidoresService.list?.({ limit: 1000 })
          ?? Promise.resolve([]),
      ]);

      setRegistros(safeArray(feriasResponse).map(normalizeFerias).filter((item) => item.servidorNome));
      setServidores(safeArray(servidoresResponse).map(normalizeServidor).filter((item) => item.nome));
    } catch (err: any) {
      console.error('Erro ao carregar férias:', err);
      setError(err?.message || 'Não foi possível carregar os dados da aba Férias.');
    } finally {
      setCarregando(false);
    }
  }, [filtros.ano]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(''), 3500);
    return () => window.clearTimeout(timer);
  }, [success]);

  const setores = useMemo(() => {
    return Array.from(new Set(registros.map((item) => item.setor).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));
  }, [registros]);

  const registrosFiltrados = useMemo(() => applyFilters(registros, filtros), [registros, filtros]);
  const stats = useMemo(() => buildStats(registros, filtros), [registros, filtros]);
  const calendarItems = useMemo(() => buildCalendarItems(registrosFiltrados), [registrosFiltrados]);
  const listItems = useMemo(() => toListItems(registrosFiltrados), [registrosFiltrados]);

  const handleFilterChange = useCallback(<K extends keyof FeriasFiltroState>(field: K, value: FeriasFiltroState[K]) => {
    setFiltros((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleResetFilters = useCallback(() => setFiltros(initialFilters), []);

  const openCreateModal = useCallback(() => {
    setForm(emptyForm);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((item: FeriasListItem) => {
    const registro = registros.find((entry) => entry.id === item.id);
    if (!registro) return;

    setForm({
      id: registro.id,
      servidorId: registro.servidorId || '',
      servidorNome: registro.servidorNome,
      matricula: registro.matricula || '',
      cpf: registro.cpf || '',
      setor: registro.setor || '',
      inicio: registro.inicio,
      fim: registro.fim,
      observacao: registro.observacao || '',
    });
    setModalOpen(true);
  }, [registros]);

  const selectServidor = useCallback((servidorId: string) => {
    const servidor = servidores.find((item) => item.id === servidorId || item.cpf === servidorId);
    if (!servidor) return;

    setForm((prev) => ({
      ...prev,
      servidorId: servidor.id,
      servidorNome: servidor.nome,
      matricula: servidor.matricula || '',
      cpf: servidor.cpf || '',
      setor: servidor.setor || '',
    }));
  }, [servidores]);

  const handleSave = useCallback(async () => {
    if (!form.servidorNome || !form.inicio || !form.fim) {
      setError('Preencha servidor, data inicial e data final antes de salvar.');
      return;
    }

    if (calculateDays(form.inicio, form.fim) <= 0) {
      setError('O período informado é inválido. Verifique as datas.');
      return;
    }

    setSalvando(true);
    setError('');

    const payload = {
      id: form.id,
      servidorId: form.servidorId || form.cpf,
      servidorNome: form.servidorNome,
      matricula: form.matricula,
      cpf: form.cpf,
      setor: form.setor,
      inicio: form.inicio,
      fim: form.fim,
      dias: calculateDays(form.inicio, form.fim),
      observacao: form.observacao,
    };

    try {
      if (form.id) {
        await (feriasService.editar?.(form.id, payload)
          ?? feriasService.atualizar?.(form.id, payload)
          ?? feriasService.update?.(form.id, payload));
        setSuccess('Período de férias atualizado com sucesso.');
      } else {
        await (feriasService.criar?.(payload)
          ?? feriasService.adicionar?.(payload)
          ?? feriasService.create?.(payload));
        setSuccess('Período de férias cadastrado com sucesso.');
      }

      setModalOpen(false);
      setForm(emptyForm);
      await carregarDados();
    } catch (err: any) {
      console.error('Erro ao salvar férias:', err);
      setError(err?.message || 'Falha ao salvar o período de férias.');
    } finally {
      setSalvando(false);
    }
  }, [carregarDados, form]);

  const handleDelete = useCallback(async (item: FeriasListItem) => {
    const confirmado = window.confirm(`Excluir o período de férias de ${item.servidorNome}?`);
    if (!confirmado) return;

    setError('');
    try {
      await (feriasService.excluir?.(item.id)
        ?? feriasService.remover?.(item.id)
        ?? feriasService.delete?.(item.id));
      setSuccess('Período de férias excluído com sucesso.');
      await carregarDados();
    } catch (err: any) {
      console.error('Erro ao excluir férias:', err);
      setError(err?.message || 'Não foi possível excluir o período selecionado.');
    }
  }, [carregarDados]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.30)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_28%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="mb-3 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              CIAPI RH • Gestão de Férias
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white">Painel de férias e planejamento anual</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Visualize períodos cadastrados, acompanhe servidores em férias, distribua melhor o planejamento do ano e mantenha o controle operacional por setor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              <Plus className="h-4 w-4" />
              Novo período
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div>
      )}

      <FeriasStatsCards stats={stats} carregando={carregando} />

      <FeriasFilters
        filtros={filtros}
        setores={setores}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      <FeriasCalendar
        ano={filtros.ano}
        mes={filtros.mes || defaultMonth}
        registros={calendarItems}
        onSelectDate={(date, records) => setDayPreview({ date, records })}
      />

      <FeriasList
        registros={listItems}
        carregando={carregando}
        onVisualizar={(item) => openEditModal(item)}
        onEditar={(item) => openEditModal(item)}
        onExcluir={handleDelete}
      />

      <Modal open={modalOpen}>
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">{form.id ? 'Editar período de férias' : 'Novo período de férias'}</h2>
              <p className="mt-1 text-sm text-slate-400">Preencha os dados do servidor e o intervalo do afastamento.</p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:bg-white/[0.08]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Servidor</span>
              <select
                value={form.servidorId || form.cpf}
                onChange={(event) => selectServidor(event.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="">Selecione um servidor</option>
                {servidores
                  .slice()
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((servidor) => (
                    <option key={servidor.id || servidor.cpf} value={servidor.id || servidor.cpf}>
                      {servidor.nome} {servidor.setor ? `• ${servidor.setor}` : ''}
                    </option>
                  ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Nome do servidor</span>
              <input
                value={form.servidorNome}
                onChange={(event) => setForm((prev) => ({ ...prev, servidorNome: event.target.value }))}
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Setor</span>
              <input
                value={form.setor}
                onChange={(event) => setForm((prev) => ({ ...prev, setor: event.target.value }))}
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Matrícula</span>
              <input
                value={form.matricula}
                onChange={(event) => setForm((prev) => ({ ...prev, matricula: event.target.value }))}
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">CPF</span>
              <input
                value={form.cpf}
                onChange={(event) => setForm((prev) => ({ ...prev, cpf: event.target.value }))}
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Data inicial</span>
              <input
                type="date"
                value={form.inicio}
                onChange={(event) => setForm((prev) => ({ ...prev, inicio: event.target.value }))}
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Data final</span>
              <input
                type="date"
                value={form.fim}
                onChange={(event) => setForm((prev) => ({ ...prev, fim: event.target.value }))}
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>

            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100 md:col-span-2">
              Total previsto: <strong>{calculateDays(form.inicio, form.fim)}</strong> dia(s)
            </div>

            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Observação</span>
              <textarea
                value={form.observacao}
                onChange={(event) => setForm((prev) => ({ ...prev, observacao: event.target.value }))}
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20"
                placeholder="Portaria, observações internas, remanejamentos ou detalhes do período"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-5">
          <div className="text-sm text-slate-400">
            {form.id ? 'Revise as datas e salve as alterações.' : 'Selecione um servidor e informe o período para cadastrar.'}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={salvando}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {form.id ? 'Salvar alterações' : 'Cadastrar período'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!dayPreview}>
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                <CalendarRange className="h-5 w-5 text-cyan-300" />
                Detalhes do dia {dayPreview?.date ? new Date(`${dayPreview.date}T00:00:00`).toLocaleDateString('pt-BR') : ''}
              </h2>
              <p className="mt-1 text-sm text-slate-400">Servidores em férias na data selecionada.</p>
            </div>
            <button
              type="button"
              onClick={() => setDayPreview(null)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:bg-white/[0.08]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {!dayPreview?.records.length ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/35 px-4 py-10 text-center text-sm text-slate-400">
              Nenhum servidor em férias nesta data.
            </div>
          ) : (
            <div className="space-y-3">
              {dayPreview.records.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{item.servidorNome}</h3>
                      <p className="mt-1 text-sm text-slate-400">{item.setor || 'Setor não informado'}</p>
                    </div>
                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                      {item.inicio} até {item.fim}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
