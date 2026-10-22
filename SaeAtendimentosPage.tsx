import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ClipboardPlus,
  FilterX,
  HeartPulse,
  Loader2,
  Search,
  Stethoscope,
} from 'lucide-react';

import {
  saeAdministrativoService,
  type SaeAdminAtendimento,
  type SaeAdminSinalVital,
} from '../services/saeAdministrativoService';

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export default function SaeAtendimentosPage() {
  const [aba, setAba] = useState<'ATENDIMENTOS' | 'SINAIS'>('ATENDIMENTOS');
  const [atendimentos, setAtendimentos] = useState<SaeAdminAtendimento[]>([]);
  const [sinais, setSinais] = useState<SaeAdminSinalVital[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [profissional, setProfissional] = useState('TODOS');
  const [servico, setServico] = useState('TODOS');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    Promise.all([
      saeAdministrativoService.listarAtendimentos(),
      saeAdministrativoService.listarSinaisVitais(),
    ])
      .then(([a, s]) => {
        setAtendimentos(a);
        setSinais(s);
      })
      .catch((error) =>
        setErro(error instanceof Error ? error.message : 'Não foi possível carregar os atendimentos.'),
      )
      .finally(() => setCarregando(false));
  }, []);

  const profissionais = useMemo(
    () => Array.from(new Set(atendimentos.map((i) => i.profissionalNome).filter(Boolean))).sort(),
    [atendimentos],
  );
  const servicos = useMemo(
    () => Array.from(new Set(atendimentos.map((i) => i.servicoNome).filter(Boolean))).sort(),
    [atendimentos],
  );

  const filtrados = useMemo(() => {
    const termo = normalize(busca);
    return atendimentos.filter((item) => {
      if (termo && ![item.usuarioNome, item.prontuario, item.profissionalNome, item.servicoNome, item.observacao].some((v) => normalize(v).includes(termo))) return false;
      if (profissional !== 'TODOS' && item.profissionalNome !== profissional) return false;
      if (servico !== 'TODOS' && item.servicoNome !== servico) return false;
      if (dataInicio && item.data < dataInicio) return false;
      if (dataFim && item.data > dataFim) return false;
      return true;
    });
  }, [atendimentos, busca, profissional, servico, dataInicio, dataFim]);

  const sinaisFiltrados = useMemo(() => {
    const termo = normalize(busca);
    return sinais.filter((item) => {
      if (termo && ![item.usuarioNome, item.prontuario].some((v) => normalize(v).includes(termo))) return false;
      if (dataInicio && item.data < dataInicio) return false;
      if (dataFim && item.data > dataFim) return false;
      return true;
    });
  }, [sinais, busca, dataInicio, dataFim]);

  const limpar = () => {
    setBusca('');
    setProfissional('TODOS');
    setServico('TODOS');
    setDataInicio('');
    setDataFim('');
  };

  if (carregando) return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="app-surface p-4 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">SAE Administrativo</p>
        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Atendimentos</h1>
        <p className="mt-2 text-sm text-slate-400">
          Os registros inseridos pelos profissionais em Atendimento aparecem automaticamente nesta página. Sinais vitais ficam no mesmo módulo.
        </p>
      </section>

      {erro && <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300"><AlertCircle size={18} />{erro}</div>}

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border-dark bg-card-dark p-1.5 sm:w-fit">
        <button onClick={() => setAba('ATENDIMENTOS')} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold ${aba === 'ATENDIMENTOS' ? 'bg-primary text-white' : 'text-slate-400'}`}><Stethoscope size={16}/>Atendimentos</button>
        <button onClick={() => setAba('SINAIS')} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold ${aba === 'SINAIS' ? 'bg-primary text-white' : 'text-slate-400'}`}><HeartPulse size={16}/>Sinais vitais</button>
      </div>

      <section className="app-surface overflow-hidden">
        <div className="grid gap-4 px-4 py-4 sm:px-5 xl:grid-cols-[minmax(260px,1.4fr)_190px_190px_auto]">
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Busca
            </label>
            <label className="relative block">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"/>
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Usuário, prontuário, profissional..." className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 pl-10 pr-3 text-sm text-white outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"/>
            </label>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              De
            </label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="input-att"/>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Até
            </label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="input-att"/>
          </div>

          <div className="flex items-end">
            <button onClick={limpar} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-dark bg-slate-800/40 px-4 text-sm font-bold text-slate-300 transition hover:border-primary/30 hover:text-white xl:w-auto"><FilterX size={16}/>Limpar</button>
          </div>
        </div>

        {aba === 'ATENDIMENTOS' && (
          <div className="border-t border-border-dark px-4 py-4 sm:px-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Profissional
                </label>
                <select value={profissional} onChange={(e) => setProfissional(e.target.value)} className="input-att">
                  <option value="TODOS">Todos profissionais</option>
                  {profissionais.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Serviço
                </label>
                <select value={servico} onChange={(e) => setServico(e.target.value)} className="input-att">
                  <option value="TODOS">Todos serviços</option>
                  {servicos.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </section>

      {aba === 'ATENDIMENTOS' ? (
        <section className="app-surface overflow-hidden">
          <div className="border-b border-border-dark p-4 sm:p-5"><h2 className="font-bold text-white">Histórico de atendimentos</h2><p className="mt-1 text-xs text-slate-500">{filtrados.length} registro(s)</p></div>
          <div className="responsive-scroll">
            <table className="min-w-[960px] w-full text-left text-sm">
              <thead className="bg-slate-900/40 text-[11px] uppercase tracking-[.12em] text-slate-500"><tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Pront.</th><th className="px-4 py-3">Usuário</th><th className="px-4 py-3">Serviço</th><th className="px-4 py-3">Profissional</th><th className="px-4 py-3">Registro</th></tr></thead>
              <tbody className="divide-y divide-border-dark">{filtrados.map((i) => <tr key={i.id} className="text-slate-300"><td className="px-4 py-3">{i.data ? new Date(`${i.data}T12:00:00`).toLocaleDateString('pt-BR') : '—'}</td><td className="px-4 py-3">{i.prontuario || '—'}</td><td className="px-4 py-3 font-medium text-white">{i.usuarioNome}</td><td className="px-4 py-3">{i.servicoNome}</td><td className="px-4 py-3">{i.profissionalNome}</td><td className="max-w-[420px] px-4 py-3">{i.observacao || '—'}</td></tr>)}</tbody>
            </table>
          </div>
          {!filtrados.length && <div className="p-10 text-center text-sm text-slate-500"><ClipboardPlus className="mx-auto mb-3 h-8 w-8"/>Nenhum atendimento encontrado.</div>}
        </section>
      ) : (
        <section className="app-surface overflow-hidden">
          <div className="border-b border-border-dark p-4 sm:p-5"><h2 className="font-bold text-white">Sinais vitais</h2><p className="mt-1 text-xs text-slate-500">{sinaisFiltrados.length} registro(s)</p></div>
          <div className="divide-y divide-border-dark">
            {sinaisFiltrados.map((i) => <div key={i.id} className="p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-semibold text-white">{i.usuarioNome}</div><div className="mt-1 text-xs text-slate-500">Pront. {i.prontuario || '—'} • {i.data ? new Date(`${i.data}T12:00:00`).toLocaleDateString('pt-BR') : 'Sem data'}</div></div><div className="flex flex-wrap gap-2">{i.valores.map((v) => <span key={v.label} className="rounded-xl border border-border-dark bg-slate-900/40 px-3 py-2 text-xs text-slate-300"><strong className="text-white">{v.label}:</strong> {v.value}</span>)}</div></div></div>)}
          </div>
          {!sinaisFiltrados.length && <div className="p-10 text-center text-sm text-slate-500"><Activity className="mx-auto mb-3 h-8 w-8"/>Nenhum sinal vital encontrado.</div>}
        </section>
      )}

      <style>{`.input-att{height:44px;width:100%;border-radius:12px;border:1px solid #26344a;background:rgba(15,23,42,.5);padding:0 12px;font-size:14px;color:#fff;outline:none}.input-att:focus{border-color:rgba(59,130,246,.5);box-shadow:0 0 0 2px rgba(59,130,246,.12)}`}</style>
    </div>
  );
}
