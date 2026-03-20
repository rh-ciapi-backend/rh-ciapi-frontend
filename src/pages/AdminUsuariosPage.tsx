import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  KeyRound,
  Mail,
  Pencil,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  UserCog,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { adminAccessService } from '../services/adminAccessService';
import { setoresService } from '../services/setoresService';
import {
  AdminManagedUser,
  AdminPermission,
  AdminUserFilters,
  PERMISSION_MODULES,
  PROFILE_LABELS,
  STATUS_LABELS,
  UpsertAdminUserInput,
  UserProfile,
  UserStatus,
} from '../types/adminAccess';

const PROFILE_OPTIONS: UserProfile[] = ['MASTER', 'ADMINISTRADOR', 'RH', 'GESTOR', 'CONSULTA', 'SERVIDOR_LIMITADO'];
const STATUS_OPTIONS: UserStatus[] = ['ATIVO', 'INATIVO', 'BLOQUEADO'];

const emptyFilters: AdminUserFilters = {
  termo: '',
  perfil: '',
  setorId: '',
  status: '',
};

interface SetorOption {
  id: string;
  nome: string;
}

interface FormState extends UpsertAdminUserInput {
  newPassword?: string;
}

const emptyForm: FormState = {
  nome_completo: '',
  email: '',
  perfil: 'CONSULTA',
  status: 'ATIVO',
  setor_id: '',
  sendInvite: false,
  permissions: adminAccessService.buildDefaultPermissions('CONSULTA'),
  newPassword: '',
};

const badgeByProfile: Record<UserProfile, string> = {
  MASTER: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25',
  ADMINISTRADOR: 'bg-primary/15 text-primary border-primary/25',
  RH: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  GESTOR: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  CONSULTA: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
  SERVIDOR_LIMITADO: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
};

