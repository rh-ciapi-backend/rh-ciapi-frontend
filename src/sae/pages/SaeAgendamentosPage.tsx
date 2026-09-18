import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  FilterX,
  Loader2,
  Plus,
  XCircle,
  Search,
  Stethoscope,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';

import { saeAgendamentosService } from '../services/saeAgendamentosService';
import GerenciarProfissionaisModal from '../components/agendamentos/GerenciarProfissionaisModal';
import NovoAgendamentoModal from '../components/agendamentos/NovoAgendamentoModal';

import type {
  SaeAgendamentoFiltros,
  SaeAgendamentoResumo,
  SaeTipoAtendimento,
  SaeTipoUsuario,
} from '../types/saeAgendamento';

const FILTROS_INICIAIS: SaeAgendamentoFiltros = {
  busca: '',
  data: '',
  tipoUsuario: 'TODOS',
  tipoAtendimento: 'TODOS',
  servicoId: 'TODOS',
  turno: 'TODOS',
  status: 'TODOS',
};

const tiposUsuario: SaeTipoUsuario[] = [
  'MATRICULADO',
  'TRIAGEM',
  'SERVIDOR',
  'EXTERNO',
];

const tiposAtendimento: SaeTipoAtendimento[] = [
  'AVALIAÇÃO',
  'REAVALIAÇÃO',
  'RETORNO',
  'ROTINA',
];

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const formatarData = (value?: string | null) => {
  if (!value) {
    return 'Sem data';
  }

  const [ano, mes, dia] = value.split('-');

  if (!ano || !mes || !dia) {
    return value;
  }

  return `${dia}/${mes}/${ano}`;
};

const formatarHora = (value?: string | null) => {
  if (!value) {
    return null;
  }

  return value.slice(0, 5);
};

