import React from 'react';
import { Calendar, ChevronRight, FileText, Info, ShieldAlert, X } from 'lucide-react';
import type { FrequenciaDayDrawerProps } from '../../types/frequencia';
import FrequenciaStatusBadge from './FrequenciaStatusBadge';

export default function FrequenciaDayDrawer({
  open,
  servidor,
  day,
  onClose,
}: FrequenciaDayDrawerProps) {
  return (
    <>
      <div
        className={[
          'fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={onClose}
      />

      <aside
        className={[
          'fixed right-0 top-0 z-50 h-full w-full max-w-xl transform border-l border-white/10 bg-slate-950 shadow-2xl shadow-black/50 transition duration-300',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Detalhes do dia</div>
              <h3 className="mt-2 text-xl font-semibold text-white">
                {day ? `${String(day.dia).padStart(2, '0')} • ${day.weekdayLabel}` : 'Nenhum dia selecionado'}
              </h3>
              {servidor && (
                <p className="mt-2 text-sm text-slate-400">
                  {servidor.nome} • CPF {servidor.cpf || 'Não informado'}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {!day && (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-400">
                Selecione um dia na grade mensal para abrir os detalhes.
              </div>
            )}

            {day && (
              <>
                <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">Status do dia</div>
                    <FrequenciaStatusBadge status={day.status} />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-400">
                        <Calendar className="h-4 w-4" />
                        Rubrica
                      </div>
                      <div className="text-sm text-white">{day.rubrica || 'Sem rubrica informada.'}</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-400">
                        <FileText className="h-4 w-4" />
                        Referência
                      </div>
                      <div className="text-sm text-white">{day.referencia || 'Sem referência informada.'}</div>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 text-sm font-semibold text-white">Ocorrências por turno</div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Manhã</div>
                      <div className="mt-2 text-sm text-white">{day.ocorrenciaManha || 'Sem ocorrência.'}</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Tarde</div>
                      <div className="mt-2 text-sm text-white">{day.ocorrenciaTarde || 'Sem ocorrência.'}</div>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                    <Info className="h-4 w-4 text-cyan-300" />
                    Descrição consolidada
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm leading-6 text-slate-200">
                    {day.descricao || day.titulo || 'Sem descrição detalhada para este dia.'}
                  </div>

                  {day.badges.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {day.badges.map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </section>

                {day.avisos.length > 0 && (
                  <section className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-300">
                      <ShieldAlert className="h-4 w-4" />
                      Avisos
                    </div>

                    <div className="space-y-2">
                      {day.avisos.map((warning, index) => (
                        <div
                          key={`${warning}-${index}`}
                          className="flex items-start gap-2 rounded-2xl border border-amber-500/10 bg-slate-950/30 px-3 py-3 text-sm text-amber-100"
                        >
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
