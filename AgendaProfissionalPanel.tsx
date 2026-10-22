import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { saeAgendaService } from '../../services/saeAgendaService';

import type {
  SaeAgendaImpacto,
  SaeAgendaPeriodo,
  SaeAgendaPeriodoForm,
  SaeDiaSemana,
} from '../../types/saeAgenda';
import type {
  SaeProfissional,
  SaeServicoOpcao,
} from '../../types/saeProfissional';

interface AgendaProfissionalPanelProps {
  profissional: SaeProfissional;
  servicos: SaeServicoOpcao[];
  podeEditar: boolean;
}

const DIAS: Array<{ value: SaeDiaSemana; label: string; curto: string }> = [
  { value: 1, label: 'Segunda-feira', curto: 'SEG' },
  { value: 2, label: 'Terça-feira', curto: 'TER' },
  { value: 3, label: 'Quarta-feira', curto: 'QUA' },
  { value: 4, label: 'Quinta-feira', curto: 'QUI' },
  { value: 5, label: 'Sexta-feira', curto: 'SEX' },
];

const NOVO_PERIODO: SaeAgendaPeriodoForm = {
  servicoId: '',
  diaSemana: 1,
  horaInicio: '08:00',
  horaFim: '12:00',
  intervaloInicio: '',
  intervaloFim: '',
  duracaoSlotMinutos: 30,
  ativo: true,
  observacao: '',
};

const formatHora = (value?: string | null) =>
  value ? String(value).slice(0, 5) : '—';

const formatData = (value?: string | null) => {
  if (!value) return '—';
  const [ano, mes, dia] = String(value).slice(0, 10).split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : value;
};

const formFromPeriodo = (periodo: SaeAgendaPeriodo): SaeAgendaPeriodoForm => ({
  servicoId: periodo.servicoId || '',
  diaSemana: periodo.diaSemana,
  horaInicio: formatHora(periodo.horaInicio) === '—' ? '' : formatHora(periodo.horaInicio),
  horaFim: formatHora(periodo.horaFim) === '—' ? '' : formatHora(periodo.horaFim),
  intervaloInicio:
    formatHora(periodo.intervaloInicio) === '—' ? '' : formatHora(periodo.intervaloInicio),
  intervaloFim:
    formatHora(periodo.intervaloFim) === '—' ? '' : formatHora(periodo.intervaloFim),
  duracaoSlotMinutos: periodo.duracaoSlotMinutos || 30,
  ativo: periodo.ativo,
  observacao: periodo.observacao || '',
});

