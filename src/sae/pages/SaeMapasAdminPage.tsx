import React, { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, Loader2, Search } from 'lucide-react';
import { saeAdministrativoService, type SaeAdminAtendimento } from './saeAdministrativoService';

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
      <section className="app-surface p-4 sm:p-6"><div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><FileSpreadsheet size={21}/></div><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">SAE Administrativo</p><h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Mapas</h1><p className="mt-2 text-sm text-slate-400">Prévia consolidada dos atendimentos registrados por profissional.</p></div></div></section>
      <section className="app-surface p-4 sm:p-5"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select value={mes} onChange={(e)=>setMes(Number(e.target.value))} className="h-11 rounded-xl border border-border-dark bg-slate-900/50 px-3 text-white">{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{String(i+1).padStart(2,'0')}</option>)}</select>
        <select value={ano} onChange={(e)=>setAno(Number(e.target.value))} className="h-11 rounded-xl border border-border-dark bg-slate-900/50 px-3 text-white">{Array.from({length:5},(_,i)=>now.getFullYear()-2+i).map(y=><option key={y}>{y}</option>)}</select>
        <select value={profissional} onChange={(e)=>setProfissional(e.target.value)} className="h-11 rounded-xl border border-border-dark bg-slate-900/50 px-3 text-white"><option value="TODOS">Todos profissionais</option>{profissionais.map(p=><option key={p}>{p}</option>)}</select>
        <div className="relative"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"/><input value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="Usuário/prontuário" className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 pl-10 pr-3 text-white"/></div>
      </div></section>
      <section className="app-surface overflow-hidden"><div className="border-b border-border-dark p-4 sm:p-5"><h2 className="font-bold text-white">Atendimentos do mapa</h2><p className="mt-1 text-xs text-slate-500">{filtrados.length} registro(s)</p></div><div className="responsive-scroll"><table className="min-w-[900px] w-full text-left text-sm"><thead className="bg-slate-900/40 text-[11px] uppercase tracking-[.12em] text-slate-500"><tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Pront.</th><th className="px-4 py-3">Usuário</th><th className="px-4 py-3">Profissional</th><th className="px-4 py-3">Serviço</th><th className="px-4 py-3">Observação</th></tr></thead><tbody className="divide-y divide-border-dark">{filtrados.map(i=><tr key={i.id} className="text-slate-300"><td className="px-4 py-3">{i.data}</td><td className="px-4 py-3">{i.prontuario||'—'}</td><td className="px-4 py-3 font-medium text-white">{i.usuarioNome}</td><td className="px-4 py-3">{i.profissionalNome}</td><td className="px-4 py-3">{i.servicoNome}</td><td className="px-4 py-3">{i.observacao||'—'}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}
