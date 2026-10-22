import React, { useEffect, useState } from 'react';
import { FileText, Search, UserRound, AlertCircle } from 'lucide-react';

import { saeDocumentosService, type SaeUsuarioBuscaDocumento } from '../services/saeDocumentosService';
import SaeProntuarioDocumentos from '../components/documentos/SaeProntuarioDocumentos';

export default function SaeRelatoriosPage() {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<SaeUsuarioBuscaDocumento[]>([]);
  const [selecionado, setSelecionado] = useState<SaeUsuarioBuscaDocumento | null>(null);
  const [profissional, setProfissional] = useState<string>('');
  const [podeCriar, setPodeCriar] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    saeDocumentosService.contexto()
      .then((ctx) => {
        setProfissional(ctx.profissional?.nome || '');
        setPodeCriar(Boolean(ctx.podeCriar));
      })
      .catch((error) => setErro(error instanceof Error ? error.message : 'Não foi possível carregar o perfil profissional.'));
  }, []);

  useEffect(() => {
    if (termo.trim().length < 2) {
      setResultados([]);
      return;
    }

    let ativo = true;
    const timer = window.setTimeout(() => {
      saeDocumentosService.buscarUsuarios(termo.trim())
        .then((items) => {
          if (ativo) setResultados(items);
        })
        .catch((error) => {
          if (ativo) setErro(error instanceof Error ? error.message : 'Falha na busca de usuários.');
        });
    }, 300);

    return () => {
      ativo = false;
      window.clearTimeout(timer);
    };
  }, [termo]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="app-surface p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">SAE</p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Meus relatórios</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {profissional
                ? `Profissional: ${profissional}. Selecione um usuário para preencher documentos do prontuário.`
                : 'Selecione um usuário para consultar os documentos do prontuário.'}
            </p>
          </div>
        </div>
      </section>

      {erro && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {erro}
        </div>
      )}

      {!profissional && !podeCriar && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          Para criar relatórios, o seu login precisa estar vinculado em <strong>Profissionais e serviços</strong>.
        </div>
      )}

      <section className="app-surface p-4 sm:p-5">
        <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
          Localizar usuário
        </label>
        <div className="relative mt-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            value={termo}
            onChange={(event) => {
              setTermo(event.target.value);
              setSelecionado(null);
            }}
            placeholder="Nome ou número do prontuário"
            className="h-12 w-full rounded-2xl border border-border-dark bg-slate-900/40 pl-11 pr-4 text-sm text-white outline-none focus:border-primary/40"
          />
        </div>

        {resultados.length > 0 && !selecionado && (
          <div className="mt-3 divide-y divide-border-dark overflow-hidden rounded-2xl border border-border-dark">
            {resultados.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelecionado(item);
                  setResultados([]);
                  setTermo(item.nome);
                }}
                className="flex w-full items-center gap-3 bg-slate-900/25 px-4 py-3 text-left transition hover:bg-slate-800/60"
              >
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <UserRound size={17} />
                </div>
                <div>
                  <div className="font-semibold text-white">{item.nome}</div>
                  <div className="mt-0.5 text-xs text-slate-500">Prontuário {item.prontuario || '—'}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selecionado && (
        <SaeProntuarioDocumentos usuarioId={selecionado.id} />
      )}
    </div>
  );
}
