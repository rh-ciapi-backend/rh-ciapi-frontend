import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { MapaDiagnostics } from '../../types/mapas';

interface Props {
  diagnostics: MapaDiagnostics;
}

function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'danger' | 'warn' }) {
  const toneClasses = tone === 'danger'
    ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
    : tone === 'warn'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
      : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300';

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses}`}>{children}</span>;
}

export function MapasDiagnostics({ diagnostics }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">Diagnóstico dos dados</h3>
          <p className="mt-1 text-sm text-slate-400">Validação minuciosa antes da exportação documental.</p>
        </div>
        <Badge tone={diagnostics.totalComPendenciaGrave > 0 ? 'danger' : 'default'}>
          {diagnostics.paginasPrevistas} página(s) prevista(s)
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Badge tone={diagnostics.totalComCpfAusente ? 'danger' : 'default'}>CPF ausente: {diagnostics.totalComCpfAusente}</Badge>
        <Badge tone={diagnostics.totalComMatriculaAusente ? 'danger' : 'default'}>Matrícula ausente: {diagnostics.totalComMatriculaAusente}</Badge>
        <Badge tone={diagnostics.totalComCargoAusente ? 'warn' : 'default'}>Cargo ausente: {diagnostics.totalComCargoAusente}</Badge>
        <Badge tone={diagnostics.totalComDuplicidadeCpf ? 'danger' : 'default'}>CPF duplicado: {diagnostics.totalComDuplicidadeCpf}</Badge>
        <Badge tone={diagnostics.totalComDuplicidadeMatricula ? 'danger' : 'default'}>Matrícula duplicada: {diagnostics.totalComDuplicidadeMatricula}</Badge>
        <Badge>Com observação: {diagnostics.totalComObservacao}</Badge>
        <Badge tone={diagnostics.totalComObservacaoLonga ? 'warn' : 'default'}>Obs. longa: {diagnostics.totalComObservacaoLonga}</Badge>
        <Badge tone={diagnostics.totalComPendenciaGrave ? 'danger' : 'default'}>Pendência grave: {diagnostics.totalComPendenciaGrave}</Badge>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <div className="mb-3 flex items-center gap-2 text-amber-300">
            <AlertTriangle size={16} />
            <h4 className="text-sm font-bold">Alertas</h4>
          </div>
          <div className="space-y-2 text-sm text-slate-300">
            {diagnostics.alertas.length ? diagnostics.alertas.map((item, index) => (
              <p key={index}>• {item}</p>
            )) : <p className="text-slate-500">Nenhum alerta identificado.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <div className="mb-3 flex items-center gap-2 text-cyan-300">
            <Info size={16} />
            <h4 className="text-sm font-bold">Sugestões</h4>
          </div>
          <div className="space-y-2 text-sm text-slate-300">
            {diagnostics.sugestoes.length ? diagnostics.sugestoes.map((item, index) => (
              <p key={index}>• {item}</p>
            )) : <p className="text-slate-500">Nenhuma sugestão adicional.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <div className="mb-3 flex items-center gap-2 text-rose-300">
            <AlertCircle size={16} />
            <h4 className="text-sm font-bold">Registros inválidos</h4>
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            {diagnostics.registrosInvalidos.length ? diagnostics.registrosInvalidos.slice(0, 6).map((item, index) => (
              <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="font-semibold text-white">{item.nomeCompleto || 'Sem nome'}</p>
                <p className="text-xs text-slate-400">Matrícula: {item.matricula || '—'} • CPF: {item.cpf || '—'}</p>
                <p className="mt-2 text-xs text-rose-300">{item.motivos.join(' | ')}</p>
              </div>
            )) : <p className="text-slate-500">Nenhum registro inválido encontrado.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
