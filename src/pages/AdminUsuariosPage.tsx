import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  KeyRound,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCog,
  X,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ADMIN_PERMISSION_ACTIONS,
  ADMIN_PERMISSION_MODULES,
  ADMIN_PROFILE_OPTIONS,
  ADMIN_STATUS_OPTIONS,
} from '../types/adminAccess';
import type {
  AdminManagedUser,
  AdminPermission,
  AdminProfile,
  AdminUserFormData,
  AdminUserStatus,
} from '../types/adminAccess';
import { adminAccessService } from '../services/adminAccessService';

const moduleLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  servidores: 'Servidores',
  frequencia: 'Frequência',
  ferias: 'Férias',
  escala: 'Escala',
  mapas: 'Mapas',
  atestados: 'Atestados',
  eventos: 'Eventos',
  administracao: 'Administração',
  relatorios: 'Relatórios',
  exportacoes: 'Exportações',
};

const actionLabels: Record<string, string> = {
  visualizar: 'Visualizar',
  criar: 'Criar',
  editar: 'Editar',
  excluir: 'Excluir',
  exportar: 'Exportar',
  aprovar: 'Aprovar',
  gerenciar_usuarios: 'Gerenciar usuários',
};

type AdminUserCreateFormData = AdminUserFormData & {
  senha_inicial?: string;
  confirmar_senha?: string;
};

const defaultPermissions = (): AdminPermission[] =>
  ADMIN_PERMISSION_MODULES.map((module) => ({
    module,
    allowed: false,
    actions: [],
  }));

function buildFormFromUser(user?: AdminManagedUser): AdminUserCreateFormData {
  return {
    nome_completo: user?.nome_completo || '',
    email: user?.email || '',
    perfil: user?.perfil || 'CONSULTA',
    status: user?.status || 'ATIVO',
    setor_nome: user?.setor_nome || '',
    senha_inicial: '',
    confirmar_senha: '',
    permissions:
      user?.permissions?.length
        ? ADMIN_PERMISSION_MODULES.map((module) => {
            const current = user.permissions.find((item) => item.module === module);
            return {
              module,
              allowed: !!current?.allowed,
              actions: current?.actions || [],
            };
          })
        : defaultPermissions(),
  };
}

