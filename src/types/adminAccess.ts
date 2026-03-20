export type AdminProfile =
  | 'MASTER'
  | 'ADMINISTRADOR'
  | 'RH'
  | 'GESTOR'
  | 'CONSULTA'
  | 'SERVIDOR_LIMITADO';

export type AdminUserStatus = 'ATIVO' | 'INATIVO' | 'BLOQUEADO';

export type PermissionModule =
  | 'dashboard'
  | 'servidores'
  | 'frequencia'
  | 'ferias'
  | 'escala'
  | 'mapas'
  | 'atestados'
  | 'eventos'
  | 'administracao'
  | 'relatorios'
  | 'exportacoes';

export type PermissionAction =
  | 'visualizar'
  | 'criar'
  | 'editar'
  | 'excluir'
  | 'exportar'
  | 'aprovar'
  | 'gerenciar_usuarios';

export interface AdminPermission {
  id?: string;
  user_id?: string;
  module: PermissionModule;
  allowed: boolean;
  actions: PermissionAction[];
}

export interface AdminManagedUser {
  id: string;
  auth_user_id?: string | null;
  nome_completo: string;
  email: string;
  perfil: AdminProfile;
  status: AdminUserStatus;
  setor_nome?: string | null;
  ultimo_login_em?: string | null;
  tentativas_login_falhas?: number;
  bloqueado_ate?: string | null;
  is_master: boolean;
  created_at: string;
  updated_at?: string;
  permissions: AdminPermission[];
}

export interface AdminUsersStats {
  totalUsuarios: number;
  ativos: number;
  inativos: number;
  bloqueados: number;
  masters: number;
  administradores: number;
  logsHoje: number;
}

export interface AdminUsersListResponse {
  users: AdminManagedUser[];
  stats: AdminUsersStats;
}

export interface AdminLogItem {
  id: string;
  actor_user_id?: string | null;
  actor_email?: string | null;
  action: string;
  module: string;
  entity_type?: string | null;
  entity_id?: string | null;
  entity_label?: string | null;
  description: string;
  metadata?: Record<string, any> | null;
  ip_address?: string | null;
  created_at: string;
}

export interface AdminLogsResponse {
  logs: AdminLogItem[];
}

export interface AdminUserFormData {
  nome_completo: string;
  email: string;
  perfil: AdminProfile;
  status: AdminUserStatus;
  setor_nome?: string | null;
  permissions: AdminPermission[];
}

export interface AdminResetPasswordPayload {
  newPassword: string;
}

export interface AdminUserFilters {
  termo?: string;
  perfil?: string;
  status?: string;
  setorNome?: string;
}

export const ADMIN_PROFILE_OPTIONS: AdminProfile[] = [
  'MASTER',
  'ADMINISTRADOR',
  'RH',
  'GESTOR',
  'CONSULTA',
  'SERVIDOR_LIMITADO',
];

export const ADMIN_STATUS_OPTIONS: AdminUserStatus[] = [
  'ATIVO',
  'INATIVO',
  'BLOQUEADO',
];

export const ADMIN_PERMISSION_MODULES: PermissionModule[] = [
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
];

export const ADMIN_PERMISSION_ACTIONS: PermissionAction[] = [
  'visualizar',
  'criar',
  'editar',
  'excluir',
  'exportar',
  'aprovar',
  'gerenciar_usuarios',
];
