import { supabase } from '../../lib/supabaseClient';
import { API_BASE_URL } from '../../config/api';

import type {
  SaeAgendamentoCatalogoResponse,
  SaeAgendamentoDisponibilidadeResponse,
  SaeAgendamentoResumo,
  SaeAgendamentoServicoResumo,
  SaeAgendamentoUsuarioOpcao,
  SaeCancelarAgendamentoResponse,
  SaeMinhaAgendaProfissionalResponse,
  SaeNovoAgendamentoPayload,
  SaeNovoAgendamentoResponse,
} from '../types/saeAgendamento';


export class SaeAgendamentosApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'SaeAgendamentosApiError';
    this.status = status;
    this.details = details;
  }
}

const buildApiUrl = (
  path = '',
  query?: Record<string, string | number | undefined | null>,
) => {
  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  const normalizedPath = path
    ? path.startsWith('/')
      ? path
      : `/${path}`
    : '';

  const url = new URL(`${base}/api/sae/agendamentos${normalizedPath}`);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;

  const token = data.session?.access_token;

  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  return token;
}

async function apiRequest<T>(
  path = '',
  options?: RequestInit,
  query?: Record<string, string | number | undefined | null>,
): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(buildApiUrl(path, query), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new SaeAgendamentosApiError(
      json?.error || 'Erro ao processar o agendamento.',
      response.status,
      json?.details,
    );
  }

  return json as T;
}

const PAGE_SIZE = 1000;
const IN_CHUNK_SIZE = 200;

const safeString = (value: unknown) => String(value ?? '').trim();

