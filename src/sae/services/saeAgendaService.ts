import { supabase } from '../../lib/supabaseClient';
import { API_BASE_URL } from '../../config/api';

import type {
  SaeAgendaAlteracaoPayload,
  SaeAgendaImpacto,
  SaeAgendaListResponse,
  SaeAgendaPeriodo,
  SaeAgendaPeriodoForm,
} from '../types/saeAgenda';

export class SaeAgendaApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'SaeAgendaApiError';
    this.status = status;
    this.details = details;
  }
}

const buildUrl = (path = '') => {
  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  const normalizedPath = path
    ? path.startsWith('/')
      ? path
      : `/${path}`
    : '';

  return `${base}/api/sae/agenda${normalizedPath}`;
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

async function request<T>(path = '', options?: RequestInit): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new SaeAgendaApiError(
      json?.error || 'Erro ao processar a agenda do profissional.',
      response.status,
      json?.details,
    );
  }

  return json as T;
}

export const saeAgendaService = {
  async listarProfissional(profissionalId: string): Promise<SaeAgendaListResponse> {
    return request<SaeAgendaListResponse>(`/profissionais/${profissionalId}`);
  },

  async criarPeriodo(
    profissionalId: string,
    form: SaeAgendaPeriodoForm,
  ): Promise<{ ok: true; agenda: SaeAgendaPeriodo }> {
    return request<{ ok: true; agenda: SaeAgendaPeriodo }>(
      `/profissionais/${profissionalId}`,
      {
        method: 'POST',
        body: JSON.stringify(form),
      },
    );
  },

  async consultarImpacto(agendaId: string): Promise<SaeAgendaImpacto> {
    return request<SaeAgendaImpacto>(`/periodos/${agendaId}/impacto`);
  },

  async editarPeriodo(
    agendaId: string,
    payload: SaeAgendaAlteracaoPayload,
  ): Promise<{ ok: true; agenda: SaeAgendaPeriodo; impacto: SaeAgendaImpacto }> {
    return request<{ ok: true; agenda: SaeAgendaPeriodo; impacto: SaeAgendaImpacto }>(
      `/periodos/${agendaId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    );
  },

  async inativarPeriodo(
    agendaId: string,
    payload: { confirmarImpacto?: boolean; motivoAlteracao?: string } = {},
  ): Promise<{ ok: true; impacto: SaeAgendaImpacto }> {
    return request<{ ok: true; impacto: SaeAgendaImpacto }>(
      `/periodos/${agendaId}`,
      {
        method: 'DELETE',
        body: JSON.stringify(payload),
      },
    );
  },
};

export default saeAgendaService;
