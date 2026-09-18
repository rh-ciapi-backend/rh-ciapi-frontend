import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Link2,
  Loader2,
  Search,
  Unlink,
  UserRoundCheck,
} from 'lucide-react';
import { motion } from 'motion/react';

import { saeProfissionaisService } from '../../services/saeProfissionaisService';

import type {
  SaeProfissional,
  SaeUsuarioSistemaOpcao,
} from '../../types/saeProfissional';

interface VinculoUsuarioSistemaPanelProps {
  profissional: SaeProfissional;
  podeEditar: boolean;
  onProfissionalAtualizado: (profissional: SaeProfissional) => void;
}

export default function VinculoUsuarioSistemaPanel({
  profissional,
  podeEditar,
  onProfissionalAtualizado,
}: VinculoUsuarioSistemaPanelProps) {
  const [usuarios, setUsuarios] = useState<SaeUsuarioSistemaOpcao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState(profissional.authUserId || '');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const response = await saeProfissionaisService.listarUsuariosSistema();
      setUsuarios(response.usuarios || []);
      setSelecionado(profissional.authUserId || '');
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os usuários do sistema.',
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [profissional.id, profissional.authUserId]);

  useEffect(() => {
    if (!sucesso) return;
    const timer = window.setTimeout(() => setSucesso(null), 3200);
    return () => window.clearTimeout(timer);
  }, [sucesso]);

  const usuarioAtual = useMemo(
    () => usuarios.find((item) => item.authUserId === profissional.authUserId) || null,
    [usuarios, profissional.authUserId],
  );

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');

    if (!termo) return usuarios;

    return usuarios.filter((usuario) =>
      [
        usuario.nomeCompleto,
        usuario.email,
        usuario.perfil,
        usuario.setorNome,
      ].some((valor) => String(valor || '').toLocaleLowerCase('pt-BR').includes(termo)),
    );
  }, [usuarios, busca]);

  const salvarVinculo = async (authUserId: string | null) => {
    if (!podeEditar) {
      setErro('Você não possui permissão para alterar o vínculo da conta.');
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      const response = await saeProfissionaisService.vincularUsuario(
        profissional.id,
        authUserId,
      );

      onProfissionalAtualizado(response.profissional);
      setSelecionado(response.profissional.authUserId || '');
      setSucesso(
        authUserId
          ? 'Conta do sistema vinculada com sucesso.'
          : 'Conta do sistema desvinculada com sucesso.',
      );

      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o vínculo da conta.',
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <section className="rounded-[18px] border border-border-dark bg-slate-900/20 p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserRoundCheck size={16} className="text-primary" />
            <h4 className="text-sm font-bold text-white">Conta do sistema</h4>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Vincule a conta autenticada que representará este profissional no SAE.
            Essa conta poderá usar a opção Minha agenda.
          </p>
        </div>

        {usuarioAtual && (
          <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold text-emerald-300">
            VINCULADO
          </span>
        )}
      </div>

      {erro && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </motion.div>
      )}

      {sucesso && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300"
        >
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          <span>{sucesso}</span>
        </motion.div>
      )}

      {usuarioAtual ? (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.05] p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {usuarioAtual.nomeCompleto}
              </p>
              <p className="mt-1 truncate text-xs text-slate-400">{usuarioAtual.email}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {usuarioAtual.perfil || 'Perfil não informado'}
                {usuarioAtual.setorNome ? ` • ${usuarioAtual.setorNome}` : ''}
              </p>
            </div>

            <button
              type="button"
              onClick={() => salvarVinculo(null)}
              disabled={!podeEditar || salvando}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {salvando ? <Loader2 size={14} className="animate-spin" /> : <Unlink size={14} />}
              Desvincular conta
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome, e-mail, perfil ou setor..."
              className="h-10 w-full rounded-xl border border-border-dark bg-slate-900/40 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-primary/50"
            />
          </div>

          <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-border-dark">
            {carregando ? (
              <div className="flex min-h-[130px] items-center justify-center text-xs text-slate-500">
                <Loader2 size={18} className="mr-2 animate-spin text-primary" />
                Carregando contas...
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-slate-500">
                Nenhuma conta disponível para vínculo.
              </div>
            ) : (
              <div className="divide-y divide-border-dark">
                {usuariosFiltrados.map((usuario) => {
                  const ocupadoPorOutro =
                    !!usuario.vinculadoProfissionalId &&
                    usuario.vinculadoProfissionalId !== profissional.id;

                  return (
                    <label
                      key={usuario.authUserId}
                      className={`flex gap-3 px-4 py-3 ${
                        ocupadoPorOutro
                          ? 'cursor-not-allowed opacity-45'
                          : 'cursor-pointer hover:bg-slate-800/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`usuario-sistema-${profissional.id}`}
                        value={usuario.authUserId}
                        checked={selecionado === usuario.authUserId}
                        disabled={!podeEditar || salvando || ocupadoPorOutro}
                        onChange={() => setSelecionado(usuario.authUserId)}
                        className="mt-1"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-200">
                            {usuario.nomeCompleto}
                          </p>
                          {ocupadoPorOutro && (
                            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                              JÁ VINCULADO
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {usuario.email}
                        </p>

                        {ocupadoPorOutro && (
                          <p className="mt-1 text-[10px] text-amber-300/80">
                            Vinculado a {usuario.vinculadoProfissionalNome || 'outro profissional'}.
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => salvarVinculo(selecionado || null)}
              disabled={!podeEditar || salvando || !selecionado}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {salvando ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
              Vincular conta selecionada
            </button>
          </div>
        </>
      )}
    </section>
  );
}
