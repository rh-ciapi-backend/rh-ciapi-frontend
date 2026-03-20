import { supabase } from '../lib/supabaseClient';
import { API_BASE_URL } from '../config/api';
import type {
  AdminLogsResponse,
  AdminManagedUser,
  AdminResetPasswordPayload,
  AdminUserFilters,
  AdminUserFormData,
  AdminUsersListResponse,
} from '../types/adminAccess';

function buildUrl(path: string, query?: Record<string, string | number | undefined | null>) {
  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${cleanPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  return token;
}

async function request<T>(path: string, options?: RequestInit, query?: Record<string, any>): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(buildUrl(path, query), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json?.error || 'Erro ao processar requisição administrativa.');
  }

  return json as T;
}

export const adminAccessService = {
  async listUsers(filters: AdminUserFilters = {}): Promise<AdminUsersListResponse> {
    return request<AdminUsersListResponse>('/api/admin/users', { method: 'GET' }, filters);
  },

  async getUser(id: string): Promise<{ user: AdminManagedUser }> {
    return request<{ user: AdminManagedUser }>(`/api/admin/users/${id}`, { method: 'GET' });
  },

  async createUser(payload: AdminUserFormData): Promise<{ ok: true; user: AdminManagedUser }> {
    return request<{ ok: true; user: AdminManagedUser }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateUser(id: string, payload: AdminUserFormData): Promise<{ ok: true; user: AdminManagedUser }> {
    return request<{ ok: true; user: AdminManagedUser }>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async updateUserStatus(
    id: string,
    status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO',
  ): Promise<{ ok: true; user: AdminManagedUser }> {
    return request<{ ok: true; user: AdminManagedUser }>(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deleteUser(id: string): Promise<{ ok: true }> {
    return request<{ ok: true }>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  async resetPassword(id: string, payload: AdminResetPasswordPayload): Promise<{ ok: true }> {
    return request<{ ok: true }>(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async listLogs(filters?: {
    search?: string;
    module?: string;
    action?: string;
    limit?: number;
  }): Promise<AdminLogsResponse> {
    return request<AdminLogsResponse>('/api/admin/logs', { method: 'GET' }, filters);
  },
};
