import './sae-institucional-claro.css';
import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ClipboardCheck, Loader2, Plus, Search } from 'lucide-react';
import { motion } from 'motion/react';

import NovaTriagemModal from '../components/triagem/NovaTriagemModal';
import TriagemDetalheModal from '../components/triagem/TriagemDetalheModal';
import { saeTriagemService } from '../services/saeTriagemService';

import type {
  SaeTriagem,
} from '../types/saeTriagem';
import type { SaeAgendamentoFoco } from '../types/saeNavegacao';

interface Props {
  onIrAgendamentos?: (foco?: SaeAgendamentoFoco) => void;
  onAbrirUsuario?: (usuarioId: string) => void;
  visao?: 'NOVA' | 'PENDENTES' | 'CONCLUIDAS' | 'HISTORICO';
}

const ETAPA_LABEL: Record<string, string> = {
  SERVICO_SOCIAL: 'Serviço Social',
  ENFERMAGEM: 'Enfermagem',
  PSICOLOGIA: 'Psicologia',
  MEDICO: 'Médico',
  TERAPIA_OCUPACIONAL: 'Terapia Ocupacional',
  CONCLUIDA: 'Concluída',
};

const STATUS_LABEL: Record<string, string> = {
  EM_TRIAGEM: 'Em triagem',
  AGUARDANDO_DECISAO: 'Aguardando decisão',
  APTO: 'Apto',
  NAO_APTO: 'Não apto',
  DESISTENTE: 'Desistente',
  MATRICULADO: 'Matriculado',
};

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export default function SaeTriagemPage({
  onIrAgendamentos,
  onAbrirUsuario,
  visao = 'PENDENTES',
}: Props) {
  const [triagens, setTriagens] = useState<SaeTriagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [novaAberta, setNovaAberta] = useState(false);
  const [selecionada, setSelecionada] =
    useState<SaeTriagem | null>(null);

  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('TODOS');
  const [etapa, setEtapa] = useState('TODAS');

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const response = await saeTriagemService.listar();
      setTriagens(response.triagens || []);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar as triagens.',
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    setBusca('');
    setSelecionada(null);
    if (visao === 'NOVA') setNovaAberta(true);
    else setNovaAberta(false);
  }, [visao]);

  const filtradas = useMemo(() => {
    const termo = normalize(busca);
    return triagens.filter((item) => {
      const situacao = String(item.status || '').toUpperCase();
      const pendente = situacao === 'EM_TRIAGEM' || situacao === 'AGUARDANDO_DECISAO';
      const concluida = ['APTO', 'NAO_APTO', 'DESISTENTE', 'MATRICULADO'].includes(situacao);
      if (visao === 'PENDENTES' && !pendente) return false;
      if (visao === 'CONCLUIDAS' && !concluida) return false;
      return !termo || normalize(item.nome).includes(termo) || normalize(item.telefone).includes(termo);
    });
  }, [triagens, busca, visao]);

  const atualizarTriagem = (atualizada: SaeTriagem) => {
    setTriagens((atuais) =>
      atuais.map((item) =>
        item.id === atualizada.id ? atualizada : item,
      ),
    );

    setSelecionada(atualizada);
  };

  const titulos = {
    NOVA: 'Nova triagem',
    PENDENTES: 'Triagens pendentes',
    CONCLUIDAS: 'Triagens concluídas',
    HISTORICO: 'Histórico de triagens',
  } as const;

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="space-y-5 sae-refresh">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">SAE / Triagem</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{titulos[visao]}</h1>
          <p className="mt-1 text-sm text-slate-400">Consulta sob demanda, com registro multidisciplinar e prontuário integrado.</p>
        </div>
        <button type="button" onClick={() => setNovaAberta(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">
          <Plus size={18} /> Nova triagem
        </button>
      </header>

      {visao === 'NOVA' ? (
        <section className="rounded-2xl border border-border-dark bg-card-dark p-6 text-center">
          <ClipboardCheck size={30} className="mx-auto text-primary" />
          <h2 className="mt-3 text-lg font-semibold text-white">Iniciar atendimento</h2>
          <p className="mt-2 text-sm text-slate-400">Abra o formulário para cadastrar a pessoa em triagem. As etapas já existentes permanecem disponíveis na ficha.</p>
          <button type="button" onClick={() => setNovaAberta(true)} className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">Abrir formulário</button>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border-dark bg-card-dark">
          <div className="border-b border-border-dark p-5">
            <label htmlFor="sae-triagem-consulta" className="mb-2 block text-xs font-bold text-slate-500">Pesquisar por nome ou telefone</label>
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input id="sae-triagem-consulta" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Digite para localizar uma triagem..." className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/50 pl-10 pr-4 text-sm text-white outline-none focus:border-primary" />
            </div>
            <p className="mt-2 text-xs text-slate-500">{filtradas.length} registro(s) nesta opção. Digite pelo menos 2 caracteres para consultar.</p>
          </div>
          {carregando ? (
            <div className="flex min-h-52 items-center justify-center"><Loader2 size={26} className="animate-spin text-primary" /></div>
          ) : erro ? (
            <div className="p-8 text-center text-sm text-rose-400"><AlertCircle className="mx-auto mb-2" />{erro}<button type="button" onClick={carregar} className="mt-4 block w-full text-primary">Tentar novamente</button></div>
          ) : busca.trim().length < 2 ? (
            <div className="p-10 text-center text-sm text-slate-500">Os registros não são exibidos até que você pesquise. Isso mantém a área de trabalho organizada.</div>
          ) : filtradas.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">Nenhuma triagem encontrada para a busca.</div>
          ) : (
            <div className="divide-y divide-border-dark">
              {filtradas.slice(0, 80).map((triagem) => (
                <button key={triagem.id} type="button" onClick={() => setSelecionada(triagem)} className="flex w-full flex-col gap-2 p-4 text-left transition hover:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0"><span className="block font-semibold text-white">{triagem.nome}</span><span className="mt-1 block text-xs text-slate-500">{triagem.telefone || 'Sem telefone'} · {ETAPA_LABEL[triagem.etapaAtual] || triagem.etapaAtual}</span></span>
                  <span className="text-xs font-semibold text-primary">{STATUS_LABEL[triagem.status] || triagem.status} · Abrir ficha</span>
                </button>
              ))}
              {filtradas.length > 80 && <p className="p-4 text-center text-xs text-slate-500">Mostrando os 80 primeiros resultados. Refine a pesquisa pelo nome.</p>}
            </div>
          )}
        </section>
      )}

      <NovaTriagemModal aberto={novaAberta} onClose={() => setNovaAberta(false)} onCriado={(triagem) => {
        setTriagens((atuais) => [triagem, ...atuais]);
        setSelecionada(triagem);
        setNovaAberta(false);
      }} />
      <TriagemDetalheModal aberto={Boolean(selecionada)} triagem={selecionada} onClose={() => setSelecionada(null)} onAtualizado={atualizarTriagem} onIrAgendamentos={onIrAgendamentos} onAbrirUsuario={onAbrirUsuario} />
    </motion.section>
  );
}
