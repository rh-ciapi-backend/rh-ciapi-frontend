import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  RotateCcw,
  Stethoscope,
  UserRoundCheck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { saeTriagemService } from '../../services/saeTriagemService';

import type {
  SaeTriagem,
  SaeTriagemEtapa,
  SaeTriagemParecer,
} from '../../types/saeTriagem';

interface Props {
  triagem: SaeTriagem | null;
  aberto: boolean;
  onClose: () => void;
  onAtualizado: (triagem: SaeTriagem) => void;
  onIrAgendamentos?: () => void;
}

const ETAPA_LABEL = {
  SERVICO_SOCIAL: 'Serviço Social',
  ENFERMAGEM: 'Enfermagem',
  PSICOLOGIA: 'Psicologia',
  MEDICO: 'Médico',
} as const;

const statusLabel = (status: string) =>
  ({
    PENDENTE: 'Pendente',
    AGENDADO: 'Agendado',
    CONCLUIDO: 'Concluído',
    NAO_COMPARECEU: 'Não compareceu',
  })[status] || status;

const formatarData = (value?: string | null) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('pt-BR');
};

export default function TriagemDetalheModal({
  triagem,
  aberto,
  onClose,
  onAtualizado,
  onIrAgendamentos,
}: Props) {
  const [etapaSelecionada, setEtapaSelecionada] =
    useState<SaeTriagemEtapa | null>(null);
  const [parecer, setParecer] =
    useState<SaeTriagemParecer>('FAVORAVEL');
  const [observacao, setObservacao] = useState('');
  const [decisaoAberta, setDecisaoAberta] = useState(false);
  const [decisao, setDecisao] =
    useState<'APTO' | 'NAO_APTO' | 'DESISTENTE'>('APTO');
  const [observacaoDecisao, setObservacaoDecisao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;

    setEtapaSelecionada(null);
    setDecisaoAberta(false);
    setErro(null);
  }, [aberto, triagem?.id]);

  if (!aberto || !triagem) return null;

  const todasConcluidas =
    triagem.etapas.length === 4 &&
    triagem.etapas.every(
      (item) => item.status === 'CONCLUIDO',
    );

  const salvarEtapa = async () => {
    if (!etapaSelecionada) return;

    try {
      setSalvando(true);
      setErro(null);

      const response = await saeTriagemService.atualizarEtapa(
        triagem.id,
        etapaSelecionada.etapa,
        {
          status: 'CONCLUIDO',
          parecer,
          observacao: observacao.trim() || null,
        },
      );

      onAtualizado(response.triagem);
      setEtapaSelecionada(null);
      setObservacao('');
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a etapa.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const reabrirEtapa = async (etapa: SaeTriagemEtapa) => {
    try {
      setSalvando(true);
      setErro(null);

      const response = await saeTriagemService.atualizarEtapa(
        triagem.id,
        etapa.etapa,
        {
          status: 'PENDENTE',
          parecer: null,
          observacao: etapa.observacao || null,
        },
      );

      onAtualizado(response.triagem);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível reabrir a etapa.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const salvarDecisao = async () => {
    try {
      setSalvando(true);
      setErro(null);

      const response = await saeTriagemService.decidir(
        triagem.id,
        {
          decisao,
          observacao: observacaoDecisao.trim() || null,
        },
      );

      onAtualizado(response.triagem);
      setDecisaoAberta(false);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a triagem.',
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => !salvando && onClose()}
        />

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-border-dark bg-card-dark shadow-2xl"
        >
          <header className="flex items-start justify-between gap-4 border-b border-border-dark px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Triagem SAE
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">
                {triagem.nome}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Fluxo recomendado: Serviço Social → Enfermagem → Psicologia → Médico
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-dark text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {erro && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                {erro}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Situação" value={triagem.status} />
              <Info label="Etapa atual" value={ETAPA_LABEL[triagem.etapaAtual as keyof typeof ETAPA_LABEL] || 'Concluída'} />
              <Info label="Nascimento" value={formatarData(triagem.dataNascimento)} />
              <Info label="Telefone" value={triagem.telefone || '—'} />
            </div>

            <div className="mt-6">
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Etapas obrigatórias
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    As quatro avaliações precisam ser concluídas antes da decisão final.
                  </p>
                </div>

                {onIrAgendamentos && (
                  <button
                    type="button"
                    onClick={onIrAgendamentos}
                    className="rounded-xl border border-border-dark bg-slate-900/40 px-4 py-2.5 text-xs font-bold text-slate-300 hover:border-primary/30 hover:text-white"
                  >
                    Ir para Agendamentos
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {triagem.etapas.map((etapa) => {
                  const concluida = etapa.status === 'CONCLUIDO';

                  return (
                    <article
                      key={etapa.id}
                      className={[
                        'rounded-[18px] border p-4',
                        concluida
                          ? 'border-emerald-500/20 bg-emerald-500/[0.06]'
                          : 'border-border-dark bg-slate-900/20',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                            Etapa {etapa.ordem}
                          </p>
                          <h4 className="mt-1 font-bold text-white">
                            {ETAPA_LABEL[etapa.etapa]}
                          </h4>
                        </div>

                        {concluida ? (
                          <CheckCircle2
                            size={20}
                            className="text-emerald-400"
                          />
                        ) : (
                          <Clock3
                            size={20}
                            className="text-amber-300"
                          />
                        )}
                      </div>

                      <div className="mt-4">
                        <span className="inline-flex rounded-full border border-border-dark bg-slate-950/30 px-2.5 py-1 text-[10px] font-bold text-slate-300">
                          {statusLabel(etapa.status)}
                        </span>
                      </div>

                      {etapa.parecer && (
                        <p className="mt-3 text-xs text-slate-400">
                          Parecer: <strong>{etapa.parecer}</strong>
                        </p>
                      )}

                      {etapa.dataConclusao && (
                        <p className="mt-2 text-[11px] text-slate-500">
                          Concluída em {formatarData(etapa.dataConclusao)}
                        </p>
                      )}

                      {etapa.observacao && (
                        <p className="mt-3 text-xs leading-5 text-slate-500">
                          {etapa.observacao}
                        </p>
                      )}

                      <div className="mt-5">
                        {concluida ? (
                          <button
                            type="button"
                            onClick={() => reabrirEtapa(etapa)}
                            disabled={salvando}
                            className="inline-flex items-center gap-2 rounded-lg border border-border-dark px-3 py-2 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50"
                          >
                            <RotateCcw size={14} />
                            Reabrir
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEtapaSelecionada(etapa);
                              setParecer('FAVORAVEL');
                              setObservacao(etapa.observacao || '');
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-hover"
                          >
                            <UserRoundCheck size={14} />
                            Registrar conclusão
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-[18px] border border-border-dark bg-slate-900/20 p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-bold text-white">
                    Decisão final
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {todasConcluidas
                      ? 'As quatro etapas foram concluídas. A triagem pode receber decisão.'
                      : 'Conclua as quatro avaliações antes de marcar como apto ou não apto.'}
                  </p>
                </div>

                {!['APTO', 'NAO_APTO', 'DESISTENTE', 'MATRICULADO'].includes(
                  triagem.status,
                ) && (
                  <button
                    type="button"
                    onClick={() => setDecisaoAberta(true)}
                    disabled={!todasConcluidas}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Stethoscope size={16} />
                    Concluir triagem
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {etapaSelecionada && (
          <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" />

            <div className="relative w-full max-w-xl rounded-[22px] border border-border-dark bg-card-dark p-5 shadow-2xl">
              <h3 className="font-bold text-white">
                Concluir {ETAPA_LABEL[etapaSelecionada.etapa]}
              </h3>

              <div className="mt-5">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Parecer
                </label>

                <select
                  value={parecer}
                  onChange={(event) =>
                    setParecer(
                      event.target.value as SaeTriagemParecer,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white outline-none"
                >
                  <option value="FAVORAVEL">Favorável</option>
                  <option value="PENDENCIA">Com pendência</option>
                  <option value="DESFAVORAVEL">Desfavorável</option>
                </select>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Observação
                </label>

                <textarea
                  value={observacao}
                  onChange={(event) =>
                    setObservacao(event.target.value)
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-border-dark bg-slate-900/50 p-3 text-sm text-white outline-none"
                  placeholder="Resumo da avaliação ou observações administrativas."
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-border-dark pt-4">
                <button
                  type="button"
                  onClick={() => setEtapaSelecionada(null)}
                  disabled={salvando}
                  className="rounded-xl border border-border-dark px-4 py-2.5 text-sm font-semibold text-slate-300"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  onClick={salvarEtapa}
                  disabled={salvando}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {salvando && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Salvar conclusão
                </button>
              </div>
            </div>
          </div>
        )}

        {decisaoAberta && (
          <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" />

            <div className="relative w-full max-w-xl rounded-[22px] border border-border-dark bg-card-dark p-5 shadow-2xl">
              <h3 className="font-bold text-white">
                Decisão final da triagem
              </h3>

              <div className="mt-5">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Resultado
                </label>

                <select
                  value={decisao}
                  onChange={(event) =>
                    setDecisao(
                      event.target.value as
                        | 'APTO'
                        | 'NAO_APTO'
                        | 'DESISTENTE',
                    )
                  }
                  className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white outline-none"
                >
                  <option value="APTO">Apto</option>
                  <option value="NAO_APTO">Não apto</option>
                  <option value="DESISTENTE">Desistente</option>
                </select>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Observação final
                </label>

                <textarea
                  value={observacaoDecisao}
                  onChange={(event) =>
                    setObservacaoDecisao(event.target.value)
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-border-dark bg-slate-900/50 p-3 text-sm text-white outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-border-dark pt-4">
                <button
                  type="button"
                  onClick={() => setDecisaoAberta(false)}
                  className="rounded-xl border border-border-dark px-4 py-2.5 text-sm font-semibold text-slate-300"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  onClick={salvarDecisao}
                  disabled={salvando}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {salvando && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Confirmar decisão
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border-dark bg-slate-900/20 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">
        {value}
      </p>
    </div>
  );
}
