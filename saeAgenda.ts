export type SaeDiaSemana = 1 | 2 | 3 | 4 | 5;

export interface SaeAgendaProfissionalResumo {
  id: string;
  authUserId?: string | null;
  nome: string;
  ativo: boolean;
}

export interface SaeAgendaServicoResumo {
  id: string;
  nome: string;
  sigla?: string | null;
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
  servicos?: SaeAgendaServicoResumo[];
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

export type SaeSolicitacaoAgendaAcao = 'INCLUIR' | 'ALTERAR' | 'REMOVER';
export type SaeSolicitacaoAgendaTipo = SaeSolicitacaoAgendaAcao | 'MISTA';
export type SaeSolicitacaoAgendaStatus =
  | 'PENDENTE'
  | 'APROVADA'
  | 'RECUSADA'
  | 'CANCELADA';

export interface SaeSolicitacaoAgendaItem {
  id: string;
  solicitacaoId: string;
  acao: SaeSolicitacaoAgendaAcao;
  agendaProfissionalId?: string | null;
  servicoId?: string | null;
  diaSemana?: SaeDiaSemana | null;
  horaInicio?: string | null;
  horaFim?: string | null;
  intervaloInicio?: string | null;
  intervaloFim?: string | null;
  duracaoSlotMinutos?: number | null;
  servicoIdAnterior?: string | null;
  diaSemanaAnterior?: SaeDiaSemana | null;
  horaInicioAnterior?: string | null;
  horaFimAnterior?: string | null;
  intervaloInicioAnterior?: string | null;
  intervaloFimAnterior?: string | null;
  duracaoSlotMinutosAnterior?: number | null;
  observacao?: string | null;
  createdAt?: string | null;
}

export interface SaeSolicitacaoAgenda {
  id: string;
  profissionalId: string;
  profissionalNome?: string | null;
  tipoSolicitacao: SaeSolicitacaoAgendaTipo;
  status: SaeSolicitacaoAgendaStatus;
  justificativa?: string | null;
  solicitadoPor: string;
  analisadoPor?: string | null;
  analisadoEm?: string | null;
  observacaoAnalise?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  itens: SaeSolicitacaoAgendaItem[];
}

export interface SaeMinhasSolicitacoesResponse {
  profissional: SaeAgendaProfissionalResumo | null;
  solicitacoes: SaeSolicitacaoAgenda[];
}

export interface SaeCriarSolicitacaoItemPayload {
  acao: SaeSolicitacaoAgendaAcao;
  agendaProfissionalId?: string;
  servicoId?: string;
  diaSemana?: SaeDiaSemana;
  horaInicio?: string;
  horaFim?: string;
  intervaloInicio?: string;
  intervaloFim?: string;
  duracaoSlotMinutos?: number;
  observacao?: string;
}

export interface SaeCriarSolicitacaoPayload {
  profissionalId: string;
  justificativa: string;
  itens: SaeCriarSolicitacaoItemPayload[];
}

export interface SaeAnalisarSolicitacaoPayload {
  decisao: 'APROVADA' | 'RECUSADA';
  observacaoAnalise?: string;
  confirmarImpacto?: boolean;
}
