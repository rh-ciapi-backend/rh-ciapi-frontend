import React, { useEffect, useRef, useState } from 'react';
import { ClipboardList, FilePlus2, Info, Search } from 'lucide-react';
import { servidoresService } from '../services/servidoresService';
import { requerimentosService, type Requerimento } from '../services/requerimentosService';
import type { Servidor } from '../types';

const TIPOS = [
  'Certidão de tempo de serviço e ficha financeira',
  'Pagamento de verbas rescisórias',
  'Averbação de tempo de contribuição',
  'Vacância',
  'Exoneração',
  'Licença para atividade política',
  'Licença para capacitação',
  'Licença para cursar pós-graduação',
  'Licença para desempenho de mandato classista',
  'Licença para o serviço militar',
  'Licença para tratar de interesse particular',
  'Licença por doença em pessoa da família',
  'Licença por afastamento do cônjuge ou companheiro(a)',
  'Licença para tratamento da própria saúde',
  'Licença por acidente em serviço',
  'Licença à gestante',
  'Auxílio natalidade',
  'Salário família',
  'Outra solicitação',
] as const;

type Campo = { name: string; label: string; type?: string };

const identificacao: Campo[] = [
  { name: 'nome', label: 'Nome completo' },
  { name: 'nacionalidade', label: 'Nacionalidade' },
  { name: 'estadoCivil', label: 'Estado civil' },
  { name: 'cpf', label: 'CPF' },
  { name: 'rg', label: 'RG' },
  { name: 'orgaoExpedidor', label: 'Órgão expedidor' },
  { name: 'dataExpedicao', label: 'Data de expedição', type: 'date' },
  { name: 'pasep', label: 'PASEP' },
  { name: 'tituloEleitor', label: 'Título de eleitor' },
  { name: 'dataNascimento', label: 'Data de nascimento', type: 'date' },
  { name: 'pai', label: 'Nome do pai' },
  { name: 'mae', label: 'Nome da mãe' },
];

const funcionais: Campo[] = [
  { name: 'cargo', label: 'Cargo ou carreira' },
  { name: 'matricula', label: 'Matrícula' },
  { name: 'funcao', label: 'Função' },
  { name: 'classe', label: 'Classe / referência / padrão / nível' },
  { name: 'lotacao', label: 'Lotação' },
  { name: 'unidadeExercicio', label: 'Unidade de exercício' },
];

const contato: Campo[] = [
  { name: 'endereco', label: 'Endereço residencial' },
  { name: 'numero', label: 'Número' },
  { name: 'complemento', label: 'Complemento' },
  { name: 'bairro', label: 'Bairro' },
  { name: 'cep', label: 'CEP' },
  { name: 'municipio', label: 'Município' },
  { name: 'uf', label: 'UF' },
  { name: 'telefoneTrabalho', label: 'Telefone do trabalho', type: 'tel' },
  { name: 'telefoneResidencial', label: 'Telefone residencial', type: 'tel' },
  { name: 'celular', label: 'Celular', type: 'tel' },
];

