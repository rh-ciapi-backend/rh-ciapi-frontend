import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  X,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { SaeAgendaApiError, saeAgendaService } from '../../services/saeAgendaService';
import { saeAgendamentosService } from '../../services/saeAgendamentosService';
import type {
  SaeAgendaListResponse,
  SaeAgendaPeriodo,
  SaeCriarSolicitacaoItemPayload,
  SaeDiaSemana,
  SaeSolicitacaoAgenda,
  SaeSolicitacaoAgendaAcao,
} from '../../types/saeAgenda';
import type { SaeProfissionalAgendamentoResumo } from '../../types/saeAgendamento';

interface Props {
  aberto: boolean;
  onClose: () => void;
}

const DIAS: Array<{ value: SaeDiaSemana; label: string }> = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
];

const hora = (value?: string | null) => (value ? String(value).slice(0, 5) : '—');
const dataHora = (value?: string | null) => value ? new Date(value).toLocaleString('pt-BR') : '—';
const dataCurta = (value?: string | null) => {
  if (!value) return '—';
  const [ano, mes, dia] = value.split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : value;
};
const diaLabel = (dia?: number | null) => DIAS.find((item) => item.value === dia)?.label || '—';

export default function MinhaAgendaModal({ aberto, onClose }: Props) {
  const [dados, setDados] = useState<SaeAgendaListResponse | null>(null);
  const [solicitacoes, setSolicitacoes] = useState<SaeSolicitacaoAgenda[]>([]);
  const [proximosAtendimentos, setProximosAtendimentos] = useState<SaeProfissionalAgendamentoResumo[]>([]);
  const [aba, setAba] = useState<'agenda' | 'solicitacoes'>('agenda');
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [semVinculo, setSemVinculo] = useState(false);
  const [formAberto, setFormAberto] = useState(false);

  const [acao, setAcao] = useState<SaeSolicitacaoAgendaAcao>('INCLUIR');
  const [periodoId, setPeriodoId] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [diaSemana, setDiaSemana] = useState<SaeDiaSemana>(1);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('12:00');
  const [intervaloInicio, setIntervaloInicio] = useState('');
  const [intervaloFim, setIntervaloFim] = useState('');
  const [duracaoSlotMinutos, setDuracaoSlotMinutos] = useState(30);
  const [observacao, setObservacao] = useState('');

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro(null);
      setSemVinculo(false);

      const [agendaResponse, solicitacoesResponse, atendimentosResponse] =
        await Promise.all([
          saeAgendaService.minhaAgenda(),
          saeAgendaService.minhasSolicitacoes(),
          saeAgendamentosService.minhaAgendaProfissional(),
        ]);

      setDados(agendaResponse);
      setSolicitacoes(solicitacoesResponse.solicitacoes || []);
      setProximosAtendimentos(atendimentosResponse.agendamentos || []);
    } catch (error) {
      if (error instanceof SaeAgendaApiError && error.status === 404) {
        setSemVinculo(true);
        setDados(null);
        setSolicitacoes([]);
        setProximosAtendimentos([]);
      } else {
        setErro(error instanceof Error ? error.message : 'Não foi possível carregar sua agenda.');
      }
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!aberto) return;
    setAba('agenda');
    setFormAberto(false);
    setSucesso(null);
    carregar();
  }, [aberto]);

  useEffect(() => {
    if (!sucesso) return;
    const timer = window.setTimeout(() => setSucesso(null), 3200);
    return () => window.clearTimeout(timer);
  }, [sucesso]);

  const periodosAtivos = useMemo(
    () => (dados?.agenda || []).filter((item) => item.ativo),
    [dados?.agenda],
  );

  const servicoNome = (id?: string | null) => {
    if (!id) return 'Agenda geral';
    const servico = dados?.servicos?.find((item) => item.id === id);
    return servico ? `${servico.nome}${servico.sigla ? ` (${servico.sigla})` : ''}` : 'Serviço específico';
  };

  const selecionarPeriodo = (id: string) => {
    setPeriodoId(id);
    const periodo = periodosAtivos.find((item) => item.id === id);
    if (!periodo) return;

    setServicoId(periodo.servicoId || '');
    setDiaSemana(periodo.diaSemana);
    setHoraInicio(hora(periodo.horaInicio) === '—' ? '' : hora(periodo.horaInicio));
    setHoraFim(hora(periodo.horaFim) === '—' ? '' : hora(periodo.horaFim));
    setIntervaloInicio(hora(periodo.intervaloInicio) === '—' ? '' : hora(periodo.intervaloInicio));
    setIntervaloFim(hora(periodo.intervaloFim) === '—' ? '' : hora(periodo.intervaloFim));
    setDuracaoSlotMinutos(periodo.duracaoSlotMinutos || 30);
    setObservacao(periodo.observacao || '');
  };

  const abrirSolicitacao = () => {
    setAcao('INCLUIR');
    setPeriodoId('');
    setJustificativa('');
    setServicoId('');
    setDiaSemana(1);
    setHoraInicio('08:00');
    setHoraFim('12:00');
    setIntervaloInicio('');
    setIntervaloFim('');
    setDuracaoSlotMinutos(30);
    setObservacao('');
    setErro(null);
    setFormAberto(true);
  };

  const enviarSolicitacao = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dados?.profissional) return;

    if (!justificativa.trim()) {
      setErro('Informe a justificativa da solicitação.');
      return;
    }

    if (acao !== 'INCLUIR' && !periodoId) {
      setErro('Selecione o período da agenda que deseja alterar ou remover.');
      return;
    }

    if (acao !== 'REMOVER') {
      if (!horaInicio || !horaFim || horaFim <= horaInicio) {
        setErro('Informe um horário inicial e final válidos.');
        return;
      }
    }

    const item: SaeCriarSolicitacaoItemPayload = {
      acao,
      observacao: observacao.trim() || undefined,
    };

    if (acao !== 'INCLUIR') item.agendaProfissionalId = periodoId;

    if (acao !== 'REMOVER') {
      item.servicoId = servicoId || undefined;
      item.diaSemana = diaSemana;
      item.horaInicio = horaInicio;
      item.horaFim = horaFim;
      item.intervaloInicio = intervaloInicio || undefined;
      item.intervaloFim = intervaloFim || undefined;
      item.duracaoSlotMinutos = duracaoSlotMinutos;
    }

    try {
      setSalvando(true);
      setErro(null);
      const response = await saeAgendaService.criarSolicitacao({
        profissionalId: dados.profissional.id,
        justificativa: justificativa.trim(),
        itens: [item],
      });

      setSolicitacoes((atuais) => [response.solicitacao, ...atuais]);
      setSucesso('Solicitação enviada para análise da secretaria.');
      setFormAberto(false);
      setAba('solicitacoes');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível enviar a solicitação.');
    } finally {
      setSalvando(false);
    }
  };

  const cancelarSolicitacao = async (solicitacao: SaeSolicitacaoAgenda) => {
    if (!window.confirm('Deseja cancelar esta solicitação pendente?')) return;

    try {
      setSalvando(true);
      setErro(null);
      const response = await saeAgendaService.cancelarSolicitacao(solicitacao.id);
      setSolicitacoes((atuais) =>
        atuais.map((item) => item.id === response.solicitacao.id ? response.solicitacao : item),
      );
      setSucesso('Solicitação cancelada.');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível cancelar a solicitação.');
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-border-dark bg-card-dark shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border-dark p-5 sm:p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">SAE</p>
              <h2 className="mt-1 text-xl font-bold text-white">Minha agenda</h2>
              <p className="mt-1 text-xs text-slate-500">
                Consulte sua disponibilidade oficial e envie solicitações de alteração para a secretaria.
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded-xl border border-border-dark p-2 text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {carregando ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 size={28} className="animate-spin text-primary" />
              </div>
            ) : semVinculo ? (
              <div className="mx-auto max-w-xl rounded-[18px] border border-amber-500/20 bg-amber-500/10 p-6 text-center">
                <AlertCircle size={28} className="mx-auto text-amber-300" />
                <h3 className="mt-4 font-bold text-white">Usuário ainda não vinculado a um profissional</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Para usar Minha Agenda, a conta do sistema precisa estar vinculada ao cadastro profissional do SAE. A secretaria ou administração pode realizar esse vínculo.
                </p>
              </div>
            ) : dados ? (
              <div className="space-y-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">{dados.profissional.nome}</h3>
                    <p className="text-xs text-slate-500">Agenda oficial vigente no SAE</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={carregar}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-dark bg-slate-900/40 px-3 text-xs font-bold text-slate-300"
                    >
                      <RefreshCw size={15} /> Atualizar
                    </button>
                    <button
                      type="button"
                      onClick={abrirSolicitacao}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white"
                    >
                      <Plus size={15} /> Solicitar alteração
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 rounded-xl border border-border-dark bg-slate-900/25 p-1.5">
                  <button
                    type="button"
                    onClick={() => setAba('agenda')}
                    className={`rounded-lg px-3 py-2 text-xs font-bold ${aba === 'agenda' ? 'bg-primary text-white' : 'text-slate-400'}`}
                  >
                    Agenda vigente
                  </button>
                  <button
                    type="button"
                    onClick={() => setAba('solicitacoes')}
                    className={`rounded-lg px-3 py-2 text-xs font-bold ${aba === 'solicitacoes' ? 'bg-primary text-white' : 'text-slate-400'}`}
                  >
                    Minhas solicitações
                  </button>
                </div>

                {erro && (
                  <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" /> {erro}
                  </div>
                )}

                {sucesso && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> {sucesso}
                  </div>
                )}

                {aba === 'agenda' ? (
                  <div className="space-y-5">
                    <section className="overflow-hidden rounded-[18px] border border-border-dark bg-slate-900/20">
                      <div className="flex flex-col gap-1 border-b border-border-dark px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">Próximos atendimentos</h4>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Pacientes já agendados para este profissional.
                          </p>
                        </div>
                        <span className="text-xs font-bold text-primary">
                          {proximosAtendimentos.length}
                        </span>
                      </div>

                      {proximosAtendimentos.length === 0 ? (
                        <p className="px-4 py-5 text-sm text-slate-600">
                          Nenhum paciente agendado.
                        </p>
                      ) : (
                        <div className="divide-y divide-border-dark">
                          {proximosAtendimentos.map((item) => (
                            <div
                              key={item.agendamentoServicoId}
                              className="grid gap-3 px-4 py-4 sm:grid-cols-[120px_120px_minmax(0,1fr)] sm:items-center"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-300">
                                  {dataCurta(item.data)}
                                </p>
                                <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-white">
                                  <Clock3 size={14} className="text-primary" />
                                  {hora(item.horaInicio)}–{hora(item.horaFim)}
                                </p>
                              </div>

                              <div className="text-xs text-slate-500">
                                {item.tipoAtendimento || 'Atendimento'}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-white">
                                  {item.nomePaciente}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                                  <span>Prontuário {item.prontuario || '—'}</span>
                                  <span>
                                    {item.servicoNome}
                                    {item.servicoSigla ? ` (${item.servicoSigla})` : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    <div className="grid gap-3">
                    {DIAS.map((dia) => {
                      const periodos = periodosAtivos.filter((item) => item.diaSemana === dia.value);
                      return (
                        <section key={dia.value} className="rounded-[18px] border border-border-dark bg-slate-900/20">
                          <div className="border-b border-border-dark px-4 py-3 text-sm font-bold text-white">{dia.label}</div>
                          {periodos.length === 0 ? (
                            <p className="px-4 py-5 text-sm text-slate-600">Sem disponibilidade cadastrada.</p>
                          ) : (
                            <div className="divide-y divide-border-dark">
                              {periodos.map((periodo) => (
                                <div key={periodo.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-4">
                                  <span className="inline-flex items-center gap-2 font-bold text-white">
                                    <Clock3 size={15} className="text-primary" />
                                    {hora(periodo.horaInicio)}–{hora(periodo.horaFim)}
                                  </span>
                                  <span className="text-xs text-slate-400">{servicoNome(periodo.servicoId)}</span>
                                  <span className="text-xs text-slate-500">Vagas de {periodo.duracaoSlotMinutos} min</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      );
                    })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {solicitacoes.length === 0 ? (
                      <div className="rounded-xl border border-border-dark bg-slate-900/20 p-8 text-center text-sm text-slate-500">
                        Você ainda não possui solicitações de alteração.
                      </div>
                    ) : solicitacoes.map((solicitacao) => (
                      <article key={solicitacao.id} className="rounded-[18px] border border-border-dark bg-slate-900/20 p-4">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-border-dark bg-slate-800/60 px-2 py-0.5 text-[9px] font-bold text-slate-300">{solicitacao.status}</span>
                              <span className="text-xs font-bold text-slate-300">{solicitacao.tipoSolicitacao}</span>
                            </div>
                            <p className="mt-3 text-sm font-semibold text-white">{solicitacao.justificativa || 'Sem justificativa'}</p>
                            <p className="mt-1 text-[11px] text-slate-500">{dataHora(solicitacao.createdAt)}</p>
                          </div>
                          {solicitacao.status === 'PENDENTE' && (
                            <button
                              type="button"
                              onClick={() => cancelarSolicitacao(solicitacao)}
                              disabled={salvando}
                              className="inline-flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300"
                            >
                              <XCircle size={14} /> Cancelar
                            </button>
                          )}
                        </div>
                        {solicitacao.observacaoAnalise && (
                          <div className="mt-4 rounded-xl border border-border-dark bg-slate-950/30 p-3 text-xs text-slate-400">
                            <span className="font-bold text-slate-300">Retorno da secretaria:</span> {solicitacao.observacaoAnalise}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </motion.div>

        {formAberto && dados && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !salvando && setFormAberto(false)} />
            <form onSubmit={enviarSolicitacao} className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[22px] border border-border-dark bg-card-dark p-5 shadow-2xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white">Solicitar alteração de agenda</h3>
                  <p className="mt-1 text-sm text-slate-500">A solicitação ficará pendente até análise da secretaria.</p>
                </div>
                <button type="button" onClick={() => setFormAberto(false)} className="rounded-lg border border-border-dark p-2 text-slate-400">
                  <X size={16} />
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Tipo de solicitação">
                  <select
                    value={acao}
                    onChange={(event) => {
                      const next = event.target.value as SaeSolicitacaoAgendaAcao;
                      setAcao(next);
                      setPeriodoId('');
                    }}
                    className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white outline-none"
                  >
                    <option value="INCLUIR">Incluir novo horário</option>
                    <option value="ALTERAR">Alterar horário existente</option>
                    <option value="REMOVER">Retirar horário existente</option>
                  </select>
                </Field>

                {acao !== 'INCLUIR' && (
                  <Field label="Período atual">
                    <select
                      value={periodoId}
                      onChange={(event) => selecionarPeriodo(event.target.value)}
                      required
                      className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white outline-none"
                    >
                      <option value="">Selecione...</option>
                      {periodosAtivos.map((periodo) => (
                        <option key={periodo.id} value={periodo.id}>
                          {diaLabel(periodo.diaSemana)} • {hora(periodo.horaInicio)}–{hora(periodo.horaFim)} • {servicoNome(periodo.servicoId)}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                {acao !== 'REMOVER' && (
                  <>
                    <Field label="Dia da semana">
                      <select
                        value={diaSemana}
                        onChange={(event) => setDiaSemana(Number(event.target.value) as SaeDiaSemana)}
                        className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white outline-none"
                      >
                        {DIAS.map((dia) => <option key={dia.value} value={dia.value}>{dia.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Serviço">
                      <select
                        value={servicoId}
                        onChange={(event) => setServicoId(event.target.value)}
                        className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white outline-none"
                      >
                        <option value="">Agenda geral</option>
                        {(dados.servicos || []).map((servico) => (
                          <option key={servico.id} value={servico.id}>{servico.nome}{servico.sigla ? ` (${servico.sigla})` : ''}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Início"><input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white" /></Field>
                    <Field label="Fim"><input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white" /></Field>
                    <Field label="Início do intervalo"><input type="time" value={intervaloInicio} onChange={(e) => setIntervaloInicio(e.target.value)} className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white" /></Field>
                    <Field label="Fim do intervalo"><input type="time" value={intervaloFim} onChange={(e) => setIntervaloFim(e.target.value)} className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white" /></Field>
                    <Field label="Duração da vaga"><input type="number" min={5} max={480} step={5} value={duracaoSlotMinutos} onChange={(e) => setDuracaoSlotMinutos(Number(e.target.value) || 30)} className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white" /></Field>
                    <Field label="Observação"><input value={observacao} onChange={(e) => setObservacao(e.target.value)} className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white" /></Field>
                  </>
                )}
              </div>

              <div className="mt-4">
                <Field label="Justificativa">
                  <textarea
                    value={justificativa}
                    onChange={(event) => setJustificativa(event.target.value)}
                    rows={4}
                    required
                    placeholder="Explique por que a agenda precisa ser alterada."
                    className="w-full resize-none rounded-xl border border-border-dark bg-slate-900/50 p-3 text-sm text-white outline-none placeholder:text-slate-600"
                  />
                </Field>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-border-dark pt-4">
                <button type="button" onClick={() => setFormAberto(false)} className="rounded-xl border border-border-dark px-4 py-2.5 text-sm font-semibold text-slate-300">Cancelar</button>
                <button type="submit" disabled={salvando} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Enviar solicitação
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</label>
      {children}
    </div>
  );
}
