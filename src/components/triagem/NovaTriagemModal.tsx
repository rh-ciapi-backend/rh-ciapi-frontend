import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Search,
  UserPlus,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { saeTriagemService } from '../../services/saeTriagemService';
import { saeAgendamentosService } from '../../services/saeAgendamentosService';

import type { SaeTriagem } from '../../types/saeTriagem';
import type { SaeAgendamentoUsuarioOpcao } from '../../types/saeAgendamento';

interface Props {
  aberto: boolean;
  onClose: () => void;
  onCriado: (triagem: SaeTriagem) => void;
}

export default function NovaTriagemModal({
  aberto,
  onClose,
  onCriado,
}: Props) {
  const [modo, setModo] =
    useState<'NOVO' | 'CADASTRADO'>('NOVO');
  const [nome, setNome] = useState('');
  const [sexo, setSexo] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [observacaoInicial, setObservacaoInicial] = useState('');
  const [usuarioSelecionado, setUsuarioSelecionado] =
    useState<SaeAgendamentoUsuarioOpcao | null>(null);
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] =
    useState<SaeAgendamentoUsuarioOpcao[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;

    setModo('NOVO');
    setNome('');
    setSexo('');
    setDataNascimento('');
    setTelefone('');
    setObservacaoInicial('');
    setUsuarioSelecionado(null);
    setBusca('');
    setResultados([]);
    setErro(null);
  }, [aberto]);

  useEffect(() => {
    if (!aberto || modo !== 'CADASTRADO' || usuarioSelecionado) {
      return;
    }

    const termo = busca.trim();

    if (termo.length < 2) {
      setResultados([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setBuscando(true);
        const response =
          await saeAgendamentosService.buscarUsuarios(termo);
        setResultados(response.usuarios || []);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : 'Não foi possível buscar os usuários.',
        );
      } finally {
        setBuscando(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [aberto, modo, busca, usuarioSelecionado]);

  const salvar = async () => {
    const nomeFinal =
      modo === 'CADASTRADO'
        ? usuarioSelecionado?.nome || ''
        : nome.trim();

    if (!nomeFinal) {
      setErro('Informe ou selecione a pessoa em triagem.');
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      const response = await saeTriagemService.criar({
        usuarioId:
          modo === 'CADASTRADO'
            ? usuarioSelecionado?.id || null
            : null,
        nome: nomeFinal,
        sexo: sexo || null,
        dataNascimento: dataNascimento || null,
        telefone: telefone.trim() || null,
        observacaoInicial:
          observacaoInicial.trim() || null,
      });

      onCriado(response.triagem);
      onClose();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível criar a triagem.',
      );
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[105] flex items-center justify-center p-4">
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
          className="relative w-full max-w-2xl rounded-[24px] border border-border-dark bg-card-dark shadow-2xl"
        >
          <header className="flex items-start justify-between border-b border-border-dark p-5 sm:p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                SAE
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">
                Nova triagem
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Inicie o fluxo Serviço Social → Psicologia → Médico.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border-dark p-2 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </header>

          <div className="p-5 sm:p-6">
            {erro && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                <AlertCircle size={17} />
                {erro}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border-dark bg-slate-900/20 p-1.5">
              <button
                type="button"
                onClick={() => {
                  setModo('NOVO');
                  setUsuarioSelecionado(null);
                }}
                className={[
                  'rounded-lg px-3 py-2.5 text-xs font-bold',
                  modo === 'NOVO'
                    ? 'bg-primary text-white'
                    : 'text-slate-400',
                ].join(' ')}
              >
                Pessoa nova
              </button>

              <button
                type="button"
                onClick={() => setModo('CADASTRADO')}
                className={[
                  'rounded-lg px-3 py-2.5 text-xs font-bold',
                  modo === 'CADASTRADO'
                    ? 'bg-primary text-white'
                    : 'text-slate-400',
                ].join(' ')}
              >
                Usuário já cadastrado
              </button>
            </div>

            {modo === 'CADASTRADO' ? (
              <div className="mt-5">
                {usuarioSelecionado ? (
                  <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/[0.06] p-4">
                    <div>
                      <p className="font-semibold text-white">
                        {usuarioSelecionado.nome}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Prontuário {usuarioSelecionado.prontuario || '—'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUsuarioSelecionado(null)}
                      className="rounded-lg border border-border-dark px-3 py-2 text-xs font-bold text-slate-400"
                    >
                      Trocar
                    </button>
                  </div>
                ) : (
                  <>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                      Nome ou prontuário
                    </label>

                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <input
                        value={busca}
                        onChange={(event) =>
                          setBusca(event.target.value)
                        }
                        className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 pl-9 pr-10 text-sm text-white outline-none"
                        placeholder="Buscar usuário..."
                      />

                      {buscando && (
                        <Loader2
                          size={16}
                          className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary"
                        />
                      )}
                    </div>

                    {resultados.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-border-dark">
                        {resultados.map((usuario) => (
                          <button
                            key={usuario.id}
                            type="button"
                            onClick={() => {
                              setUsuarioSelecionado(usuario);
                              setResultados([]);
                            }}
                            className="block w-full border-b border-border-dark px-4 py-3 text-left last:border-b-0 hover:bg-slate-800/40"
                          >
                            <p className="text-sm font-semibold text-white">
                              {usuario.nome}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Prontuário {usuario.prontuario || '—'}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Nome completo">
                  <input
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white outline-none"
                  />
                </Field>

                <Field label="Sexo">
                  <select
                    value={sexo}
                    onChange={(event) =>
                      setSexo(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white outline-none"
                  >
                    <option value="">Não informado</option>
                    <option value="FEMININO">Feminino</option>
                    <option value="MASCULINO">Masculino</option>
                  </select>
                </Field>

                <Field label="Data de nascimento">
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(event) =>
                      setDataNascimento(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white outline-none"
                  />
                </Field>

                <Field label="Telefone">
                  <input
                    value={telefone}
                    onChange={(event) =>
                      setTelefone(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white outline-none"
                  />
                </Field>
              </div>
            )}

            <div className="mt-4">
              <Field label="Observação inicial">
                <textarea
                  value={observacaoInicial}
                  onChange={(event) =>
                    setObservacaoInicial(event.target.value)
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-border-dark bg-slate-900/50 p-3 text-sm text-white outline-none"
                  placeholder="Demanda inicial, encaminhamento, responsável, observações..."
                />
              </Field>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-border-dark pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={salvando}
                className="rounded-xl border border-border-dark px-4 py-2.5 text-sm font-semibold text-slate-300"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={salvar}
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {salvando ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <UserPlus size={16} />
                )}
                Iniciar triagem
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}
