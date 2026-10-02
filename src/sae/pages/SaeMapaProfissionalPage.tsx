import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import {
  saeMapasProfissionalService,
  type SaeMapaProfissionalResponse,
} from '../services/saeMapasProfissionalService';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function SaeMapaProfissionalPage() {
  const agora = new Date();
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());
  const [servicoId, setServicoId] = useState('');
  const [dados, setDados] = useState<SaeMapaProfissionalResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro('');
      setAviso('');
      const response = await saeMapasProfissionalService.listar(
        mes,
        ano,
        servicoId || undefined,
      );
      setDados(response);

      if (!servicoId && response.profissional.servicos.length === 1) {
        setServicoId(response.profissional.servicos[0].id);
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar o mapa.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [mes, ano, servicoId]);

  const anos = useMemo(
    () => Array.from({ length: 5 }, (_, index) => agora.getFullYear() - 2 + index),
    [],
  );

  const baixar = async () => {
    try {
      setBaixando(true);
      setErro('');
      const result = await saeMapasProfissionalService.baixarDocx(
        mes,
        ano,
        servicoId || undefined,
      );
      if (result.truncated) {
        setAviso(
          `O modelo Word possui 28 linhas. O período selecionado tem ${result.total} atendimentos; revise se será necessário um segundo mapa.`,
        );
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível baixar o mapa.');
    } finally {
      setBaixando(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="app-surface p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">SAE</p>
              <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                Mapa de atendimento
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {dados?.profissional?.nome
                  ? `Profissional: ${dados.profissional.nome}. O mapa é formado pelos atendimentos registrados no SAE.`
                  : 'Mapa mensal de atendimentos do profissional.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={baixar}
            disabled={baixando || carregando || !dados}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 sm:w-auto"
          >
            {baixando ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
            Baixar Word
          </button>
        </div>
      </section>

      {erro && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {erro}
        </div>
      )}

      {aviso && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          {aviso}
        </div>
      )}

      <section className="app-surface p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Mês</span>
            <select
              value={mes}
              onChange={(event) => setMes(Number(event.target.value))}
              className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white"
            >
              {MESES.map((nome, index) => (
                <option key={nome} value={index + 1}>{nome}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Ano</span>
            <select
              value={ano}
              onChange={(event) => setAno(Number(event.target.value))}
              className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white"
            >
              {anos.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Serviço</span>
            <select
              value={servicoId}
              onChange={(event) => setServicoId(event.target.value)}
              className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white"
            >
              <option value="">Todos os serviços vinculados</option>
              {(dados?.profissional.servicos || []).map((servico) => (
                <option key={servico.id} value={servico.id}>
                  {servico.nome}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="app-surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border-dark p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-bold text-white">
              {MESES[mes - 1]} de {ano}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {dados?.total || 0} atendimento(s) registrado(s)
              {dados?.turno ? ` • Turno ${dados.turno}` : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={carregar}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border-dark px-3 text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw size={15} />
            Atualizar
          </button>
        </div>

        {carregando ? (
          <div className="flex min-h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !dados?.itens.length ? (
          <div className="px-5 py-12 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 font-semibold text-slate-300">Nenhum atendimento registrado neste período.</p>
            <p className="mt-1 text-sm text-slate-500">
              O mapa usa os registros existentes em Atendimentos do SAE.
            </p>
          </div>
        ) : (
          <div className="responsive-scroll">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-slate-900/40 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Ord.</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Pront.</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Sexo</th>
                  <th className="px-4 py-3">Idade</th>
                  <th className="px-4 py-3">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {dados.itens.map((item, index) => (
                  <tr key={item.id} className="text-slate-300">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">
                      {item.data ? new Date(`${item.data}T12:00:00`).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">{item.prontuario || '—'}</td>
                    <td className="px-4 py-3 font-medium text-white">{item.nome}</td>
                    <td className="px-4 py-3">{item.sexo || '—'}</td>
                    <td className="px-4 py-3">{item.idade || '—'}</td>
                    <td className="max-w-[360px] px-4 py-3">{item.observacao || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
