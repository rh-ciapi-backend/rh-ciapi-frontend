import React, { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  Users,
  Activity,
  Lock,
  ChevronRight,
  AlertTriangle,
  UserCheck,
  UserX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { adminAccessService } from '../services/adminAccessService';
import type { AdminUsersStats } from '../types/adminAccess';

type AdminPageProps = {
  onNavigate: (tab: string) => void;
};

type AdminCardProps = {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  count: string | number;
  tone?: 'primary' | 'emerald' | 'amber' | 'rose' | 'slate';
  onClick?: () => void;
};

const toneMap: Record<NonNullable<AdminCardProps['tone']>, string> = {
  primary: 'from-blue-500/10 to-cyan-500/5 border-blue-500/20 text-blue-300',
  emerald: 'from-emerald-500/10 to-emerald-400/5 border-emerald-500/20 text-emerald-300',
  amber: 'from-amber-500/10 to-amber-400/5 border-amber-500/20 text-amber-300',
  rose: 'from-rose-500/10 to-rose-400/5 border-rose-500/20 text-rose-300',
  slate: 'from-slate-500/10 to-slate-400/5 border-slate-500/20 text-slate-300',
};

const AdminCard = ({
  title,
  description,
  icon: Icon,
  count,
  onClick,
  tone = 'primary',
}: AdminCardProps) => {
  const clickable = typeof onClick === 'function';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border bg-gradient-to-br ${toneMap[tone]} p-5 text-left transition-all ${
        clickable ? 'hover:scale-[1.01] hover:border-primary/40' : 'cursor-default'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-900/60 p-3">
            <Icon size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
        </div>

        {clickable && <ChevronRight size={18} className="text-slate-500" />}
      </div>

      <div className="mt-5 text-3xl font-extrabold tracking-tight text-white">{count}</div>
    </button>
  );
};

const emptyStats: AdminUsersStats = {
  totalUsuarios: 0,
  ativos: 0,
  inativos: 0,
  bloqueados: 0,
  masters: 0,
  administradores: 0,
  logsHoje: 0,
};

const AdminPage = ({ onNavigate }: AdminPageProps) => {
  const [stats, setStats] = useState<AdminUsersStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const summaryCards = useMemo(
    () => [
      {
        title: 'Usuários do Sistema',
        description: 'Contas cadastradas no painel',
        icon: Users,
        count: stats.totalUsuarios,
        tone: 'primary' as const,
        onClick: () => onNavigate('admin-usuarios'),
      },
      {
        title: 'Usuários Ativos',
        description: 'Com acesso liberado',
        icon: UserCheck,
        count: stats.ativos,
        tone: 'emerald' as const,
        onClick: () => onNavigate('admin-usuarios'),
      },
      {
        title: 'Bloqueados/Inativos',
        description: 'Contas restritas',
        icon: UserX,
        count: stats.bloqueados + stats.inativos,
        tone: 'amber' as const,
        onClick: () => onNavigate('admin-usuarios'),
      },
      {
        title: 'Logs Hoje',
        description: 'Ações auditadas nas últimas horas',
        icon: Activity,
        count: stats.logsHoje,
        tone: 'rose' as const,
        onClick: () => onNavigate('admin-logs'),
      },
    ],
    [onNavigate, stats],
  );

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await adminAccessService.listUsers();
        setStats(response?.stats || emptyStats);
      } catch (err: any) {
        setError(err?.message || 'Não foi possível carregar os indicadores da administração.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-blue-950/70 via-slate-900 to-slate-950 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              <Shield size={14} />
              Administração de Sistemas
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Controle de acessos, segurança e auditoria
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Gerencie usuários, perfis, permissões por módulo e acompanhe o histórico de ações do sistema
              CIAPI RH.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              onClick={() => onNavigate('admin-usuarios')}
              className="rounded-2xl border border-border-dark bg-card-dark px-4 py-3 text-sm font-bold text-white transition hover:border-primary/40"
            >
              Usuários
            </button>
            <button
              onClick={() => onNavigate('admin-logs')}
              className="rounded-2xl border border-border-dark bg-card-dark px-4 py-3 text-sm font-bold text-white transition hover:border-primary/40"
            >
              Auditoria
            </button>
            <button
              onClick={() => onNavigate('admin-setores')}
              className="rounded-2xl border border-border-dark bg-card-dark px-4 py-3 text-sm font-bold text-white transition hover:border-primary/40"
            >
              Setores
            </button>
            <button
              onClick={() => onNavigate('admin-categorias')}
              className="rounded-2xl border border-border-dark bg-card-dark px-4 py-3 text-sm font-bold text-white transition hover:border-primary/40"
            >
              Categorias
            </button>
          </div>
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
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <AdminCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-border-dark bg-card-dark p-6 xl:col-span-2">
          <h2 className="text-lg font-bold text-white">Visão Geral de Segurança</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border-dark bg-slate-900/40 p-5">
              <div className="mb-3 flex items-center gap-2 text-emerald-300">
                <UserCheck size={18} />
                <span className="text-sm font-bold">Contas ativas</span>
              </div>
              <p className="text-3xl font-extrabold text-white">{stats.ativos}</p>
              <p className="mt-1 text-xs text-slate-400">Usuários aptos a acessar os módulos liberados.</p>
            </div>

            <div className="rounded-2xl border border-border-dark bg-slate-900/40 p-5">
              <div className="mb-3 flex items-center gap-2 text-amber-300">
                <Lock size={18} />
                <span className="text-sm font-bold">Restrições ativas</span>
              </div>
              <p className="text-3xl font-extrabold text-white">{stats.bloqueados + stats.inativos}</p>
              <p className="mt-1 text-xs text-slate-400">Perfis bloqueados ou inativos no ambiente.</p>
            </div>

            <div className="rounded-2xl border border-border-dark bg-slate-900/40 p-5">
              <div className="mb-3 flex items-center gap-2 text-blue-300">
                <Shield size={18} />
                <span className="text-sm font-bold">Perfis Master</span>
              </div>
              <p className="text-3xl font-extrabold text-white">{stats.masters}</p>
              <p className="mt-1 text-xs text-slate-400">Contas com proteção total e governança máxima.</p>
            </div>

            <div className="rounded-2xl border border-border-dark bg-slate-900/40 p-5">
              <div className="mb-3 flex items-center gap-2 text-rose-300">
                <Activity size={18} />
                <span className="text-sm font-bold">Auditoria do dia</span>
              </div>
              <p className="text-3xl font-extrabold text-white">{stats.logsHoje}</p>
              <p className="mt-1 text-xs text-slate-400">Eventos de administração e rastreabilidade.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border-dark bg-card-dark p-6">
          <h2 className="text-lg font-bold text-white">Governança</h2>
          <ul className="mt-5 space-y-4 text-sm text-slate-300">
            <li className="rounded-xl border border-border-dark bg-slate-900/40 p-4">
              O usuário master possui proteção contra exclusão, bloqueio e rebaixamento de perfil.
            </li>
            <li className="rounded-xl border border-border-dark bg-slate-900/40 p-4">
              As permissões são controladas por módulo e ação, com rastreio no log de auditoria.
            </li>
            <li className="rounded-xl border border-border-dark bg-slate-900/40 p-4">
              Toda criação, edição, exclusão e redefinição de senha deve passar pelo backend administrativo.
            </li>
          </ul>

          {isLoading && (
            <div className="mt-5 flex items-center gap-3 text-sm text-slate-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Atualizando indicadores...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
