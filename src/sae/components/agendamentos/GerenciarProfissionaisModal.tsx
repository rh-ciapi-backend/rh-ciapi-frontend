import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  ClipboardCheck,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  UserX,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { saeProfissionaisService } from '../../services/saeProfissionaisService';
import AgendaProfissionalPanel from './AgendaProfissionalPanel';
import SolicitacoesAgendaPanel from './SolicitacoesAgendaPanel';
import VinculoUsuarioSistemaPanel from './VinculoUsuarioSistemaPanel';

import type {
  SaeProfissional,
  SaeProfissionalForm,
  SaeProfissionaisAction,
  SaeServicoOpcao,
} from '../../types/saeProfissional';

interface GerenciarProfissionaisModalProps {
  aberto: boolean;
  onClose: () => void;
}

const FORM_INICIAL: SaeProfissionalForm = {
  nome: '',
  registroProfissional: '',
  conselho: '',
  cargoFuncao: '',
  telefone: '',
  email: '',
  ativo: true,
  servicoIds: [],
};

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const formFromProfissional = (
  profissional: SaeProfissional,
): SaeProfissionalForm => ({
  nome: profissional.nome || '',
  registroProfissional: profissional.registroProfissional || '',
  conselho: profissional.conselho || '',
  cargoFuncao: profissional.cargoFuncao || '',
  telefone: profissional.telefone || '',
  email: profissional.email || '',
  ativo: profissional.ativo,
  servicoIds: [...profissional.servicoIds],
});

