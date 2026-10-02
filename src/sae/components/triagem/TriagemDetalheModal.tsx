import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarSearch,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Loader2,
  Printer,
  RotateCcw,
  Stethoscope,
  UserCheck,
  UserRoundCheck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { saeTriagemService } from '../../services/saeTriagemService';

import type {
  SaeTriagem,
  SaeTriagemEtapa,
  SaeTriagemMatricula,
  SaeTriagemParecer,
} from '../../types/saeTriagem';
import type { SaeAgendamentoFoco } from '../../types/saeNavegacao';

interface Props {
  triagem: SaeTriagem | null;
  aberto: boolean;
  onClose: () => void;
  onAtualizado: (triagem: SaeTriagem) => void;
  onIrAgendamentos?: (foco?: SaeAgendamentoFoco) => void;
  onAbrirUsuario?: (usuarioId: string) => void;
}

const ETAPA_LABEL = {
  SERVICO_SOCIAL: 'Serviço Social',
  ENFERMAGEM: 'Enfermagem',
  PSICOLOGIA: 'Psicologia',
  MEDICO: 'Médico',
  TERAPIA_OCUPACIONAL: 'Terapia Ocupacional',
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

const formatarDataHora = (value?: string | null) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('pt-BR');
};

function escaparHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function TriagemDetalheModal({
  triagem,
  aberto,
  onClose,
  onAtualizado,
  onIrAgendamentos,
  onAbrirUsuario,
}: Props) {
  const [etapaSelecionada, setEtapaSelecionada] =
    useState<SaeTriagemEtapa | null>(null);
  const [parecer, setParecer] =
    useState<SaeTriagemParecer>('FAVORAVEL');
  const [observacao, setObservacao] = useState('');
  const [decisaoAberta, setDecisaoAberta] = useState(false);
  const [decisao, setDecisao] =
    useState<'APTO' | 'NAO_APTO' | 'DESISTENTE'>('NAO_APTO');
  const [observacaoDecisao, setObservacaoDecisao] = useState('');
  const [matriculaAberta, setMatriculaAberta] = useState(false);
  const [turnoMatricula, setTurnoMatricula] =
    useState<'MANHÃ' | 'TARDE'>('MANHÃ');
  const [observacaoMatricula, setObservacaoMatricula] =
    useState('');
  const [matriculaResultado, setMatriculaResultado] =
    useState<SaeTriagemMatricula | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [relatorioVisualizacao, setRelatorioVisualizacao] =
    useState<SaeTriagemEtapa | null>(null);

  useEffect(() => {
    if (!aberto) return;

    setEtapaSelecionada(null);
    setRelatorioVisualizacao(null);
    setDecisaoAberta(false);
    setMatriculaAberta(false);
    setMatriculaResultado(null);
    setErro(null);
  }, [aberto, triagem?.id]);

  if (!aberto || !triagem) return null;

  const todasConcluidas =
    triagem.etapas.length === 5 &&
    triagem.etapas.every(
      (item) => item.status === 'CONCLUIDO',
    );

  const matriculado =
    triagem.status === 'MATRICULADO' &&
    Boolean(triagem.usuarioId);

  const salvarEtapa = async () => {
    if (!etapaSelecionada) return;

    try {
      setSalvando(true);
      setErro(null);

      const response =
        await saeTriagemService.atualizarEtapa(
          triagem.id,
          etapaSelecionada.etapa,
          {
            status: 'CONCLUIDO',
            parecer,
            observacao:
              observacao.trim() || null,
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

  const reabrirEtapa = async (
    etapa: SaeTriagemEtapa,
  ) => {
    try {
      setSalvando(true);
      setErro(null);

      const response =
        await saeTriagemService.atualizarEtapa(
          triagem.id,
          etapa.etapa,
          {
            status: 'PENDENTE',
            parecer: null,
            observacao:
              etapa.observacao || null,
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

  const abrirAgendamentoDaEtapa = (
    etapa: SaeTriagemEtapa,
  ) => {
    if (!onIrAgendamentos) return;

    const foco: SaeAgendamentoFoco = {
      agendamentoId:
        etapa.agendamentoId || null,
      nomeUsuario: triagem.nome,
      etapa: etapa.etapa,
      data:
        etapa.dataAgendada ||
        etapa.dataConclusao ||
        null,
    };

    onClose();
    onIrAgendamentos(foco);
  };

  const salvarDecisao = async () => {
    try {
      setSalvando(true);
      setErro(null);

      const response =
        await saeTriagemService.decidir(
          triagem.id,
          {
            decisao,
            observacao:
              observacaoDecisao.trim() ||
              null,
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

  const matricular = async () => {
    try {
      setSalvando(true);
      setErro(null);

      const response =
        await saeTriagemService.matricular(
          triagem.id,
          {
            turno: turnoMatricula,
            observacao:
              observacaoMatricula.trim() ||
              null,
          },
        );

      setMatriculaResultado(
        response.matricula,
      );
      onAtualizado(response.triagem);
      setMatriculaAberta(false);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível emitir o protocolo e criar a matrícula.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const imprimirProtocolo = (
    matricula?: SaeTriagemMatricula | null,
  ) => {
    const protocolo =
      matricula?.protocolo ||
      triagem.protocoloMatricula ||
      '—';

    const prontuario =
      matricula?.prontuario || '—';

    const matriculadoEm =
      matricula?.matriculadoEm ||
      triagem.matriculadoEm;

    const etapasHtml = triagem.etapas
      .map(
        (etapa) => `
          <tr>
            <td>${escaparHtml(
              etapa.ordem,
            )}</td>
            <td>${escaparHtml(
              ETAPA_LABEL[etapa.etapa],
            )}</td>
            <td>${escaparHtml(
              statusLabel(etapa.status),
            )}</td>
            <td>${escaparHtml(
              formatarData(
                etapa.dataConclusao,
              ),
            )}</td>
          </tr>
        `,
      )
      .join('');

    const janela = window.open(
      '',
      '_blank',
      'width=900,height=700',
    );

    if (!janela) {
      setErro(
        'O navegador bloqueou a janela de impressão. Permita pop-ups para o CIAPI.',
      );
      return;
    }

    janela.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Protocolo ${escaparHtml(
            protocolo,
          )}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              color: #111827;
            }
            h1 { font-size: 22px; margin: 0 0 4px; }
            h2 { font-size: 16px; margin-top: 28px; }
            .muted { color: #64748b; font-size: 12px; }
            .box {
              border: 1px solid #cbd5e1;
              border-radius: 10px;
              padding: 16px;
              margin-top: 18px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }
            .label {
              font-size: 10px;
              color: #64748b;
              text-transform: uppercase;
              font-weight: bold;
            }
            .value {
              margin-top: 4px;
              font-size: 14px;
              font-weight: bold;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 8px;
              text-align: left;
            }
            th { background: #f1f5f9; }
            .footer {
              margin-top: 42px;
              font-size: 11px;
              color: #64748b;
              text-align: center;
            }
            @media print {
              body { margin: 20mm; }
            }
          </style>
        </head>
        <body>
          <h1>CIAPI — SAE</h1>
          <div class="muted">
            Protocolo de conclusão da triagem e matrícula
          </div>

          <div class="box grid">
            <div>
              <div class="label">Protocolo</div>
              <div class="value">${escaparHtml(
                protocolo,
              )}</div>
            </div>
            <div>
              <div class="label">Prontuário / Matrícula</div>
              <div class="value">${escaparHtml(
                prontuario,
              )}</div>
            </div>
            <div>
              <div class="label">Usuário</div>
              <div class="value">${escaparHtml(
                triagem.nome,
              )}</div>
            </div>
            <div>
              <div class="label">Nascimento</div>
              <div class="value">${escaparHtml(
                formatarData(
                  triagem.dataNascimento,
                ),
              )}</div>
            </div>
            <div>
              <div class="label">Data da matrícula</div>
              <div class="value">${escaparHtml(
                formatarDataHora(
                  matriculadoEm,
                ),
              )}</div>
            </div>
            <div>
              <div class="label">Situação</div>
              <div class="value">MATRICULADO</div>
            </div>
          </div>

          <h2>Avaliações obrigatórias</h2>
          <table>
            <thead>
              <tr>
                <th>Etapa</th>
                <th>Serviço</th>
                <th>Status</th>
                <th>Conclusão</th>
              </tr>
            </thead>
            <tbody>
              ${etapasHtml}
            </tbody>
          </table>

          <div class="footer">
            Documento emitido pelo CIAPI SAE.
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    janela.document.close();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() =>
            !salvando && onClose()
          }
        />

        <motion.div
          initial={{
            opacity: 0,
            y: 16,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 16,
            scale: 0.98,
          }}
          className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-border-dark bg-card-dark shadow-2xl"
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
                Serviço Social → Enfermagem → Psicologia → Médico → Terapia Ocupacional
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
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />
                {erro}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info
                label="Situação"
                value={triagem.status}
              />
              <Info
                label="Etapa atual"
                value={
                  ETAPA_LABEL[
                    triagem.etapaAtual as keyof typeof ETAPA_LABEL
                  ] || 'Concluída'
                }
              />
              <Info
                label="Nascimento"
                value={formatarData(
                  triagem.dataNascimento,
                )}
              />
              <Info
                label="Telefone"
                value={triagem.telefone || '—'}
              />
            </div>

            <div className="mt-6">
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Etapas obrigatórias
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    As cinco avaliações devem ser concluídas antes da matrícula.
                  </p>
                </div>

                {onIrAgendamentos && (
                  <button
                    type="button"
                    onClick={() =>
                      onIrAgendamentos({
                        nomeUsuario:
                          triagem.nome,
                      })
                    }
                    className="rounded-xl border border-border-dark bg-slate-900/40 px-4 py-2.5 text-xs font-bold text-slate-300 hover:border-primary/30 hover:text-white"
                  >
                    Ir para Agendamentos
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {triagem.etapas.map((etapa) => {
                  const concluida =
                    etapa.status ===
                    'CONCLUIDO';

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

                          {onIrAgendamentos ? (
                            <button
                              type="button"
                              onClick={() =>
                                abrirAgendamentoDaEtapa(
                                  etapa,
                                )
                              }
                              className="mt-1 text-left font-bold text-white transition hover:text-primary"
                            >
                              {
                                ETAPA_LABEL[
                                  etapa.etapa
                                ]
                              }
                            </button>
                          ) : (
                            <h4 className="mt-1 font-bold text-white">
                              {
                                ETAPA_LABEL[
                                  etapa.etapa
                                ]
                              }
                            </h4>
                          )}
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
                          {statusLabel(
                            etapa.status,
                          )}
                        </span>
                      </div>

                      {etapa.parecer && (
                        <p className="mt-3 text-xs text-slate-400">
                          Parecer:{' '}
                          <strong>
                            {etapa.parecer}
                          </strong>
                        </p>
                      )}

                      {etapa.dataConclusao && (
                        <p className="mt-2 text-[11px] text-slate-500">
                          Concluída em{' '}
                          {formatarData(
                            etapa.dataConclusao,
                          )}
                        </p>
                      )}

                      {etapa.observacao && (
                        <p className="mt-3 text-xs leading-5 text-slate-500">
                          {etapa.observacao}
                        </p>
                      )}

                      <div className="mt-5 flex flex-wrap gap-2">
                        {onIrAgendamentos && (
                          <button
                            type="button"
                            onClick={() =>
                              abrirAgendamentoDaEtapa(
                                etapa,
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-xs font-bold text-blue-200 transition hover:border-primary/50 hover:bg-primary/15 hover:text-white"
                          >
                            <CalendarSearch
                              size={14}
                            />
                            {etapa.agendamentoId
                              ? 'Ver agendamento'
                              : 'Localizar agendamento'}
                          </button>
                        )}

                        {concluida && (
                          <button
                            type="button"
                            onClick={() => setRelatorioVisualizacao(etapa)}
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/15"
                          >
                            <Eye size={14} />
                            Visualizar relatório
                          </button>
                        )}

                        {!matriculado &&
                          (concluida ? (
                            <button
                              type="button"
                              onClick={() =>
                                reabrirEtapa(
                                  etapa,
                                )
                              }
                              disabled={
                                salvando
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-border-dark px-3 py-2 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50"
                            >
                              <RotateCcw
                                size={14}
                              />
                              Reabrir
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEtapaSelecionada(
                                  etapa,
                                );
                                setParecer(
                                  'FAVORAVEL',
                                );
                                setObservacao(
                                  etapa.observacao ||
                                    '',
                                );
                              }}
                              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-hover"
                            >
                              <UserRoundCheck
                                size={14}
                              />
                              Registrar conclusão
                            </button>
                          ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {matriculado ? (
              <div className="mt-6 rounded-[20px] border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                      <UserCheck size={20} />
                    </div>

                    <div>
                      <h3 className="font-bold text-white">
                        Matrícula concluída
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        O processo de triagem foi convertido em usuário oficial do SAE.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                        <span className="text-slate-400">
                          Protocolo:{' '}
                          <strong className="text-white">
                            {triagem.protocoloMatricula ||
                              matriculaResultado?.protocolo ||
                              '—'}
                          </strong>
                        </span>

                        <span className="text-slate-400">
                          Matrícula em:{' '}
                          <strong className="text-white">
                            {formatarDataHora(
                              triagem.matriculadoEm ||
                                matriculaResultado?.matriculadoEm,
                            )}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        imprimirProtocolo(
                          matriculaResultado,
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-border-dark bg-slate-900/40 px-4 py-2.5 text-sm font-bold text-slate-200 hover:text-white"
                    >
                      <Printer size={16} />
                      Imprimir protocolo
                    </button>

                    {triagem.usuarioId &&
                      onAbrirUsuario && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onAbrirUsuario(
                              triagem.usuarioId!,
                            );
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-hover"
                        >
                          <UserCheck
                            size={16}
                          />
                          Abrir usuário
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[20px] border border-border-dark bg-slate-900/20 p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="font-bold text-white">
                      Conclusão da triagem
                    </h3>

                    <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
                      {todasConcluidas
                        ? 'As cinco avaliações foram concluídas. O sistema já pode emitir o protocolo e criar a matrícula do idoso como usuário do SAE.'
                        : 'Conclua Serviço Social, Enfermagem, Psicologia, Médico e Terapia Ocupacional para liberar a matrícula.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {![
                      'NAO_APTO',
                      'DESISTENTE',
                    ].includes(
                      triagem.status,
                    ) && (
                      <button
                        type="button"
                        onClick={() =>
                          setMatriculaAberta(
                            true,
                          )
                        }
                        disabled={
                          !todasConcluidas
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <FileCheck2
                          size={16}
                        />
                        Emitir protocolo e matricular
                      </button>
                    )}

                    {![
                      'NAO_APTO',
                      'DESISTENTE',
                    ].includes(
                      triagem.status,
                    ) && (
                      <button
                        type="button"
                        onClick={() => {
                          setDecisao(
                            'NAO_APTO',
                          );
                          setDecisaoAberta(
                            true,
                          );
                        }}
                        disabled={
                          !todasConcluidas
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-dark px-4 py-2.5 text-sm font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Stethoscope
                          size={16}
                        />
                        Encerrar sem matrícula
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {etapaSelecionada && (
          <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" />

            <div className="relative w-full max-w-xl rounded-[22px] border border-border-dark bg-card-dark p-5 shadow-2xl">
              <h3 className="font-bold text-white">
                Concluir{' '}
                {
                  ETAPA_LABEL[
                    etapaSelecionada.etapa
                  ]
                }
              </h3>

              <div className="mt-5">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Parecer
                </label>

                <select
                  value={parecer}
                  onChange={(event) =>
                    setParecer(
                      event.target
                        .value as SaeTriagemParecer,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white outline-none"
                >
                  <option value="FAVORAVEL">
                    Favorável
                  </option>
                  <option value="PENDENCIA">
                    Com pendência
                  </option>
                  <option value="DESFAVORAVEL">
                    Desfavorável
                  </option>
                </select>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Observação
                </label>

                <textarea
                  value={observacao}
                  onChange={(event) =>
                    setObservacao(
                      event.target.value,
                    )
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-border-dark bg-slate-900/50 p-3 text-sm text-white outline-none"
                  placeholder="Resumo da avaliação ou observações administrativas."
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-border-dark pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setEtapaSelecionada(
                      null,
                    )
                  }
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
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}
                  Salvar conclusão
                </button>
              </div>
            </div>
          </div>
        )}

        {matriculaAberta && (
          <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" />

            <div className="relative w-full max-w-xl rounded-[22px] border border-border-dark bg-card-dark p-5 shadow-2xl">
              <h3 className="font-bold text-white">
                Emitir protocolo e criar matrícula
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Ao confirmar, {triagem.nome} passará a integrar a lista oficial de usuários do SAE e receberá um novo prontuário/matrícula.
              </p>

              <div className="mt-5">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Turno
                </label>

                <select
                  value={turnoMatricula}
                  onChange={(event) =>
                    setTurnoMatricula(
                      event.target
                        .value as
                        | 'MANHÃ'
                        | 'TARDE',
                    )
                  }
                  className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white outline-none"
                >
                  <option value="MANHÃ">
                    Manhã
                  </option>
                  <option value="TARDE">
                    Tarde
                  </option>
                </select>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Observação da matrícula
                </label>

                <textarea
                  value={
                    observacaoMatricula
                  }
                  onChange={(event) =>
                    setObservacaoMatricula(
                      event.target.value,
                    )
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-border-dark bg-slate-900/50 p-3 text-sm text-white outline-none"
                  placeholder="Opcional."
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-border-dark pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setMatriculaAberta(
                      false,
                    )
                  }
                  disabled={salvando}
                  className="rounded-xl border border-border-dark px-4 py-2.5 text-sm font-semibold text-slate-300"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  onClick={matricular}
                  disabled={salvando}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {salvando ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <FileCheck2
                      size={16}
                    />
                  )}
                  Confirmar matrícula
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
                Encerrar triagem sem matrícula
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
                  <option value="NAO_APTO">
                    Não apto
                  </option>
                  <option value="DESISTENTE">
                    Desistente
                  </option>
                </select>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Observação final
                </label>

                <textarea
                  value={
                    observacaoDecisao
                  }
                  onChange={(event) =>
                    setObservacaoDecisao(
                      event.target.value,
                    )
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-border-dark bg-slate-900/50 p-3 text-sm text-white outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-border-dark pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setDecisaoAberta(
                      false,
                    )
                  }
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
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    
      <AnimatePresence>
        {relatorioVisualizacao && (
          <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border-dark bg-card-dark shadow-2xl sm:rounded-2xl"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-border-dark px-4 py-4 sm:px-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                    Relatório da triagem
                  </p>
                  <h3 className="mt-1 font-bold text-white">
                    {ETAPA_LABEL[relatorioVisualizacao.etapa]}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRelatorioVisualizacao(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-dark text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Info
                    label="Usuário"
                    value={triagem.nome}
                  />
                  <Info
                    label="Conclusão"
                    value={formatarData(relatorioVisualizacao.dataConclusao)}
                  />
                  <Info
                    label="Parecer"
                    value={relatorioVisualizacao.parecer || 'Não informado'}
                  />
                  <Info
                    label="Profissional"
                    value={relatorioVisualizacao.profissionalId || 'Não informado'}
                  />
                </div>

                <div className="rounded-2xl border border-border-dark bg-slate-900/30 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Relatório / observação profissional
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                    {relatorioVisualizacao.observacao || 'Nenhum texto de relatório foi registrado nesta etapa.'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
