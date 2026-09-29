import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Activity,
  BriefcaseMedical,
  FilterX,
  HeartPulse,
  Loader2,
  Plus,
  Search,
  Stethoscope,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';

import NovaTriagemModal from '../components/triagem/NovaTriagemModal';
import TriagemDetalheModal from '../components/triagem/TriagemDetalheModal';
import { saeTriagemService } from '../services/saeTriagemService';

import type {
  SaeTriagem,
  SaeTriagemEtapaAtual,
  SaeTriagemStatus,
} from '../types/saeTriagem';
import type { SaeAgendamentoFoco } from '../types/saeNavegacao';

interface Props {
  onIrAgendamentos?: (foco?: SaeAgendamentoFoco) => void;
  onAbrirUsuario?: (usuarioId: string) => void;
}

const ETAPA_LABEL: Record<string, string> = {
  SERVICO_SOCIAL: 'Serviço Social',
  ENFERMAGEM: 'Enfermagem',
  PSICOLOGIA: 'Psicologia',
  MEDICO: 'Médico',
  TERAPIA_OCUPACIONAL: 'Terapia Ocupacional',
  CONCLUIDA: 'Concluída',
};

const STATUS_LABEL: Record<string, string> = {
  EM_TRIAGEM: 'Em triagem',
  AGUARDANDO_DECISAO: 'Aguardando decisão',
  APTO: 'Apto',
  NAO_APTO: 'Não apto',
  DESISTENTE: 'Desistente',
  MATRICULADO: 'Matriculado',
};

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export default function SaeTriagemPage({
  onIrAgendamentos,
  onAbrirUsuario,
}: Props) {
  const [triagens, setTriagens] = useState<SaeTriagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [novaAberta, setNovaAberta] = useState(false);
  const [selecionada, setSelecionada] =
    useState<SaeTriagem | null>(null);

  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('TODOS');
  const [etapa, setEtapa] = useState('TODAS');

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const response = await saeTriagemService.listar();
      setTriagens(response.triagens || []);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar as triagens.',
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const filtradas = useMemo(() => {
    const termo = normalize(busca);

    return triagens.filter((item) => {
      const atendeBusca =
        !termo ||
        normalize(item.nome).includes(termo) ||
        normalize(item.telefone).includes(termo);

      const atendeStatus =
        status === 'TODOS' || item.status === status;

      const atendeEtapa =
        etapa === 'TODAS' || item.etapaAtual === etapa;

      return atendeBusca && atendeStatus && atendeEtapa;
    });
  }, [triagens, busca, status, etapa]);

  const totais = useMemo(() => {
    const emTriagem = triagens.filter(
      (item) => item.status === 'EM_TRIAGEM',
    );

    return {
      total: triagens.length,
      social: emTriagem.filter(
        (item) => item.etapaAtual === 'SERVICO_SOCIAL',
      ).length,
      enfermagem: emTriagem.filter(
        (item) => item.etapaAtual === 'ENFERMAGEM',
      ).length,
      psicologia: emTriagem.filter(
        (item) => item.etapaAtual === 'PSICOLOGIA',
      ).length,
      medico: emTriagem.filter(
        (item) => item.etapaAtual === 'MEDICO',
      ).length,
      terapiaOcupacional: emTriagem.filter(
        (item) => item.etapaAtual === 'TERAPIA_OCUPACIONAL',
      ).length,
      decisao: triagens.filter(
        (item) => item.status === 'AGUARDANDO_DECISAO',
      ).length,
    };
  }, [triagens]);

  const atualizarTriagem = (atualizada: SaeTriagem) => {
    setTriagens((atuais) =>
      atuais.map((item) =>
        item.id === atualizada.id ? atualizada : item,
      ),
    );

    setSelecionada(atualizada);
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
            Gestão de Triagem
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
            Triagem
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Acompanhe o ingresso no SAE pelo fluxo multidisciplinar de
            Serviço Social, Enfermagem, Psicologia, Médico e
            Terapia Ocupacional.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setNovaAberta(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-hover"
        >
          <Plus size={18} />
          Nova triagem
        </button>
      </div>

      <div className="rounded-[18px] border border-primary/15 bg-primary/[0.05] p-4">
        <div className="flex items-start gap-3">
          <HeartPulse
            size={18}
            className="mt-0.5 shrink-0 text-primary"
          />

          <div>
            <p className="text-sm font-bold text-white">
              Fluxo multidisciplinar configurado
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Serviço Social → Enfermagem → Psicologia → Médico →
              Terapia Ocupacional. Ao concluir as cinco avaliações, o
              sistema libera a emissão do protocolo e a criação da
              matrícula definitiva do idoso como usuário do SAE.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        <Kpi
          label="Triagens"
          value={totais.total}
          helper="Processos cadastrados"
          icon={Users}
        />

        <Kpi
          label="Serviço Social"
          value={totais.social}
          helper="Etapa atual"
          icon={ClipboardCheck}
        />

        <Kpi
          label="Enfermagem"
          value={totais.enfermagem}
          helper="Etapa atual"
          icon={Activity}
        />

        <Kpi
          label="Psicologia"
          value={totais.psicologia}
          helper="Etapa atual"
          icon={HeartPulse}
        />

        <Kpi
          label="Médico"
          value={totais.medico}
          helper="Etapa atual"
          icon={Stethoscope}
        />

        <Kpi
          label="Terapia Ocupacional"
          value={totais.terapiaOcupacional}
          helper="Etapa atual"
          icon={BriefcaseMedical}
        />

        <Kpi
          label="Decisão"
          value={totais.decisao}
          helper="Aguardando resultado"
          icon={CheckCircle2}
        />
      </div>

      <section className="rounded-[20px] border border-border-dark bg-card-dark p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_220px_220px_auto]">
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Buscar
            </label>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={busca}
                onChange={(event) =>
                  setBusca(event.target.value)
                }
                placeholder="Nome ou telefone..."
                className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-primary/50"
              />
            </div>
          </div>

          <Filter label="Situação">
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-slate-200 outline-none"
            >
              <option value="TODOS">Todas</option>
              <option value="EM_TRIAGEM">Em triagem</option>
              <option value="AGUARDANDO_DECISAO">
                Aguardando decisão
              </option>
              <option value="APTO">Apto</option>
              <option value="NAO_APTO">Não apto</option>
              <option value="DESISTENTE">Desistente</option>
              <option value="MATRICULADO">Matriculado</option>
            </select>
          </Filter>

          <Filter label="Etapa atual">
            <select
              value={etapa}
              onChange={(event) =>
                setEtapa(event.target.value)
              }
              className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-slate-200 outline-none"
            >
              <option value="TODAS">Todas</option>
              <option value="SERVICO_SOCIAL">
                Serviço Social
              </option>
              <option value="ENFERMAGEM">Enfermagem</option>
              <option value="PSICOLOGIA">Psicologia</option>
              <option value="MEDICO">Médico</option>
              <option value="TERAPIA_OCUPACIONAL">
                Terapia Ocupacional
              </option>
              <option value="CONCLUIDA">Concluída</option>
            </select>
          </Filter>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setBusca('');
                setStatus('TODOS');
                setEtapa('TODAS');
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-dark bg-slate-800/50 px-4 text-sm font-semibold text-slate-300 hover:text-white"
            >
              <FilterX size={16} />
              Limpar
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[20px] border border-border-dark bg-card-dark">
        <div className="flex items-center justify-between border-b border-border-dark px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-white">
              Pessoas em acompanhamento
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {filtradas.length} registro(s)
            </p>
          </div>
        </div>

        {carregando ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2
              size={28}
              className="animate-spin text-primary"
            />
          </div>
        ) : erro ? (
          <div className="flex min-h-[320px] items-center justify-center px-6 text-center">
            <div>
              <AlertCircle
                size={28}
                className="mx-auto text-rose-400"
              />
              <p className="mt-4 text-sm text-slate-400">
                {erro}
              </p>
              <button
                type="button"
                onClick={carregar}
                className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="flex min-h-[320px] items-center justify-center px-6 text-center">
            <div>
              <ClipboardCheck
                size={30}
                className="mx-auto text-slate-600"
              />
              <h3 className="mt-4 font-bold text-white">
                Nenhuma triagem encontrada
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Inicie uma nova triagem ou ajuste os filtros.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden lg:block">
              <div className="grid grid-cols-[minmax(220px,1.3fr)_160px_170px_minmax(330px,1.7fr)_110px] gap-4 border-b border-border-dark bg-slate-800/30 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <span>Usuário</span>
                <span>Situação</span>
                <span>Etapa atual</span>
                <span>Progresso</span>
                <span></span>
              </div>

              {filtradas.map((triagem) => (
                <div
                  key={triagem.id}
                  className="grid grid-cols-[minmax(220px,1.3fr)_160px_170px_minmax(330px,1.7fr)_110px] items-center gap-4 border-b border-border-dark px-5 py-4 last:border-b-0 hover:bg-slate-800/20"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {triagem.nome}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {triagem.telefone || 'Telefone não informado'}
                    </p>
                  </div>

                  <Badge value={STATUS_LABEL[triagem.status] || triagem.status} />

                  <span className="text-sm text-slate-400">
                    {ETAPA_LABEL[triagem.etapaAtual] ||
                      triagem.etapaAtual}
                  </span>

                  <Progress triagem={triagem} />

                  <button
                    type="button"
                    onClick={() => setSelecionada(triagem)}
                    className="rounded-lg border border-border-dark px-3 py-2 text-xs font-bold text-slate-300 hover:border-primary/30 hover:text-white"
                  >
                    Abrir
                  </button>
                </div>
              ))}
            </div>

            <div className="divide-y divide-border-dark lg:hidden">
              {filtradas.map((triagem) => (
                <article
                  key={triagem.id}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {triagem.nome}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {ETAPA_LABEL[triagem.etapaAtual]}
                      </p>
                    </div>

                    <Badge
                      value={
                        STATUS_LABEL[triagem.status] ||
                        triagem.status
                      }
                    />
                  </div>

                  <div className="mt-4">
                    <Progress triagem={triagem} />
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelecionada(triagem)}
                    className="mt-4 w-full rounded-xl border border-border-dark px-3 py-2.5 text-sm font-bold text-slate-300"
                  >
                    Abrir triagem
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <NovaTriagemModal
        aberto={novaAberta}
        onClose={() => setNovaAberta(false)}
        onCriado={(triagem) => {
          setTriagens((atuais) => [triagem, ...atuais]);
          setSelecionada(triagem);
        }}
      />

      <TriagemDetalheModal
        aberto={Boolean(selecionada)}
        triagem={selecionada}
        onClose={() => setSelecionada(null)}
        onAtualizado={atualizarTriagem}
        onIrAgendamentos={onIrAgendamentos}
        onAbrirUsuario={onAbrirUsuario}
      />
    </motion.section>
  );
}

function Kpi({
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold text-white">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {helper}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Icon size={18} />
        </div>
      </div>
    </article>
  );
}

function Filter({
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

function Badge({ value }: { value: string }) {
  return (
    <span className="inline-flex w-fit rounded-full border border-border-dark bg-slate-800/60 px-2.5 py-1 text-[10px] font-bold text-slate-300">
      {value}
    </span>
  );
}

function Progress({ triagem }: { triagem: SaeTriagem }) {
  const ordem = [
    'SERVICO_SOCIAL',
    'ENFERMAGEM',
    'PSICOLOGIA',
    'MEDICO',
  ] as const;

  return (
    <div className="flex items-center gap-2">
      {ordem.map((nome, index) => {
        const etapa = triagem.etapas.find(
          (item) => item.etapa === nome,
        );
        const concluida = etapa?.status === 'CONCLUIDO';

        return (
          <React.Fragment key={nome}>
            <div
              className={[
                'flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-[9px] font-bold',
                concluida
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                  : triagem.etapaAtual === nome
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border-dark bg-slate-900/30 text-slate-600',
              ].join(' ')}
              title={ETAPA_LABEL[nome]}
            >
              {index + 1}
            </div>

            {index < ordem.length - 1 && (
              <div
                className={[
                  'h-px flex-1',
                  concluida
                    ? 'bg-emerald-500/30'
                    : 'bg-border-dark',
                ].join(' ')}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
