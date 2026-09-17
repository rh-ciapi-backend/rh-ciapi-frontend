import { supabase } from '../../lib/supabaseClient';

import type {
  ListarSaeUsuariosParams,
  SaeUsuarioDbRow,
  SaeUsuarioResumo,
  SituacaoUsuario,
} from '../types/saeUsuario';

const VIEW_USUARIOS = 'sae_usuarios_resumo';

const PAGE_SIZE = 1000;

const safeString = (value: unknown) =>
  String(value ?? '').trim();

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
};

export default saeUsuariosService;
