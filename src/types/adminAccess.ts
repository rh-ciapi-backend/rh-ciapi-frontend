export const MASTER_EMAIL = 'joabbys@hotmail.com';

export type UserProfile =
  | 'MASTER'
  | 'ADMINISTRADOR'
  | 'RH'
  | 'GESTOR'
  | 'CONSULTA'
  | 'SERVIDOR_LIMITADO';

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

export type UserStatus = 'ATIVO' | 'INATIVO' | 'BLOQUEADO';

export interface AdminPermission {
  id?: string;
  user_id?: string;
  module: PermissionModule;
  actions: PermissionAction[];
  allowed: boolean;
}

export interface AdminManagedUser {
  id: string;
  auth_user_id?: string | null;
  nome_completo: string;
  email: string;
  perfil: UserProfile;
  status: UserStatus;
  setor_id?: string | null;
  setor_nome?: string | null;
  ultimo_login_em?: string | null;
  tentativas_login_falhas?: number;
  bloqueado_ate?: string | null;
  is_master?: boolean;
  created_at: string;
  updated_at?: string;
  permissions?: AdminPermission[];
}

export interface AdminUserFilters {
  termo: string;
  perfil: string;
  setorId: string;
  status: string;
}

export interface AdminStats {
  totalUsuarios: number;
  ativos: number;
  inativos: number;
  bloqueados: number;
  masters: number;
  administradores: number;
  logsHoje: number;
}

export interface AdminAuditLog {
  id: string;
  actor_user_id?: string | null;
  actor_email?: string | null;
  action: string;
  module: string;
  entity_type: string;
  entity_id?: string | null;
  entity_label?: string | null;
  description: string;
  metadata?: Record<string, any> | null;
  ip_address?: string | null;
  created_at: string;
}

export interface AdminUsersResponse {
  users: AdminManagedUser[];
  stats: AdminStats;
}

export interface UpsertAdminUserInput {
  nome_completo: string;
  email: string;
  perfil: UserProfile;
  status: UserStatus;
  setor_id?: string | null;
  sendInvite?: boolean;
  permissions: AdminPermission[];
}

export interface ResetPasswordInput {
  userId: string;
  newPassword: string;
}

export interface PermissionMatrixItem {
  module: PermissionModule;
  label: string;
  description: string;
  actions: PermissionAction[];
}

export const PERMISSION_MODULES: PermissionMatrixItem[] = [
  { module: 'dashboard', label: 'Dashboard', description: 'Indicadores e visão geral do sistema', actions: ['visualizar'] },
  { module: 'servidores', label: 'Servidores', description: 'Cadastro e gestão de servidores', actions: ['visualizar', 'criar', 'editar', 'excluir', 'exportar'] },
  { module: 'frequencia', label: 'Frequência', description: 'Folhas de frequência e ocorrências', actions: ['visualizar', 'criar', 'editar', 'exportar', 'aprovar'] },
  { module: 'ferias', label: 'Férias', description: 'Planejamento e exportação de férias', actions: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'aprovar'] },
  { module: 'escala', label: 'Escala', description: 'Escalas e jornadas', actions: ['visualizar', 'criar', 'editar', 'exportar'] },
  { module: 'mapas', label: 'Mapas', description: 'Mapas e consolidados', actions: ['visualizar', 'criar', 'editar', 'exportar'] },
  { module: 'atestados', label: 'Atestados', description: 'Gestão de atestados e anexos', actions: ['visualizar', 'criar', 'editar', 'excluir', 'aprovar'] },
  { module: 'eventos', label: 'Eventos', description: 'Feriados, pontos e calendário', actions: ['visualizar', 'criar', 'editar', 'excluir'] },
  { module: 'administracao', label: 'Administração', description: 'Usuários, perfis e segurança', actions: ['visualizar', 'editar', 'gerenciar_usuarios'] },
  { module: 'relatorios', label: 'Relatórios', description: 'Acesso a relatórios gerenciais', actions: ['visualizar', 'exportar'] },
  { module: 'exportacoes', label: 'Exportações', description: 'Download de DOCX, PDF, CSV e ZIP', actions: ['visualizar', 'exportar'] },
];

export const PROFILE_LABELS: Record<UserProfile, string> = {
  MASTER: 'Master',
  ADMINISTRADOR: 'Administrador',
  RH: 'RH',
  GESTOR: 'Gestor',
  CONSULTA: 'Consulta',
  SERVIDOR_LIMITADO: 'Servidor limitado',
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  BLOQUEADO: 'Bloqueado',
};
