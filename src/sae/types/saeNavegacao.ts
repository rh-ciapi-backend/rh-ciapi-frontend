export interface SaeAgendamentoFoco {
  agendamentoId?: string | null;
  nomeUsuario?: string | null;
  etapa?: 'SERVICO_SOCIAL' | 'ENFERMAGEM' | 'PSICOLOGIA' | 'MEDICO' | 'TERAPIA_OCUPACIONAL' | null;
  data?: string | null;
}
