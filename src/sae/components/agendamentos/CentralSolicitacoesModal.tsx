import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  X,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { SaeAgendaApiError, saeAgendaService } from '../../services/saeAgendaService';

import type {
  SaeAgendaAfetado,
  SaeSolicitacaoAgenda,
  SaeSolicitacaoAgendaItem,
} from '../../types/saeAgenda';

interface CentralSolicitacoesModalProps {
  aberto: boolean;
  onClose: () => void;
  onAtualizarPendentes?: () => void;
}

const diaLabel = (dia?: number | null) =>
  ({ 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta' } as Record<number, string>)[
    Number(dia)
  ] || '—';

const hora = (value?: string | null) => (value ? String(value).slice(0, 5) : '—');

const dataHora = (value?: string | null) =>
  value ? new Date(value).toLocaleString('pt-BR') : '—';

const itemResumo = (item: SaeSolicitacaoAgendaItem) => {
  if (item.acao === 'REMOVER') {
    return `Retirar ${diaLabel(item.diaSemanaAnterior)} ${hora(item.horaInicioAnterior)}–${hora(
      item.horaFimAnterior,
    )}`;
  }

  if (item.acao === 'ALTERAR') {
    return `Alterar para ${diaLabel(item.diaSemana)} ${hora(item.horaInicio)}–${hora(
      item.horaFim,
    )}`;
  }

  return `Incluir ${diaLabel(item.diaSemana)} ${hora(item.horaInicio)}–${hora(
    item.horaFim,
  )}`;
};

export default function CentralSolicitacoesModal({
  aberto,
  onClose,
  onAtualizarPendentes,
}: CentralSolicitacoesModalProps) {
  const [solicitacoes, setSolicitacoes] = useState<SaeSolicitacaoAgenda[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const [analise, setAnalise] = useState<{
    solicitacao: SaeSolicitacaoAgenda;
    decisao: 'APROVADA' | 'RECUSADA';
    observacao: string;
    confirmarImpacto: boolean;
    afetados: SaeAgendaAfetado[];
  } | null>(null);

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const response = await saeAgendaService.listarSolicitacoes({
        status: 'PENDENTE',
      });

      setSolicitacoes(response.solicitacoes || []);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar as solicitações pendentes.',
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!aberto) return;
    setAnalise(null);
    setSucesso(null);
    carregar();
  }, [aberto]);

  useEffect(() => {
    if (!sucesso) return;
    const timer = window.setTimeout(() => setSucesso(null), 3200);
    return () => window.clearTimeout(timer);
  }, [sucesso]);

  const totalPendentes = useMemo(
    () => solicitacoes.filter((item) => item.status === 'PENDENTE').length,
    [solicitacoes],
  );

  const concluirAnalise = async () => {
    if (!analise) return;

    try {
      setProcessando(true);
      setErro(null);

      const response = await saeAgendaService.analisarSolicitacao(
        analise.solicitacao.id,
        {
          decisao: analise.decisao,
          observacaoAnalise: analise.observacao.trim() || undefined,
          confirmarImpacto: analise.confirmarImpacto || undefined,
        },
      );

      setSolicitacoes((atuais) =>
        atuais.filter((item) => item.id !== response.solicitacao.id),
      );

      setSucesso(
        analise.decisao === 'APROVADA'
          ? 'Solicitação aprovada e agenda oficial atualizada.'
          : 'Solicitação recusada.',
      );

      setAnalise(null);
      onAtualizarPendentes?.();
    } catch (error) {
      if (error instanceof SaeAgendaApiError && error.status === 409) {
        const details = error.details as { afetados?: SaeAgendaAfetado[] } | undefined;
        const afetados = Array.isArray(details?.afetados) ? details?.afetados || [] : [];

        if (afetados.length > 0 && analise.decisao === 'APROVADA') {
          setAnalise((atual) =>
            atual
              ? {
                  ...atual,
                  confirmarImpacto: true,
                  afetados,
                }
              : atual,
          );

          setErro(
            'A aprovação afeta pacientes agendados. Revise a lista e confirme novamente.',
          );
          return;
        }
      }

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível analisar a solicitação.',
      );
    } finally {
      setProcessando(false);
    }
  };

  if (!aberto) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-border-dark bg-card-dark shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border-dark px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                SAE
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">
                Caixa de solicitações
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Pedidos pendentes enviados pelos profissionais para análise da secretaria.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={carregar}
                disabled={carregando}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-dark bg-slate-900/40 text-slate-400 transition hover:text-white disabled:opacity-50"
                title="Atualizar"
              >
                <RefreshCw size={17} className={carregando ? 'animate-spin' : ''} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-dark bg-slate-900/40 text-slate-400 transition hover:text-white"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border-dark bg-slate-900/25 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Pendentes
                </p>
                <p className="mt-2 text-2xl font-bold text-white">{totalPendentes}</p>
              </div>

              <div className="rounded-2xl border border-border-dark bg-slate-900/25 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Situação
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-300">
                  Aguardando análise da secretaria
                </p>
              </div>
            </div>

            {erro && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            {sucesso && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                <span>{sucesso}</span>
              </div>
            )}

            {carregando ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-border-dark bg-slate-900/20">
                <div className="text-center">
                  <Loader2 size={26} className="mx-auto animate-spin text-primary" />
                  <p className="mt-3 text-sm text-slate-500">
                    Carregando solicitações...
                  </p>
                </div>
              </div>
            ) : solicitacoes.length === 0 ? (
              <div className="rounded-2xl border border-border-dark bg-slate-900/20 px-5 py-12 text-center">
                <CheckCircle2 size={30} className="mx-auto text-emerald-400/70" />
                <h3 className="mt-4 font-bold text-white">
                  Nenhuma solicitação pendente
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Quando um profissional enviar um pedido, ele aparecerá aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {solicitacoes.map((solicitacao) => (
                  <article
                    key={solicitacao.id}
                    className="rounded-[18px] border border-border-dark bg-slate-900/20 p-4"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[9px] font-bold text-amber-300">
                            PENDENTE
                          </span>
                          <span className="text-xs font-bold text-slate-300">
                            {solicitacao.tipoSolicitacao}
                          </span>
                        </div>

                        <h3 className="mt-3 truncate text-base font-bold text-white">
                          {solicitacao.profissionalNome || 'Profissional não identificado'}
                        </h3>

                        <p className="mt-1 text-sm text-slate-300">
                          {solicitacao.justificativa || 'Sem justificativa informada'}
                        </p>

                        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Clock3 size={12} />
                          {dataHora(solicitacao.createdAt)}
                        </p>

                        <div className="mt-3 space-y-1.5">
                          {solicitacao.itens.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-lg border border-border-dark bg-slate-950/20 px-3 py-2 text-xs text-slate-400"
                            >
                              {itemResumo(item)}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setAnalise({
                              solicitacao,
                              decisao: 'RECUSADA',
                              observacao: '',
                              confirmarImpacto: false,
                              afetados: [],
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/15"
                        >
                          <XCircle size={14} />
                          Recusar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setAnalise({
                              solicitacao,
                              decisao: 'APROVADA',
                              observacao: '',
                              confirmarImpacto: false,
                              afetados: [],
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-hover"
                        >
                          <CheckCircle2 size={14} />
                          Aprovar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {analise && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => !processando && setAnalise(null)}
              />

              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[22px] border border-border-dark bg-card-dark shadow-2xl"
              >
                <div className="border-b border-border-dark p-5">
                  <h3 className="font-bold text-white">
                    {analise.decisao === 'APROVADA'
                      ? 'Aprovar solicitação'
                      : 'Recusar solicitação'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {analise.solicitacao.profissionalNome || 'Profissional'}
                  </p>
                </div>

                <div className="max-h-[55vh] overflow-y-auto p-5">
                  {analise.afetados.length > 0 && (
                    <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                      <p className="font-bold text-amber-300">
                        {analise.afetados.length} paciente(s) afetado(s)
                      </p>
                      <div className="mt-3 space-y-2">
                        {analise.afetados.map((item) => (
                          <div
                            key={item.agendamentoServicoId}
                            className="rounded-lg border border-amber-500/10 bg-black/10 px-3 py-2 text-xs text-slate-300"
                          >
                            <span className="font-semibold text-white">
                              {item.nome || item.nomeAvulso || 'Paciente'}
                            </span>
                            {' • '}
                            {item.data || 'Data não informada'}
                            {' • '}
                            {hora(item.horaInicio)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Observação da análise
                  </label>
                  <textarea
                    value={analise.observacao}
                    onChange={(event) =>
                      setAnalise((atual) =>
                        atual ? { ...atual, observacao: event.target.value } : atual,
                      )
                    }
                    rows={4}
                    placeholder={
                      analise.decisao === 'RECUSADA'
                        ? 'Informe o motivo da recusa, se necessário.'
                        : 'Observação opcional da aprovação.'
                    }
                    className="w-full resize-none rounded-xl border border-border-dark bg-slate-900/50 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-primary/50"
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-border-dark p-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setAnalise(null)}
                    disabled={processando}
                    className="rounded-xl border border-border-dark bg-slate-900/40 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={concluirAnalise}
                    disabled={processando}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 ${
                      analise.decisao === 'APROVADA'
                        ? 'bg-primary text-white hover:bg-primary-hover'
                        : 'bg-rose-500 text-white hover:bg-rose-400'
                    }`}
                  >
                    {processando ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : analise.decisao === 'APROVADA' ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <XCircle size={16} />
                    )}
                    {analise.confirmarImpacto && analise.decisao === 'APROVADA'
                      ? 'Confirmar aprovação mesmo assim'
                      : analise.decisao === 'APROVADA'
                        ? 'Aprovar'
                        : 'Recusar'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
