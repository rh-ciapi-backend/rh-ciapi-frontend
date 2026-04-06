import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  criarEvento,
  excluirEvento,
  listarEventos,
  type EventoCalendario,
  type EventoInput,
  type TipoEvento,
} from '../../services/eventosService';

type GerenciarFeriadosModalProps = {
  open: boolean;
  ano: number;
  mes: number;
  onClose: () => void;
  onSaved?: (eventos: EventoCalendario[]) => void;
};

type FormState = {
  data: string;
  tipo: TipoEvento;
  titulo: string;
  descricao: string;
  ativo: boolean;
};

const MONTHS = [
  '',
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

const INITIAL_FORM: FormState = {
  data: '',
  tipo: 'FERIADO',
  titulo: '',
  descricao: '',
  ativo: true,
};

function safeString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function formatDateBr(dateIso: string): string {
  if (!dateIso) return 'Sem data';
  const [ano, mes, dia] = dateIso.split('-');
  if (!ano || !mes || !dia) return dateIso;
  return `${dia}/${mes}/${ano}`;
}

function buildInitialDate(ano: number, mes: number): string {
  return `${String(ano).padStart(4, '0')}-${String(mes).padStart(2, '0')}-01`;
}

function getTypeClasses(tipo: TipoEvento): string {
  if (tipo === 'FERIADO') return 'border-violet-400/20 bg-violet-500/10 text-violet-200';
  if (tipo === 'PONTO_FACULTATIVO') return 'border-sky-400/20 bg-sky-500/10 text-sky-200';
  return 'border-amber-400/20 bg-amber-500/10 text-amber-200';
}

export default function GerenciarFeriadosModal({
  open,
  ano,
  mes,
  onClose,
  onSaved,
}: GerenciarFeriadosModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [form, setForm] = useState<FormState>({
    ...INITIAL_FORM,
    data: buildInitialDate(ano, mes),
  });

  const title = useMemo(() => `Gerenciar feriados e eventos · ${MONTHS[mes] || mes}/${ano}`, [ano, mes]);

  async function carregarEventos() {
    try {
      setLoading(true);
      setError('');
      const rows = await listarEventos({ ano, mes, ativo: true });
      setEventos(Array.isArray(rows) ? rows : []);
      onSaved?.(Array.isArray(rows) ? rows : []);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar os eventos do mês.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setForm({
      ...INITIAL_FORM,
      data: buildInitialDate(ano, mes),
    });
    setSuccess('');
    setError('');
    carregarEventos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ano, mes]);

  function handleClose() {
    if (saving || loading) return;
    onClose();
  }

  function handleChange<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm({
      ...INITIAL_FORM,
      data: buildInitialDate(ano, mes),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload: EventoInput = {
        data: form.data,
        tipo: form.tipo,
        titulo: safeString(form.titulo),
        descricao: safeString(form.descricao),
        ativo: form.ativo,
      };

      await criarEvento(payload);
      await carregarEventos();
      setSuccess('Evento salvo com sucesso.');
      resetForm();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível salvar o evento.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Deseja realmente excluir este evento?');
    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError('');
      setSuccess('');
      await excluirEvento(id);
      await carregarEventos();
      setSuccess('Evento excluído com sucesso.');
    } catch (err: any) {
      setError(err?.message || 'Não foi possível excluir o evento.');
    } finally {
      setDeletingId('');
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#020617]/80 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#08111d] shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),linear-gradient(135deg,#0b1320_0%,#0f1d31_55%,#12243c_100%)] px-6 py-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-cyan-200">
              <CalendarDays className="h-3.5 w-3.5" />
              Calendário institucional
            </div>
            <h2 className="mt-3 text-xl font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm text-slate-300">
              Cadastre feriados, pontos facultativos e eventos para refletir na frequência mensal.
            </p>
          </div>

          <button
            onClick={handleClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-96px)] grid-cols-1 gap-0 overflow-hidden xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="border-r border-white/10 bg-[#0b1524] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Novo cadastro</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Os dias cadastrados serão usados no calendário e nas exportações.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.08]"
              >
                Limpar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                  Data
                </label>
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => handleChange('data', e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#09111d] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                  Tipo
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) => handleChange('tipo', e.target.value as TipoEvento)}
                  className="w-full rounded-2xl border border-white/10 bg-[#09111d] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
                >
                  <option value="FERIADO">Feriado</option>
                  <option value="PONTO_FACULTATIVO">Ponto Facultativo</option>
                  <option value="EVENTO">Evento</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                  Título
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => handleChange('titulo', e.target.value)}
                  placeholder="Ex.: Dia do Trabalhador"
                  className="w-full rounded-2xl border border-white/10 bg-[#09111d] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                  Descrição
                </label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => handleChange('descricao', e.target.value)}
                  rows={4}
                  placeholder="Observações internas do evento"
                  className="w-full resize-none rounded-2xl border border-white/10 bg-[#09111d] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => handleChange('ativo', e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-[#09111d] text-cyan-400 focus:ring-cyan-400"
                />
                <div>
                  <p className="text-sm font-medium text-white">Ativo no calendário</p>
                  <p className="text-xs text-slate-400">Mantém o evento disponível na competência.</p>
                </div>
              </label>

              {error ? (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  {success}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/12 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/18 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Cadastrar evento
              </button>
            </form>
          </aside>

          <section className="overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Eventos do mês</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {eventos.length} registro(s) encontrados para {MONTHS[mes] || mes}/{ano}
                </p>
              </div>

              <button
                type="button"
                onClick={carregarEventos}
                disabled={loading}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-60"
              >
                {loading ? 'Atualizando...' : 'Atualizar lista'}
              </button>
            </div>

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-3 text-slate-300">
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
                  Carregando eventos...
                </div>
              </div>
            ) : !eventos.length ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-6 text-center">
                <CalendarDays className="h-10 w-10 text-slate-600" />
                <p className="mt-4 text-base font-medium text-white">Nenhum evento cadastrado</p>
                <p className="mt-2 max-w-xl text-sm text-slate-400">
                  Cadastre os feriados e pontos facultativos deste mês para que apareçam no calendário
                  da frequência e nas exportações.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {eventos.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(15,23,42,0.94))] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${getTypeClasses(item.tipo)}`}>
                            {item.tipo === 'FERIADO'
                              ? 'Feriado'
                              : item.tipo === 'PONTO_FACULTATIVO'
                              ? 'Ponto Facultativo'
                              : 'Evento'}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-slate-300">
                            {formatDateBr(item.data)}
                          </span>
                        </div>

                        <h4 className="mt-3 text-lg font-semibold text-white">
                          {safeString(item.titulo, 'Sem título')}
                        </h4>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {safeString(item.descricao, 'Sem descrição informada.')}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
