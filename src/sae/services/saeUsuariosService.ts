import { supabase } from '../../lib/supabaseClient';

import type {
  ListarSaeUsuariosParams,
  SaeUsuarioDbRow,
  SaeUsuarioResumo,
  SituacaoUsuario,
} from '../types/saeUsuario';

import type { SaeUsuarioForm } from '../types/saeUsuarioForm';

import type {
  SaeUsuarioPerfil,
  SaeUsuarioDadosCadastrais,
  SaeUsuarioEndereco,
  SaeUsuarioContato,
  SaeUsuarioAgendamento,
  SaeUsuarioAgendamentoServico,
  SaeUsuarioAtendimento,
  SaeUsuarioSinalVital,
  SaeUsuarioAvaliacaoServico,
  SaeUsuarioCicloAvaliacao,
} from '../types/saeUsuarioPerfil';

const VIEW_USUARIOS = 'sae_usuarios_resumo';
const TABLE_USUARIOS = 'sae_usuarios';
const TABLE_ENDERECOS = 'sae_enderecos';
const TABLE_CONTATOS = 'sae_contatos';

const PAGE_SIZE = 1000;

const safeString = (value: unknown) =>
  String(value ?? '').trim();

const onlyDigits = (value: unknown) =>
  safeString(value).replace(/\D/g, '');

const getErrorMessage = (
  error: unknown,
  fallback: string,
) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
};

const normalizeSituacao = (
  value: unknown,
): SituacaoUsuario => {
  const normalized = safeString(value).toUpperCase();

  if (normalized.includes('INATIVO')) {
    return 'INATIVO';
  }

  return 'ATIVO';
};

const situacaoParaBanco = (
  situacao: SituacaoUsuario,
) => {
  return situacao === 'ATIVO'
    ? 'Usuário ATIVO'
    : 'Usuário INATIVO';
};

const mapFromDB = (
  row: SaeUsuarioDbRow,
): SaeUsuarioResumo => ({
  id: safeString(row.id),
  prontuario: safeString(row.prontuario),
  nome: safeString(row.nome),
  sexo: safeString(row.sexo) || null,
  nacionalidade: safeString(row.nacionalidade) || null,
  dataNascimento: safeString(row.data_nascimento) || null,
  idade:
    typeof row.idade === 'number'
      ? row.idade
      : row.idade != null
        ? Number(row.idade)
        : null,
  turno: safeString(row.turno) || null,
  situacao: normalizeSituacao(row.situacao_cadastral),
  enderecoOriginal:
    safeString(row.endereco_original) || null,
  bairro: safeString(row.bairro) || null,
  telefonePrincipal:
    safeString(row.telefone_principal) || null,
});

const escapeSearchTerm = (value: string) =>
  value
    .replace(/[%_,]/g, ' ')
    .trim();

const aplicarFiltros = (
  query: any,
  params?: ListarSaeUsuariosParams,
) => {
  let result = query;

  if (params?.busca) {
    const busca = escapeSearchTerm(params.busca);

    if (busca) {
      result = result.or(
        `nome.ilike.%${busca}%,prontuario.ilike.%${busca}%`,
      );
    }
  }

  if (
    params?.situacao &&
    params.situacao !== 'TODOS'
  ) {
    result = result.eq(
      'situacao_cadastral',
      situacaoParaBanco(params.situacao),
    );
  }

  if (
    params?.turno &&
    params.turno !== 'TODOS'
  ) {
    result = result.eq('turno', params.turno);
  }

  return result;
};

