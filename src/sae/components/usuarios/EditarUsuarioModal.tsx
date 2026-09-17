import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  Loader2,
  Pencil,
  AlertCircle,
} from 'lucide-react';

import { saeUsuariosService } from '../../services/saeUsuariosService';

import type { SaeUsuarioForm } from '../../types/saeUsuarioForm';
import type { SaeUsuarioResumo } from '../../types/saeUsuario';

interface EditarUsuarioModalProps {
  aberto: boolean;
  usuarioId: string | null;
  onClose: () => void;
  onSalvo: (usuario: SaeUsuarioResumo) => void;
}

const nacionalidadesPadrao = [
  'BRASILEIRA',
  'COLOMBIANA',
  'GUIANA INGLESA',
  'PERU',
  'VENEZUELANA',
];

const racas = [
  'AMARELA',
  'BRANCA',
  'PARDA',
  'PRETA',
  'NÃO INFORMADO',
];

const parentescos = [
  'FILHA',
  'FILHO',
  'IRMÃ',
  'IRMÃO',
  'ESPOSA',
  'ESPOSO',
  'CÔNJUGE',
  'COMPANHEIRA',
  'COMPANHEIRO',
  'NETA',
  'NETO',
  'NORA',
  'SOBRINHA',
  'SOBRINHO',
  'PRIMA',
  'AMIGA',
  'AMIGO',
  'CUIDADORA',
  'ENTEADA',
  'AFILHADO',
  'COMADRE',
  'OUTRO',
];

const tiposContato = [
  'CELULAR',
  'TELEFONE',
  'WHATSAPP',
  'RECADO',
  'OUTRO',
];

