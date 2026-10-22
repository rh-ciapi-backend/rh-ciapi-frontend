import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';

import { SaeAgendaApiError, saeAgendaService } from '../../services/saeAgendaService';
import type {
  SaeAgendaAfetado,
  SaeSolicitacaoAgenda,
  SaeSolicitacaoAgendaItem,
  SaeSolicitacaoAgendaStatus,
} from '../../types/saeAgenda';
import type { SaeProfissional } from '../../types/saeProfissional';

interface Props {
  profissional: SaeProfissional;
  podeEditar: boolean;
}

const STATUS_OPTIONS: Array<{ value: '' | SaeSolicitacaoAgendaStatus; label: string }> = [
  { value: '', label: 'Todas' },
  { value: 'PENDENTE', label: 'Pendentes' },
  { value: 'APROVADA', label: 'Aprovadas' },
  { value: 'RECUSADA', label: 'Recusadas' },
  { value: 'CANCELADA', label: 'Canceladas' },
];

const diaLabel = (dia?: number | null) =>
  ({ 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta' } as Record<number, string>)[Number(dia)] || '—';

const hora = (value?: string | null) => (value ? String(value).slice(0, 5) : '—');

const dataHora = (value?: string | null) =>
  value ? new Date(value).toLocaleString('pt-BR') : '—';

const itemResumo = (item: SaeSolicitacaoAgendaItem) => {
  if (item.acao === 'REMOVER') {
    return `Remover ${diaLabel(item.diaSemanaAnterior)} ${hora(item.horaInicioAnterior)}–${hora(item.horaFimAnterior)}`;
  }

  if (item.acao === 'ALTERAR') {
    return `Alterar para ${diaLabel(item.diaSemana)} ${hora(item.horaInicio)}–${hora(item.horaFim)}`;
  }

  return `Incluir ${diaLabel(item.diaSemana)} ${hora(item.horaInicio)}–${hora(item.horaFim)}`;
};

export default function SolicitacoesAgendaPanel({ profissional, podeEditar }: Props) {
  const [solicitacoes, setSolicitacoes] = useState<SaeSolicitacaoAgenda[]>([]);
  const [status, setStatus] = useState<'' | SaeSolicitacaoAgendaStatus>('');
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
        profissionalId: profissional.id,
        status,
      });
      setSolicitacoes(response.solicitacoes || []);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar as solicitações.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    setStatus('');
    setAnalise(null);
  }, [profissional.id]);

  useEffect(() => {
    carregar();
  }, [profissional.id, status]);

  useEffect(() => {
    if (!sucesso) return;
    const timer = window.setTimeout(() => setSucesso(null), 3200);
    return () => window.clearTimeout(timer);
  }, [sucesso]);

  const pendentes = useMemo(
    () => solicitacoes.filter((item) => item.status === 'PENDENTE').length,
    [solicitacoes],
  );

  const iniciarAnalise = (solicitacao: SaeSolicitacaoAgenda, decisao: 'APROVADA' | 'RECUSADA') => {
    if (!podeEditar) {
      setErro('Você não possui permissão para analisar solicitações de agenda.');
      return;
    }

    setAnalise({
      solicitacao,
      decisao,
      observacao: '',
      confirmarImpacto: false,
      afetados: [],
    });
  };

  const concluirAnalise = async () => {
    if (!analise) return;

    try {
      setProcessando(true);
      setErro(null);

      const response = await saeAgendaService.analisarSolicitacao(analise.solicitacao.id, {
        decisao: analise.decisao,
        observacaoAnalise: analise.observacao.trim() || undefined,
        confirmarImpacto: analise.confirmarImpacto || undefined,
      });

      setSolicitacoes((atuais) =>
        atuais.map((item) =>
          item.id === response.solicitacao.id ? response.solicitacao : item,
        ),
      );
      setSucesso(
        analise.decisao === 'APROVADA'
          ? 'Solicitação aprovada e agenda oficial atualizada.'
          : 'Solicitação recusada.',
      );
      setAnalise(null);
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
          setErro('A aprovação afeta pacientes já agendados. Revise a lista e confirme novamente.');
          return;
        }
      }

      setErro(error instanceof Error ? error.message : 'Não foi possível analisar a solicitação.');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-white">Solicitações de alteração</h3>
          <p className="mt-1 text-xs text-slate-500">
            Pedidos enviados pelo profissional. A agenda oficial só muda após aprovação da secretaria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as '' | SaeSolicitacaoAgendaStatus)}
            className="h-10 rounded-xl border border-border-dark bg-slate-900/40 px-3 text-xs text-slate-200 outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'todas'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={carregar}
            disabled={carregando}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-dark bg-slate-900/40 px-3 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={15} className={carregando ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border-dark bg-slate-900/25 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Pendentes</p>
          <p className="mt-2 text-2xl font-bold text-white">{pendentes}</p>
        </div>
        <div className="rounded-xl border border-border-dark bg-slate-900/25 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Exibidas</p>
          <p className="mt-2 text-2xl font-bold text-white">{solicitacoes.length}</p>
        </div>
      </div>

      {erro && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {sucesso && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          <span>{sucesso}</span>
        </div>
      )}

      {carregando ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-border-dark bg-slate-900/20">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : solicitacoes.length === 0 ? (
        <div className="rounded-xl border border-border-dark bg-slate-900/20 px-5 py-10 text-center text-sm text-slate-500">
          Nenhuma solicitação encontrada para este profissional.
        </div>
      ) : (
        <div className="space-y-3">
          {solicitacoes.map((solicitacao) => (
            <article key={solicitacao.id} className="rounded-[18px] border border-border-dark bg-slate-900/20 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={solicitacao.status} />
                    <span className="text-xs font-bold text-slate-300">{solicitacao.tipoSolicitacao}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">
                    {solicitacao.justificativa || 'Sem justificativa informada'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Solicitada em {dataHora(solicitacao.createdAt)}
                  </p>
                </div>

                {solicitacao.status === 'PENDENTE' && podeEditar && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => iniciarAnalise(solicitacao, 'RECUSADA')}
                      className="inline-flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300"
                    >
                      <XCircle size={14} /> Recusar
                    </button>
                    <button
                      type="button"
                      onClick={() => iniciarAnalise(solicitacao, 'APROVADA')}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white"
                    >
                      <CheckCircle2 size={14} /> Aprovar
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2 border-t border-border-dark pt-4">
                {solicitacao.itens.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock3 size={13} className="text-primary" />
                    <span>{itemResumo(item)}</span>
                  </div>
                ))}
              </div>

              {solicitacao.observacaoAnalise && (
                <div className="mt-4 rounded-xl border border-border-dark bg-slate-950/30 p-3 text-xs text-slate-400">
                  <span className="font-bold text-slate-300">Análise:</span> {solicitacao.observacaoAnalise}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {analise && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !processando && setAnalise(null)} />
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[22px] border border-border-dark bg-card-dark shadow-2xl">
            <div className="border-b border-border-dark p-5">
              <h4 className="font-bold text-white">
                {analise.decisao === 'APROVADA' ? 'Aprovar solicitação' : 'Recusar solicitação'}
              </h4>
              <p className="mt-1 text-sm text-slate-500">Registre uma observação para manter o histórico da decisão.</p>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-5">
              {analise.afetados.length > 0 && (
                <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <p className="text-sm font-bold text-amber-300">
                    Esta aprovação afeta {analise.afetados.length} paciente(s) já agendado(s).
                  </p>
                  <div className="mt-3 space-y-2">
                    {analise.afetados.map((item) => (
                      <div key={item.agendamentoServicoId} className="rounded-lg border border-border-dark bg-slate-950/30 p-3 text-xs text-slate-300">
                        <div className="font-semibold text-white">{item.nome || item.nomeAvulso || 'Paciente não informado'}</div>
                        <div className="mt-1 text-slate-500">
                          {item.data || 'Sem data'} • {hora(item.horaInicio)} • Prontuário {item.prontuario || item.prontuarioInformado || '—'}
                          {item.telefone ? ` • ${item.telefone}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-amber-200/80">
                    A secretaria pode confirmar a mudança e realizar as remarcações posteriormente.
                  </p>
                </div>
              )}

              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Observação da análise
              </label>
              <textarea
                value={analise.observacao}
                onChange={(event) => setAnalise((atual) => atual ? { ...atual, observacao: event.target.value } : atual)}
                rows={4}
                placeholder="Ex: profissional informou mudança de disponibilidade; pacientes afetados serão contatados."
                className="w-full resize-none rounded-xl border border-border-dark bg-slate-900/50 p-3 text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-border-dark p-5">
              <button
                type="button"
                onClick={() => setAnalise(null)}
                disabled={processando}
                className="rounded-xl border border-border-dark px-4 py-2.5 text-sm font-semibold text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={concluirAnalise}
                disabled={processando}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
                  analise.decisao === 'APROVADA'
                    ? 'bg-primary text-white'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {processando && <Loader2 size={16} className="animate-spin" />}
                {analise.decisao === 'APROVADA' && analise.afetados.length > 0
                  ? 'Confirmar aprovação mesmo assim'
                  : analise.decisao === 'APROVADA'
                    ? 'Aprovar'
                    : 'Recusar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ value }: { value: SaeSolicitacaoAgendaStatus }) {
  const styles: Record<SaeSolicitacaoAgendaStatus, string> = {
    PENDENTE: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    APROVADA: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    RECUSADA: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
    CANCELADA: 'border-slate-500/20 bg-slate-500/10 text-slate-400',
  };

  return <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${styles[value]}`}>{value}</span>;
}
