import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserCheck,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  Plus,
  ChevronRight,
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
  s: Partial<Servidor> | null | undefined,
): Servidor => {
  const nomeCompleto = safeString(
    s?.nomeCompleto ||
      (s as any)?.nome_completo ||
      s?.nome ||
      (s as any)?.servidor_nome,
  );

  const nome = safeString(s?.nome || nomeCompleto || 'Servidor sem nome');

  return {
    ...(s as Servidor),
    id: safeString(
      s?.id ||
        (s as any)?.servidor ||
        (s as any)?.uuid ||
        (s as any)?.cpf ||
        nome,
    ),
    nome,
    nomeCompleto,
    status: (safeString(s?.status) || 'ATIVO') as Servidor['status'],
    setor: safeString(
      s?.setor || (s as any)?.lotacao || 'Setor não informado',
    ),
    categoria: safeString(
      s?.categoria ||
        (s as any)?.categoria_canonica ||
        'Categoria não informada',
    ) as Servidor['categoria'],
    dataNascimento:
      safeString(
        s?.dataNascimento ||
          (s as any)?.data_nascimento ||
          s?.aniversario ||
          (s as any)?.nascimento,
      ) || null,
    aniversario:
      safeString(
        s?.aniversario ||
          s?.dataNascimento ||
          (s as any)?.data_nascimento,
      ) || null,
  };
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  accent,
  description,
  onClick,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
  description: string;
  onClick?: () => void;
}) => (
  <motion.button
    type="button"
    whileHover={{ y: -3 }}
    transition={{ duration: 0.18 }}
    onClick={onClick}
    className="group app-surface w-full p-5 text-left transition-all hover:border-primary/30"
  >
    <div className="flex items-start justify-between gap-4">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}
      >
        <Icon size={20} />
      </div>

      <div className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 transition-all group-hover:bg-white/[0.05] group-hover:text-white">
        <ChevronRight size={17} />
      </div>
    </div>

    <div className="mt-6">
      <p className="text-[13px] font-medium text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-3xl font-bold tracking-tight text-white">
        {value}
      </p>

      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        {description}
      </p>
    </div>
  </motion.button>
);

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
          (servidor) =>
            normalizeStatus(servidor.status) === 'ATIVO',
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

  const hasData = useMemo(
    () => servidores.length > 0,
    [servidores],
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
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
          {error}
        </div>
      ) : null}

      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Visão geral
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Bom dia
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
            Acompanhe os principais indicadores do CIAPI em um único lugar.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('servidores', 'add')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/15 transition hover:bg-primary-hover sm:w-auto"
        >
          <Plus size={18} />
          Novo Servidor
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total de Servidores"
          value={stats.total}
          icon={Users}
          accent="bg-blue-500/10 text-blue-400"
          description="Todos os servidores cadastrados"
          onClick={() => onNavigate('servidores')}
        />

        <StatCard
          title="Servidores Ativos"
          value={stats.ativos}
          icon={UserCheck}
          accent="bg-emerald-500/10 text-emerald-400"
          description="Servidores atualmente ativos"
          onClick={() => onNavigate('servidores')}
        />

        <StatCard
          title="Férias no Mês"
          value={stats.ferias}
          icon={Calendar}
          accent="bg-amber-500/10 text-amber-400"
          description="Registros previstos para este mês"
          onClick={() => onNavigate('ferias')}
        />

        <StatCard
          title="Faltas e Atestados"
          value={stats.faltas}
          icon={AlertCircle}
          accent="bg-rose-500/10 text-rose-400"
          description="Ocorrências registradas"
          onClick={() => onNavigate('atestados')}
        />
      </section>

      <section>
        <BirthdayPanel
          servidores={servidores}
          isLoading={isLoading}
        />
      </section>
    </div>
  );
};

export default DashboardPage;
