import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserCheck,
  Calendar,
  AlertCircle,
  ArrowUpRight,
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

const normalizeServidor = (s: Partial<Servidor> | null | undefined): Servidor => {
  const nomeCompleto = safeString(
    s?.nomeCompleto || (s as any)?.nome_completo || s?.nome || (s as any)?.servidor_nome,
  );

  const nome = safeString(s?.nome || nomeCompleto || 'Servidor sem nome');

  return {
    ...(s as Servidor),
    id: safeString(s?.id || (s as any)?.servidor || (s as any)?.uuid || (s as any)?.cpf || nome),
    nome,
    nomeCompleto,
    status: (safeString(s?.status) || 'ATIVO') as Servidor['status'],
    setor: safeString(s?.setor || (s as any)?.lotacao || 'Setor não informado'),
    categoria: safeString(s?.categoria || (s as any)?.categoria_canonica || 'Categoria não informada') as Servidor['categoria'],
    dataNascimento: safeString(
      s?.dataNascimento || (s as any)?.data_nascimento || s?.aniversario || (s as any)?.nascimento,
    ) || null,
    aniversario: safeString(
      s?.aniversario || s?.dataNascimento || (s as any)?.data_nascimento,
    ) || null,
  };
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  onClick,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  trend?: string;
  onClick?: () => void;
}) => (
  <motion.div
    whileHover={{ y: -5 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
    className={`rounded-2xl border border-border-dark bg-card-dark p-6 shadow-xl ${
      onClick ? 'cursor-pointer hover:border-primary/30' : ''
    }`}
  >
    <div className="mb-4 flex items-start justify-between">
      <div className={`rounded-xl ${color} bg-opacity-10 p-3`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>

      {trend ? (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
          <ArrowUpRight size={14} />
          {trend}
        </span>
      ) : null}
    </div>

    <h3 className="mb-1 text-sm font-medium text-slate-400">{title}</h3>
    <p className="text-3xl font-bold text-white">{value}</p>
  </motion.div>
);

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
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
        const servidoresList = normalizeServidoresArray(raw).map(normalizeServidor);

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

        setError('Erro ao carregar dados do dashboard. Verifique a conexão com o servidor.');
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

  const hasData = useMemo(() => servidores.length > 0, [servidores]);

  if (isLoading && !hasData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Servidores"
          value={stats.total}
          icon={Users}
          color="bg-blue-500"
          trend="+2.5%"
          onClick={() => onNavigate('servidores')}
        />

        <StatCard
          title="Servidores Ativos"
          value={stats.ativos}
          icon={UserCheck}
          color="bg-emerald-500"
          onClick={() => onNavigate('servidores')}
        />

        <StatCard
          title="Férias no Mês"
          value={stats.ferias}
          icon={Calendar}
          color="bg-amber-500"
          onClick={() => onNavigate('ferias')}
        />

        <StatCard
          title="Faltas/Atestados"
          value={stats.faltas}
          icon={AlertCircle}
          color="bg-rose-500"
          onClick={() => onNavigate('atestados')}
        />
      </div>

      <BirthdayPanel servidores={servidores} isLoading={isLoading} />
    </div>
  );
};

export default DashboardPage;
