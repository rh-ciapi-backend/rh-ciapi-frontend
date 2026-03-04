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
  nome: string; // Mantido para compatibilidade
  nomeCompleto: string;
  matricula: string;
  cpf: string;
  dataNascimento: string;
  sexo: Sexo;
  rgNumero: string;
  rgOrgaoEmissor: string;
  rgUf: string;
  email: string;
  escolaridade: string;
  profissao: string;
  vinculo: string;
  funcao: string;
  cargaHoraria: string;
  inicioExercicio: string;
  categoria: Categoria;
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
  nome: string; // Mantido para compatibilidade
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
