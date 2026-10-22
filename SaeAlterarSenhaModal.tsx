import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { saeProfissionaisService } from '../services/saeProfissionaisService';

export default function SaeAlterarSenhaModal({
  aberto,
  onClose,
}: {
  aberto: boolean;
  onClose: () => void;
}) {
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const fechar = () => {
    setSenha('');
    setConfirmar('');
    setErro('');
    setSucesso('');
    setMostrar(false);
    onClose();
  };

  const salvar = async () => {
    try {
      setErro('');
      setSucesso('');

      if (senha.length < 6) {
        throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
      }

      if (senha !== confirmar) {
        throw new Error('A confirmação da senha não confere.');
      }

      setSalvando(true);
      await saeProfissionaisService.alterarMinhaSenha(senha);
      setSucesso('Senha alterada com sucesso.');
      setSenha('');
      setConfirmar('');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível alterar a senha.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="w-full max-w-md rounded-t-2xl border border-border-dark bg-card-dark p-5 shadow-2xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <KeyRound size={19} />
                </div>
                <div>
                  <h3 className="font-bold text-white">Alterar minha senha</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Escolha uma nova senha com pelo menos 6 caracteres.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fechar}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-dark text-slate-400"
              >
                <X size={17} />
              </button>
            </div>

            {erro && (
              <div className="mt-4 flex gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle size={16} className="shrink-0" />
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="mt-4 flex gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <CheckCircle2 size={16} className="shrink-0" />
                {sucesso}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Nova senha
                </span>
                <div className="relative">
                  <input
                    type={mostrar ? 'text' : 'password'}
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/40 px-3 pr-11 text-sm text-white outline-none focus:border-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrar((value) => !value)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-slate-500"
                  >
                    {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Confirmar nova senha
                </span>
                <input
                  type={mostrar ? 'text' : 'password'}
                  value={confirmar}
                  onChange={(event) => setConfirmar(event.target.value)}
                  className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/40 px-3 text-sm text-white outline-none focus:border-primary/40"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={fechar}
                className="min-h-11 rounded-xl border border-border-dark px-4 text-sm font-bold text-slate-300"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={salvar}
                disabled={salvando}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white disabled:opacity-50"
              >
                {salvando ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                Alterar senha
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
