import { supabase } from '../../lib/supabaseClient';
import { API_BASE_URL } from '../../config/api';

import type {
  SaeProfissional,
  SaeProfissionalForm,
  SaeProfissionaisListResponse,
  SaeUsuarioSistemaOpcao,
} from '../types/saeProfissional';

const buildUrl = (path = '') => {
  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  const normalizedPath = path
    ? path.startsWith('/')
      ? path
      : `/${path}`
    : '';

  return `${base}/api/sae/profissionais${normalizedPath}`;
};

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

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
    throw new Error(
      json?.error || 'Erro ao processar a solicitação de profissionais do SAE.',
    );
  }

  return json as T;
}

export const saeProfissionaisService = {
  async listar(): Promise<SaeProfissionaisListResponse> {
    return request<SaeProfissionaisListResponse>();
  },

  async adicionar(
    form: SaeProfissionalForm,
  ): Promise<{ ok: true; profissional: SaeProfissional }> {
    return request<{ ok: true; profissional: SaeProfissional }>('', {
      method: 'POST',
      body: JSON.stringify(form),
    });
  },

  async editar(
    id: string,
    form: SaeProfissionalForm,
  ): Promise<{ ok: true; profissional: SaeProfissional }> {
    return request<{ ok: true; profissional: SaeProfissional }>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    });
  },

  async alterarStatus(
    id: string,
    ativo: boolean,
  ): Promise<{ ok: true; profissional: SaeProfissional }> {
    return request<{ ok: true; profissional: SaeProfissional }>(
      `/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ ativo }),
      },
    );
  },


  async listarUsuariosSistema(): Promise<{ usuarios: SaeUsuarioSistemaOpcao[] }> {
    return request<{ usuarios: SaeUsuarioSistemaOpcao[] }>('/usuarios-sistema');
  },

  async vincularUsuario(
    id: string,
    authUserId: string | null,
  ): Promise<{ ok: true; profissional: SaeProfissional }> {
    return request<{ ok: true; profissional: SaeProfissional }>(
      `/${id}/usuario-sistema`,
      {
        method: 'PATCH',
        body: JSON.stringify({ authUserId }),
      },
    );
  },

  async excluir(id: string): Promise<{ ok: true }> {
    return request<{ ok: true }>(`/${id}`, {
      method: 'DELETE',
    });
  },
};

export default saeProfissionaisService;
