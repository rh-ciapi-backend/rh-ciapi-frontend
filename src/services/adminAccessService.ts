import { API_BASE_URL } from '../config/api';
import {
  AdminAuditLog,
  AdminManagedUser,
  AdminPermission,
  AdminUserFilters,
  AdminUsersResponse,
  ResetPasswordInput,
  UpsertAdminUserInput,
} from '../types/adminAccess';
import { supabase } from '../lib/supabaseClient';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(path: string, method: HttpMethod = 'GET', body?: unknown): Promise<T> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Falha ao processar a requisição.');
  }

  return payload as T;
}

const buildQuery = (filters: Partial<AdminUserFilters>) => {
  const query = new URLSearchParams();
  if (filters.termo) query.set('termo', filters.termo);
  if (filters.perfil) query.set('perfil', filters.perfil);
  if (filters.setorId) query.set('setorId', filters.setorId);
  if (filters.status) query.set('status', filters.status);
  return query.toString() ? `?${query.toString()}` : '';
};

export const adminAccessService = {
  async listarUsuarios(filters: Partial<AdminUserFilters> = {}) {
    return request<AdminUsersResponse>(`/api/admin/users${buildQuery(filters)}`);
  },

  async obterUsuario(userId: string) {
    return request<{ user: AdminManagedUser }>(`/api/admin/users/${userId}`);
  },

  async criarUsuario(input: UpsertAdminUserInput) {
    return request<{ ok: true; user: AdminManagedUser }>(`/api/admin/users`, 'POST', input);
  },

  async editarUsuario(userId: string, input: UpsertAdminUserInput) {
    return request<{ ok: true; user: AdminManagedUser }>(`/api/admin/users/${userId}`, 'PUT', input);
  },

  async alternarStatus(userId: string, status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO') {
    return request<{ ok: true; user: AdminManagedUser }>(`/api/admin/users/${userId}/status`, 'PATCH', { status });
  },

  async excluirUsuario(userId: string) {
    return request<{ ok: true }>(`/api/admin/users/${userId}`, 'DELETE');
  },

  async redefinirSenha(input: ResetPasswordInput) {
    return request<{ ok: true }>(`/api/admin/users/${input.userId}/reset-password`, 'POST', {
      newPassword: input.newPassword,
    });
  },

  async listarLogs(params?: { search?: string; module?: string; action?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.module) query.set('module', params.module);
    if (params?.action) query.set('action', params.action);
    if (params?.limit) query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<{ logs: AdminAuditLog[] }>(`/api/admin/logs${suffix}`);
  },

  buildDefaultPermissions(profile: string): AdminPermission[] {
    const allModules = [
      'dashboard',
      'servidores',
      'frequencia',
      'ferias',
      'escala',
      'mapas',
      'atestados',
      'eventos',
      'administracao',
      'relatorios',
      'exportacoes',
    ] as const;

    const byProfile: Record<string, Record<string, string[]>> = {
      MASTER: Object.fromEntries(
        allModules.map((module) => [module, ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar', 'gerenciar_usuarios']]),
      ),
      ADMINISTRADOR: {
        dashboard: ['visualizar'],
        servidores: ['visualizar', 'criar', 'editar', 'exportar'],
        frequencia: ['visualizar', 'criar', 'editar', 'exportar', 'aprovar'],
        ferias: ['visualizar', 'criar', 'editar', 'exportar', 'aprovar'],
        escala: ['visualizar', 'criar', 'editar', 'exportar'],
        mapas: ['visualizar', 'criar', 'editar', 'exportar'],
        atestados: ['visualizar', 'criar', 'editar', 'aprovar'],
        eventos: ['visualizar', 'criar', 'editar'],
        administracao: ['visualizar', 'editar', 'gerenciar_usuarios'],
        relatorios: ['visualizar', 'exportar'],
        exportacoes: ['visualizar', 'exportar'],
      },
      RH: {
        dashboard: ['visualizar'],
        servidores: ['visualizar', 'criar', 'editar', 'exportar'],
        frequencia: ['visualizar', 'criar', 'editar', 'exportar'],
        ferias: ['visualizar', 'criar', 'editar', 'exportar', 'aprovar'],
        escala: ['visualizar', 'editar'],
        mapas: ['visualizar', 'exportar'],
        atestados: ['visualizar', 'criar', 'editar', 'aprovar'],
        eventos: ['visualizar'],
        administracao: ['visualizar'],
        relatorios: ['visualizar', 'exportar'],
        exportacoes: ['visualizar', 'exportar'],
      },
      GESTOR: {
        dashboard: ['visualizar'],
        servidores: ['visualizar'],
        frequencia: ['visualizar', 'aprovar'],
        ferias: ['visualizar', 'aprovar'],
        escala: ['visualizar', 'editar'],
        mapas: ['visualizar'],
        atestados: ['visualizar', 'aprovar'],
        eventos: ['visualizar'],
        administracao: [],
        relatorios: ['visualizar'],
        exportacoes: ['visualizar', 'exportar'],
      },
      CONSULTA: {
        dashboard: ['visualizar'],
        servidores: ['visualizar'],
        frequencia: ['visualizar'],
        ferias: ['visualizar'],
        escala: ['visualizar'],
        mapas: ['visualizar'],
        atestados: ['visualizar'],
        eventos: ['visualizar'],
        administracao: [],
        relatorios: ['visualizar'],
        exportacoes: [],
      },
      SERVIDOR_LIMITADO: {
        dashboard: ['visualizar'],
        servidores: [],
        frequencia: ['visualizar'],
        ferias: ['visualizar'],
        escala: ['visualizar'],
        mapas: [],
        atestados: ['visualizar'],
        eventos: ['visualizar'],
        administracao: [],
        relatorios: [],
        exportacoes: [],
      },
    };

    const profileMap = byProfile[profile] || byProfile.CONSULTA;

    return allModules.map((module) => ({
      module,
      allowed: (profileMap[module] || []).length > 0,
      actions: (profileMap[module] || []) as any,
    }));
  },
};
