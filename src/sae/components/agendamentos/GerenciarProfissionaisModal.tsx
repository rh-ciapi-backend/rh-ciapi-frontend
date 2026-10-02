import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  UserRoundSearch,
  UserX,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { saeProfissionaisService } from '../../services/saeProfissionaisService';
import AgendaProfissionalPanel from './AgendaProfissionalPanel';

import type {
  SaeProfissional,
  SaeProfissionalForm,
  SaeProfissionaisAction,
  SaeServidorBusca,
  SaeServicoOpcao,
} from '../../types/saeProfissional';

interface GerenciarProfissionaisModalProps {
  aberto: boolean;
  onClose: () => void;
}

const FORM_INICIAL: SaeProfissionalForm = {
  servidorId: '',
  registroProfissional: '',
  conselho: '',
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
  servidorId: profissional.servidorId || '',
  registroProfissional: profissional.registroProfissional || '',
  conselho: profissional.conselho || '',
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
  const [abaAtiva, setAbaAtiva] = useState<'cadastro' | 'agenda'>('cadastro');
  const [form, setForm] = useState<SaeProfissionalForm>(FORM_INICIAL);

  const [buscaServidor, setBuscaServidor] = useState('');
  const [servidoresEncontrados, setServidoresEncontrados] = useState<SaeServidorBusca[]>([]);
  const [servidorSelecionado, setServidorSelecionado] = useState<SaeServidorBusca | null>(null);
  const [buscandoServidor, setBuscandoServidor] = useState(false);
  const [senhaExibida, setSenhaExibida] = useState<string | null>(null);

  const podeCriar = permissions.includes('criar');
  const podeEditar = permissions.includes('editar');
  const podeExcluir = permissions.includes('excluir');

  const selecionado = useMemo(
    () => profissionais.find((item) => item.id === selecionadoId) || null,
    [profissionais, selecionadoId],
  );

  const profissionaisFiltrados = useMemo(() => {
    const termo = normalize(busca);

    if (!termo) return profissionais;

    return profissionais.filter((profissional) =>
      [
        profissional.nome,
        profissional.matricula,
        profissional.cargoFuncao,
        profissional.conselho,
        profissional.registroProfissional,
        profissional.email,
        profissional.setor,
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
    if (!aberto) return;

    setBusca('');
    setModoNovo(false);
    setAbaAtiva('cadastro');
    setForm(FORM_INICIAL);
    setSelecionadoId(null);
    setErro(null);
    setSucesso(null);
    setSenhaExibida(null);
    carregar();
  }, [aberto]);

  useEffect(() => {
    if (!aberto || modoNovo || !selecionado) return;

    setForm(formFromProfissional(selecionado));
    setServidorSelecionado(null);
    setSenhaExibida(null);
  }, [aberto, modoNovo, selecionado]);

  useEffect(() => {
    if (!sucesso) return;

    const timer = window.setTimeout(() => setSucesso(null), 4500);
    return () => window.clearTimeout(timer);
  }, [sucesso]);

  const iniciarNovo = () => {
    setModoNovo(true);
    setSelecionadoId(null);
    setAbaAtiva('cadastro');
    setForm(FORM_INICIAL);
    setBuscaServidor('');
    setServidoresEncontrados([]);
    setServidorSelecionado(null);
    setErro(null);
    setSucesso(null);
    setSenhaExibida(null);
  };

  const selecionarProfissional = (profissional: SaeProfissional) => {
    setModoNovo(false);
    setSelecionadoId(profissional.id);
    setAbaAtiva('cadastro');
    setErro(null);
    setSucesso(null);
    setSenhaExibida(null);
  };

  const pesquisarServidor = async () => {
    const termo = buscaServidor.trim();

    if (termo.length < 2) {
      setErro('Digite pelo menos 2 caracteres do nome, CPF ou matrícula.');
      return;
    }

    try {
      setBuscandoServidor(true);
      setErro(null);
      const response = await saeProfissionaisService.buscarServidores(termo);
      setServidoresEncontrados(response.servidores || []);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível localizar servidores.');
    } finally {
      setBuscandoServidor(false);
    }
  };

  const escolherServidor = (servidor: SaeServidorBusca) => {
    if (servidor.jaVinculado) return;
    setServidorSelecionado(servidor);
    setForm((atual) => ({ ...atual, servidorId: servidor.id }));
    setErro(null);
  };

  const alternarServico = (servicoId: string) => {
    setForm((atual) => ({
      ...atual,
      servicoIds: atual.servicoIds.includes(servicoId)
        ? atual.servicoIds.filter((id) => id !== servicoId)
        : [...atual.servicoIds, servicoId],
    }));
  };

  const salvar = async () => {
    try {
      setSalvando(true);
      setErro(null);
      setSenhaExibida(null);

      if (!form.servicoIds.length) {
        throw new Error('Selecione pelo menos um serviço realizado.');
      }

      if (modoNovo) {
        if (!form.servidorId || !servidorSelecionado) {
          throw new Error('Selecione um servidor do CIAPI RH.');
        }

        const response = await saeProfissionaisService.adicionar(form);

        setSucesso(
          response.contaReutilizada
            ? 'Profissional vinculado ao SAE. A conta existente foi reutilizada.'
            : 'Profissional e conta de acesso criados com sucesso.',
        );

        if (response.senhaTemporaria) {
          setSenhaExibida(response.senhaTemporaria);
        }

        setModoNovo(false);
        await carregar();
        setSelecionadoId(response.profissional.id);
      } else if (selecionado) {
        const response = await saeProfissionaisService.editar(
          selecionado.id,
          form,
        );

        setSucesso('Alterações salvas.');
        await carregar();
        setSelecionadoId(response.profissional.id);
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const alterarStatus = async () => {
    if (!selecionado) return;

    try {
      setSalvando(true);
      setErro(null);

      const response = await saeProfissionaisService.alterarStatus(
        selecionado.id,
        !selecionado.ativo,
      );

      setSucesso(
        response.profissional.ativo
          ? 'Profissional ativado.'
          : 'Profissional inativado.',
      );

      await carregar();
      setSelecionadoId(response.profissional.id);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível alterar o status.');
    } finally {
      setSalvando(false);
    }
  };

  const redefinirSenha = async () => {
    if (!selecionado) return;

    if (
      !window.confirm(
        `Redefinir a senha de ${selecionado.nome} para a senha provisória baseada no CPF?`,
      )
    ) {
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      const response = await saeProfissionaisService.redefinirSenha(selecionado.id);
      setSenhaExibida(response.senhaTemporaria);
      setSucesso('Senha provisória redefinida com sucesso.');
      await carregar();
      setSelecionadoId(selecionado.id);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível redefinir a senha.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!selecionado) return;

    if (
      !window.confirm(
        `Excluir ${selecionado.nome} da lista de profissionais do SAE?`,
      )
    ) {
      return;
    }

    try {
      setSalvando(true);
      setErro(null);
      await saeProfissionaisService.excluir(selecionado.id);
      setSucesso('Profissional removido.');
      setSelecionadoId(null);
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível excluir.');
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.99 }}
          className="flex h-[100dvh] w-full flex-col overflow-hidden border border-border-dark bg-card-dark shadow-2xl sm:h-[92vh] sm:max-w-6xl sm:rounded-3xl"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-border-dark px-4 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                SAE
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">
                Profissionais e serviços
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Vincule servidores já cadastrados no CIAPI RH ao ambiente profissional do SAE.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={carregar}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-dark text-slate-400 hover:text-white"
                title="Atualizar"
              >
                <RefreshCw size={17} className={carregando ? 'animate-spin' : ''} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-dark text-slate-400 hover:text-white"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[330px_minmax(0,1fr)]">
            <aside className="flex min-h-0 flex-col border-b border-border-dark lg:border-b-0 lg:border-r">
              <div className="space-y-3 border-b border-border-dark p-4">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Buscar profissional..."
                    className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/40 pl-10 pr-3 text-sm text-white outline-none"
                  />
                </div>

                <button
                  type="button"
                  disabled={!podeCriar}
                  onClick={iniciarNovo}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white disabled:opacity-40"
                >
                  <Plus size={17} />
                  Vincular servidor ao SAE
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {carregando && !profissionais.length ? (
                  <div className="flex min-h-40 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profissionaisFiltrados.map((profissional) => (
                      <button
                        type="button"
                        key={profissional.id}
                        onClick={() => selecionarProfissional(profissional)}
                        className={[
                          'w-full rounded-xl border p-3 text-left transition',
                          selecionadoId === profissional.id && !modoNovo
                            ? 'border-primary/40 bg-primary/10'
                            : 'border-transparent hover:border-border-dark hover:bg-slate-800/40',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white">
                              {profissional.nome}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {profissional.cargoFuncao || 'Profissional SAE'}
                            </p>
                            {profissional.matricula && (
                              <p className="mt-1 text-[10px] text-slate-600">
                                Matrícula {profissional.matricula}
                              </p>
                            )}
                          </div>

                          <span
                            className={[
                              'rounded-full border px-2 py-1 text-[9px] font-bold',
                              profissional.ativo
                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                                : 'border-slate-600 bg-slate-800 text-slate-400',
                            ].join(' ')}
                          >
                            {profissional.ativo ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </div>
                      </button>
                    ))}

                    {!profissionaisFiltrados.length && (
                      <div className="p-8 text-center text-xs text-slate-500">
                        Nenhum profissional encontrado.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </aside>

            <main className="min-h-0 overflow-y-auto p-4 sm:p-6">
              {erro && (
                <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  {erro}
                </div>
              )}

              {sucesso && (
                <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  {sucesso}
                </div>
              )}

              {senhaExibida && (
                <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-200">
                    <KeyRound size={17} />
                    Senha provisória
                  </div>
                  <div className="mt-3 rounded-xl border border-amber-400/20 bg-slate-950/30 px-4 py-3 font-mono text-lg font-bold tracking-[0.18em] text-white">
                    {senhaExibida}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-amber-100/70">
                    Regra: 5 primeiros dígitos do CPF + @. Oriente o profissional a alterar a senha após entrar.
                  </p>
                </div>
              )}

              {modoNovo ? (
                <div className="space-y-5">
                  <section className="rounded-2xl border border-primary/15 bg-primary/5 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                        <UserRoundSearch size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">
                          Localizar servidor no CIAPI RH
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Pesquise por nome, CPF ou matrícula. Os dados pessoais não serão duplicados no SAE.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <div className="relative flex-1">
                        <Search
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                          value={buscaServidor}
                          onChange={(event) => setBuscaServidor(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') pesquisarServidor();
                          }}
                          placeholder="Nome, CPF ou matrícula..."
                          className="h-11 w-full rounded-xl border border-border-dark bg-slate-950/30 pl-10 pr-3 text-sm text-white outline-none focus:border-primary/40"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={pesquisarServidor}
                        disabled={buscandoServidor}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {buscandoServidor ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Search size={16} />
                        )}
                        Buscar
                      </button>
                    </div>

                    {!!servidoresEncontrados.length && (
                      <div className="mt-4 grid grid-cols-1 gap-2 xl:grid-cols-2">
                        {servidoresEncontrados.map((servidor) => (
                          <button
                            key={servidor.id}
                            type="button"
                            disabled={servidor.jaVinculado}
                            onClick={() => escolherServidor(servidor)}
                            className={[
                              'rounded-xl border p-3 text-left transition',
                              servidorSelecionado?.id === servidor.id
                                ? 'border-primary/50 bg-primary/10'
                                : 'border-border-dark bg-slate-950/20 hover:border-primary/25',
                              servidor.jaVinculado ? 'cursor-not-allowed opacity-50' : '',
                            ].join(' ')}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-white">
                                  {servidor.nome}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Matrícula {servidor.matricula || '—'} • CPF {servidor.cpfMascarado || '—'}
                                </p>
                                <p className="mt-1 truncate text-xs text-slate-600">
                                  {servidor.cargo || servidor.funcao || servidor.profissao || 'Cargo não informado'}
                                </p>
                              </div>

                              {servidor.jaVinculado && (
                                <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-300">
                                  JÁ VINCULADO
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>

                  {servidorSelecionado && (
                    <>
                      <ServidorResumo servidor={servidorSelecionado} />
                      <ConfiguracaoProfissional
                        form={form}
                        setForm={setForm}
                        servicos={servicos}
                        alternarServico={alternarServico}
                        podeEditar={true}
                      />

                      <div className="flex flex-col-reverse gap-2 border-t border-border-dark pt-5 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setModoNovo(false)}
                          className="min-h-11 rounded-xl border border-border-dark px-5 text-sm font-bold text-slate-300"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={salvar}
                          disabled={salvando}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white disabled:opacity-50"
                        >
                          {salvando ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                          Criar profissional e acesso
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : selecionado ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2 border-b border-border-dark pb-4">
                    <button
                      type="button"
                      onClick={() => setAbaAtiva('cadastro')}
                      className={[
                        'rounded-xl px-4 py-2 text-xs font-bold transition',
                        abaAtiva === 'cadastro'
                          ? 'bg-primary text-white'
                          : 'border border-border-dark text-slate-400',
                      ].join(' ')}
                    >
                      Cadastro e serviços
                    </button>

                    <button
                      type="button"
                      onClick={() => setAbaAtiva('agenda')}
                      className={[
                        'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition',
                        abaAtiva === 'agenda'
                          ? 'bg-primary text-white'
                          : 'border border-border-dark text-slate-400',
                      ].join(' ')}
                    >
                      <CalendarDays size={14} />
                      Agenda
                    </button>
                  </div>

                  {abaAtiva === 'agenda' ? (
                    <AgendaProfissionalPanel
                      profissionalId={selecionado.id}
                      profissionalNome={selecionado.nome}
                    />
                  ) : (
                    <>
                      <section className="rounded-2xl border border-border-dark bg-slate-950/20 p-4 sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                              Servidor vinculado
                            </p>
                            <h3 className="mt-1 text-xl font-bold text-white">
                              {selecionado.nome}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              Matrícula {selecionado.matricula || '—'} • CPF {selecionado.cpfMascarado || '—'}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300">
                              CONTA {selecionado.contaStatus || '—'}
                            </span>
                            {selecionado.senhaProvisoria && (
                              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold text-amber-300">
                                SENHA PROVISÓRIA
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <Info label="E-mail de login" value={selecionado.email || 'Não informado'} />
                          <Info label="Cargo/Função" value={selecionado.cargoFuncao || 'Não informado'} />
                          <Info label="Setor RH" value={selecionado.setor || 'Não informado'} />
                          <Info label="Telefone" value={selecionado.telefone || 'Não informado'} />
                        </div>
                      </section>

                      <ConfiguracaoProfissional
                        form={form}
                        setForm={setForm}
                        servicos={servicos}
                        alternarServico={alternarServico}
                        podeEditar={podeEditar}
                      />

                      <section className="rounded-2xl border border-border-dark bg-slate-950/20 p-4 sm:p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <KeyRound size={17} className="text-amber-300" />
                              <h3 className="font-bold text-white">
                                Conta de acesso
                              </h3>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              O login usa o e-mail do servidor. A senha provisória é formada pelos 5 primeiros dígitos do CPF + @.
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={!podeEditar || salvando || !selecionado.authUserId}
                            onClick={redefinirSenha}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 text-sm font-bold text-amber-200 disabled:opacity-40"
                          >
                            <KeyRound size={16} />
                            Redefinir senha
                          </button>
                        </div>
                      </section>

                      <div className="flex flex-col gap-2 border-t border-border-dark pt-5 sm:flex-row sm:flex-wrap sm:justify-between">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            disabled={!podeEditar || salvando}
                            onClick={alterarStatus}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-dark px-4 text-sm font-bold text-slate-300 disabled:opacity-40"
                          >
                            {selecionado.ativo ? <UserX size={16} /> : <UserCheck size={16} />}
                            {selecionado.ativo ? 'Inativar' : 'Ativar'}
                          </button>

                          <button
                            type="button"
                            disabled={!podeExcluir || salvando}
                            onClick={excluir}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 text-sm font-bold text-rose-300 disabled:opacity-40"
                          >
                            <Trash2 size={16} />
                            Excluir
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={!podeEditar || salvando}
                          onClick={salvar}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white disabled:opacity-40"
                        >
                          {salvando ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                          Salvar alterações
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
                  <UserCog className="h-10 w-10 text-slate-700" />
                  <h3 className="mt-4 font-bold text-white">
                    Selecione um profissional
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Ou use “Vincular servidor ao SAE” para localizar um servidor ativo do CIAPI RH.
                  </p>
                </div>
              )}
            </main>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ServidorResumo({ servidor }: { servidor: SaeServidorBusca }) {
  return (
    <section className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-emerald-300">
        <UserCheck size={18} />
        <h3 className="font-bold">Servidor selecionado</h3>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Info label="Nome" value={servidor.nome} />
        <Info label="Matrícula" value={servidor.matricula || '—'} />
        <Info label="CPF" value={servidor.cpfMascarado || '—'} />
        <Info label="E-mail" value={servidor.email || 'Não informado'} />
        <Info label="Cargo/Função" value={servidor.cargo || servidor.funcao || servidor.profissao || '—'} />
        <Info label="Setor" value={servidor.setor || '—'} />
        <Info label="Categoria" value={servidor.categoria || '—'} />
        <Info label="Telefone" value={servidor.telefone || '—'} />
      </div>
    </section>
  );
}

function ConfiguracaoProfissional({
  form,
  setForm,
  servicos,
  alternarServico,
  podeEditar,
}: {
  form: SaeProfissionalForm;
  setForm: React.Dispatch<React.SetStateAction<SaeProfissionalForm>>;
  servicos: SaeServicoOpcao[];
  alternarServico: (id: string) => void;
  podeEditar: boolean;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border-dark bg-slate-950/20 p-4 sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Registro profissional
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Conselho
            </span>
            <input
              value={form.conselho}
              disabled={!podeEditar}
              onChange={(event) =>
                setForm((atual) => ({ ...atual, conselho: event.target.value }))
              }
              placeholder="Ex.: CRESS"
              className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/40 px-3 text-sm text-white outline-none disabled:opacity-60"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Registro
            </span>
            <input
              value={form.registroProfissional}
              disabled={!podeEditar}
              onChange={(event) =>
                setForm((atual) => ({
                  ...atual,
                  registroProfissional: event.target.value,
                }))
              }
              placeholder="Número do registro profissional"
              className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/40 px-3 text-sm text-white outline-none disabled:opacity-60"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border-dark bg-slate-950/20 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" />
          <h3 className="font-bold text-white">
            Serviços realizados
          </h3>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Marque os serviços que poderão ser associados a este profissional.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {servicos
            .filter((servico) => servico.ativo)
            .map((servico) => {
              const marcado = form.servicoIds.includes(servico.id);

              return (
                <button
                  key={servico.id}
                  type="button"
                  disabled={!podeEditar}
                  onClick={() => alternarServico(servico.id)}
                  className={[
                    'flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition disabled:opacity-60',
                    marcado
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-border-dark bg-slate-900/20 hover:border-primary/20',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs',
                      marcado
                        ? 'border-primary bg-primary text-white'
                        : 'border-slate-600 text-transparent',
                    ].join(' ')}
                  >
                    ✓
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-white">
                      {servico.nome}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">
                      {servico.sigla || 'SAE'}
                    </span>
                  </span>
                </button>
              );
            })}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border-dark bg-slate-950/20 px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-slate-200">
        {value}
      </p>
    </div>
  );
}
