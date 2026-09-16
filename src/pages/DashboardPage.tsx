import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserCheck,
  Calendar,
  AlertCircle,
  Plus,
  ChevronRight,
  CalendarDays,
  Clock3,
} from 'lucide-react';
import { motion } from 'motion/react';
import { servidoresService } from '../services/servidoresService';
import type { Servidor } from '../types';
import BirthdayPanel from '../components/dashboard/BirthdayPanel';

type DashboardPageProps = {
  onNavigate: (tab: string, action?: string) => void;
};

type DashboardStats = {
  total: number;
  ativos: number;
  ferias: number;
  faltas: number;
};

const safeString = (value: unknown) => String(value ?? '').trim();

const normalizeStatus = (value: unknown) => safeString(value).toUpperCase();

const normalizeServidoresArray = (raw: unknown): Servidor[] => {
  if (Array.isArray(raw)) return raw as Servidor[];

  if (raw && typeof raw === 'object') {
    const possibleData = (raw as any).data;
    if (Array.isArray(possibleData)) return possibleData as Servidor[];

    const possibleItems = (raw as any).items;
    if (Array.isArray(possibleItems)) return possibleItems as Servidor[];
  }

  return [];
};

const normalizeServidor = (
  servidor: Partial<Servidor> | null | undefined,
): Servidor => {
  const nomeCompleto = safeString(
    servidor?.nomeCompleto ||
      (servidor as any)?.nome_completo ||
      servidor?.nome ||
      (servidor as any)?.servidor_nome,
  );

  const nome = safeString(
    servidor?.nome || nomeCompleto || 'Servidor sem nome',
  );

  return {
    ...(servidor as Servidor),
    id: safeString(
      servidor?.id ||
        (servidor as any)?.servidor ||
        (servidor as any)?.uuid ||
        (servidor as any)?.cpf ||
        nome,
    ),
    nome,
    nomeCompleto,
    status: (safeString(servidor?.status) || 'ATIVO') as Servidor['status'],
    setor: safeString(
      servidor?.setor ||
        (servidor as any)?.lotacao ||
        'Setor não informado',
    ),
    categoria: safeString(
      servidor?.categoria ||
        (servidor as any)?.categoria_canonica ||
        'Categoria não informada',
    ) as Servidor['categoria'],
    dataNascimento:
      safeString(
        servidor?.dataNascimento ||
          (servidor as any)?.data_nascimento ||
          servidor?.aniversario ||
          (servidor as any)?.nascimento,
      ) || null,
    aniversario:
      safeString(
        servidor?.aniversario ||
          servidor?.dataNascimento ||
          (servidor as any)?.data_nascimento,
      ) || null,
  };
};

type StatCardProps = {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconClass: string;
  onClick?: () => void;
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  onClick,
}: StatCardProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      onClick={onClick}
      disabled={!onClick}
      className={`app-surface w-full p-5 text-left transition ${
        onClick
          ? 'cursor-pointer hover:border-slate-500/70'
          : 'cursor-default'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-dark bg-slate-800/70 ${iconClass}`}
        >
          <Icon size={19} />
        </div>
      </div>

      {onClick ? (
        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-slate-500">
          Ver detalhes
          <ChevronRight size={14} />
        </div>
      ) : null}
    </motion.button>
  );
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
}) => {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    ativos: 0,
    ferias: 12,
    faltas: 8,
  });

  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const raw = await servidoresService.listar();
        const servidoresList =
          normalizeServidoresArray(raw).map(normalizeServidor);

        if (!isMounted) return;

        const ativos = servidoresList.filter(
          (servidor) => normalizeStatus(servidor.status) === 'ATIVO',
        ).length;

        setServidores(servidoresList);
        setStats((prev) => ({
          ...prev,
          total: servidoresList.length,
          ativos,
        }));
      } catch (err) {
        console.error('Erro ao buscar dados do dashboard:', err);

        if (!isMounted) return;

        setError(
          'Erro ao carregar dados do dashboard. Verifique a conexão com o servidor.',
        );
        setServidores([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const updateClock = () => setCurrentDateTime(new Date());

    updateClock();

    const interval = window.setInterval(updateClock, 60000);

    return () => window.clearInterval(interval);
  }, []);

  const hasData = useMemo(() => servidores.length > 0, [servidores]);

  const greeting = useMemo(() => {
    const hour = currentDateTime.getHours();

    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, [currentDateTime]);

  const formattedDate = useMemo(() => {
    const formatted = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(currentDateTime);

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [currentDateTime]);

  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(currentDateTime),
    [currentDateTime],
  );

  if (isLoading && !hasData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Visão geral
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {greeting}, Admin CIAPI
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-slate-500" />
              <span>{formattedDate}</span>
            </div>

            <span className="text-slate-600">•</span>

            <div className="flex items-center gap-2">
              <Clock3 size={16} className="text-slate-500" />
              <span>{formattedTime}</span>
            </div>
          </div>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
            Acompanhe os principais indicadores do CIAPI em um único lugar.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('servidores', 'add')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/15 transition hover:bg-primary-hover sm:w-auto"
        >
          <Plus size={18} />
          Novo Servidor
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total de servidores"
          value={stats.total}
          subtitle="Servidores cadastrados"
          icon={Users}
          iconClass="text-blue-400"
          onClick={() => onNavigate('servidores')}
        />

        <StatCard
          title="Servidores ativos"
          value={stats.ativos}
          subtitle="Cadastros com status ativo"
          icon={UserCheck}
          iconClass="text-emerald-400"
          onClick={() => onNavigate('servidores')}
        />

        <StatCard
          title="Férias no mês"
          value={stats.ferias}
          subtitle="Indicador mensal de férias"
          icon={Calendar}
          iconClass="text-amber-400"
          onClick={() => onNavigate('ferias')}
        />

        <StatCard
          title="Faltas / atestados"
          value={stats.faltas}
          subtitle="Indicador de ocorrências"
          icon={AlertCircle}
          iconClass="text-rose-400"
          onClick={() => onNavigate('atestados')}
        />
      </section>

      <BirthdayPanel servidores={servidores} isLoading={isLoading} />
    </div>
  );
};

export default DashboardPage;
