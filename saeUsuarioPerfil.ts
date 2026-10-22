import type { SaeUsuarioResumo } from './saeUsuario';

export interface SaeUsuarioDadosCadastrais {
  rgOriginal?: string | null;
  cpfOriginal?: string | null;
  cartaoSusOriginal?: string | null;
  dataIngresso?: string | null;
  dataDesligamento?: string | null;
  motivoDesligamento?: string | null;
  motivoDesligamentoOriginal?: string | null;
  raca?: string | null;
  deficienciaOriginal?: string | null;
  possuiDeficiencia?: boolean | null;
  tipoDeficiencia?: string | null;
  escolaridadeOriginal?: string | null;
  escolaridadeNormalizada?: string | null;
  rendimentoOriginal?: string | null;
  faixaRenda?: string | null;
  observacao?: string | null;
}

export interface SaeUsuarioEndereco {
  id: string;
  usuarioId: string;
  enderecoOriginal?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  principal: boolean;
}

export interface SaeUsuarioContato {
  id: string;
  usuarioId: string;
  ordem?: number | null;
  telefoneOriginal?: string | null;
  telefoneNormalizado?: string | null;
  nomeContato?: string | null;
  parentesco?: string | null;
  tipo?: string | null;
  observacao?: string | null;
  principal: boolean;
}

export interface SaeUsuarioAgendamentoServico {
  id: string;
  agendamentoId: string;
  servicoId: string;
  servicoNome?: string | null;
  servicoSigla?: string | null;
  profissionalId?: string | null;
  profissionalNome?: string | null;
  turno?: string | null;
  horaInicio?: string | null;
  horaFim?: string | null;
  status: string;
  observacao?: string | null;
}

export interface SaeUsuarioAgendamento {
  id: string;
  data?: string | null;
  tipoUsuario: string;
  usuarioId?: string | null;
  prontuarioInformado?: string | null;
  nomeAvulso?: string | null;
  sexoAvulso?: string | null;
  dataNascimentoAvulso?: string | null;
  tipoAtendimento?: string | null;
  status: string;
  observacao?: string | null;
  servicos: SaeUsuarioAgendamentoServico[];
}

export interface SaeUsuarioAtendimento {
  id: string;
  usuarioId?: string | null;
  agendamentoId?: string | null;
  agendamentoServicoId?: string | null;
  servicoId: string;
  servicoNome?: string | null;
  servicoSigla?: string | null;
  profissionalId?: string | null;
  profissionalNome?: string | null;
  dataAtendimento: string;
  horaInicio?: string | null;
  horaFim?: string | null;
  tipoAtendimento?: string | null;
  procedimento?: string | null;
  evolucao?: string | null;
  observacao?: string | null;
  status: string;
}

export interface SaeUsuarioSinalVital {
  id: string;
  usuarioId?: string | null;
  atendimentoId?: string | null;
  prontuarioInformado?: string | null;
  nomeAvulso?: string | null;
  dataAfericao: string;
  pressaoSistolica?: number | null;
  pressaoDiastolica?: number | null;
  statusOriginal?: string | null;
  observacao?: string | null;
}

export interface SaeUsuarioAvaliacaoServico {
  id: string;
  usuarioId: string;
  servicoId: string;
  servicoNome?: string | null;
  servicoSigla?: string | null;
  anoReferencia: number;
  dataAvaliacao?: string | null;
  status?: string | null;
  valorOriginal?: string | null;
  observacao?: string | null;
}

export interface SaeUsuarioCicloAvaliacao {
  id: string;
  usuarioId: string;
  periodoReferencia: string;
  dataInicio?: string | null;
  dataFim?: string | null;
  statusInicio?: string | null;
  statusFim?: string | null;
  valorInicioOriginal?: string | null;
  valorFimOriginal?: string | null;
  observacao?: string | null;
}

export interface SaeUsuarioPerfil {
  usuario: SaeUsuarioResumo;
  dadosCadastrais: SaeUsuarioDadosCadastrais;
  enderecoPrincipal?: SaeUsuarioEndereco | null;
  enderecos: SaeUsuarioEndereco[];
  contatos: SaeUsuarioContato[];
  agendamentos: SaeUsuarioAgendamento[];
  atendimentos: SaeUsuarioAtendimento[];
  sinaisVitais: SaeUsuarioSinalVital[];
  avaliacoes: SaeUsuarioAvaliacaoServico[];
  ciclosAvaliacao: SaeUsuarioCicloAvaliacao[];
}
