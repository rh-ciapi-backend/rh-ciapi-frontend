export type SaeDiaSemana = 1 | 2 | 3 | 4 | 5;

export interface SaeAgendaProfissionalResumo {
  id: string;
  authUserId?: string | null;
  nome: string;
  ativo: boolean;
}

export interface SaeAgendaPeriodo {
  id: string;
  profissionalId: string;
  servicoId?: string | null;
  diaSemana: SaeDiaSemana;
  horaInicio?: string | null;
  horaFim?: string | null;
  intervaloInicio?: string | null;
  intervaloFim?: string | null;
  duracaoSlotMinutos: number;
  ativo: boolean;
  observacao?: string | null;
  createdAt?: string | null;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface SaeAgendaPeriodoForm {
  servicoId: string;
  diaSemana: SaeDiaSemana;
  horaInicio: string;
  horaFim: string;
  intervaloInicio: string;
  intervaloFim: string;
  duracaoSlotMinutos: number;
  ativo: boolean;
  observacao: string;
}

export interface SaeAgendaListResponse {
  profissional: SaeAgendaProfissionalResumo;
  agenda: SaeAgendaPeriodo[];
}

export interface SaeAgendaAfetado {
  agendamentoServicoId: string;
  agendamentoId: string;
  data?: string | null;
  tipoUsuario?: string | null;
  usuarioId?: string | null;
  prontuarioInformado?: string | null;
  nomeAvulso?: string | null;
  tipoAtendimento?: string | null;
  servicoId?: string | null;
  turno?: string | null;
  horaInicio?: string | null;
  horaFim?: string | null;
  statusAgendamento?: string | null;
  statusServico?: string | null;
  nome?: string | null;
  prontuario?: string | null;
  telefone?: string | null;
}

export interface SaeAgendaImpacto {
  agenda: SaeAgendaPeriodo;
  totalAfetados: number;
  afetados: SaeAgendaAfetado[];
}

export interface SaeAgendaAlteracaoPayload extends SaeAgendaPeriodoForm {
  confirmarImpacto?: boolean;
  motivoAlteracao?: string;
}
