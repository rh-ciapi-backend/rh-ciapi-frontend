export type SituacaoUsuario = 'ATIVO' | 'INATIVO';

export interface SaeUsuarioResumo {
  id: string;
  prontuario: string;
  nome: string;
  sexo?: string | null;
  nacionalidade?: string | null;
  dataNascimento?: string | null;
  idade?: number | null;
  turno?: string | null;
  situacao: SituacaoUsuario;
  enderecoOriginal?: string | null;
  bairro?: string | null;
  telefonePrincipal?: string | null;
}

export interface SaeUsuarioDbRow {
  id: string;
  prontuario: string;
  nome: string;
  sexo?: string | null;
  nacionalidade?: string | null;
  data_nascimento?: string | null;
  idade?: number | null;
  turno?: string | null;
  situacao_cadastral?: string | null;
  endereco_original?: string | null;
  bairro?: string | null;
  telefone_principal?: string | null;
}

export interface ListarSaeUsuariosParams {
  busca?: string;
  situacao?: 'TODOS' | SituacaoUsuario;
  turno?: 'TODOS' | 'MANHÃ' | 'TARDE';
  limite?: number;
}
