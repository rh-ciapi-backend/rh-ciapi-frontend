import React, { useEffect, useMemo, useState } from 'react';
import { CalendarRange, FileSpreadsheet, Loader2, Search, UserRound, Rows3 } from 'lucide-react';
import { saeAdministrativoService, type SaeAdminAtendimento } from '../services/saeAdministrativoService';

export default function SaeMapasAdminPage() {
  const now = new Date();
  const [dados, setDados] = useState<SaeAdminAtendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [profissional, setProfissional] = useState('TODOS');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    saeAdministrativoService.listarAtendimentos()
      .then(setDados)
      .finally(() => setLoading(false));
  }, []);

  const profissionais = useMemo(
    () => Array.from(new Set(dados.map((d) => d.profissionalNome).filter(Boolean))).sort(),
    [dados],
  );

  const filtrados = useMemo(() => dados.filter((d) => {
    const [y, m] = d.data.split('-').map(Number);
    if (y !== ano || m !== mes) return false;
    if (profissional !== 'TODOS' && d.profissionalNome !== profissional) return false;
    const q = busca.trim().toLowerCase();
    if (q && !`${d.usuarioNome} ${d.prontuario} ${d.profissionalNome} ${d.servicoNome}`.toLowerCase().includes(q)) return false;
    return true;
  }), [dados, mes, ano, profissional, busca]);

  if (loading) return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary"/></div>;

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="app-surface relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
            <FileSpreadsheet size={22}/>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">SAE Administrativo</p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Mapas</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">Visualização mensal consolidada dos atendimentos registrados pelos profissionais.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Registros no período" value={filtrados.length} icon={Rows3} tone="blue" />
        <Metric label="Profissionais" value={new Set(filtrados.map((i) => i.profissionalNome).filter(Boolean)).size} icon={UserRound} tone="emerald" />
        <Metric label="Mês / ano" value={`${String(mes).padStart(2,'0')}/${ano}`} icon={CalendarRange} tone="amber" />
      </div>

      <section className="app-surface p-4 sm:p-5">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Filtros do mapa</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select value={mes} onChange={(e)=>setMes(Number(e.target.value))} className="h-11 rounded-xl border border-border-dark bg-slate-900/50 px-3 text-white outline-none focus:border-primary/40">{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{String(i+1).padStart(2,'0')}</option>)}</select>
          <select value={ano} onChange={(e)=>setAno(Number(e.target.value))} className="h-11 rounded-xl border border-border-dark bg-slate-900/50 px-3 text-white outline-none focus:border-primary/40">{Array.from({length:5},(_,i)=>now.getFullYear()-2+i).map(y=><option key={y}>{y}</option>)}</select>
          <select value={profissional} onChange={(e)=>setProfissional(e.target.value)} className="h-11 rounded-xl border border-border-dark bg-slate-900/50 px-3 text-white outline-none focus:border-primary/40"><option value="TODOS">Todos profissionais</option>{profissionais.map(p=><option key={p}>{p}</option>)}</select>
          <div className="relative"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"/><input value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="Usuário/prontuário" className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 pl-10 pr-3 text-white outline-none focus:border-primary/40"/></div>
        </div>
      </section>

      <section className="app-surface overflow-hidden">
        <div className="border-b border-border-dark p-4 sm:p-5">
          <h2 className="font-bold text-white">Atendimentos do mapa</h2>
          <p className="mt-1 text-xs text-slate-500">{filtrados.length} registro(s) no período selecionado</p>
        </div>
        <div className="responsive-scroll">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-slate-900/40 text-[11px] uppercase tracking-[.12em] text-slate-500"><tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Pront.</th><th className="px-4 py-3">Usuário</th><th className="px-4 py-3">Profissional</th><th className="px-4 py-3">Serviço</th><th className="px-4 py-3">Observação</th></tr></thead>
            <tbody className="divide-y divide-border-dark">{filtrados.map(i=><tr key={i.id} className="text-slate-300 transition hover:bg-slate-800/20"><td className="px-4 py-3">{i.data}</td><td className="px-4 py-3">{i.prontuario||'—'}</td><td className="px-4 py-3 font-medium text-white">{i.usuarioNome}</td><td className="px-4 py-3">{i.profissionalNome}</td><td className="px-4 py-3">{i.servicoNome}</td><td className="px-4 py-3">{i.observacao||'—'}</td></tr>)}</tbody>
          </table>
        </div>
        {!filtrados.length && <div className="p-10 text-center text-sm text-slate-500"><FileSpreadsheet className="mx-auto mb-3 h-8 w-8"/>Nenhum registro para os filtros selecionados.</div>}
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  tone: 'blue' | 'emerald' | 'amber';
}) {
  const tones = {
    blue: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  };

  return (
    <article className="app-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tones[tone]}`}><Icon size={18}/></div>
      </div>
    </article>
  );
}
