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

// Textos iniciais: o servidor pode alterar livremente antes de enviar.
const TEXTOS_BASE: Record<string, string> = {
  'Certidão de tempo de serviço e ficha financeira':
    'Requeiro a expedição de certidão de tempo de serviço e de minha ficha financeira, para esclarecimento de minha situação funcional e defesa de meus interesses, nos termos do art. 109, VIII, b, da Lei Complementar estadual nº 53/2001. Solicito que os documentos indiquem os períodos registrados e as informações financeiras disponíveis.',
  'Pagamento de verbas rescisórias':
    'Requeiro a apuração e o pagamento das verbas eventualmente devidas em razão do encerramento do meu vínculo funcional, inclusive férias e adicional proporcionais, quando cabíveis, observado o art. 75, § 1º, da Lei Complementar estadual nº 53/2001. Solicito demonstrativo discriminado dos valores apurados.',
  'Averbação de tempo de contribuição':
    'Requeiro a análise e a averbação do tempo de contribuição comprovado pela documentação anexa em meus assentamentos funcionais, para os efeitos legalmente cabíveis, observados os arts. 93 a 96 da Lei Complementar estadual nº 53/2001 e as regras previdenciárias aplicáveis.',
  Vacância:
    'Requeiro a análise e a declaração de vacância do meu cargo em razão do motivo informado e comprovado nos documentos anexos, com fundamento no art. 31 da Lei Complementar estadual nº 53/2001, com a publicação do ato administrativo correspondente, se cabível.',
  Exoneração:
    'Requeiro minha exoneração, a pedido, do cargo indicado neste formulário, nos termos dos arts. 32 e 33 da Lei Complementar estadual nº 53/2001, conforme a natureza do vínculo. Solicito a adoção das providências administrativas e a publicação do ato correspondente.',
  'Licença para atividade política':
    'Requeiro licença para atividade política em razão de minha candidatura a mandato eletivo, nos termos do art. 83 da Lei Complementar estadual nº 53/2001 e da legislação eleitoral aplicável. Apresento os documentos pertinentes para análise do período de afastamento.',
  'Licença para capacitação':
    'Requeiro licença para capacitação profissional, nos termos do art. 84 da Lei Complementar estadual nº 53/2001. Apresento as informações do curso e solicito a análise dos requisitos legais e do interesse da Administração.',
  'Licença para cursar pós-graduação':
    'Requeiro a análise de dispensa ou ajuste de horário para cursar pós-graduação, com fundamento no art. 91, §§ 4º a 7º, da Lei Complementar estadual nº 53/2001. Apresento comprovante de matrícula, calendário e horários do curso para avaliação das condições aplicáveis.',
  'Licença para desempenho de mandato classista':
    'Requeiro licença para o desempenho de mandato classista, com fundamento no art. 86 da Lei Complementar estadual nº 53/2001. Apresento os documentos relativos à eleição, à entidade e ao mandato para análise dos requisitos legais.',
  'Licença para o serviço militar':
    'Requeiro licença para o serviço militar, nos termos do art. 82 da Lei Complementar estadual nº 53/2001, em razão da convocação comprovada em documento anexo. Solicito a análise do período de afastamento e das condições previstas na legislação específica.',
  'Licença para tratar de interesse particular':
    'Requeiro licença para tratar de interesses particulares, sem remuneração, nos termos do art. 85 da Lei Complementar estadual nº 53/2001. Solicito a análise dos requisitos legais, do período pretendido e do interesse da Administração.',
  'Licença por doença em pessoa da família':
    'Requeiro licença por motivo de doença em pessoa da família, nos termos do art. 80 da Lei Complementar estadual nº 53/2001. Apresento a documentação pertinente e solicito a avaliação da necessidade de assistência direta, inclusive por junta médica oficial, quando exigida.',
  'Licença por afastamento do cônjuge ou companheiro(a)':
    'Requeiro licença para acompanhar meu cônjuge ou companheiro(a), em razão de seu deslocamento, nos termos do art. 81 da Lei Complementar estadual nº 53/2001. Apresento a documentação do deslocamento e solicito a análise do período pretendido.',
  'Licença para tratamento da própria saúde':
    'Requeiro licença para tratamento da própria saúde, nos termos dos arts. 180 e 181 da Lei Complementar estadual nº 53/2001. Apresento a documentação médica necessária e solicito a avaliação pela perícia médica competente.',
  'Licença por acidente em serviço':
    'Requeiro licença por acidente em serviço, com fundamento nos arts. 185 a 188 da Lei Complementar estadual nº 53/2001. Apresento a documentação relativa ao ocorrido e solicito a apuração do nexo com as atividades funcionais e a avaliação médica cabível.',
  'Licença à gestante':
    'Requeiro licença à gestante, em razão da gestação comprovada pela documentação médica apresentada. Solicito a análise do período e das condições aplicáveis à minha situação funcional, conforme a legislação vigente.',
  'Auxílio natalidade':
    'Requeiro a concessão do auxílio-natalidade, com fundamento no art. 179 da Lei Complementar estadual nº 53/2001, em razão do nascimento de filho(a), conforme documentação apresentada. Solicito a análise dos requisitos legais e, sendo devido, o pagamento do benefício.',
  'Salário família':
    'Requeiro a análise da concessão do salário-família em razão de dependente indicado na documentação apresentada. Solicito a verificação dos requisitos e a implantação do benefício, caso devido, conforme a legislação previdenciária aplicável ao meu vínculo.',
};

