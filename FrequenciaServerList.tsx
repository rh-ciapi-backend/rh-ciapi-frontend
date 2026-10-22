import React from 'react';
import { BadgeCheck, IdCard, SearchX, UserCircle2 } from 'lucide-react';
import type { FrequenciaServerListProps } from '../../types/frequencia';
import FrequenciaStatusBadge from './FrequenciaStatusBadge';

export default function FrequenciaServerList({
  servidores,
  selectedCpf,
  onSelect,
  loading = false,
}: FrequenciaServerListProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">Servidores</h2>
          <p className="text-xs text-slate-400">Selecione um servidor para abrir a grade mensal.</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {servidores.length}
        </div>
      </div>

      <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
        {loading &&
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="h-4 w-32 rounded bg-white/10" />
              <div className="mt-3 h-3 w-24 rounded bg-white/10" />
              <div className="mt-4 h-8 rounded bg-white/10" />
            </div>
          ))}

        {!loading && servidores.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-10 text-center">
            <SearchX className="mb-3 h-8 w-8 text-slate-500" />
            <div className="text-sm font-medium text-white">Nenhum servidor encontrado</div>
            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
              Ajuste os filtros de busca, categoria, setor ou status para localizar registros.
            </p>
          </div>
        )}

        {!loading &&
          servidores.map((servidor) => {
            const isActive = selectedCpf === servidor.cpf;

            return (
              <button
                key={`${servidor.cpf}-${servidor.id}`}
                type="button"
                onClick={() => onSelect(servidor.cpf)}
                className={[
                  'w-full rounded-2xl border p-4 text-left transition',
                  isActive
                    ? 'border-cyan-500/40 bg-cyan-500/10 shadow-lg shadow-cyan-950/20'
                    : 'border-white/10 bg-slate-950/50 hover:border-white/20 hover:bg-white/[0.03]',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-slate-300">
                    {servidor.fotoUrl ? (
                      <img
                        src={servidor.fotoUrl}
                        alt={servidor.nome}
                        className="h-11 w-11 rounded-2xl object-cover"
                      />
                    ) : (
                      <UserCircle2 className="h-7 w-7" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{servidor.nome}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <IdCard className="h-3.5 w-3.5" />
                        {servidor.matricula || 'Sem matrícula'}
                      </span>
                      <span>CPF: {servidor.cpf || 'Não informado'}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <FrequenciaStatusBadge
                        status={servidor.statusServidor === 'ATIVO' ? 'presente' : 'pendente'}
                        label={servidor.statusServidor || 'Sem status'}
                        small
                      />
                      {servidor.categoria && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                          {servidor.categoria}
                        </span>
                      )}
                      {servidor.setor && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                          {servidor.setor}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-400">
                      <div className="rounded-xl bg-white/[0.03] px-2 py-2">
                        <div>Faltas</div>
                        <div className="mt-1 font-semibold text-rose-300">{servidor.resumo.faltas}</div>
                      </div>
                      <div className="rounded-xl bg-white/[0.03] px-2 py-2">
                        <div>Atestados</div>
                        <div className="mt-1 font-semibold text-amber-300">{servidor.resumo.atestados}</div>
                      </div>
                      <div className="rounded-xl bg-white/[0.03] px-2 py-2">
                        <div>Férias</div>
                        <div className="mt-1 font-semibold text-sky-300">{servidor.resumo.ferias}</div>
                      </div>
                    </div>

                    {isActive && (
                      <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-cyan-300">
                        <BadgeCheck className="h-4 w-4" />
                        Selecionado
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
      </div>
    </section>
  );
}
