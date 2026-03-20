import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ChevronRight,
  LockKeyhole,
  ShieldCheck,
  UserCog,
  Users,
  ScrollText,
  RefreshCcw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { adminAccessService } from '../services/adminAccessService';
import { AdminStats } from '../types/adminAccess';

interface Props {
  onNavigate: (tab: string) => void;
}

const EMPTY_STATS: AdminStats = {
  totalUsuarios: 0,
  ativos: 0,
  inativos: 0,
  bloqueados: 0,
  masters: 0,
  administradores: 0,
  logsHoje: 0,
};

const modules = [
  {
    key: 'admin-usuarios',
    title: 'Usuários e Permissões',
    description: 'Gestão completa de contas, perfis e acessos por módulo.',
    icon: UserCog,
    metricKey: 'totalUsuarios' as keyof AdminStats,
  },
  {
    key: 'admin-logs',
    title: 'Auditoria',
    description: 'Acompanhamento detalhado de ações e eventos sensíveis.',
    icon: ScrollText,
    metricKey: 'logsHoje' as keyof AdminStats,
  },
  {
    key: 'admin-seguranca',
    title: 'Segurança',
    description: 'Master, bloqueios, status e proteção de contas críticas.',
    icon: LockKeyhole,
    metricKey: 'bloqueados' as keyof AdminStats,
  },
  {
    key: 'admin-perfis',
    title: 'Perfis de Acesso',
    description: 'Regras por perfil, ação, módulo e escopo operacional.',
    icon: ShieldCheck,
    metricKey: 'administradores' as keyof AdminStats,
  },
];

const StatCard = ({ label, value, helper }: { label: string; value: string | number; helper: string }) => (
  <div className="rounded-2xl border border-border-dark bg-card-dark p-5 shadow-xl">
    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
    <div className="mt-3 flex items-end justify-between gap-4">
      <h3 className="text-3xl font-black text-white">{value}</h3>
      <span className="text-xs text-slate-500">{helper}</span>
    </div>
  </div>
);

const FeatureCard = ({
  title,
  description,
  icon: Icon,
  count,
  onClick,
}: {
  title: string;
  description: string;
  icon: any;
  count: number;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group rounded-3xl border border-border-dark bg-card-dark p-6 text-left shadow-xl transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-slate-800/70"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-slate-800 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <Icon size={22} />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
      </div>
      <ChevronRight className="mt-1 text-slate-600 transition-colors group-hover:text-primary" size={18} />
    </div>
    <div className="mt-6 flex items-center justify-between">
      <span className="text-xs uppercase tracking-[0.22em] text-slate-500">Indicador</span>
      <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
        {count}
      </span>
    </div>
  </button>
);

export default function AdminPage({ onNavigate }: Props) {
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const response = await adminAccessService.listarUsuarios();
      setStats(response.stats);
    } catch (error) {
      console.error(error);
      setStats(EMPTY_STATS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const headerText = useMemo(() => {
    if (stats.masters > 0) return `Conta master protegida e ${stats.totalUsuarios} usuários monitorados`;
    return 'Configuração central de acesso e auditoria do CIAPI RH';
  }, [stats]);

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-7 shadow-2xl"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
              <ShieldCheck size={14} />
              Administração de Sistemas
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white lg:text-4xl">
              Governança de usuários, permissões e auditoria
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Painel preparado para crescimento do CIAPI RH, com proteção do usuário master, escopo por perfil,
              controle por módulo/ação e trilha de auditoria das operações sensíveis.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{headerText}</p>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border-dark bg-slate-800/70 px-4 py-3 text-sm font-bold text-slate-200 transition-all hover:border-primary/30 hover:text-white"
          >
            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
            Atualizar painel
          </button>
        </div>
      </motion.section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuários totais" value={stats.totalUsuarios} helper="Contas registradas" />
        <StatCard label="Usuários ativos" value={stats.ativos} helper="Prontos para uso" />
        <StatCard label="Bloqueados" value={stats.bloqueados} helper="Monitoramento de acesso" />
        <StatCard label="Logs hoje" value={stats.logsHoje} helper="Eventos auditados" />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {modules.map((item) => (
          <FeatureCard
            key={item.key}
            title={item.title}
            description={item.description}
            icon={item.icon}
            count={stats[item.metricKey] as number}
            onClick={() => onNavigate(item.key)}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-border-dark bg-card-dark p-6 shadow-xl lg:col-span-2">
          <div className="flex items-center gap-3">
            <Users className="text-primary" size={20} />
            <h2 className="text-lg font-bold text-white">Diretrizes já aplicadas nesta arquitetura</h2>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              'joabbys@hotmail.com como usuário MASTER imutável por administradores comuns',
              'Permissões independentes por módulo e por ação',
              'Bloqueio de gestão para quem não tiver gerenciar_usuarios',
              'Trilha de auditoria para criação, edição, exclusão e exportações',
              'Base preparada para bloqueio por tentativas incorretas de login',
              'Compatível com expansão futura por setor e escopo operacional',
            ].map((text) => (
              <div key={text} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border-dark bg-card-dark p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <Activity className="text-primary" size={20} />
            <h2 className="text-lg font-bold text-white">Visão de segurança</h2>
          </div>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-400">Master</p>
              <p className="mt-2 text-sm text-emerald-100">Conta protegida contra exclusão, rebaixamento e perda indevida de acesso.</p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-400">Atenção</p>
              <p className="mt-2 text-sm text-amber-100">Administradores comuns só gerenciam usuários dentro do próprio alcance de permissão.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
              Futuro previsto: lockout temporário por falhas, políticas de senha e alertas automáticos.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
