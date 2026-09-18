export interface SaeServicoOpcao {
  id: string;
  nome: string;
  sigla?: string | null;
  ativo: boolean;
}


export interface SaeUsuarioSistemaOpcao {
  id: string;
  authUserId: string;
  nomeCompleto: string;
  email: string;
  perfil?: string | null;
  status?: string | null;
  setorNome?: string | null;
  vinculadoProfissionalId?: string | null;
  vinculadoProfissionalNome?: string | null;
}

export interface SaeProfissional {
  id: string;
  authUserId?: string | null;
  nome: string;
  registroProfissional?: string | null;
  conselho?: string | null;
  cargoFuncao?: string | null;
  telefone?: string | null;
  email?: string | null;
  ativo: boolean;
  servicoIds: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SaeProfissionalForm {
  nome: string;
  registroProfissional: string;
  conselho: string;
  cargoFuncao: string;
  telefone: string;
  email: string;
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
  usuariosSistema?: SaeUsuarioSistemaOpcao[];
  permissions: SaeProfissionaisAction[];
}
