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

export interface SaeAgendamentoCatalogoServico {
  id: string;
  nome: string;
  sigla?: string | null;
}

export interface SaeAgendamentoCatalogoProfissional {
  id: string;
  nome: string;
  servicoIds: string[];
}

export interface SaeAgendamentoCatalogoResponse {
  servicos: SaeAgendamentoCatalogoServico[];
  profissionais: SaeAgendamentoCatalogoProfissional[];
}

export interface SaeAgendamentoUsuarioOpcao {
  id: string;
  prontuario: string;
  nome: string;
}

export interface SaeAgendamentoSlotDisponivel {
  horaInicio: string;
  horaFim: string;
  turno?: string | null;
  agendaId?: string | null;
}

export interface SaeAgendamentoDisponibilidadeResponse {
  profissional: { id: string; nome: string; ativo: boolean };
  servico: SaeAgendamentoCatalogoServico & { ativo?: boolean };
  data: string;
  diaSemana: number;
  slots: SaeAgendamentoSlotDisponivel[];
}

export interface SaeNovoAgendamentoServicoPayload {
  servicoId: string;
  profissionalId: string;
  horaInicio: string;
  horaFim: string;
  observacao?: string | null;
}

export interface SaeNovoAgendamentoPayload {
  data: string;
  tipoUsuario: SaeTipoUsuario;
  usuarioId?: string | null;
  prontuarioInformado?: string | null;
  nomeAvulso?: string | null;
  sexoAvulso?: string | null;
  dataNascimentoAvulso?: string | null;
  tipoAtendimento: SaeTipoAtendimento;
  observacao?: string | null;
  servicos: SaeNovoAgendamentoServicoPayload[];
}

export interface SaeNovoAgendamentoResponse {
  ok: true;
  agendamento: { id: string; status: string; data: string; servicos: unknown[] };
}

export interface SaeProfissionalAgendamentoResumo {
  agendamentoId: string;
  agendamentoServicoId: string;
  data?: string | null;
  horaInicio?: string | null;
  horaFim?: string | null;
  turno?: string | null;
  status: string;
  statusServico: string;
  tipoUsuario: string;
  tipoAtendimento?: string | null;
  usuarioId?: string | null;
  prontuario?: string | null;
  nomePaciente: string;
  servicoId?: string | null;
  servicoNome: string;
  servicoSigla?: string | null;
  observacao?: string | null;
}

export interface SaeMinhaAgendaProfissionalResponse {
  profissional: {
    id: string;
    nome: string;
    ativo: boolean;
    authUserId?: string | null;
  };
  agendamentos: SaeProfissionalAgendamentoResumo[];
}

export interface SaeCancelarAgendamentoResponse {
  ok: true;
  agendamento: {
    id: string;
    status: 'CANCELADO';
    motivo: string;
  };
}