export default function GerenciarProfissionaisModal({
  aberto,
  onClose,
}: GerenciarProfissionaisModalProps) {
  const [profissionais, setProfissionais] = useState<SaeProfissional[]>([]);
  const [servicos, setServicos] = useState<SaeServicoOpcao[]>([]);
  const [permissions, setPermissions] = useState<SaeProfissionaisAction[]>([]);

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const [busca, setBusca] = useState('');
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [modoNovo, setModoNovo] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'cadastro' | 'agenda' | 'solicitacoes'>('cadastro');
  const [form, setForm] = useState<SaeProfissionalForm>(FORM_INICIAL);

  const podeCriar = permissions.includes('criar');
  const podeEditar = permissions.includes('editar');
  const podeExcluir = permissions.includes('excluir');

  const selecionado = useMemo(
    () => profissionais.find((item) => item.id === selecionadoId) || null,
    [profissionais, selecionadoId],
  );

  const profissionaisFiltrados = useMemo(() => {
    const termo = normalize(busca);

    if (!termo) {
      return profissionais;
    }

    return profissionais.filter((profissional) =>
      [
        profissional.nome,
        profissional.cargoFuncao,
        profissional.conselho,
        profissional.registroProfissional,
        profissional.email,
      ].some((value) => normalize(value).includes(termo)),
    );
  }, [profissionais, busca]);

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const response = await saeProfissionaisService.listar();

      setProfissionais(response.profissionais || []);
      setServicos(response.servicos || []);
      setPermissions(response.permissions || []);

      setSelecionadoId((atual) => {
        if (
          atual &&
          (response.profissionais || []).some((item) => item.id === atual)
        ) {
          return atual;
        }

        return response.profissionais?.[0]?.id || null;
      });
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os profissionais.',
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const atualizarProfissionalLocal = (profissionalAtualizado: SaeProfissional) => {
    setProfissionais((atuais) =>
      atuais.map((item) =>
        item.id === profissionalAtualizado.id ? profissionalAtualizado : item,
      ),
    );
    setForm(formFromProfissional(profissionalAtualizado));
  };

  if (!aberto) {
      return;
    }

    setBusca('');
    setModoNovo(false);
    setAbaAtiva('cadastro');
    setForm(FORM_INICIAL);
    setSelecionadoId(null);
    setErro(null);
    setSucesso(null);
    carregar();
  }, [aberto]);

  useEffect(() => {
    if (!aberto || modoNovo || !selecionado) {
      return;
    }

    setForm(formFromProfissional(selecionado));
  }, [aberto, modoNovo, selecionado]);

  useEffect(() => {
    if (!sucesso) {
      return;
    }

    const timer = window.setTimeout(() => setSucesso(null), 3200);
    return () => window.clearTimeout(timer);
  }, [sucesso]);

  const iniciarNovo = () => {
    if (!podeCriar) {
      setErro('Você não possui permissão para cadastrar profissionais.');
      return;
    }

    setModoNovo(true);
    setAbaAtiva('cadastro');
    setSelecionadoId(null);
    setForm(FORM_INICIAL);
    setErro(null);
  };

  const selecionarProfissional = (profissional: SaeProfissional) => {
    setModoNovo(false);
    setAbaAtiva('cadastro');
    setSelecionadoId(profissional.id);
    setForm(formFromProfissional(profissional));
    setErro(null);
  };

  const atualizarCampo = <K extends keyof SaeProfissionalForm>(
    campo: K,
    valor: SaeProfissionalForm[K],
  ) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  };

  const alternarServico = (servicoId: string) => {
    setForm((atual) => {
      const marcado = atual.servicoIds.includes(servicoId);

      return {
        ...atual,
        servicoIds: marcado
          ? atual.servicoIds.filter((id) => id !== servicoId)
          : [...atual.servicoIds, servicoId],
      };
    });
  };

  const salvar = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.nome.trim()) {
      setErro('Informe o nome do profissional.');
      return;
    }

    if (modoNovo && !podeCriar) {
      setErro('Você não possui permissão para cadastrar profissionais.');
      return;
    }

    if (!modoNovo && !podeEditar) {
      setErro('Você não possui permissão para editar profissionais.');
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      if (modoNovo) {
        const response = await saeProfissionaisService.adicionar(form);

        setProfissionais((atuais) =>
          [...atuais, response.profissional].sort((a, b) =>
            a.nome.localeCompare(b.nome, 'pt-BR'),
          ),
        );
        setSelecionadoId(response.profissional.id);
        setModoNovo(false);
        setForm(formFromProfissional(response.profissional));
        setSucesso('Profissional cadastrado com sucesso.');
      } else if (selecionado) {
        const response = await saeProfissionaisService.editar(
          selecionado.id,
          form,
        );

        setProfissionais((atuais) =>
          atuais
            .map((item) =>
              item.id === response.profissional.id
                ? response.profissional
                : item,
            )
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
        );
        setForm(formFromProfissional(response.profissional));
        setSucesso('Profissional atualizado com sucesso.');
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o profissional.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const alterarStatus = async () => {
    if (!selecionado) {
      return;
    }

    if (!podeEditar) {
      setErro('Você não possui permissão para alterar o status.');
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      const response = await saeProfissionaisService.alterarStatus(
        selecionado.id,
        !selecionado.ativo,
      );

      setProfissionais((atuais) =>
        atuais.map((item) =>
          item.id === response.profissional.id ? response.profissional : item,
        ),
      );
      setForm(formFromProfissional(response.profissional));
      setSucesso(
        response.profissional.ativo
          ? 'Profissional ativado com sucesso.'
          : 'Profissional inativado com sucesso.',
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível alterar o status.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!selecionado || !podeExcluir) {
      if (!podeExcluir) {
        setErro('Você não possui permissão para excluir profissionais.');
      }
      return;
    }

    const confirmado = window.confirm(
      `Deseja realmente excluir ${selecionado.nome}? O sistema impedirá a exclusão se houver histórico ou configuração de agenda vinculada.`,
    );

    if (!confirmado) {
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      await saeProfissionaisService.excluir(selecionado.id);

      const restantes = profissionais.filter(
        (item) => item.id !== selecionado.id,
      );

      setProfissionais(restantes);
      setSelecionadoId(restantes[0]?.id || null);
      setModoNovo(false);
      setForm(
        restantes[0] ? formFromProfissional(restantes[0]) : FORM_INICIAL,
      );
      setSucesso('Profissional excluído com sucesso.');
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o profissional.',
      );
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) {
    return null;
  }

  const formHabilitado = modoNovo ? podeCriar : podeEditar;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5">
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
          className="relative flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-[24px] border border-border-dark bg-card-dark shadow-2xl"
        >
          <div className="flex items-center justify-between gap-4 border-b border-border-dark px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                SAE
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">
                Profissionais e serviços
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Cadastre profissionais e defina os serviços que cada um realiza.
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
                <RefreshCw
                  size={17}
                  className={carregando ? 'animate-spin' : ''}
                />
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

          <div className="grid min-h-0 flex-1 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="flex min-h-0 flex-col border-b border-border-dark lg:border-b-0 lg:border-r">
              <div className="space-y-3 border-b border-border-dark p-4">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="text"
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Buscar profissional..."
                    className="h-10 w-full rounded-xl border border-border-dark bg-slate-900/40 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-primary/50"
                  />
                </div>

                <button
                  type="button"
                  onClick={iniciarNovo}
                  disabled={!podeCriar}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={16} />
                  Novo profissional
                </button>
              </div>

              <div className="min-h-[220px] flex-1 overflow-y-auto p-2 lg:min-h-0">
                {carregando ? (
                  <div className="flex min-h-[220px] items-center justify-center">
                    <div className="text-center">
                      <Loader2
                        size={24}
                        className="mx-auto animate-spin text-primary"
                      />
                      <p className="mt-3 text-xs text-slate-500">
                        Carregando profissionais...
                      </p>
                    </div>
                  </div>
                ) : profissionaisFiltrados.length > 0 ? (
                  <div className="space-y-1">
                    {profissionaisFiltrados.map((profissional) => {
                      const ativo = selecionadoId === profissional.id && !modoNovo;

                      return (
                        <button
                          key={profissional.id}
                          type="button"
                          onClick={() => selecionarProfissional(profissional)}
                          className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                            ativo
                              ? 'border-primary/30 bg-primary/10'
                              : 'border-transparent hover:border-border-dark hover:bg-slate-900/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">
                                {profissional.nome}
                              </p>
                              <p className="mt-1 truncate text-[11px] text-slate-500">
                                {profissional.cargoFuncao ||
                                  profissional.conselho ||
                                  'Função não informada'}
                              </p>
                            </div>

                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                                profissional.ativo
                                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                  : 'border-slate-500/20 bg-slate-500/10 text-slate-400'
                              }`}
                            >
                              {profissional.ativo ? 'ATIVO' : 'INATIVO'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex min-h-[220px] items-center justify-center px-5 text-center">
                    <div>
                      <UserCog
                        size={24}
                        className="mx-auto text-slate-600"
                      />
                      <p className="mt-3 text-sm font-semibold text-slate-300">
                        Nenhum profissional encontrado
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Cadastre o primeiro profissional para começar.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </aside>

            <main className="min-h-0 overflow-y-auto p-4 sm:p-6">
              <AnimatePresence mode="wait">
                {erro && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-4 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300"
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
                    className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300"
                  >
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                    <span>{sucesso}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {!modoNovo && selecionado && (
                <div className="mb-5 flex flex-wrap gap-2 rounded-xl border border-border-dark bg-slate-900/25 p-1.5">
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('cadastro')}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                      abaAtiva === 'cadastro'
                        ? 'bg-primary text-white'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <UserCog size={15} />
                    Cadastro e serviços
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('agenda')}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                      abaAtiva === 'agenda'
                        ? 'bg-primary text-white'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <CalendarDays size={15} />
                    Agenda oficial
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('solicitacoes')}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                      abaAtiva === 'solicitacoes'
                        ? 'bg-primary text-white'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <ClipboardCheck size={15} />
                    Solicitações
                  </button>
                </div>
              )}

              {modoNovo || selecionado ? (
                !modoNovo && selecionado && abaAtiva === 'agenda' ? (
                  <AgendaProfissionalPanel
                    profissional={selecionado}
                    servicos={servicos}
                    podeEditar={podeEditar}
                  />
                ) : !modoNovo && selecionado && abaAtiva === 'solicitacoes' ? (
                  <SolicitacoesAgendaPanel
                    profissional={selecionado}
                    podeEditar={podeEditar}
                  />
                ) : (
                <form onSubmit={salvar} className="space-y-6">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {modoNovo ? 'Novo profissional' : selecionado?.nome}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {modoNovo
                          ? 'Preencha os dados e associe os serviços realizados.'
                          : 'Atualize os dados cadastrais e vínculos de serviço.'}
                      </p>
                    </div>

                    {!modoNovo && selecionado && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={alterarStatus}
                          disabled={salvando || !podeEditar}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:opacity-40 ${
                            selecionado.ativo
                              ? 'border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15'
                              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15'
                          }`}
                        >
                          {selecionado.ativo ? (
                            <UserX size={15} />
                          ) : (
                            <UserCheck size={15} />
                          )}
                          {selecionado.ativo ? 'Inativar' : 'Ativar'}
                        </button>

                        <button
                          type="button"
                          onClick={excluir}
                          disabled={salvando || !podeExcluir}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/15 disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>

                  <section className="rounded-[18px] border border-border-dark bg-slate-900/20 p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Pencil size={16} className="text-primary" />
                      <h4 className="text-sm font-bold text-white">
                        Dados profissionais
                      </h4>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <Field label="Nome completo" className="xl:col-span-2">
                        <input
                          type="text"
                          value={form.nome}
                          onChange={(event) =>
                            atualizarCampo('nome', event.target.value)
                          }
                          disabled={!formHabilitado}
                          required
                          className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </Field>

                      <Field label="Cargo / função">
                        <input
                          type="text"
                          value={form.cargoFuncao}
                          onChange={(event) =>
                            atualizarCampo('cargoFuncao', event.target.value)
                          }
                          disabled={!formHabilitado}
                          placeholder="Ex: Psicólogo"
                          className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </Field>

                      <Field label="Conselho">
                        <input
                          type="text"
                          value={form.conselho}
                          onChange={(event) =>
                            atualizarCampo('conselho', event.target.value)
                          }
                          disabled={!formHabilitado}
                          placeholder="Ex: CRP"
                          className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </Field>

                      <Field label="Registro profissional">
                        <input
                          type="text"
                          value={form.registroProfissional}
                          onChange={(event) =>
                            atualizarCampo(
                              'registroProfissional',
                              event.target.value,
                            )
                          }
                          disabled={!formHabilitado}
                          className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </Field>

                      <Field label="Telefone">
                        <input
                          type="text"
                          value={form.telefone}
                          onChange={(event) =>
                            atualizarCampo('telefone', event.target.value)
                          }
                          disabled={!formHabilitado}
                          className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </Field>

                      <Field label="E-mail" className="md:col-span-2 xl:col-span-1">
                        <input
                          type="email"
                          value={form.email}
                          onChange={(event) =>
                            atualizarCampo('email', event.target.value)
                          }
                          disabled={!formHabilitado}
                          className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </Field>
                    </div>
                  </section>

                  {!modoNovo && selecionado && (
                    <VinculoUsuarioSistemaPanel
                      profissional={selecionado}
                      podeEditar={podeEditar}
                      onProfissionalAtualizado={atualizarProfissionalLocal}
                    />
                  )}

                  <section className="rounded-[18px] border border-border-dark bg-slate-900/20 p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} className="text-primary" />
                          <h4 className="text-sm font-bold text-white">
                            Serviços realizados
                          </h4>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Marque os serviços que poderão ser associados a este profissional.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {servicos.map((servico) => {
                        const marcado = form.servicoIds.includes(servico.id);
                        const desabilitado =
                          !formHabilitado || (!servico.ativo && !marcado);

                        return (
                          <label
                            key={servico.id}
                            className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                              marcado
                                ? 'border-primary/30 bg-primary/10'
                                : 'border-border-dark bg-slate-900/30'
                            } ${
                              desabilitado
                                ? 'cursor-not-allowed opacity-50'
                                : 'cursor-pointer hover:border-primary/25'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={marcado}
                              disabled={desabilitado}
                              onChange={() => alternarServico(servico.id)}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-200">
                                {servico.nome}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-500">
                                {servico.sigla || 'Sem sigla'}
                                {!servico.ativo ? ' • Inativo' : ''}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </section>

                  <div className="flex flex-col-reverse justify-end gap-3 border-t border-border-dark pt-5 sm:flex-row">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl border border-border-dark bg-slate-900/40 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-white"
                    >
                      Fechar
                    </button>

                    <button
                      type="submit"
                      disabled={salvando || !formHabilitado}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {salvando ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      {salvando
                        ? 'Salvando...'
                        : modoNovo
                          ? 'Cadastrar profissional'
                          : 'Salvar alterações'}
                    </button>
                  </div>
                </form>
                )
              ) : (
                <div className="flex min-h-[420px] items-center justify-center text-center">
                  <div className="max-w-sm">
                    <UserCog
                      size={32}
                      className="mx-auto text-slate-600"
                    />
                    <h3 className="mt-4 font-bold text-white">
                      Cadastre o primeiro profissional
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      O cadastro de profissionais será usado posteriormente para configurar disponibilidade e horários de agendamento.
                    </p>
                    {podeCriar && (
                      <button
                        type="button"
                        onClick={iniciarNovo}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white"
                      >
                        <Plus size={16} />
                        Novo profissional
                      </button>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
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