const badgeByStatus: Record<UserStatus, string> = {
  ATIVO: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  INATIVO: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  BLOQUEADO: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

function UserModal({
  isOpen,
  onClose,
  onSave,
  form,
  setForm,
  setores,
  isEditing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  setores: SetorOption[];
  isEditing: boolean;
}) {
  const toggleAction = (moduleName: string, action: string, checked: boolean) => {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.map((permission) => {
        if (permission.module !== moduleName) return permission;

        const nextActions = checked
          ? Array.from(new Set([...(permission.actions || []), action as any]))
          : (permission.actions || []).filter((item) => item !== action);

        return {
          ...permission,
          allowed: nextActions.length > 0,
          actions: nextActions as any,
        };
      }),
    }));
  };

  const toggleModuleAllowed = (moduleName: string, allowed: boolean) => {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.map((permission) => {
        if (permission.module !== moduleName) return permission;
        const meta = PERMISSION_MODULES.find((item) => item.module === moduleName);
        return {
          ...permission,
          allowed,
          actions: allowed ? [...(meta?.actions || [])] : [],
        };
      }),
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border-dark bg-card-dark shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border-dark px-6 py-5">
              <div>
                <h3 className="text-xl font-black text-white">{isEditing ? 'Editar usuário' : 'Novo usuário'}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Defina perfil principal, escopo de acesso e permissões por módulo.
                </p>
              </div>
              <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-800 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-0 overflow-y-auto lg:grid-cols-[1.05fr_1.4fr]">
              <div className="space-y-5 border-b border-border-dark p-6 lg:border-b-0 lg:border-r">
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Nome completo</label>
                  <input
                    value={form.nome_completo}
                    onChange={(e) => setForm((current) => ({ ...current, nome_completo: e.target.value }))}
                    className="w-full rounded-2xl border border-border-dark bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition-all focus:border-primary/40"
                    placeholder="Ex: Joab Silva Araújo"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.22em] text-slate-500">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                    className="w-full rounded-2xl border border-border-dark bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition-all focus:border-primary/40"
                    placeholder="usuario@ciapi.com.br"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Perfil</label>
                    <select
                      value={form.perfil}
                      onChange={(e) => {
                        const perfil = e.target.value as UserProfile;
                        setForm((current) => ({
                          ...current,
                          perfil,
                          permissions: adminAccessService.buildDefaultPermissions(perfil),
                        }));
                      }}
                      className="w-full rounded-2xl border border-border-dark bg-slate-900/70 px-4 py-3 text-sm text-white outline-none"
                    >
                      {PROFILE_OPTIONS.map((perfil) => (
                        <option key={perfil} value={perfil}>
                          {PROFILE_LABELS[perfil]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as UserStatus }))}
                      className="w-full rounded-2xl border border-border-dark bg-slate-900/70 px-4 py-3 text-sm text-white outline-none"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Setor</label>
                  <select
                    value={form.setor_id || ''}
                    onChange={(e) => setForm((current) => ({ ...current, setor_id: e.target.value || '' }))}
                    className="w-full rounded-2xl border border-border-dark bg-slate-900/70 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="">Todos / não vinculado</option>
                    {setores.map((setor) => (
                      <option key={setor.id} value={setor.id}>
                        {setor.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {!isEditing && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Senha inicial</label>
                      <input
                        type="password"
                        value={form.newPassword || ''}
                        onChange={(e) => setForm((current) => ({ ...current, newPassword: e.target.value }))}
                        className="w-full rounded-2xl border border-border-dark bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition-all focus:border-primary/40"
                        placeholder="Senha temporária"
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-border-dark bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={!!form.sendInvite}
                        onChange={(e) => setForm((current) => ({ ...current, sendInvite: e.target.checked }))}
                        className="h-4 w-4 rounded border-border-dark bg-slate-800 text-primary"
                      />
                      Enviar convite/boas-vindas por e-mail
                    </label>
                  </>
                )}
              </div>

              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white">Matriz de permissões</h4>
                    <p className="text-sm text-slate-400">Ative módulos e refine as ações autorizadas para este usuário.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {PERMISSION_MODULES.map((moduleItem) => {
                    const currentPermission =
                      form.permissions.find((item) => item.module === moduleItem.module) ||
                      ({ module: moduleItem.module, allowed: false, actions: [] } as AdminPermission);

                    return (
                      <div key={moduleItem.module} className="rounded-2xl border border-border-dark bg-slate-900/60 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <label className="inline-flex items-center gap-3 text-white">
                                <input
                                  type="checkbox"
                                  checked={currentPermission.allowed}
                                  onChange={(e) => toggleModuleAllowed(moduleItem.module, e.target.checked)}
                                  className="h-4 w-4 rounded border-border-dark bg-slate-800 text-primary"
                                />
                                <span className="font-bold">{moduleItem.label}</span>
                              </label>
                            </div>
                            <p className="mt-1 text-sm text-slate-400">{moduleItem.description}</p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {moduleItem.actions.map((action) => {
                              const checked = currentPermission.actions?.includes(action as any) || false;
                              return (
                                <label
                                  key={`${moduleItem.module}-${action}`}
                                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] transition-all ${
                                    checked
                                      ? 'border-primary/30 bg-primary/15 text-primary'
                                      : 'border-border-dark bg-slate-950 text-slate-400'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={checked}
                                    onChange={(e) => toggleAction(moduleItem.module, action, e.target.checked)}
                                  />
                                  {action}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border-dark bg-slate-950/70 px-6 py-4">
              <button
                onClick={onClose}
                className="rounded-2xl px-5 py-2.5 text-sm font-bold text-slate-400 transition-all hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={onSave}
                className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover"
              >
                Salvar usuário
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ResetPasswordModal({
  isOpen,
  onClose,
  onConfirm,
  selectedUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  selectedUser: AdminManagedUser | null;
}) {
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!isOpen) setPassword('');
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && selectedUser && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="relative w-full max-w-md rounded-3xl border border-border-dark bg-card-dark p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/15 p-3 text-primary">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Redefinir senha</h3>
                <p className="text-sm text-slate-400">{selectedUser.email}</p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <label className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Nova senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-border-dark bg-slate-900/70 px-4 py-3 text-sm text-white outline-none"
                placeholder="Digite a nova senha"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={onClose} className="rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-white">
                Cancelar
              </button>
              <button
                onClick={() => onConfirm(password)}
                className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20"
              >
                Aplicar senha
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<AdminManagedUser[]>([]);
  const [setores, setSetores] = useState<SetorOption[]>([]);
  const [stats, setStats] = useState({ totalUsuarios: 0, ativos: 0, bloqueados: 0, masters: 0 });
  const [filters, setFilters] = useState<AdminUserFilters>(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminManagedUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminManagedUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const [usersResponse, setoresResponse] = await Promise.all([
        adminAccessService.listarUsuarios(filters),
        setoresService.listar(),
      ]);

      setUsuarios(usersResponse.users);
      setStats({
        totalUsuarios: usersResponse.stats.totalUsuarios,
        ativos: usersResponse.stats.ativos,
        bloqueados: usersResponse.stats.bloqueados,
        masters: usersResponse.stats.masters,
      });

      setSetores((setoresResponse || []).map((item: any) => ({ id: item.id, nome: item.nome })));
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'Falha ao carregar usuários.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.termo, filters.perfil, filters.setorId, filters.status]);

  const currentSummary = useMemo(
    () => [
      { label: 'Usuários', value: stats.totalUsuarios },
      { label: 'Ativos', value: stats.ativos },
      { label: 'Bloqueados', value: stats.bloqueados },
      { label: 'Masters', value: stats.masters },
    ],
    [stats],
  );

  const openCreate = () => {
    setEditingUser(null);
    setForm({
      ...emptyForm,
      permissions: adminAccessService.buildDefaultPermissions('CONSULTA'),
    });
    setIsModalOpen(true);
  };

  const openEdit = (user: AdminManagedUser) => {
    setEditingUser(user);
    setForm({
      nome_completo: user.nome_completo,
      email: user.email,
      perfil: user.perfil,
      status: user.status,
      setor_id: user.setor_id || '',
      sendInvite: false,
      permissions: user.permissions?.length
        ? user.permissions
        : adminAccessService.buildDefaultPermissions(user.perfil),
      newPassword: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload: UpsertAdminUserInput = {
        nome_completo: form.nome_completo,
        email: form.email,
        perfil: form.perfil,
        status: form.status,
        setor_id: form.setor_id || null,
        sendInvite: !!form.sendInvite,
        permissions: form.permissions,
      };

      if (!payload.nome_completo || !payload.email) {
        throw new Error('Preencha nome e e-mail do usuário.');
      }

      if (editingUser) {
        await adminAccessService.editarUsuario(editingUser.id, payload);
        setFeedback({ type: 'success', text: 'Usuário atualizado com sucesso.' });
      } else {
        if (!form.newPassword || form.newPassword.length < 6) {
          throw new Error('Defina uma senha inicial com pelo menos 6 caracteres.');
        }
        await adminAccessService.criarUsuario({ ...payload, newPassword: form.newPassword } as any);
        setFeedback({ type: 'success', text: 'Usuário criado com sucesso.' });
      }

      setIsModalOpen(false);
      await load();
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'Não foi possível salvar o usuário.' });
    }
  };

  const handleStatusChange = async (user: AdminManagedUser, nextStatus: UserStatus) => {
    try {
      await adminAccessService.alternarStatus(user.id, nextStatus);
      setFeedback({ type: 'success', text: `Status de ${user.nome_completo} atualizado para ${STATUS_LABELS[nextStatus]}.` });
      await load();
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'Erro ao atualizar status.' });
    }
  };

  const handleDelete = async (user: AdminManagedUser) => {
    const confirmed = window.confirm(`Deseja realmente excluir o usuário ${user.nome_completo}?`);
    if (!confirmed) return;

    try {
      await adminAccessService.excluirUsuario(user.id);
      setFeedback({ type: 'success', text: 'Usuário excluído com sucesso.' });
      await load();
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'Erro ao excluir o usuário.' });
    }
  };

  const handleResetPassword = async (password: string) => {
    try {
      if (!selectedUser) return;
      if (!password || password.length < 6) throw new Error('Informe uma senha com pelo menos 6 caracteres.');

      await adminAccessService.redefinirSenha({ userId: selectedUser.id, newPassword: password });
      setIsResetPasswordOpen(false);
      setFeedback({ type: 'success', text: `Senha redefinida para ${selectedUser.nome_completo}.` });
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'Erro ao redefinir senha.' });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border-dark bg-card-dark p-6 shadow-xl">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
              <UserCog size={14} />
              Administração de usuários
            </div>
            <h1 className="mt-3 text-2xl font-black text-white">Gestão de contas, perfis e acessos</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Controle centralizado de usuários do CIAPI RH com proteção do usuário master, limitação por setor,
              perfis operacionais e permissões granulares por módulo e ação.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover"
          >
            <Plus size={18} />
            Novo usuário
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {currentSummary.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border-dark bg-slate-950/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
              <h3 className="mt-2 text-2xl font-black text-white">{item.value}</h3>
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`rounded-2xl border p-4 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
            }`}
          >
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="rounded-3xl border border-border-dark bg-card-dark p-5 shadow-xl">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              value={filters.termo}
              onChange={(e) => setFilters((current) => ({ ...current, termo: e.target.value }))}
              className="w-full rounded-2xl border border-border-dark bg-slate-950/70 py-3 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-primary/30"
              placeholder="Buscar por nome ou e-mail"
            />
          </label>

          <select
            value={filters.perfil}
            onChange={(e) => setFilters((current) => ({ ...current, perfil: e.target.value }))}
            className="rounded-2xl border border-border-dark bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="">Todos os perfis</option>
            {PROFILE_OPTIONS.map((perfil) => (
              <option key={perfil} value={perfil}>
                {PROFILE_LABELS[perfil]}
              </option>
            ))}
          </select>

          <select
            value={filters.setorId}
            onChange={(e) => setFilters((current) => ({ ...current, setorId: e.target.value }))}
            className="rounded-2xl border border-border-dark bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="">Todos os setores</option>
            {setores.map((setor) => (
              <option key={setor.id} value={setor.id}>
                {setor.nome}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}
            className="rounded-2xl border border-border-dark bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilters(emptyFilters)}
            className="rounded-2xl border border-border-dark bg-slate-950/70 px-4 py-3 text-sm font-bold text-slate-300 transition-all hover:border-primary/30 hover:text-white"
          >
            Limpar
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-border-dark bg-card-dark shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-900/70">
              <tr className="border-b border-border-dark">
                <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.22em] text-slate-500">Usuário</th>
                <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.22em] text-slate-500">Perfil</th>
                <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.22em] text-slate-500">Setor</th>
                <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.22em] text-slate-500">Status</th>
                <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.22em] text-slate-500">Último login</th>
                <th className="px-6 py-4 text-right text-[11px] uppercase tracking-[0.22em] text-slate-500">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-dark">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Carregando usuários...
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhum usuário encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                usuarios.map((user) => (
                  <tr key={user.id} className="transition-all hover:bg-slate-900/50">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-2xl p-3 ${user.is_master ? 'bg-fuchsia-500/10 text-fuchsia-300' : 'bg-primary/10 text-primary'}`}>
                          {user.is_master ? <ShieldAlert size={18} /> : <Mail size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-white">{user.nome_completo}</p>
                          <p className="text-sm text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${badgeByProfile[user.perfil]}`}>
                        {PROFILE_LABELS[user.perfil]}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-300">{user.setor_nome || '—'}</td>

                    <td className="px-6 py-5">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${badgeByStatus[user.status]}`}>
                        {STATUS_LABELS[user.status]}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-400">
                      {user.ultimo_login_em ? new Date(user.ultimo_login_em).toLocaleString('pt-BR') : 'Nunca'}
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="rounded-xl p-2 text-slate-400 transition-all hover:bg-primary/10 hover:text-primary"
                          title="Editar usuário"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsResetPasswordOpen(true);
                          }}
                          className="rounded-xl p-2 text-slate-400 transition-all hover:bg-amber-500/10 hover:text-amber-300"
                          title="Redefinir senha"
                        >
                          <KeyRound size={16} />
                        </button>

                        <button
                          onClick={() => handleStatusChange(user, user.status === 'ATIVO' ? 'INATIVO' : 'ATIVO')}
                          className="rounded-xl p-2 text-slate-400 transition-all hover:bg-emerald-500/10 hover:text-emerald-300"
                          title={user.status === 'ATIVO' ? 'Inativar usuário' : 'Ativar usuário'}
                        >
                          {user.status === 'ATIVO' ? <Eye size={16} /> : <CheckCircle2 size={16} />}
                        </button>

                        <button
                          onClick={() => handleDelete(user)}
                          className="rounded-xl p-2 text-slate-400 transition-all hover:bg-rose-500/10 hover:text-rose-300"
                          title="Excluir usuário"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {user.is_master && (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-fuchsia-300">
                          <AlertTriangle size={12} />
                          Protegido
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        form={form}
        setForm={setForm}
        setores={setores}
        isEditing={!!editingUser}
      />

      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        onConfirm={handleResetPassword}
        selectedUser={selectedUser}
      />
    </div>
  );
}