const buildUsuarioPayload = (form: SaeUsuarioForm) => ({
  prontuario: safeString(form.prontuario),
  turno: safeString(form.turno) || null,
  nome: safeString(form.nome),
  sexo: safeString(form.sexo) || null,
  nacionalidade: safeString(form.nacionalidade) || null,

  rg_original: safeString(form.rg) || null,
  rg_normalizado: onlyDigits(form.rg) || null,

  cpf_original: safeString(form.cpf) || null,
  cpf_normalizado: onlyDigits(form.cpf) || null,

  data_nascimento: form.dataNascimento || null,

  cartao_sus_original: safeString(form.cartaoSus) || null,
  cartao_sus_normalizado: onlyDigits(form.cartaoSus) || null,

  data_ingresso: form.dataIngresso || null,

  situacao_cadastral: form.situacaoCadastral,

  data_desligamento:
    form.situacaoCadastral === 'INATIVO'
      ? form.dataDesligamento || null
      : null,

  motivo_desligamento:
    form.situacaoCadastral === 'INATIVO'
      ? safeString(form.motivoDesligamento) || null
      : null,

  raca: safeString(form.raca) || null,

  escolaridade_normalizada:
    safeString(form.escolaridade) || null,

  faixa_renda:
    safeString(form.faixaRenda) || null,

  possui_deficiencia: form.possuiDeficiencia,

  tipo_deficiencia: form.possuiDeficiencia
    ? safeString(form.tipoDeficiencia) || null
    : null,

  observacao: safeString(form.observacao) || null,
});

const buildEnderecoPayload = (
  usuarioId: string,
  form: SaeUsuarioForm,
) => {
  const enderecoOriginal = [
    safeString(form.endereco.logradouro),
    safeString(form.endereco.numero),
    safeString(form.endereco.complemento),
    safeString(form.endereco.bairro),
    safeString(form.endereco.cidade),
    safeString(form.endereco.uf),
    safeString(form.endereco.cep),
  ]
    .filter(Boolean)
    .join(', ');

  return {
    usuario_id: usuarioId,
    endereco_original: enderecoOriginal || null,
    logradouro: safeString(form.endereco.logradouro) || null,
    numero: safeString(form.endereco.numero) || null,
    complemento: safeString(form.endereco.complemento) || null,
    bairro: safeString(form.endereco.bairro) || null,
    cidade: safeString(form.endereco.cidade) || 'Boa Vista',
    uf: safeString(form.endereco.uf) || 'RR',
    cep: onlyDigits(form.endereco.cep) || null,
    principal: true,
  };
};

const buildContatosPayload = (
  usuarioId: string,
  form: SaeUsuarioForm,
) => {
  const contatos = form.contatos
    .filter((contato) => safeString(contato.telefone))
    .map((contato, index) => ({
      usuario_id: usuarioId,
      ordem: index + 1,
      telefone_original: safeString(contato.telefone),
      telefone_normalizado:
        onlyDigits(contato.telefone) || null,
      nome_contato:
        safeString(contato.nomeContato) || null,
      parentesco:
        safeString(contato.parentesco) || null,
      tipo:
        safeString(contato.tipo) || null,
      observacao:
        safeString(contato.observacao) || null,
      principal: contato.principal,
    }));

  if (
    contatos.length > 0 &&
    !contatos.some((contato) => contato.principal)
  ) {
    contatos[0].principal = true;
  }

  return contatos;
};

