import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseMedical, Loader2, RefreshCw, Settings2, UserCog } from 'lucide-react';

import GerenciarProfissionaisModal from '../components/agendamentos/GerenciarProfissionaisModal';
import { saeProfissionaisService } from '../services/saeProfissionaisService';

import type { SaeProfissional, SaeServicoOpcao } from '../types/saeProfissional';

export default function SaeProfissionaisPage() {
  const [profissionais, setProfissionais] = useState<SaeProfissional[]>([]);
  const [servicos, setServicos] = useState<SaeServicoOpcao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    try {
      const response = await saeProfissionaisService.listar();
      setProfissionais(response.profissionais || []);
      setServicos(response.servicos || []);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const serviceMap = useMemo(
    () => new Map(servicos.map((item) => [item.id, item.nome])),
    [servicos],
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="app-surface p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">SAE Administrativo</p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Profissionais</h1>
            <p className="mt-2 text-sm text-slate-400">Cadastros, serviços realizados, conta vinculada e agenda oficial.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button onClick={carregar} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-dark px-4 text-sm font-bold text-slate-300"><RefreshCw size={16}/>Atualizar</button>
            <button onClick={() => setAberto(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white"><Settings2 size={16}/>Gerenciar</button>
          </div>
        </div>
      </section>

      {carregando ? (
        <div className="flex min-h-[360px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary"/></div>
      ) : (
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {profissionais.map((p) => (
            <article key={p.id} className="app-surface p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><UserCog size={19}/></div>
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-white">{p.nome}</h3>
                    <p className="mt-1 text-xs text-slate-500">{p.cargoFuncao || 'Função não informada'}</p>
                  </div>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${p.ativo ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-slate-600/40 bg-slate-800 text-slate-400'}`}>{p.ativo ? 'ATIVO' : 'INATIVO'}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {p.servicoIds.map((id) => <span key={id} className="inline-flex items-center gap-1 rounded-xl border border-border-dark bg-slate-900/40 px-2.5 py-1.5 text-xs text-slate-300"><BriefcaseMedical size={13}/>{serviceMap.get(id) || 'Serviço'}</span>)}
                {!p.servicoIds.length && <span className="text-xs text-slate-500">Nenhum serviço vinculado.</span>}
              </div>
              <div className="mt-4 text-xs text-slate-500">
                {p.email || 'Sem e-mail'} {p.authUserId ? '• Conta vinculada' : '• Sem conta vinculada'}
              </div>
            </article>
          ))}
          {!profissionais.length && <div className="app-surface col-span-full p-10 text-center text-sm text-slate-500">Nenhum profissional cadastrado.</div>}
        </section>
      )}

      <GerenciarProfissionaisModal aberto={aberto} onClose={() => { setAberto(false); carregar(); }} />
    </div>
  );
}