const StatPill = ({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: number | string;
  tone?: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose';
}) => {
  const tones = {
    slate: 'border-slate-500/20 bg-slate-500/10 text-slate-300',
    blue: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    rose: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone]}`}>
      <div className="text-xs font-bold uppercase tracking-wide">{label}</div>
      <div className="mt-2 text-2xl font-extrabold text-white">{value}</div>
    </div>
  );
};

const AdminUsuariosPage = () => {
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    ativos: 0,
    inativos: 0,
    bloqueados: 0,
    masters: 0,
    administradores: 0,
    logsHoje: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [termo, setTermo] = useState('');
  const [perfilFiltro, setPerfilFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [setorFiltro, setSetorFiltro] = useState('');

  const [selectedUser, setSelectedUser] = useState<AdminManagedUser | null>(null);
  const [formData, setFormData] = useState<AdminUserCreateFormData>(buildFormFromUser());
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetTarget, setResetTarget] = useState<AdminManagedUser | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditing = !!selectedUser;

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await adminAccessService.listUsers({
        termo,
        perfil: perfilFiltro,
        status: statusFiltro,
        setorNome: setorFiltro,
      });

      setUsers(response.users || []);
      setStats(response.stats);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar os usuários.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 3500);
    return () => window.clearTimeout(timer);
  }, [success]);

  const filteredUsers = useMemo(() => users, [users]);

  const handleSearch = async () => {
    await loadUsers();
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setFormData(buildFormFromUser());
    setIsUserModalOpen(true);
  };

  const openEditModal = (user: AdminManagedUser) => {
    setSelectedUser(user);
    setFormData(buildFormFromUser(user));
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
    setFormData(buildFormFromUser());
  };

  const updatePermissionAllowed = (module: string, allowed: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.map((permission) =>
        permission.module === module
          ? {
              ...permission,
              allowed,
              actions: allowed ? permission.actions : [],
            }
          : permission,
      ),
    }));
  };

  const togglePermissionAction = (module: string, action: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.map((permission) => {
        if (permission.module !== module) return permission;

        const exists = permission.actions.includes(action as any);
        const nextActions = exists
          ? permission.actions.filter((item) => item !== action)
          : [...permission.actions, action as any];

        return {
          ...permission,
          allowed: nextActions.length > 0 || permission.allowed,
          actions: nextActions,
        };
      }),
    }));
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setError(null);

      if (!isEditing) {
        const senha = String(formData.senha_inicial || '').trim();
        const confirmar = String(formData.confirmar_senha || '').trim();

        if (senha.length < 6) {
          throw new Error('Informe uma senha inicial com pelo menos 6 caracteres.');
        }

        if (senha !== confirmar) {
          throw new Error('A confirmação da senha inicial não confere.');
        }
      }

      if (isEditing && selectedUser) {
        const payload: AdminUserFormData = {
          nome_completo: formData.nome_completo,
          email: formData.email,
          perfil: formData.perfil,
          status: formData.status,
          setor_nome: formData.setor_nome,
          permissions: formData.permissions,
        };

        await adminAccessService.updateUser(selectedUser.id, payload);
        setSuccess('Usuário atualizado com sucesso.');
      } else {
        await adminAccessService.createUser({
          nome_completo: formData.nome_completo,
          email: formData.email,
          perfil: formData.perfil,
          status: formData.status,
          setor_nome: formData.setor_nome,
          permissions: formData.permissions,
          senha_inicial: formData.senha_inicial,
        } as any);

        setSuccess('Usuário criado com sucesso.');
      }

      closeUserModal();
      await loadUsers();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível salvar o usuário.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (user: AdminManagedUser, status: AdminUserStatus) => {
    try {
      setError(null);
      await adminAccessService.updateUserStatus(user.id, status);
      setSuccess(`Status de ${user.email} alterado para ${status}.`);
      await loadUsers();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível alterar o status.');
    }
  };

  const handleDelete = async (user: AdminManagedUser) => {
    const confirmed = window.confirm(`Deseja realmente excluir o usuário ${user.email}?`);
    if (!confirmed) return;

    try {
      setError(null);
      await adminAccessService.deleteUser(user.id);
      setSuccess('Usuário excluído com sucesso.');
      await loadUsers();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível excluir o usuário.');
    }
  };

  const openResetPasswordModal = (user: AdminManagedUser) => {
    setResetTarget(user);
    setResetPasswordValue('');
    setIsResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;

    try {
      setIsSaving(true);
      setError(null);

      await adminAccessService.resetPassword(resetTarget.id, {
        newPassword: resetPasswordValue,
      });

      setSuccess(`Senha redefinida para ${resetTarget.email}.`);
      setIsResetModalOpen(false);
      setResetTarget(null);
      setResetPasswordValue('');
      await loadUsers();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível redefinir a senha.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: AdminUserStatus) => {
    const styleMap = {
      ATIVO: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
      INATIVO: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
      BLOQUEADO: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
    };

    return (
      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${styleMap[status]}`}>
        {status}
      </span>
    );
  };

  const getProfileBadge = (perfil: AdminProfile, isMaster: boolean) => {
    if (isMaster || perfil === 'MASTER') {
      return (
        <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-violet-300">
          MASTER
        </span>
      );
    }

    const tone =
      perfil === 'ADMINISTRADOR'
        ? 'border-blue-500/20 bg-blue-500/10 text-blue-300'
        : perfil === 'RH'
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
          : perfil === 'GESTOR'
            ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
            : 'border-slate-500/20 bg-slate-500/10 text-slate-300';

    return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${tone}`}>{perfil}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border-dark bg-card-dark p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Usuários do Sistema</h1>
            <p className="mt-1 text-sm text-slate-400">
              Gerencie contas, perfis, permissões por módulo e redefinição de senha.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadUsers}
              className="inline-flex items-center gap-2 rounded-xl border border-border-dark bg-slate-900/50 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-primary/40 hover:text-white"
            >
              <RefreshCw size={16} />
              Atualizar
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover"
            >
              <Plus size={16} />
              Novo usuário
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatPill label="Total" value={stats.totalUsuarios} tone="blue" />
          <StatPill label="Ativos" value={stats.ativos} tone="emerald" />
          <StatPill label="Inativos" value={stats.inativos} tone="amber" />
          <StatPill label="Bloqueados" value={stats.bloqueados} tone="rose" />
          <StatPill label="Masters" value={stats.masters} tone="slate" />
          <StatPill label="Admins" value={stats.administradores} tone="slate" />
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300"
          >
            <AlertTriangle size={18} />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
          >
            <CheckCircle2 size={18} />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl border border-border-dark bg-card-dark p-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Busca</label>
            <div className="flex items-center gap-2 rounded-xl border border-border-dark bg-slate-900/40 px-3">
              <Search size={16} className="text-slate-500" />
              <input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Nome, e-mail ou setor"
                className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Perfil</label>
            <select
              value={perfilFiltro}
              onChange={(e) => setPerfilFiltro(e.target.value)}
              className="w-full rounded-xl border border-border-dark bg-slate-900/40 px-3 py-3 text-sm text-white outline-none"
            >
              <option value="">Todos</option>
              {ADMIN_PROFILE_OPTIONS.map((perfil) => (
                <option key={perfil} value={perfil}>
                  {perfil}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Status</label>
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="w-full rounded-xl border border-border-dark bg-slate-900/40 px-3 py-3 text-sm text-white outline-none"
            >
              <option value="">Todos</option>
              {ADMIN_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Setor</label>
            <input
              value={setorFiltro}
              onChange={(e) => setSetorFiltro(e.target.value)}
              placeholder="Ex: RH"
              className="w-full rounded-xl border border-border-dark bg-slate-900/40 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleSearch}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-hover"
          >
            Aplicar filtros
          </button>
          <button
            onClick={() => {
              setTermo('');
              setPerfilFiltro('');
              setStatusFiltro('');
              setSetorFiltro('');
            }}
            className="rounded-xl border border-border-dark bg-slate-900/50 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-primary/40 hover:text-white"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-dark bg-card-dark shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-dark bg-slate-900/50">
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Usuário</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Perfil</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Setor</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Último login</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Criado em</th>
                <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-400">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-dark">
              {filteredUsers.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-900/20">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2 text-primary">
                          {user.is_master ? <ShieldCheck size={16} /> : <Mail size={16} />}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{user.nome_completo}</div>
                          <div className="text-xs text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">{getProfileBadge(user.perfil, user.is_master)}</td>

                    <td className="px-5 py-4 text-sm text-slate-300">{user.setor_nome || '—'}</td>

                    <td className="px-5 py-4">{getStatusBadge(user.status)}</td>

                    <td className="px-5 py-4 text-sm text-slate-400">
                      {user.ultimo_login_em ? new Date(user.ultimo_login_em).toLocaleString('pt-BR') : 'Nunca'}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-400">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="rounded-lg border border-border-dark bg-slate-900/50 p-2 text-slate-300 transition hover:border-primary/40 hover:text-white"
                          title="Editar usuário"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={() => openEditModal(user)}
                          className="rounded-lg border border-border-dark bg-slate-900/50 p-2 text-slate-300 transition hover:border-primary/40 hover:text-white"
                          title="Visualizar permissões"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() => openResetPasswordModal(user)}
                          className="rounded-lg border border-border-dark bg-slate-900/50 p-2 text-slate-300 transition hover:border-primary/40 hover:text-white"
                          title="Redefinir senha"
                        >
                          <KeyRound size={15} />
                        </button>

                        {user.status !== 'ATIVO' && (
                          <button
                            onClick={() => handleStatusChange(user, 'ATIVO')}
                            className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300 transition hover:bg-emerald-500/20"
                            title="Ativar usuário"
                          >
                            <Shield size={15} />
                          </button>
                        )}

                        {user.status !== 'INATIVO' && (
                          <button
                            onClick={() => handleStatusChange(user, 'INATIVO')}
                            className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-amber-300 transition hover:bg-amber-500/20"
                            title="Inativar usuário"
                          >
                            <UserCog size={15} />
                          </button>
                        )}

                        {user.status !== 'BLOQUEADO' && (
                          <button
                            onClick={() => handleStatusChange(user, 'BLOQUEADO')}
                            className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20"
                            title="Bloquear usuário"
                          >
                            <Shield size={15} />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(user)}
                          className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20"
                          title="Excluir usuário"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-3 border-t border-border-dark p-6 text-sm text-slate-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Carregando usuários...
          </div>
        )}
      </div>

      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={closeUserModal}
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-border-dark bg-card-dark shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border-dark px-6 py-5">
                <div>
                  <h2 className="text-xl font-extrabold text-white">
                    {isEditing ? 'Editar usuário' : 'Novo usuário'}
                  </h2>
                  <p className="text-sm text-slate-400">
                    Configure perfil, status, setor e permissões por módulo.
                  </p>
                </div>

                <button
                  onClick={closeUserModal}
                  className="rounded-xl border border-border-dark bg-slate-900/50 p-2 text-slate-400 transition hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="grid max-h-[calc(92vh-82px)] grid-cols-1 overflow-y-auto xl:grid-cols-[360px_1fr]">
                <div className="border-b border-border-dark p-6 xl:border-b-0 xl:border-r">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                        Nome completo
                      </label>
                      <input
                        value={formData.nome_completo}
                        onChange={(e) => setFormData((prev) => ({ ...prev, nome_completo: e.target.value }))}
                        required
                        className="w-full rounded-xl border border-border-dark bg-slate-900/40 px-3 py-3 text-sm text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        required
                        className="w-full rounded-xl border border-border-dark bg-slate-900/40 px-3 py-3 text-sm text-white outline-none"
                      />
                    </div>

                    {!isEditing && (
                      <>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                            Senha inicial
                          </label>
                          <div className="flex items-center gap-2 rounded-xl border border-border-dark bg-slate-900/40 px-3">
                            <Lock size={16} className="text-slate-500" />
                            <input
                              type="password"
                              value={formData.senha_inicial || ''}
                              onChange={(e) => setFormData((prev) => ({ ...prev, senha_inicial: e.target.value }))}
                              required={!isEditing}
                              minLength={6}
                              placeholder="Mínimo de 6 caracteres"
                              className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                            Confirmar senha
                          </label>
                          <div className="flex items-center gap-2 rounded-xl border border-border-dark bg-slate-900/40 px-3">
                            <Lock size={16} className="text-slate-500" />
                            <input
                              type="password"
                              value={formData.confirmar_senha || ''}
                              onChange={(e) => setFormData((prev) => ({ ...prev, confirmar_senha: e.target.value }))}
                              required={!isEditing}
                              minLength={6}
                              placeholder="Repita a senha inicial"
                              className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                        Perfil
                      </label>
                      <select
                        value={formData.perfil}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            perfil: e.target.value as AdminProfile,
                          }))
                        }
                        className="w-full rounded-xl border border-border-dark bg-slate-900/40 px-3 py-3 text-sm text-white outline-none"
                      >
                        {ADMIN_PROFILE_OPTIONS.map((perfil) => (
                          <option key={perfil} value={perfil}>
                            {perfil}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            status: e.target.value as AdminUserStatus,
                          }))
                        }
                        className="w-full rounded-xl border border-border-dark bg-slate-900/40 px-3 py-3 text-sm text-white outline-none"
                      >
                        {ADMIN_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                        Setor
                      </label>
                      <input
                        value={formData.setor_nome || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, setor_nome: e.target.value }))}
                        className="w-full rounded-xl border border-border-dark bg-slate-900/40 px-3 py-3 text-sm text-white outline-none"
                        placeholder="Ex: RH / CIAPI / Coordenação"
                      />
                    </div>

                    {selectedUser?.is_master && (
                      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm text-violet-300">
                        Conta protegida como usuário master.
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white">Permissões por módulo</h3>
                    <p className="text-sm text-slate-400">
                      Ative os módulos permitidos e marque as ações que o usuário poderá executar.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {formData.permissions.map((permission) => (
                      <div
                        key={permission.module}
                        className="rounded-2xl border border-border-dark bg-slate-900/30 p-4"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-[220px]">
                            <div className="text-sm font-bold text-white">
                              {moduleLabels[permission.module] || permission.module}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              Controle de acesso ao módulo {moduleLabels[permission.module] || permission.module}.
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                              <input
                                type="checkbox"
                                checked={permission.allowed}
                                onChange={(e) => updatePermissionAllowed(permission.module, e.target.checked)}
                              />
                              Módulo habilitado
                            </label>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {ADMIN_PERMISSION_ACTIONS.map((action) => {
                            const checked = permission.actions.includes(action);

                            return (
                              <label
                                key={`${permission.module}-${action}`}
                                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                                  checked
                                    ? 'border-primary/30 bg-primary/10 text-primary'
                                    : 'border-border-dark bg-slate-900/40 text-slate-400'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePermissionAction(permission.module, action)}
                                />
                                {actionLabels[action]}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end gap-3 border-t border-border-dark pt-5">
                    <button
                      type="button"
                      onClick={closeUserModal}
                      className="rounded-xl border border-border-dark bg-slate-900/50 px-4 py-2 text-sm font-bold text-slate-300 transition hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white transition hover:bg-primary-hover disabled:opacity-70"
                    >
                      {isSaving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar usuário'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isResetModalOpen && resetTarget && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsResetModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="relative w-full max-w-md rounded-3xl border border-border-dark bg-card-dark p-6 shadow-2xl"
            >
              <h3 className="text-lg font-extrabold text-white">Redefinir senha</h3>
              <p className="mt-1 text-sm text-slate-400">
                Informe a nova senha para <span className="font-bold text-white">{resetTarget.email}</span>.
              </p>

              <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                    Nova senha
                  </label>
                  <input
                    type="password"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-border-dark bg-slate-900/40 px-3 py-3 text-sm text-white outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="rounded-xl border border-border-dark bg-slate-900/50 px-4 py-2 text-sm font-bold text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white"
                  >
                    {isSaving ? 'Salvando...' : 'Redefinir'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsuariosPage;
