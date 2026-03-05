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

        // ✅ CORREÇÃO: normaliza resposta para sempre ser array
        // Suporta: array direto, { ok, data: [] }, { data: [] }, null/undefined
        const servidores: Servidor[] = Array.isArray(raw)
          ? raw
          : Array.isArray((raw as any)?.data)
            ? (raw as any).data
            : Array.isArray((raw as any)?.items)
              ? (raw as any).items
              : [];

        const ativos = servidores.filter((s: any) => (s?.status ?? 'ATIVO') === 'ATIVO').length;

        setStats(prev => ({
          ...prev,
          total: servidores.length,
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-xl">
            <div className="p-6 border-b border-border-dark flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Avisos Recentes</h2>
              <button className="text-primary text-sm font-medium hover:underline">Ver todos</button>
            </div>
            <div className="divide-y divide-border-dark">
              {[
                { title: 'Atualização de Sistema', date: 'Hoje, 09:00', type: 'info' },
                { title: 'Prazo para entrega de Mapas', date: 'Amanhã, 18:00', type: 'warning' },
                { title: 'Novo Feriado Municipal Adicionado', date: '24 Fev, 2024', type: 'success' },
              ].map((aviso, i) => (
                <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    aviso.type === 'warning' ? 'bg-amber-500' : 
                    aviso.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-slate-200 font-medium">{aviso.title}</p>
                    <p className="text-xs text-slate-500">{aviso.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Novo Servidor', icon: Plus, tab: 'servidores', action: 'add' },
              { label: 'Atestados', icon: FileHeart, tab: 'atestados' },
              { label: 'Lançar Férias', icon: Calendar, tab: 'ferias' },
              { label: 'Gerar Mapa', icon: FileText, tab: 'mapas' },
              { label: 'Frequência', icon: Clock, tab: 'frequencia' },
            ].map((action, i) => (
              <button 
                key={i} 
                onClick={() => onNavigate(action.tab, action.action)}
                className="bg-card-dark p-4 rounded-2xl border border-border-dark hover:border-primary/50 hover:bg-slate-800 transition-all flex flex-col items-center gap-3 group"
              >
                <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                  <action.icon size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-300">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card-dark p-6 rounded-2xl border border-border-dark shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6">Distribuição por Categoria</h2>
            <div className="space-y-4">
              {[
                { label: 'Efetivos', value: 65, color: 'bg-blue-500' },
                { label: 'Seletivos', value: 20, color: 'bg-emerald-500' },
                { label: 'Comissionados', value: 10, color: 'bg-amber-500' },
                { label: 'Outros', value: 5, color: 'bg-slate-500' },
              ].map((cat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">{cat.label}</span>
                    <span className="text-white">{cat.value}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.value}%` }}
                      className={`h-full ${cat.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
