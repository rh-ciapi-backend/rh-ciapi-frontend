import React, { useMemo, useState } from 'react';
import { Search, UserRound } from 'lucide-react';
import type { FrequenciaServerSummary } from '../../types/frequencia';
import FrequenciaStatusBadge from './FrequenciaStatusBadge';

type Props = {
  servers: FrequenciaServerSummary[];
  selectedServerId?: string | null;
  onSelect: (server: FrequenciaServerSummary) => void;
};

function getInitials(name?: string) {
  if (!name) return 'SV';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function getServerDominantStatus(server: FrequenciaServerSummary) {
  if ((server.faltas || 0) > 0) return 'falta' as const;
  if ((server.atestados || 0) > 0) return 'atestado' as const;
  if ((server.ferias || 0) > 0) return 'ferias' as const;
  if ((server.pendencias || 0) > 0) return 'pendencia' as const;
  return 'dia_util' as const;
}

export default function FrequenciaServerList({
  servers,
  selectedServerId,
  onSelect,
}: Props) {
  const [search, setSearch] = useState('');

  const filteredServers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return servers;
    return servers.filter((server) => {
      const haystack = [
        server.nome,
        server.cpf,
        server.matricula,
        server.categoria,
        server.setor,
        server.status,
        server.cargo,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [search, servers]);

  return (
    <section className="flex h-full min-h-[620px] flex-col rounded-3xl border border-slate-700/70 bg-slate-900/70 shadow-xl shadow-black/10 backdrop-blur-sm">
      <div className="border-b border-slate-800 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Servidores</h3>
            <p className="text-xs text-slate-400">
              Selecione um servidor para abrir a leitura mensal.
            </p>
          </div>
          <span className="rounded-full border border-slate-700/70 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-300">
            {filteredServers.length}
          </span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar servidor"
            className="h-11 w-full rounded-2xl border border-slate-700/70 bg-slate-950/70 pl-10 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500/40"
          />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {filteredServers.map((server) => {
          const active = server.id === selectedServerId;
          const dominantStatus = getServerDominantStatus(server);

          return (
            <button
              key={server.id}
              type="button"
              onClick={() => onSelect(server)}
              className={[
                'w-full rounded-2xl border p-3 text-left transition',
                active
                  ? 'border-cyan-500/40 bg-cyan-500/10 shadow-lg shadow-cyan-950/20'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/70',
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-800/80">
                  {server.avatar ? (
                    <img
                      src={server.avatar}
                      alt={server.nome}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-cyan-200">
                      {getInitials(server.nome)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {server.nome}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {server.categoria || 'Categoria não informada'} •{' '}
                        {server.setor || 'Setor não informado'}
                      </p>
                    </div>

                    <FrequenciaStatusBadge status={dominantStatus} />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-400">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-2.5 py-2">
                      <span className="block text-slate-500">Lançados</span>
                      <strong className="text-slate-200">
                        {server.diasLancados || 0}
                      </strong>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-2.5 py-2">
                      <span className="block text-slate-500">Pendências</span>
                      <strong className="text-slate-200">
                        {server.pendencias || 0}
                      </strong>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-2.5 py-2">
                      <span className="block text-slate-500">Ocorrências</span>
                      <strong className="text-slate-200">
                        {(server.faltas || 0) + (server.atestados || 0)}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                    <UserRound className="h-3.5 w-3.5" />
                    <span className="truncate">
                      {server.matricula || 'Sem matrícula'} • {server.status || 'Status não informado'}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {filteredServers.length === 0 && (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 px-4 text-center text-sm text-slate-400">
            Nenhum servidor encontrado com o filtro atual.
          </div>
        )}
      </div>
    </section>
  );
}
