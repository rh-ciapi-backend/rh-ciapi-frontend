import { API_BASE_URL } from '../../config/api';
import { supabase } from '../../lib/supabaseClient';

import type {
  SaeAtualizarEtapaTriagemPayload,
  SaeCriarTriagemPayload,
  SaeDecisaoTriagemPayload,
  SaeTriagem,
  SaeTriagemEtapaNome,
  SaeMatricularTriagemPayload,
  SaeTriagemMatricula,
} from '../types/saeTriagem';

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;

  const token = data.session?.access_token;

  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  return token;
}

function apiUrl(path = '', query?: Record<string, string | undefined>) {
  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  const normalizedPath = path
    ? path.startsWith('/')
      ? path
      : `/${path}`
    : '';

  const url = new URL(`${base}/api/sae/triagem${normalizedPath}`);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value && value.trim()) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

async function request<T>(
  path = '',
  options: RequestInit = {},
  query?: Record<string, string | undefined>,
): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(apiUrl(path, query), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      json?.error || 'Erro ao processar o módulo de triagem.',
    );
  }

  return json as T;
}

export const saeTriagemService = {
  async listar(filtros?: {
    busca?: string;
    status?: string;
    etapa?: string;
  }): Promise<{ triagens: SaeTriagem[] }> {
    return request<{ triagens: SaeTriagem[] }>(
      '',
      { method: 'GET' },
      {
        busca: filtros?.busca,
        status: filtros?.status,
        etapa: filtros?.etapa,
      },
    );
  },

  async obter(id: string): Promise<{ triagem: SaeTriagem }> {
    return request<{ triagem: SaeTriagem }>(`/${id}`);
  },

  async criar(
    payload: SaeCriarTriagemPayload,
  ): Promise<{ ok: true; triagem: SaeTriagem }> {
    return request<{ ok: true; triagem: SaeTriagem }>('', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async atualizarEtapa(
    triagemId: string,
    etapa: SaeTriagemEtapaNome,
    payload: SaeAtualizarEtapaTriagemPayload,
  ): Promise<{ ok: true; triagem: SaeTriagem }> {
    return request<{ ok: true; triagem: SaeTriagem }>(
      `/${triagemId}/etapas/${etapa}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
  },

  async decidir(
    triagemId: string,
    payload: SaeDecisaoTriagemPayload,
  ): Promise<{ ok: true; triagem: SaeTriagem }> {
    return request<{ ok: true; triagem: SaeTriagem }>(
      `/${triagemId}/decisao`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
  },

  async matricular(
    triagemId: string,
    payload: SaeMatricularTriagemPayload,
  ): Promise<{
    ok: true;
    triagem: SaeTriagem;
    matricula: SaeTriagemMatricula;
  }> {
    return request<{
      ok: true;
      triagem: SaeTriagem;
      matricula: SaeTriagemMatricula;
    }>(
      `/${triagemId}/matricular`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  },
};
