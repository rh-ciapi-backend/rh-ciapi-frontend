import { supabase } from '../../lib/supabaseClient';
import { API_BASE_URL } from '../../config/api';

import type {
  SaeCriarProfissionalResponse,
  SaeProfissional,
  SaeProfissionalForm,
  SaeProfissionaisListResponse,
  SaeServidorBusca,
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

  // Compatibilidade com versões anteriores.
  async listarProfissionais(): Promise<SaeProfissionaisListResponse> {
    return request<SaeProfissionaisListResponse>();
  },

  async buscarServidores(
    busca: string,
  ): Promise<{ servidores: SaeServidorBusca[] }> {
    const params = new URLSearchParams({ busca, limit: '20' });
    return request<{ servidores: SaeServidorBusca[] }>(
      `/servidores?${params.toString()}`,
    );
  },

  async adicionar(
    form: SaeProfissionalForm,
  ): Promise<SaeCriarProfissionalResponse> {
    return request<SaeCriarProfissionalResponse>('', {
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

  async redefinirSenha(
    id: string,
  ): Promise<{ ok: true; senhaTemporaria: string; mensagem: string }> {
    return request<{ ok: true; senhaTemporaria: string; mensagem: string }>(
      `/${id}/reset-password`,
      { method: 'POST' },
    );
  },

  async alterarMinhaSenha(
    newPassword: string,
  ): Promise<{ ok: true }> {
    return request<{ ok: true }>('/minha-senha', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },

  async excluir(id: string): Promise<{ ok: true }> {
    return request<{ ok: true }>(`/${id}`, {
      method: 'DELETE',
    });
  },
};

export default saeProfissionaisService;