const getErrorMessage = (error: unknown, fallback: string) => {
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

const chunk = <T,>(items: T[], size: number): T[][] => {
  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
};

const listarPaginado = async (
  table: string,
  select: string,
  orderBy?: { column: string; ascending?: boolean; nullsFirst?: boolean }[],
): Promise<any[]> => {
  const registros: any[] = [];
  let inicio = 0;

  while (true) {
    const fim = inicio + PAGE_SIZE - 1;

    let query = supabase.from(table).select(select);

    for (const order of orderBy ?? []) {
      query = query.order(order.column, {
        ascending: order.ascending ?? true,
        nullsFirst: order.nullsFirst,
      });
    }

    const { data, error } = await query.range(inicio, fim);

    if (error) {
      throw error;
    }

    const pagina = Array.isArray(data) ? data : [];
    registros.push(...pagina);

    if (pagina.length < PAGE_SIZE) {
      break;
    }

    inicio += PAGE_SIZE;
  }

  return registros;
};

export const saeAgendamentosService = {

  async listarCatalogo(): Promise<SaeAgendamentoCatalogoResponse> {
    return apiRequest<SaeAgendamentoCatalogoResponse>('/catalogo');
  },

  async buscarUsuarios(
    busca: string,
  ): Promise<{ usuarios: SaeAgendamentoUsuarioOpcao[] }> {
    return apiRequest<{ usuarios: SaeAgendamentoUsuarioOpcao[] }>(
      '/usuarios',
      { method: 'GET' },
      { busca, limit: 20 },
    );
  },

  async consultarDisponibilidade(
    profissionalId: string,
    servicoId: string,
    data: string,
  ): Promise<SaeAgendamentoDisponibilidadeResponse> {
    return apiRequest<SaeAgendamentoDisponibilidadeResponse>(
      '/disponibilidade',
      { method: 'GET' },
      { profissionalId, servicoId, data },
    );
  },

  async criar(
    payload: SaeNovoAgendamentoPayload,
  ): Promise<SaeNovoAgendamentoResponse> {
    return apiRequest<SaeNovoAgendamentoResponse>('', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },


  async minhaAgendaProfissional(): Promise<SaeMinhaAgendaProfissionalResponse> {
    return apiRequest<SaeMinhaAgendaProfissionalResponse>('/minha-agenda');
  },

  async cancelar(
    agendamentoId: string,
    motivo: string,
  ): Promise<SaeCancelarAgendamentoResponse> {
    return apiRequest<SaeCancelarAgendamentoResponse>(
      `/${agendamentoId}/cancelar`,
      {
        method: 'PATCH',
        body: JSON.stringify({ motivo }),
      },
    );
  },

  async listar(): Promise<SaeAgendamentoResumo[]> {
    try {
      const [agendamentosRows, agendamentoServicosRows, servicosRows, profissionaisRows] =
        await Promise.all([
          listarPaginado(
            'sae_agendamentos',
            [
              'id',
              'data',
              'tipo_usuario',
              'usuario_id',
              'prontuario_informado',
              'nome_avulso',
              'sexo_avulso',
              'data_nascimento_avulso',
              'tipo_atendimento',
              'status',
              'observacao',
              'created_at',
            ].join(','),
            [
              { column: 'data', ascending: false, nullsFirst: false },
              { column: 'created_at', ascending: false },
            ],
          ),
          listarPaginado(
            'sae_agendamento_servicos',
            [
              'id',
              'agendamento_id',
              'servico_id',
              'profissional_id',
              'turno',
              'hora_inicio',
              'hora_fim',
              'status',
              'observacao',
            ].join(','),
          ),
          listarPaginado('sae_servicos', 'id,nome,sigla,ativo', [
            { column: 'nome', ascending: true },
          ]),
          listarPaginado('sae_profissionais', 'id,nome,ativo', [
            { column: 'nome', ascending: true },
          ]),
        ]);

      const usuarioIds = Array.from(
        new Set(
          agendamentosRows
            .map((row) => safeString(row.usuario_id))
            .filter(Boolean),
        ),
      );

      const usuariosRows: any[] = [];

      for (const ids of chunk(usuarioIds, IN_CHUNK_SIZE)) {
        const { data, error } = await supabase
          .from('sae_usuarios_resumo')
          .select('id,prontuario,nome')
          .in('id', ids);

        if (error) {
          throw error;
        }

        usuariosRows.push(...(data ?? []));
      }

      const usuariosMap = new Map<
        string,
        { prontuario: string; nome: string }
      >();

      for (const usuario of usuariosRows) {
        usuariosMap.set(safeString(usuario.id), {
          prontuario: safeString(usuario.prontuario),
          nome: safeString(usuario.nome),
        });
      }

      const servicosMap = new Map<
        string,
        { nome: string; sigla: string | null }
      >();

      for (const servico of servicosRows) {
        servicosMap.set(safeString(servico.id), {
          nome: safeString(servico.nome) || 'Serviço não informado',
          sigla: safeString(servico.sigla) || null,
        });
      }

      const profissionaisMap = new Map<string, string>();

      for (const profissional of profissionaisRows) {
        profissionaisMap.set(
          safeString(profissional.id),
          safeString(profissional.nome),
        );
      }

      const servicosPorAgendamento = new Map<
        string,
        SaeAgendamentoServicoResumo[]
      >();

      for (const row of agendamentoServicosRows) {
        const agendamentoId = safeString(row.agendamento_id);
        const servicoId = safeString(row.servico_id);
        const profissionalId = safeString(row.profissional_id);
        const servico = servicosMap.get(servicoId);

        const item: SaeAgendamentoServicoResumo = {
          id: safeString(row.id),
          agendamentoId,
          servicoId,
          servicoNome: servico?.nome || 'Serviço não informado',
          servicoSigla: servico?.sigla || null,
          profissionalId: profissionalId || null,
          profissionalNome:
            profissionaisMap.get(profissionalId) || null,
          turno: safeString(row.turno) || null,
          horaInicio: safeString(row.hora_inicio) || null,
          horaFim: safeString(row.hora_fim) || null,
          status: safeString(row.status),
          observacao: safeString(row.observacao) || null,
        };

        const lista = servicosPorAgendamento.get(agendamentoId) ?? [];
        lista.push(item);
        servicosPorAgendamento.set(agendamentoId, lista);
      }

      return agendamentosRows.map((row) => {
        const usuarioId = safeString(row.usuario_id);
        const usuario = usuariosMap.get(usuarioId);
        const nomeAvulso = safeString(row.nome_avulso);
        const prontuarioInformado = safeString(row.prontuario_informado);

        return {
          id: safeString(row.id),
          data: safeString(row.data) || null,
          tipoUsuario: safeString(row.tipo_usuario),
          usuarioId: usuarioId || null,
          prontuario:
            usuario?.prontuario || prontuarioInformado || null,
          nomeUsuario:
            usuario?.nome || nomeAvulso || 'Usuário não identificado',
          sexoAvulso: safeString(row.sexo_avulso) || null,
          dataNascimentoAvulso:
            safeString(row.data_nascimento_avulso) || null,
          tipoAtendimento:
            safeString(row.tipo_atendimento) || null,
          status: safeString(row.status),
          observacao: safeString(row.observacao) || null,
          servicos:
            servicosPorAgendamento.get(safeString(row.id)) ?? [],
        } satisfies SaeAgendamentoResumo;
      });
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          'Não foi possível carregar os agendamentos do SAE.',
        ),
      );
    }
  },
};

export default saeAgendamentosService;