export default function EditarUsuarioModal({
  aberto,
  usuarioId,
  onClose,
  onSalvo,
}: EditarUsuarioModalProps) {
  const [form, setForm] = useState<SaeUsuarioForm | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nacionalidadeModoOutra, setNacionalidadeModoOutra] =
    useState(false);
  const [outraNacionalidade, setOutraNacionalidade] =
    useState('');

  useEffect(() => {
    if (!aberto || !usuarioId) {
      return;
    }

    carregar();
  }, [aberto, usuarioId]);

  const carregar = async () => {
    if (!usuarioId) {
      return;
    }

    try {
      setCarregando(true);
      setErro(null);

      const dados =
        await saeUsuariosService.obterFormularioEdicao(
          usuarioId,
        );

      if (!dados) {
        throw new Error('Usuário não encontrado.');
      }

      setForm(dados);

      const nacionalidadeAtual =
        dados.nacionalidade.trim().toUpperCase();

      if (
        nacionalidadeAtual &&
        !nacionalidadesPadrao.includes(
          nacionalidadeAtual,
        )
      ) {
        setNacionalidadeModoOutra(true);
        setOutraNacionalidade(
          dados.nacionalidade,
        );
      } else {
        setNacionalidadeModoOutra(false);
        setOutraNacionalidade('');
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os dados.',
      );
    } finally {
      setCarregando(false);
    }
  };

  const nacionalidadeFinal = useMemo(() => {
    if (nacionalidadeModoOutra) {
      return outraNacionalidade.trim();
    }

    return form?.nacionalidade || '';
  }, [
    form?.nacionalidade,
    nacionalidadeModoOutra,
    outraNacionalidade,
  ]);

  if (!aberto) {
    return null;
  }

  const atualizarCampo = <K extends keyof SaeUsuarioForm>(
    campo: K,
    valor: SaeUsuarioForm[K],
  ) => {
    setForm((atual) =>
      atual
        ? {
            ...atual,
            [campo]: valor,
          }
        : atual,
    );
  };

  const atualizarEndereco = (
    campo: keyof SaeUsuarioForm['endereco'],
    valor: string,
  ) => {
    setForm((atual) =>
      atual
        ? {
            ...atual,
            endereco: {
              ...atual.endereco,
              [campo]: valor,
            },
          }
        : atual,
    );
  };

  const atualizarContato = (
    index: number,
    campo: keyof SaeUsuarioForm['contatos'][number],
    valor: string | boolean,
  ) => {
    setForm((atual) => {
      if (!atual) return atual;

      return {
        ...atual,
        contatos: atual.contatos.map((contato, i) => {
          if (i !== index) {
            if (
              campo === 'principal' &&
              valor === true
            ) {
              return {
                ...contato,
                principal: false,
              };
            }

            return contato;
          }

          return {
            ...contato,
            [campo]: valor,
          };
        }),
      };
    });
  };

  const adicionarContato = () => {
    setForm((atual) =>
      atual
        ? {
            ...atual,
            contatos: [
              ...atual.contatos,
              {
                telefone: '',
                nomeContato: '',
                parentesco: '',
                tipo: 'CELULAR',
                observacao: '',
                principal: false,
              },
            ],
          }
        : atual,
    );
  };

  const removerContato = (index: number) => {
    setForm((atual) => {
      if (!atual) return atual;

      const novos = atual.contatos.filter(
        (_, i) => i !== index,
      );

      if (
        novos.length > 0 &&
        !novos.some(
          (contato) => contato.principal,
        )
      ) {
        novos[0] = {
          ...novos[0],
          principal: true,
        };
      }

      return {
        ...atual,
        contatos:
          novos.length > 0
            ? novos
            : [
                {
                  telefone: '',
                  nomeContato: '',
                  parentesco: '',
                  tipo: 'CELULAR',
                  observacao: '',
                  principal: true,
                },
              ],
      };
    });
  };

  const validar = () => {
    if (!form) {
      return 'Dados do usuário não carregados.';
    }

    if (!form.prontuario.trim()) {
      return 'Informe o prontuário.';
    }

    if (!form.nome.trim()) {
      return 'Informe o nome do usuário.';
    }

    if (!form.turno) {
      return 'Selecione o turno.';
    }

    if (!form.sexo) {
      return 'Selecione o sexo.';
    }

    if (!nacionalidadeFinal) {
      return 'Informe a nacionalidade.';
    }

    return null;
  };

  const handleSalvar = async () => {
    if (!form || !usuarioId) {
      return;
    }

    const validacao = validar();

    if (validacao) {
      setErro(validacao);
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      const atualizado =
        await saeUsuariosService.editar(
          usuarioId,
          {
            ...form,
            nacionalidade:
              nacionalidadeFinal,
          },
        );

      onSalvo(atualizado);
    } catch (error) {
      console.error(
        'Erro ao editar usuário do SAE:',
        error,
      );

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar as alterações.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const handleClose = () => {
    if (salvando) {
      return;
    }

    setErro(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[22px] border border-border-dark bg-[#111827] shadow-2xl">
        <header className="flex items-center justify-between border-b border-border-dark px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Pencil size={18} />
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                Editar Usuário
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Atualize os dados cadastrais do usuário.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={salvando}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </header>

        {carregando ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="text-center">
              <Loader2
                size={28}
                className="mx-auto animate-spin text-primary"
              />

              <p className="mt-3 text-sm text-slate-400">
                Carregando dados...
              </p>
            </div>
          </div>
        ) : !form ? (
          <div className="flex min-h-[420px] items-center justify-center px-6 text-center">
            <div>
              <AlertCircle
                size={28}
                className="mx-auto text-rose-400"
              />

              <p className="mt-3 text-sm text-slate-400">
                {erro || 'Dados não disponíveis.'}
              </p>

              <button
                type="button"
                onClick={carregar}
                className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {erro && (
                <div className="mb-5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {erro}
                </div>
              )}

              <div className="space-y-7">
                <FormSection
                  titulo="Dados principais"
                  descricao="Identificação e situação cadastral."
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="Prontuário" required>
                      <input
                        value={form.prontuario}
                        onChange={(e) =>
                          atualizarCampo(
                            'prontuario',
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Turno" required>
                      <select
                        value={form.turno}
                        onChange={(e) =>
                          atualizarCampo(
                            'turno',
                            e.target.value as
                              | ''
                              | 'MANHÃ'
                              | 'TARDE',
                          )
                        }
                        className={inputClass}
                      >
                        <option value="">
                          Selecione
                        </option>
                        <option value="MANHÃ">
                          Manhã
                        </option>
                        <option value="TARDE">
                          Tarde
                        </option>
                      </select>
                    </Field>

                    <Field label="Situação">
                      <select
                        value={
                          form.situacaoCadastral
                        }
                        onChange={(e) =>
                          atualizarCampo(
                            'situacaoCadastral',
                            e.target.value as
                              | 'ATIVO'
                              | 'INATIVO',
                          )
                        }
                        className={inputClass}
                      >
                        <option value="ATIVO">
                          Ativo
                        </option>
                        <option value="INATIVO">
                          Inativo
                        </option>
                      </select>
                    </Field>

                    <Field label="Data de ingresso">
                      <input
                        type="date"
                        value={form.dataIngresso}
                        onChange={(e) =>
                          atualizarCampo(
                            'dataIngresso',
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="md:col-span-2">
                      <Field
                        label="Nome completo"
                        required
                      >
                        <input
                          value={form.nome}
                          onChange={(e) =>
                            atualizarCampo(
                              'nome',
                              e.target.value,
                            )
                          }
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    <Field label="Sexo" required>
                      <select
                        value={form.sexo}
                        onChange={(e) =>
                          atualizarCampo(
                            'sexo',
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      >
                        <option value="">
                          Selecione
                        </option>
                        <option value="FEMININO">
                          Feminino
                        </option>
                        <option value="MASCULINO">
                          Masculino
                        </option>
                      </select>
                    </Field>

                    <Field label="Data de nascimento">
                      <input
                        type="date"
                        value={form.dataNascimento}
                        onChange={(e) =>
                          atualizarCampo(
                            'dataNascimento',
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection
                  titulo="Documentos e informações pessoais"
                  descricao="Dados complementares de identificação."
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="CPF">
                      <input
                        value={form.cpf}
                        onChange={(e) =>
                          atualizarCampo(
                            'cpf',
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="RG">
                      <input
                        value={form.rg}
                        onChange={(e) =>
                          atualizarCampo(
                            'rg',
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Cartão SUS">
                      <input
                        value={form.cartaoSus}
                        onChange={(e) =>
                          atualizarCampo(
                            'cartaoSus',
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Raça">
                      <select
                        value={form.raca}
                        onChange={(e) =>
                          atualizarCampo(
                            'raca',
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      >
                        {racas.map((raca) => (
                          <option
                            key={raca}
                            value={raca}
                          >
                            {raca}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Nacionalidade">
                      <select
                        value={
                          nacionalidadeModoOutra
                            ? 'OUTRA'
                            : form.nacionalidade
                        }
                        onChange={(e) => {
                          if (
                            e.target.value ===
                            'OUTRA'
                          ) {
                            setNacionalidadeModoOutra(
                              true,
                            );
                            setOutraNacionalidade(
                              '',
                            );
                            return;
                          }

                          setNacionalidadeModoOutra(
                            false,
                          );
                          setOutraNacionalidade(
                            '',
                          );
                          atualizarCampo(
                            'nacionalidade',
                            e.target.value,
                          );
                        }}
                        className={inputClass}
                      >
                        {nacionalidadesPadrao.map(
                          (item) => (
                            <option
                              key={item}
                              value={item}
                            >
                              {item}
                            </option>
                          ),
                        )}

                        <option value="OUTRA">
                          OUTRA
                        </option>
                      </select>
                    </Field>

                    {nacionalidadeModoOutra && (
                      <Field label="Outra nacionalidade">
                        <input
                          value={
                            outraNacionalidade
                          }
                          onChange={(e) =>
                            setOutraNacionalidade(
                              e.target.value,
                            )
                          }
                          className={inputClass}
                        />
                      </Field>
                    )}
                  </div>

                  <div className="mt-5 rounded-xl border border-border-dark bg-slate-800/30 p-4">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={
                          form.possuiDeficiencia
                        }
                        onChange={(e) =>
                          atualizarCampo(
                            'possuiDeficiencia',
                            e.target.checked,
                          )
                        }
                        className="h-4 w-4 rounded"
                      />

                      <span className="text-sm font-medium text-slate-300">
                        Possui deficiência
                      </span>
                    </label>

                    {form.possuiDeficiencia && (
                      <div className="mt-4">
                        <Field label="Tipo de deficiência">
                          <input
                            value={
                              form.tipoDeficiencia
                            }
                            onChange={(e) =>
                              atualizarCampo(
                                'tipoDeficiencia',
                                e.target.value,
                              )
                            }
                            className={inputClass}
                          />
                        </Field>
                      </div>
                    )}
                  </div>
                </FormSection>

                <FormSection
                  titulo="Endereço"
                  descricao="Endereço principal do usuário."
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="md:col-span-2">
                      <Field label="Logradouro">
                        <input
                          value={
                            form.endereco
                              .logradouro
                          }
                          onChange={(e) =>
                            atualizarEndereco(
                              'logradouro',
                              e.target.value,
                            )
                          }
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    <Field label="Número">
                      <input
                        value={
                          form.endereco.numero
                        }
                        onChange={(e) =>
                          atualizarEndereco(
                            'numero',
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Complemento">
                      <input
                        value={
                          form.endereco
                            .complemento
                        }
                        onChange={(e) =>
                          atualizarEndereco(
                            'complemento',
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Bairro">
                      <input
                        value={
                          form.endereco.bairro
                        }
                        onChange={(e) =>
                          atualizarEndereco(
                            'bairro',
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Cidade">
                      <input
                        value={
                          form.endereco.cidade
                        }
                        onChange={(e) =>
                          atualizarEndereco(
                            'cidade',
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="UF">
                      <input
                        maxLength={2}
                        value={form.endereco.uf}
                        onChange={(e) =>
                          atualizarEndereco(
                            'uf',
                            e.target.value.toUpperCase(),
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="CEP">
                      <input
                        value={form.endereco.cep}
                        onChange={(e) =>
                          atualizarEndereco(
                            'cep',
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection
                  titulo="Contatos"
                  descricao="Telefone do usuário e contatos de referência."
                >
                  <div className="space-y-4">
                    {form.contatos.map(
                      (contato, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-border-dark bg-slate-800/25 p-4"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">
                              Contato {index + 1}
                            </p>

                            {form.contatos
                              .length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  removerContato(
                                    index,
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>
                            )}
                          </div>

                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <Field label="Telefone">
                              <input
                                value={
                                  contato.telefone
                                }
                                onChange={(e) =>
                                  atualizarContato(
                                    index,
                                    'telefone',
                                    e.target
                                      .value,
                                  )
                                }
                                className={
                                  inputClass
                                }
                              />
                            </Field>

                            <Field label="Tipo">
                              <select
                                value={
                                  contato.tipo
                                }
                                onChange={(e) =>
                                  atualizarContato(
                                    index,
                                    'tipo',
                                    e.target
                                      .value,
                                  )
                                }
                                className={
                                  inputClass
                                }
                              >
                                {tiposContato.map(
                                  (tipo) => (
                                    <option
                                      key={
                                        tipo
                                      }
                                      value={
                                        tipo
                                      }
                                    >
                                      {tipo}
                                    </option>
                                  ),
                                )}
                              </select>
                            </Field>

                            <Field label="Nome do contato">
                              <input
                                value={
                                  contato.nomeContato
                                }
                                onChange={(e) =>
                                  atualizarContato(
                                    index,
                                    'nomeContato',
                                    e.target
                                      .value,
                                  )
                                }
                                className={
                                  inputClass
                                }
                              />
                            </Field>

                            <Field label="Parentesco">
                              <select
                                value={
                                  contato.parentesco
                                }
                                onChange={(e) =>
                                  atualizarContato(
                                    index,
                                    'parentesco',
                                    e.target
                                      .value,
                                  )
                                }
                                className={
                                  inputClass
                                }
                              >
                                <option value="">
                                  Selecione
                                </option>

                                {parentescos.map(
                                  (parentesco) => (
                                    <option
                                      key={
                                        parentesco
                                      }
                                      value={
                                        parentesco
                                      }
                                    >
                                      {
                                        parentesco
                                      }
                                    </option>
                                  ),
                                )}
                              </select>
                            </Field>
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                            <Field label="Observação">
                              <input
                                value={
                                  contato.observacao
                                }
                                onChange={(e) =>
                                  atualizarContato(
                                    index,
                                    'observacao',
                                    e.target
                                      .value,
                                  )
                                }
                                className={
                                  inputClass
                                }
                              />
                            </Field>

                            <div className="flex items-end pb-1">
                              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border-dark bg-slate-800/40 px-3 py-2.5">
                                <input
                                  type="checkbox"
                                  checked={
                                    contato.principal
                                  }
                                  onChange={(e) =>
                                    atualizarContato(
                                      index,
                                      'principal',
                                      e.target
                                        .checked,
                                    )
                                  }
                                  className="h-4 w-4 rounded"
                                />

                                <span className="text-xs font-medium text-slate-300">
                                  Principal
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ),
                    )}

                    <button
                      type="button"
                      onClick={adicionarContato}
                      className="inline-flex items-center gap-2 rounded-xl border border-border-dark bg-slate-800/40 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-primary/30 hover:text-white"
                    >
                      <Plus size={16} />
                      Adicionar contato
                    </button>
                  </div>
                </FormSection>

                <FormSection
                  titulo="Observações"
                  descricao="Informações complementares."
                >
                  <textarea
                    value={form.observacao}
                    onChange={(e) =>
                      atualizarCampo(
                        'observacao',
                        e.target.value,
                      )
                    }
                    rows={4}
                    className={`${inputClass} min-h-[110px] resize-y py-3`}
                  />
                </FormSection>
              </div>
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-border-dark bg-[#0f172a]/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={salvando}
                className="rounded-xl border border-border-dark bg-slate-800/50 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Salvar alterações
                  </>
                )}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function FormSection({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white">
          {titulo}
        </h3>

        {descricao && (
          <p className="mt-1 text-xs text-slate-500">
            {descricao}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}

        {required && (
          <span className="ml-1 text-rose-400">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

const inputClass =
  'h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/20';
