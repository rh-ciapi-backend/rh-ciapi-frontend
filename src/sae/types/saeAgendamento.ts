export type SaeTipoUsuario =
  | 'MATRICULADO'
  | 'TRIAGEM'
  | 'SERVIDOR'
  | 'EXTERNO';

export type SaeTipoAtendimento =
  | 'AVALIAÇÃO'
  | 'REAVALIAÇÃO'
  | 'RETORNO'
  | 'ROTINA';

export interface SaeAgendamentoServicoResumo {
  id: string;
  agendamentoId: string;
  servicoId: string;
  servicoNome: string;
  servicoSigla?: string | null;
  profissionalId?: string | null;
  profissionalNome?: string | null;
  turno?: string | null;
  horaInicio?: string | null;
  horaFim?: string | null;
  status: string;
  observacao?: string | null;
}

export interface SaeAgendamentoResumo {
  id: string;
  data?: string | null;
  tipoUsuario: string;
  usuarioId?: string | null;
  prontuario?: string | null;
  nomeUsuario: string;
  sexoAvulso?: string | null;
  dataNascimentoAvulso?: string | null;
  tipoAtendimento?: string | null;
  status: string;
  observacao?: string | null;
  servicos: SaeAgendamentoServicoResumo[];
}

export interface SaeAgendamentoFiltros {
  busca: string;
  data: string;
  tipoUsuario: 'TODOS' | SaeTipoUsuario;
  tipoAtendimento: 'TODOS' | SaeTipoAtendimento;
  servicoId: 'TODOS' | string;
  turno: 'TODOS' | 'MANHÃ' | 'TARDE';
  status: 'TODOS' | string;
}
