export type SaeTriagemEtapaNome =
  | 'SERVICO_SOCIAL'
  | 'ENFERMAGEM'
  | 'PSICOLOGIA'
  | 'MEDICO';

export type SaeTriagemEtapaAtual =
  | SaeTriagemEtapaNome
  | 'CONCLUIDA';

export type SaeTriagemStatus =
  | 'EM_TRIAGEM'
  | 'AGUARDANDO_DECISAO'
  | 'APTO'
  | 'NAO_APTO'
  | 'DESISTENTE'
  | 'MATRICULADO';

export type SaeTriagemEtapaStatus =
  | 'PENDENTE'
  | 'AGENDADO'
  | 'CONCLUIDO'
  | 'NAO_COMPARECEU';

export type SaeTriagemParecer =
  | 'FAVORAVEL'
  | 'PENDENCIA'
  | 'DESFAVORAVEL';

export interface SaeTriagemEtapa {
  id: string;
  triagemId: string;
  etapa: SaeTriagemEtapaNome;
  ordem: number;
  status: SaeTriagemEtapaStatus;
  profissionalId?: string | null;
  agendamentoId?: string | null;
  dataAgendada?: string | null;
  dataConclusao?: string | null;
  parecer?: SaeTriagemParecer | null;
  observacao?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SaeTriagem {
  id: string;
  usuarioId?: string | null;
  nome: string;
  sexo?: string | null;
  dataNascimento?: string | null;
  telefone?: string | null;
  observacaoInicial?: string | null;
  status: SaeTriagemStatus;
  etapaAtual: SaeTriagemEtapaAtual;
  resultadoObservacao?: string | null;
  concluidoEm?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  etapas: SaeTriagemEtapa[];
}

export interface SaeCriarTriagemPayload {
  usuarioId?: string | null;
  nome: string;
  sexo?: string | null;
  dataNascimento?: string | null;
  telefone?: string | null;
  observacaoInicial?: string | null;
}

export interface SaeAtualizarEtapaTriagemPayload {
  status: SaeTriagemEtapaStatus;
  profissionalId?: string | null;
  agendamentoId?: string | null;
  dataAgendada?: string | null;
  parecer?: SaeTriagemParecer | null;
  observacao?: string | null;
}

export interface SaeDecisaoTriagemPayload {
  decisao: 'APTO' | 'NAO_APTO' | 'DESISTENTE';
  observacao?: string | null;
}
