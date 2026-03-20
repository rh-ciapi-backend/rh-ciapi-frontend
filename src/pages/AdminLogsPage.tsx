import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Clock3, Filter, Search, Shield, UserRound } from 'lucide-react';
import { adminAccessService } from '../services/adminAccessService';
import { AdminAuditLog } from '../types/adminAccess';

const actionColor = (action: string) => {
  const normalized = (action || '').toUpperCase();
  if (normalized.includes('DELETE') || normalized.includes('EXCLUIR')) return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
  if (normalized.includes('UPDATE') || normalized.includes('EDIT')) return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  if (normalized.includes('CREATE') || normalized.includes('CRIAR')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  if (normalized.includes('LOGIN')) return 'bg-primary/10 text-primary border-primary/20';
  return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const response = await adminAccessService.listarLogs({
        search,
        module,
        action,
        limit: 150,
      });
      setLogs(response.logs || []);
    } catch (error) {
      console.error(error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, module, action]);

  const summary = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: logs.length,
      login: logs.filter((log) => (log.action || '').toUpperCase().includes('LOGIN')).length,
      changes: logs.filter((log) => ['CREATE', 'UPDATE', 'DELETE', 'CRIAR', 'EDITAR', 'EXCLUIR'].some((key) => (log.action || '').toUpperCase().includes(key))).length,
      today: logs.filter((log) => new Date(log.created_at).toDateString() === today).length,
    };
  }, [logs]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border-dark bg-card-dark p-6 shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
              <Activity size={14} />
              Auditoria
            </div>
            <h1 className="mt-3 text-2xl font-black text-white">Logs de atividade e rastreabilidade</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Histórico central do sistema para login, logout, gestão de usuários, alterações cadastrais,
              exportações e eventos críticos de segurança.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: 'Total', value: summary.total },
              { label: 'Hoje', value: summary.today },
              { label: 'Logins', value: summary.login },
              { label: 'Mudanças', value: summary.changes },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border-dark bg-slate-950/70 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <h3 className="mt-2 text-2xl font-black text-white">{item.value}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border-dark bg-card-dark p-5 shadow-xl">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-border-dark bg-slate-950/70 py-3 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-primary/30"
              placeholder="Buscar por usuário, entidade ou descrição"
            />
          </label>

          <input
            value={module}
            onChange={(e) => setModule(e.target.value)}
            className="rounded-2xl border border-border-dark bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
            placeholder="Módulo"
          />

          <input
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-2xl border border-border-dark bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
            placeholder="Ação"
          />

          <button
            onClick={load}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border-dark bg-slate-950/70 px-4 py-3 text-sm font-bold text-slate-300 transition-all hover:border-primary/30 hover:text-white"
          >
            <Filter size={16} />
            Aplicar
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-border-dark bg-card-dark shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-900/70">
              <tr className="border-b border-border-dark">
                <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.22em] text-slate-500">Data/Hora</th>
                <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.22em] text-slate-500">Usuário</th>
                <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.22em] text-slate-500">Módulo</th>
                <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.22em] text-slate-500">Ação</th>
                <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.22em] text-slate-500">Descrição</th>
                <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.22em] text-slate-500">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Carregando logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhum log encontrado.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="transition-all hover:bg-slate-900/50">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Clock3 size={14} className="text-slate-500" />
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <UserRound size={14} className="text-slate-500" />
                        {log.actor_email || 'Sistema'}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                        <Shield size={12} />
                        {log.module || 'geral'}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-200">{log.description}</td>

                    <td className="px-6 py-5 text-xs text-slate-400">
                      <div className="max-w-[340px] truncate" title={JSON.stringify(log.metadata || {})}>
                        {log.entity_type}
                        {log.entity_label ? ` • ${log.entity_label}` : ''}
                        {log.ip_address ? ` • IP ${log.ip_address}` : ''}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