function GrupoCampos({
  titulo, campos, valores, atualizar,
}: {
  titulo: string;
  campos: Campo[];
  valores: Record<string, string>;
  atualizar: (name: string, value: string) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-[#26344a] bg-[#172033] p-5">
      <legend className="px-2 text-sm font-semibold text-white">{titulo}</legend>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {campos.map(({ name, label, type }) => (
          <label key={name} className="block text-xs font-medium text-slate-300">
            {label}
            <input
              name={name}
              type={type ?? 'text'}
              autoComplete="off"
              value={valores[name] ?? ''}
              onChange={(event) => atualizar(name, event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function dataParaInput(value: string | null | undefined) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}

export default function RequerimentosPage() {
  const [aba, setAba] = useState<'lista' | 'novo'>('lista');
  const [tipo, setTipo] = useState('');
  const [busca, setBusca] = useState('');
  const [sugestoes, setSugestoes] = useState<Servidor[]>([]);
  const [erroBusca, setErroBusca] = useState('');
  const [selecionado, setSelecionado] = useState<Servidor | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [detalhes, setDetalhes] = useState('');
  const [requerimentos, setRequerimentos] = useState<Requerimento[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregandoFormulario, setCarregandoFormulario] = useState(false);
  const [formularioPronto, setFormularioPronto] = useState(false);
  const consultaFormulario = useRef(0);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    requerimentosService.listar()
      .then((dados) => { if (ativo) { setRequerimentos(dados); setErroEnvio(''); } })
      .catch((error) => { if (ativo) setErroEnvio(error.message || 'Erro ao carregar requerimentos.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    if (aba !== 'novo' || selecionado || busca.trim().length < 3) {
      setSugestoes([]);
      return;
    }
    let ativo = true;
    const timer = window.setTimeout(async () => {
      try {
        const dados = await servidoresService.buscarSugestoes(busca.trim(), 8);
        if (ativo) { setSugestoes(dados); setErroBusca(''); }
      } catch {
        if (ativo) { setSugestoes([]); setErroBusca('Não foi possível buscar servidores.'); }
      }
    }, 300);
    return () => { ativo = false; window.clearTimeout(timer); };
  }, [aba, busca, selecionado]);

  const atualizar = (name: string, value: string) => {
    setValores((anterior) => ({ ...anterior, [name]: value }));
  };

  const escolherServidor = async (servidor: Servidor) => {
    const consultaAtual = ++consultaFormulario.current;
    setSelecionado(servidor);
    setBusca(servidor.nomeCompleto || servidor.nome);
    setSugestoes([]);
    setErroEnvio('');
    setCarregandoFormulario(true);
    setFormularioPronto(false);
    const conhecidos = {
      nome: servidor.nomeCompleto || servidor.nome || '',
      cpf: servidor.cpf || '',
      rg: servidor.rgNumero || '',
      orgaoExpedidor: servidor.rgOrgaoEmissor || '',
      dataNascimento: dataParaInput(servidor.dataNascimento),
      cargo: servidor.cargo || '',
      matricula: servidor.matricula || '',
      funcao: servidor.funcao || '',
      lotacao: servidor.setor || '',
      unidadeExercicio: servidor.lotacaoInterna || '',
      celular: servidor.telefone || '',
    };
    setValores(conhecidos);
    try {
      const formulario = await requerimentosService.obterFormulario(servidor.id);
      if (consultaAtual !== consultaFormulario.current) return;
      const preenchidos = Object.fromEntries(
        Object.entries(conhecidos).filter(([, valor]) => Boolean(valor)),
      );
      setValores((atuais) => ({
        ...formulario.complemento,
        ...preenchidos,
        ...Object.fromEntries(Object.entries(atuais).filter(([, valor]) => Boolean(valor))),
      }));
      setFormularioPronto(true);
    } catch (error) {
      if (consultaAtual === consultaFormulario.current) {
        setErroEnvio(error instanceof Error ? error.message : 'Não foi possível carregar os dados adicionais.');
      }
    } finally {
      if (consultaAtual === consultaFormulario.current) setCarregandoFormulario(false);
    }
  };

  const enviar = async () => {
    if (!selecionado || !tipo || enviando || !formularioPronto) {
      setErroEnvio('Selecione o servidor e o tipo de requerimento.');
      return;
    }
    setEnviando(true);
    setErroEnvio('');
    setSucesso('');
    try {
      const novo = await requerimentosService.criar({
        servidorId: selecionado.id, tipo, detalhes, dados: valores,
      });
      setRequerimentos((anteriores) => [
  { ...novo, servidor_nome: valores.nome || selecionado.nomeCompleto || selecionado.nome },
  ...anteriores,
]);
      setSucesso(`Requerimento enviado: ${novo.id}`);
      setAba('lista');
      setTipo('');
      setDetalhes('');
    } catch (error) {
      setErroEnvio(error instanceof Error ? error.message : 'Falha ao enviar requerimento.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Requerimentos</h1>
          <p className="mt-1 text-sm text-slate-400">Solicitações dos servidores e formulário estadual.</p>
        </div>
        <button
          type="button"
          onClick={() => setAba(aba === 'lista' ? 'novo' : 'lista')}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <FilePlus2 size={17} />
          {aba === 'lista' ? 'Ver formulário' : 'Voltar à lista'}
        </button>
      </div>

      {sucesso && <p role="status" className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-300">{sucesso}</p>}
      {erroEnvio && <p role="alert" className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-300">{erroEnvio}</p>}

      {aba === 'lista' ? (
        <section className="rounded-2xl border border-[#26344a] bg-[#172033] p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><ClipboardList size={21} /> Solicitações recebidas</h2>
          {carregando ? <p className="mt-4 text-sm text-slate-400">Carregando...</p> :
            requerimentos.length === 0 ? <p className="mt-4 text-sm text-slate-400">Nenhum requerimento recebido.</p> : (
              <div className="mt-4 space-y-2">
                {requerimentos.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#26344a] bg-[#0b1220] p-3 text-sm">
                    <div><p className="font-medium text-white">{item.tipo}</p><p className="text-xs text-slate-400">Servidor: {item.servidor_nome || item.servidor_id} · {new Date(item.criado_em).toLocaleDateString('pt-BR')}</p></div>
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">{item.status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            )}
        </section>
      ) : (
        <div className="space-y-5">
          <div className="flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100"><Info size={18} className="mt-0.5 shrink-0" /><p>Os dados conhecidos são preenchidos ao escolher um servidor. Complete os campos restantes antes de enviar.</p></div>
          <section className="rounded-2xl border border-[#26344a] bg-[#172033] p-5">
            <h2 className="text-sm font-semibold text-white">Selecionar servidor</h2>
            <div className="relative mt-3 max-w-xl">
              <Search size={18} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
              <input
                type="search"
                value={busca}
                onChange={(event) => {
                  setBusca(event.target.value);
                  setSelecionado(null);
                  consultaFormulario.current++;
                  setFormularioPronto(false);
                  setCarregandoFormulario(false);
                  setValores({});
                  setSugestoes([]);
                  setErroBusca('');
                }}
                placeholder="Busque pelo nome, CPF ou matrícula"
                className="w-full rounded-xl border border-[#26344a] bg-[#0b1220] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-blue-500"
              />
              {sugestoes.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-[#26344a] bg-[#1e293b] p-1 shadow-xl">
                  {sugestoes.map((servidor) => (
                    <button
                      key={servidor.id}
                      type="button"
                      onClick={() => escolherServidor(servidor)}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-blue-600/20"
                    >
                      <span className="block font-medium">{servidor.nomeCompleto || servidor.nome}</span>
                      <span className="text-xs text-slate-400">Matrícula: {servidor.matricula || 'não informada'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {erroBusca && <p className="mt-2 text-xs text-rose-400">{erroBusca}</p>}
            {carregandoFormulario && <p className="mt-2 text-xs text-blue-300">Carregando dados anteriores...</p>}
            {selecionado && formularioPronto && <p className="mt-2 text-xs text-emerald-400">Dados encontrados. Complete os campos que faltam.</p>}
          </section>
          <GrupoCampos titulo="Identificação do servidor" campos={identificacao} valores={valores} atualizar={atualizar} />
          <GrupoCampos titulo="Dados funcionais" campos={funcionais} valores={valores} atualizar={atualizar} />
          <fieldset className="rounded-2xl border border-[#26344a] bg-[#172033] p-5">
            <legend className="px-2 text-sm font-semibold text-white">Vínculo</legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-xs font-medium text-slate-300">Regime de contrato
                <select name="regime" value={valores.regime || ''} onChange={(event) => atualizar('regime', event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-2.5 text-sm text-white">
                  <option value="">Selecione</option><option>Efetivo</option><option>Cargo comissionado</option><option>Temporário</option>
                </select>
              </label>
              <label className="text-xs font-medium text-slate-300">Situação funcional
                <select name="situacao" value={valores.situacao || ''} onChange={(event) => atualizar('situacao', event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-2.5 text-sm text-white">
                  <option value="">Selecione</option><option>Ativo</option><option>Inativo</option><option>Pensionista</option><option>Exonerado</option>
                </select>
              </label>
              <label className="text-xs font-medium text-slate-300">Data de exoneração, se houver
                <input name="dataExoneracao" type="date" value={valores.dataExoneracao || ''} onChange={(event) => atualizar('dataExoneracao', event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-2.5 text-sm text-white" />
              </label>
            </div>
          </fieldset>
          <GrupoCampos titulo="Endereço e contato" campos={contato} valores={valores} atualizar={atualizar} />
          <fieldset className="rounded-2xl border border-[#26344a] bg-[#172033] p-5">
            <legend className="px-2 text-sm font-semibold text-white">Pedido</legend>
            <label className="block text-xs font-medium text-slate-300">Tipo de requerimento
              <select value={tipo} onChange={(event) => setTipo(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-2.5 text-sm text-white">
                <option value="">Selecione o pedido</option>
                {TIPOS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="mt-4 block text-xs font-medium text-slate-300">Detalhes ou outra solicitação
              <textarea rows={4} value={detalhes} onChange={(event) => setDetalhes(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
            </label>
          </fieldset>
          <div className="flex justify-end">
            <button type="button" disabled={!selecionado || !tipo || enviando || !formularioPronto} onClick={enviar} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {enviando ? 'Enviando...' : 'Enviar requerimento'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
