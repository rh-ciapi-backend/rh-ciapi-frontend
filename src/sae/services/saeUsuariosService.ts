import { supabase } from '../../lib/supabaseClient';

import type {
  ListarSaeUsuariosParams,
  SaeUsuarioDbRow,
  SaeUsuarioResumo,
  SituacaoUsuario,
} from '../types/saeUsuario';

import type { SaeUsuarioForm } from '../types/saeUsuarioForm';

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

export const saeUsuariosService = {
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

  async adicionar(
    form: SaeUsuarioForm,
  ): Promise<SaeUsuarioResumo> {
    let usuarioCriadoId: string | null = null;

    try {
      const usuarioPayload = {
        prontuario: safeString(form.prontuario),
        turno: safeString(form.turno) || null,
        nome: safeString(form.nome),
        sexo: safeString(form.sexo) || null,
        nacionalidade:
          safeString(form.nacionalidade) || null,

        rg_original:
          safeString(form.rg) || null,
        rg_normalizado:
          onlyDigits(form.rg) || null,

        cpf_original:
          safeString(form.cpf) || null,
        cpf_normalizado:
          onlyDigits(form.cpf) || null,

        data_nascimento:
          form.dataNascimento || null,

        cartao_sus_original:
          safeString(form.cartaoSus) || null,
        cartao_sus_normalizado:
          onlyDigits(form.cartaoSus) || null,

        data_ingresso:
          form.dataIngresso || null,

        situacao_cadastral:
          form.situacaoCadastral,

        raca:
          safeString(form.raca) || null,

        possui_deficiencia:
          form.possuiDeficiencia,

        tipo_deficiencia:
          form.possuiDeficiencia
            ? safeString(form.tipoDeficiencia) || null
            : null,

        observacao:
          safeString(form.observacao) || null,
      };

      const { data: usuarioData, error: usuarioError } =
        await supabase
          .from(TABLE_USUARIOS)
          .insert(usuarioPayload)
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

        const { error: enderecoError } = await supabase
          .from(TABLE_ENDERECOS)
          .insert({
            usuario_id: usuarioCriadoId,
            endereco_original:
              enderecoOriginal || null,
            logradouro:
              safeString(form.endereco.logradouro) || null,
            numero:
              safeString(form.endereco.numero) || null,
            complemento:
              safeString(form.endereco.complemento) || null,
            bairro:
              safeString(form.endereco.bairro) || null,
            cidade:
              safeString(form.endereco.cidade) ||
              'Boa Vista',
            uf:
              safeString(form.endereco.uf) || 'RR',
            cep:
              onlyDigits(form.endereco.cep) || null,
            principal: true,
          });

        if (enderecoError) {
          throw new Error(
            getErrorMessage(
              enderecoError,
              'Usuário criado, mas ocorreu erro ao cadastrar o endereço.',
            ),
          );
        }
      }

      const contatosValidos = form.contatos
        .filter((contato) =>
          safeString(contato.telefone),
        )
        .map((contato, index) => ({
          usuario_id: usuarioCriadoId,
          ordem: index + 1,
          telefone_original:
            safeString(contato.telefone),
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
          principal:
            contato.principal,
        }));

      if (contatosValidos.length > 0) {
        const possuiPrincipal =
          contatosValidos.some(
            (contato) => contato.principal,
          );

        if (!possuiPrincipal) {
          contatosValidos[0].principal = true;
        }

        const { error: contatosError } = await supabase
          .from(TABLE_CONTATOS)
          .insert(contatosValidos);

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