type Campo = { name: string; label: string; type?: string };

const UNIDADE_CIAPI = 'CENTRO INTEGRADO DE ATENÇÃO À PESSOA IDOSA';
const ESTADOS_CIVIS = ['SOLTEIRO', 'SOLTEIRA', 'CASADO', 'CASADA', 'DIVORCIADO', 'DIVORCIADA', 'SEPARADO', 'SEPARADA', 'VIÚVO', 'VIÚVA', 'UNIÃO ESTÁVEL'];
const LOTACOES_CIAPI = ['CENTRO DIA', 'ABRIGO DE IDOSOS'];
const comparar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
const ehCiapi = (texto: string) => ['CIAPI', UNIDADE_CIAPI].some((item) => comparar(texto) === comparar(item));
const valorOpcao = (valor: string, opcoes: string[]) =>
  opcoes.find((opcao) => comparar(opcao) === comparar(valor)) || (valor ? '__outro__' : '');

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
  const [outros, setOutros] = useState<Record<string, boolean>>({});
  const campoSelecao = (name: string, opcoes: string[], atualizarUnidade = false) => {
    const valor = valores[name] || '';
    const selecionado = outros[name] ? '__outro__' : valorOpcao(valor, opcoes);
    return (
      <>
        <select
          name={name}
          value={selecionado}
          onChange={(event) => {
            const novo = event.target.value;
            setOutros((anteriores) => ({ ...anteriores, [name]: novo === '__outro__' }));
            atualizar(name, novo === '__outro__' ? '' : novo);
            if (atualizarUnidade && ehCiapi(novo) && !LOTACOES_CIAPI.some((item) => comparar(item) === comparar(valores.lotacao || ''))) {
              atualizar('lotacao', '');
            }
          }}
          className="mt-1.5 w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-2.5 text-sm text-white"
        >
          <option value="">Selecione</option>
          {opcoes.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
          <option value="__outro__">OUTRO (DIGITAR)</option>
        </select>
        {selecionado === '__outro__' && <input
          aria-label={`${name}: digite a opção`}
          value={valor}
          onChange={(event) => atualizar(name, event.target.value)}
          placeholder="DIGITE AQUI"
          className="mt-2 w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-2.5 text-sm text-white uppercase"
        />}
      </>
    );
  };
  return (
    <fieldset className="rounded-2xl border border-[#26344a] bg-[#172033] p-5">
      <legend className="px-2 text-sm font-semibold text-white">{titulo}</legend>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {campos.map(({ name, label, type }) => (
          <label key={name} className="block text-xs font-medium text-slate-300">
            {label}
            {name === 'estadoCivil' ? campoSelecao(name, ESTADOS_CIVIS) :
            name === 'nacionalidade' ? campoSelecao(name, ['BRASILEIRO', 'BRASILEIRA']) :
            name === 'unidadeExercicio' ? campoSelecao(name, [UNIDADE_CIAPI], true) :
            name === 'lotacao' && ehCiapi(valores.unidadeExercicio || '') ? campoSelecao(name, LOTACOES_CIAPI) : <input
              name={name}
              type={type ?? 'text'}
              autoComplete="off"
              value={valores[name] ?? ''}
              onChange={(event) => atualizar(name, event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-2.5 text-sm text-white uppercase outline-none focus:border-blue-500"
            />}
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

export default function RequerimentosPage({ modoServidor = false }: { modoServidor?: boolean }) {
  const [aba, setAba] = useState<'lista' | 'novo'>(modoServidor ? 'novo' : 'lista');
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
  const [ultimoSalvo, setUltimoSalvo] = useState<Requerimento | null>(null);
  const [linkServidor, setLinkServidor] = useState('');
  const consultaFormulario = useRef(0);

  useEffect(() => {
    if (modoServidor) return;
    let ativo = true;
    setCarregando(true);
    requerimentosService.listar()
      .then((dados) => { if (ativo) { setRequerimentos(dados); setErroEnvio(''); } })
      .catch((error) => { if (ativo) setErroEnvio(error.message || 'Erro ao carregar requerimentos.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [modoServidor]);

  useEffect(() => {
    if (!modoServidor) return;
    let ativo = true;
    setCarregandoFormulario(true);
    requerimentosService.obterFormulario()
      .then(({ servidor, complemento }) => {
        if (!ativo) return;
        const dado = (chave: string) => String(servidor[chave] ?? '');
        setSelecionado({
          id: dado('id') || dado('servidor') || 'proprio',
          nomeCompleto: dado('nome_completo') || dado('nomeCompleto') || dado('nome'),
          cpf: dado('cpf'),
        } as Servidor);
        setValores({
          ...complemento,
          nome: dado('nome_completo') || dado('nomeCompleto') || dado('nome'),
          cpf: dado('cpf'),
          rg: dado('rg_numero') || dado('rgNumero') || complemento.rg || '',
          cargo: dado('cargo') || complemento.cargo || '',
          matricula: dado('matricula') || complemento.matricula || '',
          lotacao: dado('setor') || complemento.lotacao || '',
        });
        setFormularioPronto(true);
      })
      .catch((error) => { if (ativo) setErroEnvio(error.message || 'Erro ao carregar seus dados.'); })
      .finally(() => { if (ativo) setCarregandoFormulario(false); });
    return () => { ativo = false; };
  }, [modoServidor]);

  useEffect(() => {
    if (modoServidor || aba !== 'novo' || selecionado || busca.trim().length < 3) {
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
  }, [aba, busca, selecionado, modoServidor]);

  const atualizar = (name: string, value: string) => {
    setUltimoSalvo(null);
    setValores((anterior) => ({ ...anterior, [name]: name.startsWith('data') ? value : value.toLocaleUpperCase('pt-BR') }));
  };

  const escolherServidor = async (servidor: Servidor) => {
    const consultaAtual = ++consultaFormulario.current;
    setSelecionado(servidor);
    setLinkServidor('');
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
        servidorId: selecionado.id, tipo, detalhes, dados: Object.fromEntries(
          Object.entries(valores).map(([chave, valor]) => [chave, chave.startsWith('data') ? valor : valor.toLocaleUpperCase('pt-BR')]),
        ),
      });
      setRequerimentos((anteriores) => [
  { ...novo, servidor_nome: valores.nome || selecionado.nomeCompleto || selecionado.nome },
  ...anteriores,
]);
      setSucesso(`Requerimento enviado: ${novo.id}`);
      setUltimoSalvo(novo);
      if (!modoServidor) {
        setAba('lista');
        setTipo('');
        setDetalhes('');
      }
    } catch (error) {
      setErroEnvio(error instanceof Error ? error.message : 'Falha ao enviar requerimento.');
    } finally {
      setEnviando(false);
    }
  };

  const gerarLink = async () => {
    if (!selecionado) return;
    setErroEnvio('');
    try {
      const acesso = await requerimentosService.criarAcesso(selecionado.id);
      setLinkServidor(acesso.url);
      try { await navigator.clipboard.writeText(acesso.url); } catch { /* campo permite copiar */ }
    } catch (error) {
      setErroEnvio(error instanceof Error ? error.message : 'Não foi possível gerar o link.');
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Requerimentos</h1>
          <p className="mt-1 text-sm text-slate-400">{modoServidor ? 'Preencha e salve sua solicitação.' : 'Solicitações dos servidores e formulário estadual.'}</p>
        </div>
        {!modoServidor && <button
          type="button"
          onClick={() => setAba(aba === 'lista' ? 'novo' : 'lista')}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <FilePlus2 size={17} />
          {aba === 'lista' ? 'Ver formulário' : 'Voltar à lista'}
        </button>}
      </div>

      {sucesso && <p role="status" className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-300">{sucesso}</p>}
      {erroEnvio && <p role="alert" className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-300">{erroEnvio}</p>}
      {modoServidor && ultimoSalvo && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-blue-500/20 bg-[#172033] p-4">
          <button type="button" onClick={() => requerimentosService.baixarPdf(ultimoSalvo.id).catch((error) => setErroEnvio(error.message))} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Baixar PDF</button>
          <button type="button" onClick={() => requerimentosService.baixarDocx(ultimoSalvo.id).catch((error) => setErroEnvio(error.message))} className="rounded-lg border border-[#26344a] px-4 py-2 text-sm text-white">Baixar Word</button>
        </div>
      )}

      {aba === 'lista' ? (
        <section className="rounded-2xl border border-[#26344a] bg-[#172033] p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><ClipboardList size={21} /> Solicitações recebidas</h2>
          {carregando ? <p className="mt-4 text-sm text-slate-400">Carregando...</p> :
            requerimentos.length === 0 ? <p className="mt-4 text-sm text-slate-400">Nenhum requerimento recebido.</p> : (
              <div className="mt-4 space-y-2">
                {requerimentos.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#26344a] bg-[#0b1220] p-3 text-sm">
                    <div><p className="font-medium text-white">{item.tipo}</p><p className="text-xs text-slate-400">Servidor: {item.servidor_nome || item.servidor_id} · {new Date(item.criado_em).toLocaleDateString('pt-BR')}</p></div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">{item.status.replace('_', ' ')}</span>
                      {(['docx', 'pdf'] as const).map((formato) => (
                        <button
                          key={formato}
                          type="button"
                          onClick={async () => {
                            setErroEnvio('');
                            try {
                              if (formato === 'pdf') await requerimentosService.baixarPdf(item.id);
                              else await requerimentosService.baixarDocx(item.id);
                            } catch (error) {
                              setErroEnvio(error instanceof Error ? error.message : 'Não foi possível baixar o requerimento.');
                            }
                          }}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Baixar {formato === 'pdf' ? 'PDF' : 'Word'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </section>
      ) : (
        <div className="space-y-5">
          <div className="flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100"><Info size={18} className="mt-0.5 shrink-0" /><p>{modoServidor ? 'Confira seus dados e complete os campos que faltam.' : 'Os dados conhecidos são preenchidos ao escolher um servidor. Complete os campos restantes antes de enviar.'}</p></div>
          {!modoServidor && <section className="rounded-2xl border border-[#26344a] bg-[#172033] p-5">
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
            {selecionado && formularioPronto && <button type="button" onClick={gerarLink} className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Gerar e copiar link do servidor</button>}
            {linkServidor && <input readOnly value={linkServidor} onFocus={(event) => event.currentTarget.select()} className="mt-2 w-full rounded-lg border border-[#26344a] bg-[#0b1220] p-2 text-xs text-white" aria-label="Link do servidor" />}
          </section>}
          {modoServidor && carregandoFormulario && <p className="text-sm text-blue-300">Carregando seus dados...</p>}
          <GrupoCampos key={`identificacao-${selecionado?.id || ''}`} titulo="Identificação do servidor" campos={identificacao} valores={valores} atualizar={atualizar} />
          <GrupoCampos key={`funcionais-${selecionado?.id || ''}`} titulo="Dados funcionais" campos={funcionais} valores={valores} atualizar={atualizar} />
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
              <select value={tipo} onChange={(event) => {
                const novoTipo = event.target.value;
                setUltimoSalvo(null);
                setTipo(novoTipo);
                setDetalhes(TEXTOS_BASE[novoTipo] ?? '');
              }} className="mt-1.5 w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-2.5 text-sm text-white">
                <option value="">Selecione o pedido</option>
                {TIPOS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="mt-4 block text-xs font-medium text-slate-300">Texto da solicitação (editável)
              <textarea rows={7} value={detalhes} onChange={(event) => { setUltimoSalvo(null); setDetalhes(event.target.value); }} className="mt-1.5 w-full rounded-xl border border-[#26344a] bg-[#0b1220] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
            </label>
          </fieldset>
          <div className="flex justify-end">
            <button type="button" disabled={!selecionado || !tipo || enviando || !formularioPronto || (modoServidor && !!ultimoSalvo)} onClick={enviar} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {enviando ? 'Salvando...' : modoServidor && ultimoSalvo ? 'Salvo' : modoServidor ? 'Salvar requerimento' : 'Enviar requerimento'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
