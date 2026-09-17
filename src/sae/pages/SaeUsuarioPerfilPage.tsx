import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Pencil,
  User,
  IdCard,
  CalendarDays,
  MapPin,
  Phone,
  ClipboardList,
  Stethoscope,
  Activity,
  FileHeart,
  Clock3,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';

import { saeUsuariosService } from '../services/saeUsuariosService';
import EditarUsuarioModal from '../components/usuarios/EditarUsuarioModal';

import type {
  SaeUsuarioPerfil,
  SaeUsuarioAgendamento,
  SaeUsuarioAtendimento,
  SaeUsuarioAvaliacaoServico,
  SaeUsuarioCicloAvaliacao,
  SaeUsuarioSinalVital,
} from '../types/saeUsuarioPerfil';

interface SaeUsuarioPerfilPageProps {
  usuarioId: string;
  onVoltar: () => void;
}

type AbaPerfil =
  | 'resumo'
  | 'agendamentos'
  | 'atendimentos'
  | 'avaliacoes'
  | 'sinais-vitais';

const statusUsuarioStyles = {
  ATIVO:
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  INATIVO:
    'border-slate-500/20 bg-slate-500/10 text-slate-400',
};

export default function SaeUsuarioPerfilPage({
  usuarioId,
  onVoltar,
}: SaeUsuarioPerfilPageProps) {
  const [perfil, setPerfil] = useState<SaeUsuarioPerfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<AbaPerfil>('resumo');
  const [editarAberto, setEditarAberto] = useState(false);

  useEffect(() => {
    carregarPerfil();
  }, [usuarioId]);

  const carregarPerfil = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await saeUsuariosService.obterPerfil(usuarioId);

      if (!dados) {
        setPerfil(null);
        setErro('Usuário não encontrado.');
        return;
      }

      setPerfil(dados);
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar o perfil do usuário.',
      );
    } finally {
      setCarregando(false);
    }
  };

  const ultimoAtendimento = useMemo(() => {
    if (!perfil?.atendimentos.length) {
      return null;
    }

    return perfil.atendimentos[0];
  }, [perfil]);

  const proximoAgendamento = useMemo(() => {
    if (!perfil?.agendamentos.length) {
      return null;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const futuros = perfil.agendamentos
      .filter((item) => {
        if (!item.data) return false;

        const data = new Date(`${item.data}T00:00:00`);

        return data.getTime() >= hoje.getTime();
      })
      .sort((a, b) =>
        String(a.data).localeCompare(String(b.data)),
      );

    return futuros[0] ?? null;
  }, [perfil]);

  if (carregando) {
    return <LoadingState />;
  }

  if (erro || !perfil) {
    return (
      <ErrorState
        mensagem={erro || 'Usuário não encontrado.'}
        onVoltar={onVoltar}
        onRetry={carregarPerfil}
      />
    );
  }

  const { usuario } = perfil;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <button
            type="button"
            onClick={onVoltar}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Voltar para usuários
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <User size={25} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {usuario.nome}
                </h1>

                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                    statusUsuarioStyles[usuario.situacao]
                  }`}
                >
                  {usuario.situacao}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                <span>
                  Prontuário {usuario.prontuario || '—'}
                </span>

                {usuario.idade != null && (
                  <span>{usuario.idade} anos</span>
                )}

                {usuario.turno && (
                  <span>Turno {usuario.turno}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEditarAberto(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-600"
        >
          <Pencil size={17} />
          Editar informações
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Agendamentos"
          value={perfil.agendamentos.length}
          helper={
            proximoAgendamento?.data
              ? `Próximo: ${formatarData(proximoAgendamento.data)}`
              : 'Nenhum futuro identificado'
          }
          icon={CalendarDays}
        />

        <KpiCard
          label="Atendimentos"
          value={perfil.atendimentos.length}
          helper={
            ultimoAtendimento?.dataAtendimento
              ? `Último: ${formatarData(
                  ultimoAtendimento.dataAtendimento,
                )}`
              : 'Sem atendimentos registrados'
          }
          icon={Stethoscope}
        />

        <KpiCard
          label="Avaliações"
          value={perfil.avaliacoes.length}
          helper={`${perfil.ciclosAvaliacao.length} ciclo(s)`}
          icon={ClipboardList}
        />

        <KpiCard
          label="Sinais vitais"
          value={perfil.sinaisVitais.length}
          helper="Registros de aferição"
          icon={Activity}
        />
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-1 rounded-xl border border-border-dark bg-card-dark p-1 sm:min-w-0">
          <TabButton
            active={aba === 'resumo'}
            onClick={() => setAba('resumo')}
          >
            Resumo
          </TabButton>

          <TabButton
            active={aba === 'agendamentos'}
            onClick={() => setAba('agendamentos')}
          >
            Agendamentos
          </TabButton>

          <TabButton
            active={aba === 'atendimentos'}
            onClick={() => setAba('atendimentos')}
          >
            Atendimentos
          </TabButton>

          <TabButton
            active={aba === 'avaliacoes'}
            onClick={() => setAba('avaliacoes')}
          >
            Avaliações
          </TabButton>

          <TabButton
            active={aba === 'sinais-vitais'}
            onClick={() => setAba('sinais-vitais')}
          >
            Sinais vitais
          </TabButton>
        </div>
      </div>

      {aba === 'resumo' && (
        <ResumoTab perfil={perfil} />
      )}

      {aba === 'agendamentos' && (
        <AgendamentosTab itens={perfil.agendamentos} />
      )}

      {aba === 'atendimentos' && (
        <AtendimentosTab itens={perfil.atendimentos} />
      )}

      {aba === 'avaliacoes' && (
        <AvaliacoesTab
          avaliacoes={perfil.avaliacoes}
          ciclos={perfil.ciclosAvaliacao}
        />
      )}

      {aba === 'sinais-vitais' && (
        <SinaisVitaisTab itens={perfil.sinaisVitais} />
      )}

      <EditarUsuarioModal
        aberto={editarAberto}
        usuarioId={usuario.id}
        onClose={() => setEditarAberto(false)}
        onSalvo={async () => {
          setEditarAberto(false);
          await carregarPerfil();
        }}
      />
    </motion.section>
  );
}

function ResumoTab({
  perfil,
}: {
  perfil: SaeUsuarioPerfil;
}) {
  const endereco = perfil.enderecoPrincipal;
  const dados = perfil.dadosCadastrais;
  const usuarioInativo = perfil.usuario.situacao === 'INATIVO';

  const possuiDeficienciaTexto =
    dados.possuiDeficiencia == null
      ? dados.deficienciaOriginal || '—'
      : dados.possuiDeficiencia
        ? 'SIM'
        : 'NÃO';

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-5">
        <SectionCard title="Dados pessoais" icon={IdCard}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Prontuário" value={perfil.usuario.prontuario} />
            <InfoItem label="Sexo" value={perfil.usuario.sexo} />
            <InfoItem label="Nascimento" value={formatarData(perfil.usuario.dataNascimento)} />
            <InfoItem label="Idade" value={perfil.usuario.idade != null ? `${perfil.usuario.idade} anos` : null} />
            <InfoItem label="Nacionalidade" value={perfil.usuario.nacionalidade} />
            <InfoItem label="Raça" value={dados.raca} />
            <InfoItem label="Turno" value={perfil.usuario.turno} />
            <InfoItem label="Data de ingresso" value={formatarData(dados.dataIngresso)} />
            <InfoItem label="Situação cadastral" value={perfil.usuario.situacao} />

            {usuarioInativo && (
              <>
                <InfoItem label="Data de desligamento" value={formatarData(dados.dataDesligamento)} />
                <InfoItem
                  label="Motivo do desligamento"
                  value={dados.motivoDesligamento || dados.motivoDesligamentoOriginal}
                />
              </>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Documentos e informações sociais" icon={FileHeart}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="RG" value={dados.rgOriginal} />
            <InfoItem label="CPF" value={formatarCpf(dados.cpfOriginal)} />
            <InfoItem label="Cartão SUS" value={dados.cartaoSusOriginal} />
            <InfoItem
              label="Escolaridade"
              value={dados.escolaridadeNormalizada || dados.escolaridadeOriginal}
            />
            <InfoItem
              label="Faixa de renda"
              value={dados.faixaRenda || dados.rendimentoOriginal}
            />
            <InfoItem label="Possui deficiência" value={possuiDeficienciaTexto} />

            {(dados.possuiDeficiencia || dados.tipoDeficiencia) && (
              <InfoItem
                label="Tipo de deficiência"
                value={dados.tipoDeficiencia || dados.deficienciaOriginal}
              />
            )}
          </div>

          {dados.observacao && (
            <div className="mt-5 rounded-xl border border-border-dark bg-slate-800/25 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                Observações
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {dados.observacao}
              </p>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Endereço" icon={MapPin}>
          {endereco ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem label="Logradouro" value={endereco.logradouro} />
                <InfoItem label="Número" value={endereco.numero} />
                <InfoItem label="Complemento" value={endereco.complemento} />
                <InfoItem label="Bairro" value={endereco.bairro} />
                <InfoItem label="Cidade" value={endereco.cidade} />
                <InfoItem label="UF" value={endereco.uf} />
                <InfoItem label="CEP" value={formatarCep(endereco.cep)} />
              </div>

              {endereco.enderecoOriginal && (
                <div className="mt-5 rounded-xl border border-border-dark bg-slate-800/25 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                    Endereço original
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {endereco.enderecoOriginal}
                  </p>
                </div>
              )}
            </>
          ) : (
            <EmptyText text="Nenhum endereço cadastrado." />
          )}
        </SectionCard>
      </div>

      <div className="space-y-5">
        <SectionCard title="Contatos" icon={Phone}>
          {perfil.contatos.length > 0 ? (
            <div className="space-y-3">
              {perfil.contatos.map((contato) => (
                <div
                  key={contato.id}
                  className="rounded-xl border border-border-dark bg-slate-800/30 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white">
                        {contato.telefoneOriginal ||
                          contato.telefoneNormalizado ||
                          'Sem telefone'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {contato.nomeContato || 'Contato sem nome'}
                        {contato.parentesco ? ` • ${contato.parentesco}` : ''}
                      </p>
                    </div>

                    {contato.principal && (
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                        PRINCIPAL
                      </span>
                    )}
                  </div>

                  {(contato.tipo || contato.observacao) && (
                    <div className="mt-3 text-xs text-slate-400">
                      {contato.tipo && <span>{contato.tipo}</span>}
                      {contato.tipo && contato.observacao && <span> • </span>}
                      {contato.observacao && <span>{contato.observacao}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyText text="Nenhum contato cadastrado." />
          )}
        </SectionCard>

        <SectionCard title="Resumo assistencial" icon={FileHeart}>
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Agendamentos" value={perfil.agendamentos.length} />
            <MiniMetric label="Atendimentos" value={perfil.atendimentos.length} />
            <MiniMetric label="Avaliações" value={perfil.avaliacoes.length} />
            <MiniMetric label="Ciclos" value={perfil.ciclosAvaliacao.length} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function AgendamentosTab({
  itens,
}: {
  itens: SaeUsuarioAgendamento[];
}) {
  if (!itens.length) {
    return (
      <EmptySection text="Nenhum agendamento registrado para este usuário." />
    );
  }

  return (
    <div className="space-y-4">
      {itens.map((agendamento) => (
        <article
          key={agendamento.id}
          className="rounded-[18px] border border-border-dark bg-card-dark p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays
                  size={17}
                  className="text-primary"
                />

                <h3 className="font-bold text-white">
                  {formatarData(agendamento.data)}
                </h3>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {agendamento.tipoAtendimento ||
                  agendamento.tipoUsuario ||
                  'Atendimento'}
              </p>
            </div>

            <StatusBadge
              value={agendamento.status}
            />
          </div>

          {agendamento.servicos.length > 0 && (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {agendamento.servicos.map((servico) => (
                <div
                  key={servico.id}
                  className="rounded-xl border border-border-dark bg-slate-800/30 p-4"
                >
                  <p className="font-semibold text-slate-200">
                    {servico.servicoNome ||
                      servico.servicoSigla ||
                      'Serviço'}
                  </p>

                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    {servico.profissionalNome && (
                      <p>
                        Profissional:{' '}
                        {servico.profissionalNome}
                      </p>
                    )}

                    {servico.turno && (
                      <p>Turno: {servico.turno}</p>
                    )}

                    {(servico.horaInicio ||
                      servico.horaFim) && (
                      <p>
                        Horário:{' '}
                        {formatarHorario(
                          servico.horaInicio,
                        )}
                        {servico.horaFim
                          ? ` – ${formatarHorario(
                              servico.horaFim,
                            )}`
                          : ''}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {agendamento.observacao && (
            <p className="mt-4 rounded-xl border border-border-dark bg-slate-800/20 p-3 text-sm leading-6 text-slate-400">
              {agendamento.observacao}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function AtendimentosTab({
  itens,
}: {
  itens: SaeUsuarioAtendimento[];
}) {
  if (!itens.length) {
    return (
      <EmptySection text="Nenhum atendimento registrado para este usuário." />
    );
  }

  return (
    <div className="space-y-4">
      {itens.map((item) => (
        <article
          key={item.id}
          className="rounded-[18px] border border-border-dark bg-card-dark p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                {item.servicoNome ||
                  item.servicoSigla ||
                  'Atendimento'}
              </p>

              <h3 className="mt-1 font-bold text-white">
                {formatarData(item.dataAtendimento)}
              </h3>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                {item.profissionalNome && (
                  <span>
                    {item.profissionalNome}
                  </span>
                )}

                {item.tipoAtendimento && (
                  <span>{item.tipoAtendimento}</span>
                )}

                {item.horaInicio && (
                  <span>
                    {formatarHorario(item.horaInicio)}
                  </span>
                )}
              </div>
            </div>

            <StatusBadge value={item.status} />
          </div>

          {item.procedimento && (
            <TextBlock
              label="Procedimento"
              value={item.procedimento}
            />
          )}

          {item.evolucao && (
            <TextBlock
              label="Evolução"
              value={item.evolucao}
            />
          )}

          {item.observacao && (
            <TextBlock
              label="Observação"
              value={item.observacao}
            />
          )}
        </article>
      ))}
    </div>
  );
}

function AvaliacoesTab({
  avaliacoes,
  ciclos,
}: {
  avaliacoes: SaeUsuarioAvaliacaoServico[];
  ciclos: SaeUsuarioCicloAvaliacao[];
}) {
  return (
    <div className="space-y-5">
      <SectionCard
        title="Avaliações por serviço"
        icon={ClipboardList}
      >
        {avaliacoes.length > 0 ? (
          <div className="space-y-3">
            {avaliacoes.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border-dark bg-slate-800/25 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      {item.servicoNome ||
                        item.servicoSigla ||
                        'Serviço'}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Ano de referência:{' '}
                      {item.anoReferencia}
                      {item.dataAvaliacao
                        ? ` • ${formatarData(
                            item.dataAvaliacao,
                          )}`
                        : ''}
                    </p>
                  </div>

                  {item.status && (
                    <StatusBadge
                      value={item.status}
                    />
                  )}
                </div>

                {item.valorOriginal && (
                  <p className="mt-3 text-sm text-slate-300">
                    {item.valorOriginal}
                  </p>
                )}

                {item.observacao && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.observacao}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyText text="Nenhuma avaliação por serviço registrada." />
        )}
      </SectionCard>

      <SectionCard
        title="Ciclos de avaliação"
        icon={Clock3}
      >
        {ciclos.length > 0 ? (
          <div className="space-y-3">
            {ciclos.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border-dark bg-slate-800/25 p-4"
              >
                <p className="font-semibold text-white">
                  {item.periodoReferencia}
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <MiniInfo
                    label="Início"
                    value={[
                      formatarData(item.dataInicio),
                      item.statusInicio,
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  />

                  <MiniInfo
                    label="Fim"
                    value={[
                      formatarData(item.dataFim),
                      item.statusFim,
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  />
                </div>

                {(item.valorInicioOriginal ||
                  item.valorFimOriginal) && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <MiniInfo
                      label="Valor inicial"
                      value={item.valorInicioOriginal}
                    />

                    <MiniInfo
                      label="Valor final"
                      value={item.valorFimOriginal}
                    />
                  </div>
                )}

                {item.observacao && (
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {item.observacao}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyText text="Nenhum ciclo de avaliação registrado." />
        )}
      </SectionCard>
    </div>
  );
}

function SinaisVitaisTab({
  itens,
}: {
  itens: SaeUsuarioSinalVital[];
}) {
  if (!itens.length) {
    return (
      <EmptySection text="Nenhum sinal vital registrado para este usuário." />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {itens.map((item) => (
        <article
          key={item.id}
          className="rounded-[18px] border border-border-dark bg-card-dark p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                Pressão arterial
              </p>

              <p className="mt-1 text-lg font-bold text-white">
                {item.pressaoSistolica != null &&
                item.pressaoDiastolica != null
                  ? `${item.pressaoSistolica}/${item.pressaoDiastolica} mmHg`
                  : 'Não informada'}
              </p>
            </div>

            <Activity
              size={20}
              className="text-rose-400"
            />
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {formatarDataHora(item.dataAfericao)}
          </p>

          {item.statusOriginal && (
            <p className="mt-3 text-sm font-medium text-slate-300">
              {item.statusOriginal}
            </p>
          )}

          {item.observacao && (
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {item.observacao}
            </p>
          )}
        </article>
      ))}
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
    <article className="rounded-[18px] border border-border-dark bg-card-dark p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {helper}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
          <Icon size={18} />
        </div>
      </div>
    </article>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-border-dark bg-card-dark p-5">
      <div className="mb-5 flex items-center gap-2">
        <Icon
          size={17}
          className="text-primary"
        />

        <h2 className="text-sm font-bold text-white">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p className="mt-1.5 text-sm font-medium text-slate-300">
        {value || '—'}
      </p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border-dark bg-slate-800/30 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-sm text-slate-300">
        {value || '—'}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? 'bg-primary text-white'
          : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({
  value,
}: {
  value?: string | null;
}) {
  if (!value) {
    return null;
  }

  const normalized = value.toUpperCase();

  const className =
    normalized.includes('CONCLU') ||
    normalized.includes('ATEND') ||
    normalized.includes('ATIVO')
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
      : normalized.includes('CANCEL') ||
          normalized.includes('INATIVO')
        ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
        : 'border-amber-500/20 bg-amber-500/10 text-amber-400';

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${className}`}
    >
      {value}
    </span>
  );
}

function TextBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mt-4 rounded-xl border border-border-dark bg-slate-800/25 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
        {value}
      </p>
    </div>
  );
}

function EmptyText({
  text,
}: {
  text: string;
}) {
  return (
    <p className="text-sm text-slate-500">
      {text}
    </p>
  );
}

function EmptySection({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[18px] border border-border-dark bg-card-dark px-6 text-center">
      <div>
        <CheckCircle2
          size={24}
          className="mx-auto text-slate-600"
        />

        <p className="mt-3 text-sm text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[460px] items-center justify-center">
      <div className="text-center">
        <Loader2
          size={30}
          className="mx-auto animate-spin text-primary"
        />

        <p className="mt-3 text-sm text-slate-400">
          Carregando perfil do usuário...
        </p>
      </div>
    </div>
  );
}

function ErrorState({
  mensagem,
  onVoltar,
  onRetry,
}: {
  mensagem: string;
  onVoltar: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[460px] items-center justify-center">
      <div className="max-w-md text-center">
        <AlertCircle
          size={30}
          className="mx-auto text-rose-400"
        />

        <h2 className="mt-4 text-lg font-bold text-white">
          Não foi possível carregar o perfil
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {mensagem}
        </p>

        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={onVoltar}
            className="rounded-xl border border-border-dark bg-slate-800/50 px-4 py-2.5 text-sm font-semibold text-slate-300"
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
}

function formatarData(
  value?: string | null,
) {
  if (!value) {
    return '';
  }

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function formatarDataHora(
  value?: string | null,
) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function formatarHorario(
  value?: string | null,
) {
  if (!value) {
    return '';
  }

  return value.slice(0, 5);
}

function formatarCpf(
  value?: string | null,
) {
  if (!value) return '—';

  const digits = value.replace(/\D/g, '');

  if (digits.length !== 11) return value;

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatarCep(
  value?: string | null,
) {
  if (!value) {
    return '—';
  }

  const digits = value.replace(/\D/g, '');

  if (digits.length !== 8) {
    return value;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
