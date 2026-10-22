export interface SaeServicoOpcao {
  id: string;
  nome: string;
  sigla?: string | null;
  ativo: boolean;
}

export interface SaeServidorBusca {
  id: string;
  nome: string;
  matricula: string;
  cpf: string;
  cpfMascarado?: string | null;
  email: string;
  telefone: string;
  cargo: string;
  funcao: string;
  profissao: string;
  setor: string;
  lotacaoInterna: string;
  categoria: string;
  status: string;
  jaVinculado: boolean;
}

export interface SaeProfissional {
  id: string;
  servidorId?: string | null;
  authUserId?: string | null;
  nome: string;
  matricula?: string | null;
  cpfMascarado?: string | null;
  registroProfissional?: string | null;
  conselho?: string | null;
  cargoFuncao?: string | null;
  telefone?: string | null;
  email?: string | null;
  setor?: string | null;
  categoria?: string | null;
  ativo: boolean;
  senhaProvisoria?: boolean;
  contaStatus?: string | null;
  contaAmbiente?: string | null;
  servicoIds: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SaeProfissionalForm {
  servidorId: string;
  registroProfissional: string;
  conselho: string;
  ativo: boolean;
  servicoIds: string[];
}

export type SaeProfissionaisAction =
  | 'visualizar'
  | 'criar'
  | 'editar'
  | 'excluir';

export interface SaeProfissionaisListResponse {
  profissionais: SaeProfissional[];
  servicos: SaeServicoOpcao[];
  permissions: SaeProfissionaisAction[];
}

export interface SaeCriarProfissionalResponse {
  ok: true;
  profissional: SaeProfissional;
  senhaTemporaria?: string | null;
  contaReutilizada?: boolean;
}