export default function AgendaProfissionalPanel({
  profissional,
  servicos,
  podeEditar,
}: AgendaProfissionalPanelProps) {
  const [agenda, setAgenda] = useState<SaeAgendaPeriodo[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<SaeAgendaPeriodoForm>(NOVO_PERIODO);

  const [impacto, setImpacto] = useState<SaeAgendaImpacto | null>(null);
  const [acaoPendente, setAcaoPendente] = useState<'EDITAR' | 'INATIVAR' | null>(null);
  const [motivoImpacto, setMotivoImpacto] = useState('');

  const servicosDoProfissional = useMemo(
    () =>
      servicos.filter(
        (servico) =>
          profissional.servicoIds.includes(servico.id) && servico.ativo,
      ),
    [profissional.servicoIds, servicos],
  );

  const servicoNome = (id?: string | null) => {
    if (!id) return 'Agenda geral';
    const servico = servicos.find((item) => item.id === id);
    return servico
      ? servico.sigla
        ? `${servico.nome} (${servico.sigla})`
        : servico.nome
      : 'Serviço não encontrado';
  };

  const carregarAgenda = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const response = await saeAgendaService.listarProfissional(profissional.id);
      setAgenda(response.agenda || []);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar a agenda oficial.',
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    setFormAberto(false);
    setEditandoId(null);
    setForm(NOVO_PERIODO);
    setImpacto(null);
    setAcaoPendente(null);
    setMotivoImpacto('');
    setErro(null);
    setSucesso(null);
    carregarAgenda();
  }, [profissional.id]);

  useEffect(() => {
    if (!sucesso) return;
    const timer = window.setTimeout(() => setSucesso(null), 3200);
    return () => window.clearTimeout(timer);
  }, [sucesso]);

  const abrirNovo = () => {
    if (!podeEditar) {
      setErro('Você não possui permissão para alterar a agenda oficial.');
      return;
    }

    setEditandoId(null);
    setForm(NOVO_PERIODO);
    setFormAberto(true);
    setErro(null);
  };

  const abrirEdicao = (periodo: SaeAgendaPeriodo) => {
    if (!podeEditar || !periodo.ativo) return;
    setEditandoId(periodo.id);
    setForm(formFromPeriodo(periodo));
    setFormAberto(true);
    setErro(null);
  };

  const fecharForm = () => {
    setFormAberto(false);
    setEditandoId(null);
    setForm(NOVO_PERIODO);
  };

  const validarForm = () => {
    if (!form.horaInicio || !form.horaFim) {
      throw new Error('Informe o horário inicial e final.');
    }

    if (form.horaFim <= form.horaInicio) {
      throw new Error('O horário final deve ser posterior ao horário inicial.');
    }

    if (
      (form.intervaloInicio && !form.intervaloFim) ||
      (!form.intervaloInicio && form.intervaloFim)
    ) {
      throw new Error('Preencha início e fim do intervalo, ou deixe os dois vazios.');
    }

    if (
      form.intervaloInicio &&
      form.intervaloFim &&
      (form.intervaloInicio < form.horaInicio ||
        form.intervaloFim > form.horaFim ||
        form.intervaloFim <= form.intervaloInicio)
    ) {
      throw new Error('O intervalo deve estar dentro do período de atendimento.');
    }
  };

  const executarEdicao = async (confirmarImpacto = false, motivo = '') => {
    if (!editandoId) return;

    const response = await saeAgendaService.editarPeriodo(editandoId, {
      ...form,
      confirmarImpacto,
      motivoAlteracao: motivo || undefined,
    });

    setAgenda((atuais) =>
      atuais
        .map((item) =>
          item.id === response.agenda.id ? response.agenda : item,
        )
        .sort((a, b) =>
          a.diaSemana === b.diaSemana
            ? String(a.horaInicio).localeCompare(String(b.horaInicio))
            : a.diaSemana - b.diaSemana,
        ),
    );
    fecharForm();
    setSucesso('Agenda oficial atualizada com sucesso.');
  };

  const salvarPeriodo = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!podeEditar) {
      setErro('Você não possui permissão para alterar a agenda oficial.');
      return;
    }

    try {
      validarForm();
      setSalvando(true);
      setErro(null);

      if (!editandoId) {
        const response = await saeAgendaService.criarPeriodo(profissional.id, form);
        setAgenda((atuais) =>
          [...atuais, response.agenda].sort((a, b) =>
            a.diaSemana === b.diaSemana
              ? String(a.horaInicio).localeCompare(String(b.horaInicio))
              : a.diaSemana - b.diaSemana,
          ),
        );
        fecharForm();
        setSucesso('Período incluído na agenda oficial.');
        return;
      }

      const impactoAtual = await saeAgendaService.consultarImpacto(editandoId);

      if (impactoAtual.totalAfetados > 0) {
        setImpacto(impactoAtual);
        setAcaoPendente('EDITAR');
        setMotivoImpacto('');
        return;
      }

      await executarEdicao(false);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o período da agenda.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const solicitarInativacao = async (periodo: SaeAgendaPeriodo) => {
    if (!podeEditar || !periodo.ativo) return;

    try {
      setSalvando(true);
      setErro(null);
      setEditandoId(periodo.id);

      const impactoAtual = await saeAgendaService.consultarImpacto(periodo.id);

      if (impactoAtual.totalAfetados > 0) {
        setImpacto(impactoAtual);
        setAcaoPendente('INATIVAR');
        setMotivoImpacto('');
        return;
      }

      await saeAgendaService.inativarPeriodo(periodo.id);
      setAgenda((atuais) =>
        atuais.map((item) =>
          item.id === periodo.id ? { ...item, ativo: false } : item,
        ),
      );
      setEditandoId(null);
      setSucesso('Período inativado na agenda oficial.');
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível inativar o período.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const confirmarComImpacto = async () => {
    if (!impacto || !acaoPendente || !editandoId) return;

    if (!motivoImpacto.trim()) {
      setErro('Informe o motivo da alteração antes de confirmar.');
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      if (acaoPendente === 'EDITAR') {
        await executarEdicao(true, motivoImpacto.trim());
      } else {
        await saeAgendaService.inativarPeriodo(editandoId, {
          confirmarImpacto: true,
          motivoAlteracao: motivoImpacto.trim(),
        });
        setAgenda((atuais) =>
          atuais.map((item) =>
            item.id === editandoId ? { ...item, ativo: false } : item,
          ),
        );
        setSucesso('Período inativado. Os pacientes afetados permanecem registrados para remarcação.');
      }

      setImpacto(null);
      setAcaoPendente(null);
      setMotivoImpacto('');
      setEditandoId(null);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível confirmar a alteração.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const cancelarImpacto = () => {
    setImpacto(null);
    setAcaoPendente(null);
    setMotivoImpacto('');
    if (!formAberto) setEditandoId(null);
  };

  const agendaPorDia = useMemo(
    () =>
      DIAS.map((dia) => ({
        ...dia,
        periodos: agenda.filter((item) => item.diaSemana === dia.value),
      })),
    [agenda],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <CalendarDays size={19} className="text-primary" />
            Agenda oficial
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Disponibilidade usada pelo SAE para marcações. A secretaria pode ajustar os períodos e será avisada quando houver pacientes afetados.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={carregarAgenda}
            disabled={carregando}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-dark bg-slate-900/40 px-3 text-xs font-bold text-slate-300 transition hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={15} className={carregando ? 'animate-spin' : ''} />
            Atualizar
          </button>
          <button
            type="button"
            onClick={abrirNovo}
            disabled={!podeEditar}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={15} />
            Novo período
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {erro && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{erro}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {sucesso && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300"
          >
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
            <span>{sucesso}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {formAberto && (
        <form
          onSubmit={salvarPeriodo}
          className="rounded-[18px] border border-primary/20 bg-primary/[0.04] p-4 sm:p-5"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h4 className="font-bold text-white">
                {editandoId ? 'Editar período' : 'Novo período de atendimento'}
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Somente segunda a sexta-feira. O serviço pode ficar em branco para uma agenda geral do profissional.
              </p>
            </div>
            <button
              type="button"
              onClick={fecharForm}
              className="rounded-lg border border-border-dark bg-slate-900/40 p-2 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Dia da semana">
              <select
                value={form.diaSemana}
                onChange={(event) =>
                  setForm((atual) => ({
                    ...atual,
                    diaSemana: Number(event.target.value) as SaeDiaSemana,
                  }))
                }
                className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-white outline-none focus:border-primary/50"
              >
                {DIAS.map((dia) => (
                  <option key={dia.value} value={dia.value}>
                    {dia.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Serviço">
              <select
                value={form.servicoId}
                onChange={(event) =>
                  setForm((atual) => ({ ...atual, servicoId: event.target.value }))
                }
                className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-white outline-none focus:border-primary/50"
              >
                <option value="">Agenda geral</option>
                {servicosDoProfissional.map((servico) => (
                  <option key={servico.id} value={servico.id}>
                    {servico.nome}{servico.sigla ? ` (${servico.sigla})` : ''}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Início">
              <input
                type="time"
                value={form.horaInicio}
                onChange={(event) =>
                  setForm((atual) => ({ ...atual, horaInicio: event.target.value }))
                }
                required
                className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-white outline-none focus:border-primary/50"
              />
            </Field>

            <Field label="Fim">
              <input
                type="time"
                value={form.horaFim}
                onChange={(event) =>
                  setForm((atual) => ({ ...atual, horaFim: event.target.value }))
                }
                required
                className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-white outline-none focus:border-primary/50"
              />
            </Field>

            <Field label="Início do intervalo">
              <input
                type="time"
                value={form.intervaloInicio}
                onChange={(event) =>
                  setForm((atual) => ({ ...atual, intervaloInicio: event.target.value }))
                }
                className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-white outline-none focus:border-primary/50"
              />
            </Field>

            <Field label="Fim do intervalo">
              <input
                type="time"
                value={form.intervaloFim}
                onChange={(event) =>
                  setForm((atual) => ({ ...atual, intervaloFim: event.target.value }))
                }
                className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-white outline-none focus:border-primary/50"
              />
            </Field>

            <Field label="Duração de cada vaga">
              <div className="relative">
                <input
                  type="number"
                  min={5}
                  max={480}
                  step={5}
                  value={form.duracaoSlotMinutos}
                  onChange={(event) =>
                    setForm((atual) => ({
                      ...atual,
                      duracaoSlotMinutos: Number(event.target.value) || 30,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 pr-14 text-sm text-white outline-none focus:border-primary/50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">min</span>
              </div>
            </Field>

            <Field label="Observação" className="md:col-span-2 xl:col-span-1">
              <input
                type="text"
                value={form.observacao}
                onChange={(event) =>
                  setForm((atual) => ({ ...atual, observacao: event.target.value }))
                }
                placeholder="Opcional"
                className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-primary/50"
              />
            </Field>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-border-dark pt-4">
            <button
              type="button"
              onClick={fecharForm}
              className="rounded-xl border border-border-dark bg-slate-900/40 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {salvando ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Salvar período
            </button>
          </div>
        </form>
      )}

      {carregando ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-[18px] border border-border-dark bg-slate-900/20">
          <div className="text-center text-sm text-slate-500">
            <Loader2 size={24} className="mx-auto mb-3 animate-spin text-primary" />
            Carregando agenda oficial...
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {agendaPorDia.map((dia) => (
            <section
              key={dia.value}
              className="rounded-[18px] border border-border-dark bg-slate-900/20"
            >
              <div className="flex items-center gap-3 border-b border-border-dark px-4 py-3">
                <span className="inline-flex h-8 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-[10px] font-extrabold text-primary">
                  {dia.curto}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">{dia.label}</h4>
                  <p className="text-[11px] text-slate-500">
                    {dia.periodos.filter((item) => item.ativo).length} período(s) ativo(s)
                  </p>
                </div>
              </div>

              {dia.periodos.length === 0 ? (
                <p className="px-4 py-5 text-sm text-slate-600">Sem disponibilidade cadastrada.</p>
              ) : (
                <div className="divide-y divide-border-dark">
                  {dia.periodos.map((periodo) => (
                    <div
                      key={periodo.id}
                      className={`flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between ${
                        periodo.ativo ? '' : 'opacity-55'
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2">
                        <div className="inline-flex items-center gap-2 font-bold text-white">
                          <Clock3 size={15} className="text-primary" />
                          {formatHora(periodo.horaInicio)}–{formatHora(periodo.horaFim)}
                        </div>
                        <span className="text-xs text-slate-400">
                          {servicoNome(periodo.servicoId)}
                        </span>
                        <span className="text-xs text-slate-500">
                          Vagas de {periodo.duracaoSlotMinutos} min
                        </span>
                        {periodo.intervaloInicio && periodo.intervaloFim && (
                          <span className="text-xs text-slate-500">
                            Intervalo {formatHora(periodo.intervaloInicio)}–{formatHora(periodo.intervaloFim)}
                          </span>
                        )}
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                            periodo.ativo
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                              : 'border-slate-500/20 bg-slate-500/10 text-slate-400'
                          }`}
                        >
                          {periodo.ativo ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </div>

                      {periodo.ativo && podeEditar && (
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEdicao(periodo)}
                            disabled={salvando}
                            className="inline-flex items-center gap-2 rounded-lg border border-border-dark bg-slate-900/40 px-3 py-2 text-xs font-bold text-slate-300 hover:border-primary/30 hover:text-white disabled:opacity-50"
                          >
                            <Pencil size={14} />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => solicitarInativacao(periodo)}
                            disabled={salvando}
                            className="inline-flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/15 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            Retirar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <AnimatePresence>
        {impacto && acaoPendente && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={cancelarImpacto}
            />
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[22px] border border-amber-500/20 bg-card-dark shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border-dark p-5">
                <div>
                  <div className="flex items-center gap-2 text-amber-300">
                    <AlertCircle size={19} />
                    <h3 className="font-bold">Pacientes afetados pela alteração</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Esta mudança atinge {impacto.totalAfetados} agendamento(s). A secretaria pode continuar, mas deve estar ciente e providenciar as remarcações necessárias.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cancelarImpacto}
                  className="rounded-lg border border-border-dark p-2 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[45vh] overflow-y-auto p-5">
                <div className="space-y-2">
                  {impacto.afetados.map((item) => (
                    <div
                      key={item.agendamentoServicoId}
                      className="grid gap-2 rounded-xl border border-border-dark bg-slate-900/30 p-3 sm:grid-cols-[110px_minmax(0,1fr)_120px]"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{formatData(item.data)}</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {formatHora(item.horaInicio)}{item.horaFim ? `–${formatHora(item.horaFim)}` : ''}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {item.nome || item.nomeAvulso || 'Paciente não informado'}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Prontuário {item.prontuario || item.prontuarioInformado || '—'}
                        </p>
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.telefone ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone size={12} /> {item.telefone}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-600">
                            <UserRound size={12} /> Sem telefone
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Motivo da alteração
                  </label>
                  <textarea
                    value={motivoImpacto}
                    onChange={(event) => setMotivoImpacto(event.target.value)}
                    rows={3}
                    placeholder="Ex: profissional informou indisponibilidade; pacientes serão contatados para remarcação."
                    className="w-full resize-none rounded-xl border border-border-dark bg-slate-900/50 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-border-dark p-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cancelarImpacto}
                  className="rounded-xl border border-border-dark bg-slate-900/40 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white"
                >
                  Voltar sem alterar
                </button>
                <button
                  type="button"
                  onClick={confirmarComImpacto}
                  disabled={salvando || !motivoImpacto.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Confirmar alteração mesmo assim
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}
