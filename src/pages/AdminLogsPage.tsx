import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Filter,
  RefreshCw,
  Search,
  Shield,
  User,
} from 'lucide-react';
import { adminAccessService } from '../services/adminAccessService';
import type { AdminLogItem } from '../types/adminAccess';

const actionTone = (action: string) => {
  if (action.includes('DELETE')) return 'border-rose-500/20 bg-rose-500/10 text-rose-300';
  if (action.includes('CREATE')) return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  if (action.includes('UPDATE')) return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
  if (action.includes('RESET')) return 'border-violet-500/20 bg-violet-500/10 text-violet-300';
  return 'border-slate-500/20 bg-slate-500/10 text-slate-300';
};

const AdminLogsPage = () => {
  const [logs, setLogs] = useState<AdminLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await adminAccessService.listLogs({
        search,
        module: moduleFilter,
        action: actionFilter,
        limit: 150,
      });

      setLogs(response.logs || []);
      setSuccess('Auditoria atualizada.');
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar os logs de auditoria.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 2500);
    return () => window.clearTimeout(timer);
  }, [success]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border-dark bg-card-dark p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Logs de Auditoria</h1>
            <p className="mt-1 text-sm text-slate-400">
              Rastreabilidade de ações administrativas, alterações de usuários e eventos de segurança.
            </p>
          </div>

          <button
            onClick={loadLogs}
            className="inline-flex items-center gap-2 rounded-xl border border-border-dark bg-slate-900/50 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-primary/40 hover:text-white"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Busca</label>
            <div className="flex items-center gap-2 rounded-xl border border-border-dark bg-slate-900/40 px-3">
              <Search size={16} className="text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Usuário, descrição, entidade..."
                className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Módulo</label>
            <input
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              placeholder="Ex: administracao"
              className="w-full rounded-xl border border-border-dark bg-slate-900/40 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Ação</label>
            <input
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Ex: CREATE_USER"
              className="w-full rounded-xl border border-border-dark bg-slate-900/40 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={loadLogs}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-hover"
          >
            Aplicar filtros
          </button>
          <button
            onClick={() => {
              setSearch('');
              setModuleFilter('');
              setActionFilter('');
            }}
            className="rounded-xl border border-border-dark bg-slate-900/50 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-primary/40 hover:text-white"
          >
            Limpar
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border-dark bg-card-dark shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-dark bg-slate-900/50">
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Data/Hora</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Usuário</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Ação</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Módulo</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Entidade</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">Descrição</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">IP</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-dark">
              {logs.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-500">
                    Nenhum log encontrado.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/20">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Clock size={14} className="text-slate-500" />
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <User size={14} className="text-slate-500" />
                        {log.actor_email || 'Sistema'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${actionTone(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-border-dark bg-slate-900/40 px-3 py-2 text-xs font-bold uppercase text-slate-300">
                        <Shield size={12} />
                        {log.module}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-sm text-slate-300">
                        <div className="font-semibold">{log.entity_label || '—'}</div>
                        <div className="text-xs text-slate-500">{log.entity_type || 'Sem tipo'}</div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="max-w-[420px]">
                        <div className="text-sm text-slate-300">{log.description}</div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-2 flex items-start gap-2 rounded-xl border border-border-dark bg-slate-900/40 p-3 text-xs text-slate-400">
                            <Database size={13} className="mt-0.5 text-slate-500" />
                            <pre className="overflow-auto whitespace-pre-wrap break-words font-mono">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500">{log.ip_address || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-3 border-t border-border-dark p-6 text-sm text-slate-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Carregando auditoria...
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border-dark bg-card-dark p-5">
        <div className="flex items-center gap-2 text-white">
          <Filter size={16} />
          <h3 className="font-bold">Escopo monitorado</h3>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border-dark bg-slate-900/40 p-4 text-sm text-slate-300">
            <div className="mb-2 flex items-center gap-2 text-blue-300">
              <Activity size={15} />
              Administração
            </div>
            Criação, edição, exclusão, alteração de status e redefinição de senha.
          </div>
          <div className="rounded-xl border border-border-dark bg-slate-900/40 p-4 text-sm text-slate-300">
            <div className="mb-2 flex items-center gap-2 text-emerald-300">
              <Shield size={15} />
              Segurança
            </div>
            Proteção do usuário master e rastreabilidade por IP, entidade e módulo.
          </div>
          <div className="rounded-xl border border-border-dark bg-slate-900/40 p-4 text-sm text-slate-300">
            <div className="mb-2 flex items-center gap-2 text-amber-300">
              <Database size={15} />
              Governança
            </div>
            Base pronta para evoluir com trilhas adicionais de login/logout e exportações.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogsPage;
