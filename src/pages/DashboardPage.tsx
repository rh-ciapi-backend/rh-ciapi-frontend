import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  AlertCircle,
  ArrowUpRight,
  Plus,
  FileText,
  Clock,
  FileHeart
} from 'lucide-react';
import { motion } from 'motion/react';
import { servidoresService } from '../services/servidoresService';
import { Servidor } from '../types';

const StatCard = ({ title, value, icon: Icon, color, trend, onClick }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    onClick={onClick}
    className={`bg-card-dark p-6 rounded-2xl border border-border-dark shadow-xl ${onClick ? 'cursor-pointer hover:border-primary/30' : ''}`}
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
          <ArrowUpRight size={14} />
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-3xl font-bold text-white">{value}</p>
  </motion.div>
);

export const DashboardPage = ({ onNavigate }: { onNavigate: (tab: string, action?: string) => void }) => {

  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    ferias: 12,
    faltas: 8
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    const fetchStats = async () => {

      try {

        setIsLoading(true);
        setError(null);

        const raw = await servidoresService.listar();

        // ✔️ normaliza resposta da API
        const servidores: Servidor[] =
          Array.isArray(raw)
            ? raw
            : Array.isArray((raw as any)?.data)
              ? (raw as any).data
              : [];

        // ✔️ garante objetos válidos
        const servidoresValidos = servidores.map((s: any) => ({
          ...s,
          nome: s?.nome ?? '',
          nomeCompleto: s?.nomeCompleto ?? '',
          status: s?.status ?? 'ATIVO'
        }));

        const ativos = servidoresValidos.filter((s) => s.status === 'ATIVO').length;

        setStats(prev => ({
          ...prev,
          total: servidoresValidos.length,
          ativos
        }));

      } catch (err) {

        console.error('Erro ao buscar estatísticas:', err);

        setError('Erro ao carregar dados do dashboard. Verifique a conexão com o servidor.');

      } finally {

        setIsLoading(false);

      }

    };

    fetchStats();

  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

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

    </div>
  );
};
