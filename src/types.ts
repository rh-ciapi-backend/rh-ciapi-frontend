export type Categoria =
  | 'EFETIVO SESAU'
  | 'SELETIVO SESAU'
  | 'EFETIVO SETRABES'
  | 'SELETIVO SETRABES'
  | 'FEDERAIS SETRABES'
  | 'COMISSIONADOS';

export type StatusServidor = 'ATIVO' | 'INATIVO';
export type Sexo = 'M' | 'F' | 'OUTRO';

export interface Servidor {
  id: string;
  nome: string;
  nomeCompleto: string;
  matricula: string;
  cpf: string;
  dataNascimento: string | null;
  sexo: Sexo | '';
  rgNumero: string;
  rgOrgaoEmissor: string;
  rgUf: string;
  email: string;
  escolaridade: string;
  profissao: string;
  vinculo: string;
  funcao: string;
  cargaHoraria: string;
  inicioExercicio: string | null;
  categoria: Categoria | '';
  setor: string;
  cargo: string;
  telefone: string;
  lotacaoInterna: string;
  turno: string;
  status: StatusServidor;
  observacao?: string;
  aniversario: string | null;
}

export interface Ferias {
  id: string;
  servidorId: string;
  ano: number;
  periodo1Inicio: string;
  periodo1Fim: string;
  periodo2Inicio?: string;
  periodo2Fim?: string;
  periodo3Inicio?: string;
  periodo3Fim?: string;
  observacao?: string;
}

export interface OcorrenciaFrequencia {
  id: string;
  servidorId: string;
  data: string;
  tipo: 'FALTA' | 'ATESTADO' | 'LEMBRETE' | 'EVENTO';
  turno: 'MANHA' | 'TARDE' | 'INTEGRAL';
  descricao?: string;
}

export interface EventoCalendario {
  id: string;
  data: string;
  tipo: 'FERIADO' | 'PONTO' | 'EVENTO';
  titulo: string;
  descricao?: string;
}

export interface LinhaMapa {
  ordem: number;
  nome: string;
  nomeCompleto: string;
  matricula: string;
  frequencia: number;
  faltas: number;
  observacao: string;
  categoria: Categoria;
  setor: string;
}

export interface CategoriaAdmin {
  id: string;
  nome: string;
  ativo: boolean;
  created_at?: string;
}

export interface SetorAdmin {
  id: string;
  nome: string;
  ativo: boolean;
  created_at?: string;
}

export interface LogAtividade {
  id: string;
  user_id: string;
  user_email?: string;
  acao: string;
  entidade: string;
  entidade_id: string;
  detalhes: any;
  created_at: string;
}

export interface UsuarioAdmin {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

export interface OpcaoFiltro {
  value: string;
  label: string;
}

/* =========================
   ATESTADOS
========================= */

export type StatusAtestado = 'PENDENTE' | 'VALIDADO' | 'REJEITADO';

export type TipoAtestado =
  | 'MÉDICO'
  | 'ODONTOLÓGICO'
  | 'PSICOLÓGICO'
  | 'ACOMPANHAMENTO';

export interface AtestadoArquivoMetadata {
  arquivoNome: string;
  arquivoUrl: string;
  arquivoPath: string;
  arquivoTipo: string;
  arquivoTamanho: number;
}

export interface Atestado {
  id: string;
  cpf: string;
  servidorNome: string;
  matricula: string;
  setor: string;
  categoria: Categoria | '' | string;
  tipo: TipoAtestado;
  dataEmissao: string;
  dataInicio: string;
  dataFim: string;
  dias: number;
  cid: string;
  observacao: string;
  status: StatusAtestado;
  arquivoNome: string;
  arquivoUrl: string;
  arquivoPath: string;
  arquivoTipo: string;
  arquivoTamanho: number;
  lancarNaFrequencia: boolean;
  considerarDiasUteis: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface AtestadoInput {
  cpf: string;
  servidorNome: string;
  matricula?: string;
  setor?: string;
  categoria?: Categoria | '' | string;
  tipo: TipoAtestado;
  dataEmissao?: string;
  dataInicio: string;
  dataFim: string;
  dias: number;
  cid?: string;
  observacao?: string;
  status: StatusAtestado;
  arquivo?: File | null;
  arquivoAtualNome?: string;
  arquivoAtualUrl?: string;
  arquivoAtualPath?: string;
  arquivoAtualTipo?: string;
  arquivoAtualTamanho?: number;
  lancarNaFrequencia: boolean;
  considerarDiasUteis: boolean;
}

export interface AtestadoFormData {
  id?: string;
  cpf: string;
  servidorNome: string;
  matricula: string;
  setor: string;
  categoria: Categoria | '' | string;
  tipo: '' | TipoAtestado;
  dataEmissao: string;
  dataInicio: string;
  dataFim: string;
  dias: string;
  cid: string;
  observacao: string;
  status: '' | StatusAtestado;
  arquivo: File | null;
  arquivoNome: string;
  arquivoUrl: string;
  arquivoPath: string;
  arquivoTipo: string;
  arquivoTamanho: number;
  lancarNaFrequencia: boolean;
  considerarDiasUteis: boolean;
}

export interface AtestadoFilters {
  busca?: string;
  mes?: string;
  ano?: string;
  setor?: string;
  categoria?: string;
  status?: 'TODOS' | StatusAtestado;
  tipo?: 'TODOS' | TipoAtestado;
}

export interface AtestadoUploadResult {
  arquivoNome: string;
  arquivoUrl: string;
  arquivoPath: string;
  arquivoTipo: string;
  arquivoTamanho: number;
}

export interface FrequenciaConflict {
  data: string;
  origem: 'FREQUENCIA' | 'FALTAS' | 'FERIAS' | 'ATESTADO';
  descricao: string;
}

export interface FrequenciaSyncResult {
  ok: boolean;
  conflitos: FrequenciaConflict[];
  avisos: string[];
}

export interface AtestadoOperationResult {
  ok: boolean;
  data?: Atestado;
  message?: string;
  warning?: string;
}