export default function SaeAgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<SaeAgendamentoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [profissionaisAberto, setProfissionaisAberto] = useState(false);
  const [novoAgendamentoAberto, setNovoAgendamentoAberto] = useState(false);
  const [cancelando, setCancelando] = useState<SaeAgendamentoResumo | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [cancelamentoEmAndamento, setCancelamentoEmAndamento] = useState(false);
  const [erroCancelamento, setErroCancelamento] = useState<string | null>(null);
  const [filtros, setFiltros] =
    useState<SaeAgendamentoFiltros>(FILTROS_INICIAIS);

  const carregarAgendamentos = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await saeAgendamentosService.listar();
      setAgendamentos(dados);
    } catch (error) {
      console.error('Erro ao carregar agendamentos do SAE:', error);

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os agendamentos.',
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const servicosDisponiveis = useMemo(() => {
    const mapa = new Map<string, string>();

    for (const agendamento of agendamentos) {
      for (const servico of agendamento.servicos) {
        if (servico.servicoId) {
          mapa.set(
            servico.servicoId,
            servico.servicoSigla
              ? `${servico.servicoNome} (${servico.servicoSigla})`
              : servico.servicoNome,
          );
        }
      }
    }

    return Array.from(mapa.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [agendamentos]);

  const statusDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        agendamentos
          .map((agendamento) => agendamento.status)
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [agendamentos]);

  const agendamentosFiltrados = useMemo(() => {
    const busca = normalize(filtros.busca);

    return agendamentos.filter((agendamento) => {
      const atendeBusca =
        !busca ||
        normalize(agendamento.nomeUsuario).includes(busca) ||
        normalize(agendamento.prontuario).includes(busca);

      const atendeData =
        !filtros.data || agendamento.data === filtros.data;

      const atendeTipoUsuario =
        filtros.tipoUsuario === 'TODOS' ||
        agendamento.tipoUsuario === filtros.tipoUsuario;

      const atendeTipoAtendimento =
        filtros.tipoAtendimento === 'TODOS' ||
        agendamento.tipoAtendimento === filtros.tipoAtendimento;

      const atendeServico =
        filtros.servicoId === 'TODOS' ||
        agendamento.servicos.some(
          (servico) => servico.servicoId === filtros.servicoId,
        );

      const atendeTurno =
        filtros.turno === 'TODOS' ||
        agendamento.servicos.some(
          (servico) => servico.turno === filtros.turno,
        );

      const atendeStatus =
        filtros.status === 'TODOS' ||
        agendamento.status === filtros.status;

      return (
        atendeBusca &&
        atendeData &&
        atendeTipoUsuario &&
        atendeTipoAtendimento &&
        atendeServico &&
        atendeTurno &&
        atendeStatus
      );
    });
  }, [agendamentos, filtros]);

  const totais = useMemo(() => {
    const contar = (tipo: SaeTipoUsuario) =>
      agendamentos.filter(
        (agendamento) => agendamento.tipoUsuario === tipo,
      ).length;

    return {
      total: agendamentos.length,
      matriculados: contar('MATRICULADO'),
      triagem: contar('TRIAGEM'),
      servidores: contar('SERVIDOR'),
      externos: contar('EXTERNO'),
    };
  }, [agendamentos]);

  const atualizarFiltro = <K extends keyof SaeAgendamentoFiltros>(
    campo: K,
    valor: SaeAgendamentoFiltros[K],
  ) => {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
  };

  const abrirCancelamento = (agendamento: SaeAgendamentoResumo) => {
    setCancelando(agendamento);
    setMotivoCancelamento('');
    setErroCancelamento(null);
  };

  const confirmarCancelamento = async () => {
    if (!cancelando) return;

    if (!motivoCancelamento.trim()) {
      setErroCancelamento('Informe o motivo do cancelamento.');
      return;
    }

    try {
      setCancelamentoEmAndamento(true);
      setErroCancelamento(null);

      await saeAgendamentosService.cancelar(
        cancelando.id,
        motivoCancelamento.trim(),
      );

      setCancelando(null);
      setMotivoCancelamento('');
      await carregarAgendamentos();
    } catch (error) {
      setErroCancelamento(
        error instanceof Error
          ? error.message
          : 'Não foi possível cancelar o agendamento.',
      );
    } finally {
      setCancelamentoEmAndamento(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-6"
    >
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Gestão de Agendamentos
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
            Agendamentos
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Consulte o histórico de marcações do SAE, incluindo usuários,
            serviços, turnos, profissionais e horários disponíveis na fonte.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => setProfissionaisAberto(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-dark bg-card-dark px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-primary/30 hover:bg-slate-800/60 hover:text-white">
            <UserCog size={18} className="text-primary" /> Profissionais
          </button>
          <button type="button" onClick={() => setNovoAgendamentoAberto(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-hover">
            <Plus size={18} /> Novo agendamento
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total Histórico"
          value={totais.total}
          helper="Agendamentos disponíveis"
          icon={CalendarDays}
        />
        <KpiCard
          label="Matriculados"
          value={totais.matriculados}
          helper="Usuários vinculados"
          icon={Users}
        />
        <KpiCard
          label="Triagem"
          value={totais.triagem}
          helper="Registros de triagem"
          icon={Stethoscope}
        />
        <KpiCard
          label="Servidores"
          value={totais.servidores}
          helper="Atendimentos de servidores"
          icon={UserRound}
        />
        <KpiCard
          label="Externos"
          value={totais.externos}
          helper="Atendimentos externos"
          icon={UserRound}
        />
      </div>

      <section className="rounded-[20px] border border-border-dark bg-card-dark p-4 sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(260px,1.5fr)_180px_190px_190px]">
          <FilterField label="Buscar">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={filtros.busca}
                onChange={(event) =>
                  atualizarFiltro('busca', event.target.value)
                }
                placeholder="Nome ou prontuário..."
                className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </FilterField>

          <FilterField label="Data">
            <input
              type="date"
              value={filtros.data}
              onChange={(event) =>
                atualizarFiltro('data', event.target.value)
              }
              className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-slate-200 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </FilterField>

          <FilterField label="Tipo de usuário">
            <select
              value={filtros.tipoUsuario}
              onChange={(event) =>
                atualizarFiltro(
                  'tipoUsuario',
                  event.target.value as SaeAgendamentoFiltros['tipoUsuario'],
                )
              }
              className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-slate-200 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">Todos</option>
              {tiposUsuario.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Atendimento">
            <select
              value={filtros.tipoAtendimento}
              onChange={(event) =>
                atualizarFiltro(
                  'tipoAtendimento',
                  event.target
                    .value as SaeAgendamentoFiltros['tipoAtendimento'],
                )
              }
              className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-slate-200 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">Todos</option>
              {tiposAtendimento.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </FilterField>
        </div>

        <div className="mt-4 grid gap-4 border-t border-border-dark pt-4 md:grid-cols-3 xl:grid-cols-[minmax(260px,1fr)_180px_180px_auto]">
          <FilterField label="Serviço">
            <select
              value={filtros.servicoId}
              onChange={(event) =>
                atualizarFiltro('servicoId', event.target.value)
              }
              className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-slate-200 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">Todos os serviços</option>
              {servicosDisponiveis.map((servico) => (
                <option key={servico.id} value={servico.id}>
                  {servico.nome}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Turno">
            <select
              value={filtros.turno}
              onChange={(event) =>
                atualizarFiltro(
                  'turno',
                  event.target.value as SaeAgendamentoFiltros['turno'],
                )
              }
              className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-slate-200 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">Todos</option>
              <option value="MANHÃ">Manhã</option>
              <option value="TARDE">Tarde</option>
            </select>
          </FilterField>

          <FilterField label="Status">
            <select
              value={filtros.status}
              onChange={(event) =>
                atualizarFiltro('status', event.target.value)
              }
              className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-slate-200 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">Todos</option>
              {statusDisponiveis.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </FilterField>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setFiltros(FILTROS_INICIAIS)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-dark bg-slate-800/50 px-4 text-sm font-semibold text-slate-300 transition hover:border-primary/30 hover:text-white md:w-auto"
            >
              <FilterX size={16} />
              Limpar filtros
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[20px] border border-border-dark bg-card-dark">
        <div className="flex flex-col gap-2 border-b border-border-dark px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">
              Histórico de agendamentos
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {agendamentosFiltrados.length} registro(s) encontrado(s)
            </p>
          </div>
          <span className="text-xs text-slate-600">
            Consulta em modo leitura
          </span>
        </div>

        {carregando ? (
          <LoadingState />
        ) : erro ? (
          <ErrorState mensagem={erro} onRetry={carregarAgendamentos} />
        ) : agendamentosFiltrados.length > 0 ? (
          <>
            <div className="hidden xl:block">
              <div className="grid grid-cols-[110px_minmax(220px,1.3fr)_130px_140px_minmax(280px,1.8fr)_100px_110px_110px] gap-4 border-b border-border-dark bg-slate-800/30 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <span>Data</span>
                <span>Usuário</span>
                <span>Tipo</span>
                <span>Atendimento</span>
                <span>Serviços / Profissional</span>
                <span>Turno</span>
                <span>Status</span>
                <span>Ações</span>
              </div>

              {agendamentosFiltrados.map((agendamento) => (
                <AgendamentoRow
                  key={agendamento.id}
                  agendamento={agendamento}
                  onCancelar={abrirCancelamento}
                />
              ))}
            </div>

            <div className="divide-y divide-border-dark xl:hidden">
              {agendamentosFiltrados.map((agendamento) => (
                <AgendamentoCard
                  key={agendamento.id}
                  agendamento={agendamento}
                  onCancelar={abrirCancelamento}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </section>

      <GerenciarProfissionaisModal
        aberto={profissionaisAberto}
        onClose={() => setProfissionaisAberto(false)}
      />

      <NovoAgendamentoModal
        aberto={novoAgendamentoAberto}
        onClose={() => setNovoAgendamentoAberto(false)}
        onCriado={carregarAgendamentos}
      />

      {cancelando && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => !cancelamentoEmAndamento && setCancelando(null)}
          />

          <div className="relative w-full max-w-xl rounded-[22px] border border-border-dark bg-card-dark p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-300">
                  Cancelamento
                </p>
                <h3 className="mt-1 text-lg font-bold text-white">
                  Cancelar agendamento
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  {cancelando.nomeUsuario} • {formatarData(cancelando.data)}
                </p>
              </div>
              <XCircle size={22} className="text-rose-300" />
            </div>

            <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
              O registro permanecerá no histórico e o horário voltará a ficar disponível.
            </div>

            {erroCancelamento && (
              <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                {erroCancelamento}
              </div>
            )}

            <div className="mt-5">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Motivo do cancelamento
              </label>
              <textarea
                value={motivoCancelamento}
                onChange={(event) => setMotivoCancelamento(event.target.value)}
                rows={4}
                placeholder="Ex.: agendamento realizado por engano."
                className="w-full resize-none rounded-xl border border-border-dark bg-slate-900/50 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-primary/50"
              />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-border-dark pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCancelando(null)}
                disabled={cancelamentoEmAndamento}
                className="rounded-xl border border-border-dark px-4 py-2.5 text-sm font-semibold text-slate-300 disabled:opacity-50"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={confirmarCancelamento}
                disabled={cancelamentoEmAndamento}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-400 disabled:opacity-50"
              >
                {cancelamentoEmAndamento ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                Confirmar cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: number;
  helper: string;
  icon: React.ElementType;
}) {
  return (
    <article className="rounded-[20px] border border-border-dark bg-card-dark p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold text-white">{value}</p>
          <p className="mt-2 text-xs text-slate-500">{helper}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Icon size={18} />
        </div>
      </div>
    </article>
  );
}

function AgendamentoRow({
  agendamento,
  onCancelar,
}: {
  agendamento: SaeAgendamentoResumo;
  onCancelar: (agendamento: SaeAgendamentoResumo) => void;
}) {
  const turnos = Array.from(
    new Set(agendamento.servicos.map((item) => item.turno).filter(Boolean)),
  );

  return (
    <div className="grid grid-cols-[110px_minmax(220px,1.3fr)_130px_140px_minmax(280px,1.8fr)_100px_110px_110px] items-start gap-4 border-b border-border-dark px-5 py-4 text-sm last:border-b-0 hover:bg-slate-800/20">
      <div className="font-semibold text-slate-300">
        {formatarData(agendamento.data)}
      </div>

      <div className="min-w-0">
        <p className="truncate font-semibold text-white">
          {agendamento.nomeUsuario}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          Prontuário {agendamento.prontuario || '—'}
        </p>
      </div>

      <Badge value={agendamento.tipoUsuario || '—'} />

      <span className="text-slate-400">
        {agendamento.tipoAtendimento || '—'}
      </span>

      <div className="space-y-2">
        {agendamento.servicos.length > 0 ? (
          agendamento.servicos.map((servico) => {
            const inicio = formatarHora(servico.horaInicio);
            const fim = formatarHora(servico.horaFim);
            const horario = inicio
              ? fim
                ? `${inicio}–${fim}`
                : inicio
              : null;

            return (
              <div key={servico.id} className="min-w-0">
                <p className="font-medium text-slate-200">
                  {servico.servicoNome}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {servico.profissionalNome || 'Profissional não informado'}
                  {horario ? ` • ${horario}` : ''}
                </p>
              </div>
            );
          })
        ) : (
          <span className="text-slate-500">Sem serviço vinculado</span>
        )}
      </div>

      <span className="text-slate-400">
        {turnos.length > 0 ? turnos.join(' / ') : '—'}
      </span>

      <Badge value={agendamento.status || '—'} />

      <div>
        {String(agendamento.status || '').toUpperCase() === 'AGENDADO' ? (
          <button
            type="button"
            onClick={() => onCancelar(agendamento)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-bold text-rose-300 transition hover:bg-rose-500/15"
          >
            <XCircle size={13} />
            Cancelar
          </button>
        ) : (
          <span className="text-[10px] text-slate-600">—</span>
        )}
      </div>
    </div>
  );
}

function AgendamentoCard({
  agendamento,
  onCancelar,
}: {
  agendamento: SaeAgendamentoResumo;
  onCancelar: (agendamento: SaeAgendamentoResumo) => void;
}) {
  return (
    <article className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">
            {agendamento.nomeUsuario}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Prontuário {agendamento.prontuario || '—'}
          </p>
        </div>
        <Badge value={agendamento.status || '—'} />
      </div>

      <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-slate-600" />
          {formatarData(agendamento.data)}
        </div>
        <div className="flex items-center gap-2">
          <UserRound size={14} className="text-slate-600" />
          {agendamento.tipoUsuario || '—'}
        </div>
        <div className="flex items-center gap-2">
          <Stethoscope size={14} className="text-slate-600" />
          {agendamento.tipoAtendimento || '—'}
        </div>
      </div>

      {String(agendamento.status || '').toUpperCase() === 'AGENDADO' && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => onCancelar(agendamento)}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/15"
          >
            <XCircle size={14} />
            Cancelar agendamento
          </button>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-border-dark bg-slate-800/30 p-3">
        {agendamento.servicos.length > 0 ? (
          <div className="space-y-3">
            {agendamento.servicos.map((servico) => {
              const inicio = formatarHora(servico.horaInicio);
              const fim = formatarHora(servico.horaFim);

              return (
                <div key={servico.id}>
                  <p className="text-sm font-semibold text-slate-200">
                    {servico.servicoNome}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span>
                      {servico.profissionalNome || 'Profissional não informado'}
                    </span>
                    <span>{servico.turno || 'Turno não informado'}</span>
                    {(inicio || fim) && (
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={12} />
                        {inicio || '—'}
                        {fim ? `–${fim}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Sem serviço vinculado.</p>
        )}
      </div>
    </article>
  );
}

function Badge({ value }: { value: string }) {
  return (
    <span className="inline-flex w-fit rounded-full border border-border-dark bg-slate-800/60 px-2.5 py-1 text-[10px] font-bold text-slate-300">
      {value}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="text-center">
        <Loader2 size={28} className="mx-auto animate-spin text-primary" />
        <p className="mt-3 text-sm text-slate-400">
          Carregando agendamentos...
        </p>
      </div>
    </div>
  );
}

function ErrorState({
  mensagem,
  onRetry,
}: {
  mensagem: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[320px] items-center justify-center px-6 py-12 text-center">
      <div className="max-w-md">
        <AlertCircle size={28} className="mx-auto text-rose-400" />
        <h3 className="mt-4 font-bold text-white">
          Não foi possível carregar os agendamentos
        </h3>
        <p className="mt-2 text-sm text-slate-500">{mensagem}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-600"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center px-6 py-12 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
          <CalendarDays size={22} />
        </div>
        <h3 className="mt-4 text-base font-bold text-white">
          Nenhum agendamento encontrado
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Não existem registros correspondentes aos filtros selecionados.
        </p>
      </div>
    </div>
  );
}