export const saeUsuariosService = {
  async reservarProximoProntuario(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc(
        'sae_reservar_proximo_prontuario',
      );

      if (error) {
        throw new Error(
          getErrorMessage(
            error,
            'Falha ao gerar o próximo prontuário.',
          ),
        );
      }

      const prontuario = safeString(data);

      if (!prontuario) {
        throw new Error(
          'O banco não retornou o número do prontuário.',
        );
      }

      return prontuario;
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          'Falha ao gerar o próximo prontuário.',
        ),
      );
    }
  },

  async listar(
    params?: ListarSaeUsuariosParams,
  ): Promise<SaeUsuarioResumo[]> {
    try {
      const limite =
        params?.limite && params.limite > 0
          ? params.limite
          : undefined;

      const registros: SaeUsuarioDbRow[] = [];

      let inicio = 0;

      while (true) {
        const fim = inicio + PAGE_SIZE - 1;

        let query = supabase
          .from(VIEW_USUARIOS)
          .select(
            [
              'id',
              'prontuario',
              'nome',
              'sexo',
              'nacionalidade',
              'data_nascimento',
              'idade',
              'turno',
              'situacao_cadastral',
              'endereco_original',
              'bairro',
              'telefone_principal',
            ].join(','),
          );

        query = aplicarFiltros(query, params);

        query = query
          .order('nome', { ascending: true })
          .range(inicio, fim);

        const { data, error } = await query;

        if (error) {
          throw new Error(
            getErrorMessage(
              error,
              'Falha ao listar usuários do SAE.',
            ),
          );
        }

        const pagina =
          (Array.isArray(data)
            ? data
            : []) as SaeUsuarioDbRow[];

        registros.push(...pagina);

        if (limite && registros.length >= limite) {
          break;
        }

        if (pagina.length < PAGE_SIZE) {
          break;
        }

        inicio += PAGE_SIZE;
      }

      const resultado = registros.map(mapFromDB);

      if (limite) {
        return resultado.slice(0, limite);
      }

      return resultado;
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          'Falha ao listar usuários do SAE.',
        ),
      );
    }
  },

  async obterPorId(
    id: string,
  ): Promise<SaeUsuarioResumo | null> {
    try {
      const usuarioId = safeString(id);

      if (!usuarioId) {
        return null;
      }

      const { data, error } = await supabase
        .from(VIEW_USUARIOS)
        .select(
          [
            'id',
            'prontuario',
            'nome',
            'sexo',
            'nacionalidade',
            'data_nascimento',
            'idade',
            'turno',
            'situacao_cadastral',
            'endereco_original',
            'bairro',
            'telefone_principal',
          ].join(','),
        )
        .eq('id', usuarioId)
        .maybeSingle();

      if (error) {
        throw new Error(
          getErrorMessage(
            error,
            'Falha ao obter usuário do SAE.',
          ),
        );
      }

      return data
        ? mapFromDB(data as SaeUsuarioDbRow)
        : null;
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          'Falha ao obter usuário do SAE.',
        ),
      );
    }
  },

  async obterFormularioEdicao(
    id: string,
  ): Promise<SaeUsuarioForm | null> {
    try {
      const usuarioId = safeString(id);

      if (!usuarioId) {
        return null;
      }

      const [
        usuarioResponse,
        enderecoResponse,
        contatosResponse,
      ] = await Promise.all([
        supabase
          .from(TABLE_USUARIOS)
          .select('*')
          .eq('id', usuarioId)
          .maybeSingle(),

        supabase
          .from(TABLE_ENDERECOS)
          .select('*')
          .eq('usuario_id', usuarioId)
          .order('principal', { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from(TABLE_CONTATOS)
          .select('*')
          .eq('usuario_id', usuarioId)
          .order('principal', { ascending: false })
          .order('ordem', { ascending: true }),
      ]);

      if (usuarioResponse.error) {
        throw usuarioResponse.error;
      }

      if (enderecoResponse.error) {
        throw enderecoResponse.error;
      }

      if (contatosResponse.error) {
        throw contatosResponse.error;
      }

      const row = usuarioResponse.data;

      if (!row) {
        return null;
      }

      const endereco = enderecoResponse.data;

      const contatos = (contatosResponse.data ?? []).map(
        (contato: any) => ({
          telefone:
            safeString(contato.telefone_original) ||
            safeString(contato.telefone_normalizado),
          nomeContato:
            safeString(contato.nome_contato),
          parentesco:
            safeString(contato.parentesco),
          tipo:
            safeString(contato.tipo) || 'CELULAR',
          observacao:
            safeString(contato.observacao),
          principal:
            Boolean(contato.principal),
        }),
      );

      return {
        prontuario: safeString(row.prontuario),
        turno:
          safeString(row.turno) === 'MANHÃ' ||
          safeString(row.turno) === 'TARDE'
            ? safeString(row.turno) as 'MANHÃ' | 'TARDE'
            : '',
        nome: safeString(row.nome),
        sexo: safeString(row.sexo),
        nacionalidade:
          safeString(row.nacionalidade) || 'BRASILEIRA',
        rg: safeString(row.rg_original),
        cpf: safeString(row.cpf_original),
        dataNascimento:
          safeString(row.data_nascimento),
        cartaoSus:
          safeString(row.cartao_sus_original),
        dataIngresso:
          safeString(row.data_ingresso),
        situacaoCadastral:
          normalizeSituacao(
            row.situacao_cadastral,
          ),
        dataDesligamento:
          safeString(row.data_desligamento),
        motivoDesligamento:
          safeString(row.motivo_desligamento) ||
          safeString(row.motivo_desligamento_original),
        raca:
          safeString(row.raca) || 'NÃO INFORMADO',
        escolaridade:
          safeString(row.escolaridade_normalizada) ||
          safeString(row.escolaridade_original),
        faixaRenda:
          safeString(row.faixa_renda) ||
          safeString(row.rendimento_original),
        possuiDeficiencia:
          Boolean(row.possui_deficiencia),
        tipoDeficiencia:
          safeString(row.tipo_deficiencia),
        observacao:
          safeString(row.observacao),

        endereco: {
          logradouro:
            safeString(endereco?.logradouro),
          numero:
            safeString(endereco?.numero),
          complemento:
            safeString(endereco?.complemento),
          bairro:
            safeString(endereco?.bairro),
          cidade:
            safeString(endereco?.cidade) ||
            'Boa Vista',
          uf:
            safeString(endereco?.uf) || 'RR',
          cep:
            safeString(endereco?.cep),
        },

        contatos:
          contatos.length > 0
            ? contatos
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
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          'Falha ao carregar os dados para edição.',
        ),
      );
    }
  },

  async editar(
    id: string,
    form: SaeUsuarioForm,
  ): Promise<SaeUsuarioResumo> {
    try {
      const usuarioId = safeString(id);

      if (!usuarioId) {
        throw new Error('Usuário inválido.');
      }

      const { error: usuarioError } = await supabase
        .from(TABLE_USUARIOS)
        .update(buildUsuarioPayload(form))
        .eq('id', usuarioId);

      if (usuarioError) {
        throw new Error(
          getErrorMessage(
            usuarioError,
            'Falha ao atualizar os dados do usuário.',
          ),
        );
      }

      const enderecoTemDados =
        safeString(form.endereco.logradouro) ||
        safeString(form.endereco.numero) ||
        safeString(form.endereco.complemento) ||
        safeString(form.endereco.bairro) ||
        safeString(form.endereco.cep);

      const { data: enderecoExistente, error: enderecoBuscaError } =
        await supabase
          .from(TABLE_ENDERECOS)
          .select('id')
          .eq('usuario_id', usuarioId)
          .order('principal', { ascending: false })
          .limit(1)
          .maybeSingle();

      if (enderecoBuscaError) {
        throw enderecoBuscaError;
      }

      if (enderecoTemDados) {
        const enderecoPayload = buildEnderecoPayload(
          usuarioId,
          form,
        );

        if (enderecoExistente?.id) {
          const { error } = await supabase
            .from(TABLE_ENDERECOS)
            .update(enderecoPayload)
            .eq('id', enderecoExistente.id);

          if (error) {
            throw error;
          }
        } else {
          const { error } = await supabase
            .from(TABLE_ENDERECOS)
            .insert(enderecoPayload);

          if (error) {
            throw error;
          }
        }
      }

      const { error: deleteContatosError } = await supabase
        .from(TABLE_CONTATOS)
        .delete()
        .eq('usuario_id', usuarioId);

      if (deleteContatosError) {
        throw deleteContatosError;
      }

      const contatosPayload = buildContatosPayload(
        usuarioId,
        form,
      );

      if (contatosPayload.length > 0) {
        const { error: contatosError } = await supabase
          .from(TABLE_CONTATOS)
          .insert(contatosPayload);

        if (contatosError) {
          throw contatosError;
        }
      }

      const atualizado =
        await saeUsuariosService.obterPorId(usuarioId);

      if (!atualizado) {
        throw new Error(
          'Dados atualizados, mas não foi possível recarregar o usuário.',
        );
      }

      return atualizado;
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          'Falha ao atualizar usuário do SAE.',
        ),
      );
    }
  },

  async obterPerfil(
    id: string,
  ): Promise<SaeUsuarioPerfil | null> {
    try {
      const usuarioId = safeString(id);

      if (!usuarioId) {
        return null;
      }

      const usuario =
        await saeUsuariosService.obterPorId(usuarioId);

      if (!usuario) {
        return null;
      }

      const [
        cadastroResponse,
        enderecosResponse,
        contatosResponse,
        agendamentosResponse,
        atendimentosResponse,
        sinaisVitaisResponse,
        avaliacoesResponse,
        ciclosResponse,
      ] = await Promise.all([
        supabase
          .from(TABLE_USUARIOS)
          .select(
            [
              'rg_original',
              'cpf_original',
              'cartao_sus_original',
              'data_ingresso',
              'data_desligamento',
              'motivo_desligamento',
              'motivo_desligamento_original',
              'raca',
              'deficiencia_original',
              'possui_deficiencia',
              'tipo_deficiencia',
              'escolaridade_original',
              'escolaridade_normalizada',
              'rendimento_original',
              'faixa_renda',
              'observacao',
            ].join(','),
          )
          .eq('id', usuarioId)
          .maybeSingle(),

        supabase
          .from('sae_enderecos')
          .select('*')
          .eq('usuario_id', usuarioId)
          .order('principal', { ascending: false }),

        supabase
          .from('sae_contatos')
          .select('*')
          .eq('usuario_id', usuarioId)
          .order('principal', { ascending: false })
          .order('ordem', { ascending: true }),

        supabase
          .from('sae_agendamentos')
          .select('*')
          .eq('usuario_id', usuarioId)
          .order('data', { ascending: false }),

        supabase
          .from('sae_atendimentos')
          .select('*')
          .eq('usuario_id', usuarioId)
          .order('data_atendimento', { ascending: false }),

        supabase
          .from('sae_sinais_vitais')
          .select('*')
          .eq('usuario_id', usuarioId)
          .order('data_afericao', { ascending: false }),

        supabase
          .from('sae_avaliacoes_servicos')
          .select('*')
          .eq('usuario_id', usuarioId)
          .order('ano_referencia', { ascending: false }),

        supabase
          .from('sae_ciclos_avaliacao')
          .select('*')
          .eq('usuario_id', usuarioId)
          .order('periodo_referencia', { ascending: false }),
      ]);

      const responses = [
        cadastroResponse,
        enderecosResponse,
        contatosResponse,
        agendamentosResponse,
        atendimentosResponse,
        sinaisVitaisResponse,
        avaliacoesResponse,
        ciclosResponse,
      ];

      const respostaComErro = responses.find(
        (response) => response.error,
      );

      if (respostaComErro?.error) {
        throw respostaComErro.error;
      }

      const agendamentosRows =
        agendamentosResponse.data ?? [];

      const agendamentoIds = agendamentosRows
        .map((item: any) => safeString(item.id))
        .filter(Boolean);

      let agendamentoServicosRows: any[] = [];

      if (agendamentoIds.length > 0) {
        const { data, error } = await supabase
          .from('sae_agendamento_servicos')
          .select('*')
          .in('agendamento_id', agendamentoIds);

        if (error) {
          throw error;
        }

        agendamentoServicosRows = data ?? [];
      }

      const atendimentosRows =
        atendimentosResponse.data ?? [];

      const avaliacoesRows =
        avaliacoesResponse.data ?? [];

      const servicoIds = Array.from(
        new Set(
          [
            ...agendamentoServicosRows.map(
              (item) => safeString(item.servico_id),
            ),
            ...atendimentosRows.map(
              (item: any) => safeString(item.servico_id),
            ),
            ...avaliacoesRows.map(
              (item: any) => safeString(item.servico_id),
            ),
          ].filter(Boolean),
        ),
      );

      const profissionalIds = Array.from(
        new Set(
          [
            ...agendamentoServicosRows.map(
              (item) =>
                safeString(item.profissional_id),
            ),
            ...atendimentosRows.map(
              (item: any) =>
                safeString(item.profissional_id),
            ),
          ].filter(Boolean),
        ),
      );

      const servicosMap = new Map<
        string,
        { nome: string; sigla: string }
      >();

      if (servicoIds.length > 0) {
        const { data, error } = await supabase
          .from('sae_servicos')
          .select('id,nome,sigla')
          .in('id', servicoIds);

        if (error) {
          throw error;
        }

        for (const servico of data ?? []) {
          servicosMap.set(safeString(servico.id), {
            nome: safeString(servico.nome),
            sigla: safeString(servico.sigla),
          });
        }
      }

      const profissionaisMap = new Map<string, string>();

      if (profissionalIds.length > 0) {
        const { data, error } = await supabase
          .from('sae_profissionais')
          .select('id,nome')
          .in('id', profissionalIds);

        if (error) {
          throw error;
        }

        for (const profissional of data ?? []) {
          profissionaisMap.set(
            safeString(profissional.id),
            safeString(profissional.nome),
          );
        }
      }

      const cadastroRow = cadastroResponse.data ?? {};

      const dadosCadastrais: SaeUsuarioDadosCadastrais = {
        rgOriginal: safeString((cadastroRow as any).rg_original) || null,
        cpfOriginal: safeString((cadastroRow as any).cpf_original) || null,
        cartaoSusOriginal: safeString((cadastroRow as any).cartao_sus_original) || null,
        dataIngresso: safeString((cadastroRow as any).data_ingresso) || null,
        dataDesligamento: safeString((cadastroRow as any).data_desligamento) || null,
        motivoDesligamento: safeString((cadastroRow as any).motivo_desligamento) || null,
        motivoDesligamentoOriginal: safeString((cadastroRow as any).motivo_desligamento_original) || null,
        raca: safeString((cadastroRow as any).raca) || null,
        deficienciaOriginal: safeString((cadastroRow as any).deficiencia_original) || null,
        possuiDeficiencia:
          (cadastroRow as any).possui_deficiencia == null
            ? null
            : Boolean((cadastroRow as any).possui_deficiencia),
        tipoDeficiencia: safeString((cadastroRow as any).tipo_deficiencia) || null,
        escolaridadeOriginal: safeString((cadastroRow as any).escolaridade_original) || null,
        escolaridadeNormalizada: safeString((cadastroRow as any).escolaridade_normalizada) || null,
        rendimentoOriginal: safeString((cadastroRow as any).rendimento_original) || null,
        faixaRenda: safeString((cadastroRow as any).faixa_renda) || null,
        observacao: safeString((cadastroRow as any).observacao) || null,
      };

      const enderecos: SaeUsuarioEndereco[] =
        (enderecosResponse.data ?? []).map(
          (row: any) => ({
            id: safeString(row.id),
            usuarioId: safeString(row.usuario_id),
            enderecoOriginal:
              safeString(row.endereco_original) || null,
            logradouro:
              safeString(row.logradouro) || null,
            numero: safeString(row.numero) || null,
            complemento:
              safeString(row.complemento) || null,
            bairro: safeString(row.bairro) || null,
            cidade: safeString(row.cidade) || null,
            uf: safeString(row.uf) || null,
            cep: safeString(row.cep) || null,
            principal: Boolean(row.principal),
          }),
        );

      const contatos: SaeUsuarioContato[] =
        (contatosResponse.data ?? []).map(
          (row: any) => ({
            id: safeString(row.id),
            usuarioId: safeString(row.usuario_id),
            ordem:
              row.ordem != null
                ? Number(row.ordem)
                : null,
            telefoneOriginal:
              safeString(row.telefone_original) || null,
            telefoneNormalizado:
              safeString(row.telefone_normalizado) || null,
            nomeContato:
              safeString(row.nome_contato) || null,
            parentesco:
              safeString(row.parentesco) || null,
            tipo: safeString(row.tipo) || null,
            observacao:
              safeString(row.observacao) || null,
            principal: Boolean(row.principal),
          }),
        );

      const servicosPorAgendamento =
        new Map<string, SaeUsuarioAgendamentoServico[]>();

      for (const row of agendamentoServicosRows) {
        const agendamentoId =
          safeString(row.agendamento_id);

        const servicoId =
          safeString(row.servico_id);

        const profissionalId =
          safeString(row.profissional_id);

        const servico =
          servicosMap.get(servicoId);

        const item: SaeUsuarioAgendamentoServico = {
          id: safeString(row.id),
          agendamentoId,
          servicoId,
          servicoNome: servico?.nome || null,
          servicoSigla: servico?.sigla || null,
          profissionalId:
            profissionalId || null,
          profissionalNome:
            profissionaisMap.get(profissionalId) || null,
          turno: safeString(row.turno) || null,
          horaInicio:
            safeString(row.hora_inicio) || null,
          horaFim:
            safeString(row.hora_fim) || null,
          status: safeString(row.status),
          observacao:
            safeString(row.observacao) || null,
        };

        const lista =
          servicosPorAgendamento.get(agendamentoId) ?? [];

        lista.push(item);

        servicosPorAgendamento.set(
          agendamentoId,
          lista,
        );
      }

      const agendamentos: SaeUsuarioAgendamento[] =
        agendamentosRows.map((row: any) => ({
          id: safeString(row.id),
          data: safeString(row.data) || null,
          tipoUsuario: safeString(row.tipo_usuario),
          usuarioId:
            safeString(row.usuario_id) || null,
          prontuarioInformado:
            safeString(row.prontuario_informado) || null,
          nomeAvulso:
            safeString(row.nome_avulso) || null,
          sexoAvulso:
            safeString(row.sexo_avulso) || null,
          dataNascimentoAvulso:
            safeString(row.data_nascimento_avulso) ||
            null,
          tipoAtendimento:
            safeString(row.tipo_atendimento) || null,
          status: safeString(row.status),
          observacao:
            safeString(row.observacao) || null,
          servicos:
            servicosPorAgendamento.get(
              safeString(row.id),
            ) ?? [],
        }));

      const atendimentos: SaeUsuarioAtendimento[] =
        atendimentosRows.map((row: any) => {
          const servicoId =
            safeString(row.servico_id);

          const profissionalId =
            safeString(row.profissional_id);

          const servico =
            servicosMap.get(servicoId);

          return {
            id: safeString(row.id),
            usuarioId:
              safeString(row.usuario_id) || null,
            agendamentoId:
              safeString(row.agendamento_id) || null,
            agendamentoServicoId:
              safeString(
                row.agendamento_servico_id,
              ) || null,
            servicoId,
            servicoNome: servico?.nome || null,
            servicoSigla: servico?.sigla || null,
            profissionalId:
              profissionalId || null,
            profissionalNome:
              profissionaisMap.get(
                profissionalId,
              ) || null,
            dataAtendimento:
              safeString(row.data_atendimento),
            horaInicio:
              safeString(row.hora_inicio) || null,
            horaFim:
              safeString(row.hora_fim) || null,
            tipoAtendimento:
              safeString(row.tipo_atendimento) ||
              null,
            procedimento:
              safeString(row.procedimento) || null,
            evolucao:
              safeString(row.evolucao) || null,
            observacao:
              safeString(row.observacao) || null,
            status: safeString(row.status),
          };
        });

      const sinaisVitais: SaeUsuarioSinalVital[] =
        (sinaisVitaisResponse.data ?? []).map(
          (row: any) => ({
            id: safeString(row.id),
            usuarioId:
              safeString(row.usuario_id) || null,
            atendimentoId:
              safeString(row.atendimento_id) ||
              null,
            prontuarioInformado:
              safeString(row.prontuario_informado) ||
              null,
            nomeAvulso:
              safeString(row.nome_avulso) || null,
            dataAfericao:
              safeString(row.data_afericao),
            pressaoSistolica:
              row.pressao_sistolica != null
                ? Number(row.pressao_sistolica)
                : null,
            pressaoDiastolica:
              row.pressao_diastolica != null
                ? Number(row.pressao_diastolica)
                : null,
            statusOriginal:
              safeString(row.status_original) ||
              null,
            observacao:
              safeString(row.observacao) || null,
          }),
        );

      const avaliacoes: SaeUsuarioAvaliacaoServico[] =
        avaliacoesRows.map((row: any) => {
          const servicoId =
            safeString(row.servico_id);

          const servico =
            servicosMap.get(servicoId);

          return {
            id: safeString(row.id),
            usuarioId:
              safeString(row.usuario_id),
            servicoId,
            servicoNome:
              servico?.nome || null,
            servicoSigla:
              servico?.sigla || null,
            anoReferencia:
              Number(row.ano_referencia),
            dataAvaliacao:
              safeString(row.data_avaliacao) ||
              null,
            status:
              safeString(row.status) || null,
            valorOriginal:
              safeString(row.valor_original) ||
              null,
            observacao:
              safeString(row.observacao) ||
              null,
          };
        });

      const ciclosAvaliacao:
        SaeUsuarioCicloAvaliacao[] =
        (ciclosResponse.data ?? []).map(
          (row: any) => ({
            id: safeString(row.id),
            usuarioId:
              safeString(row.usuario_id),
            periodoReferencia:
              safeString(row.periodo_referencia),
            dataInicio:
              safeString(row.data_inicio) || null,
            dataFim:
              safeString(row.data_fim) || null,
            statusInicio:
              safeString(row.status_inicio) || null,
            statusFim:
              safeString(row.status_fim) || null,
            valorInicioOriginal:
              safeString(row.valor_inicio_original) ||
              null,
            valorFimOriginal:
              safeString(row.valor_fim_original) ||
              null,
            observacao:
              safeString(row.observacao) || null,
          }),
        );

      return {
        usuario,
        dadosCadastrais,
        enderecoPrincipal:
          enderecos.find(
            (endereco) => endereco.principal,
          ) ??
          enderecos[0] ??
          null,
        enderecos,
        contatos,
        agendamentos,
        atendimentos,
        sinaisVitais,
        avaliacoes,
        ciclosAvaliacao,
      };
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          'Falha ao carregar o perfil do usuário.',
        ),
      );
    }
  },

  async adicionar(
    form: SaeUsuarioForm,
  ): Promise<SaeUsuarioResumo> {
    let usuarioCriadoId: string | null = null;

    try {
      const { data: usuarioData, error: usuarioError } =
        await supabase
          .from(TABLE_USUARIOS)
          .insert(buildUsuarioPayload(form))
          .select('id')
          .single();

      if (usuarioError || !usuarioData?.id) {
        throw new Error(
          getErrorMessage(
            usuarioError,
            'Falha ao cadastrar usuário.',
          ),
        );
      }

      usuarioCriadoId = usuarioData.id;

      const enderecoTemDados =
        safeString(form.endereco.logradouro) ||
        safeString(form.endereco.numero) ||
        safeString(form.endereco.complemento) ||
        safeString(form.endereco.bairro) ||
        safeString(form.endereco.cep);

      if (enderecoTemDados) {
        const { error: enderecoError } = await supabase
          .from(TABLE_ENDERECOS)
          .insert(
            buildEnderecoPayload(
              usuarioCriadoId,
              form,
            ),
          );

        if (enderecoError) {
          throw new Error(
            getErrorMessage(
              enderecoError,
              'Usuário criado, mas ocorreu erro ao cadastrar o endereço.',
            ),
          );
        }
      }

      const contatosPayload =
        buildContatosPayload(
          usuarioCriadoId,
          form,
        );

      if (contatosPayload.length > 0) {
        const { error: contatosError } = await supabase
          .from(TABLE_CONTATOS)
          .insert(contatosPayload);

        if (contatosError) {
          throw new Error(
            getErrorMessage(
              contatosError,
              'Usuário criado, mas ocorreu erro ao cadastrar os contatos.',
            ),
          );
        }
      }

      const usuarioCriado =
        await saeUsuariosService.obterPorId(
          usuarioCriadoId,
        );

      if (!usuarioCriado) {
        throw new Error(
          'Usuário cadastrado, mas não foi possível carregar os dados atualizados.',
        );
      }

      return usuarioCriado;
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          'Falha ao cadastrar usuário do SAE.',
        ),
      );
    }
  },
};

export default saeUsuariosService;
