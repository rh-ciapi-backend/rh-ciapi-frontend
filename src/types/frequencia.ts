export type FrequenciaViewMode = 'geral' | 'individual';

export type FrequenciaDayStatus =
  | 'dia_util'
  | 'sabado'
  | 'domingo'
  | 'feriado'
  | 'ponto_facultativo'
  | 'ferias'
  | 'atestado'
  | 'falta'
  | 'pendencia'
  | 'ocorrencia';

export type FrequenciaChannel = 'rubrica' | 'ocorrencia' | 'ambos' | 'nenhum';

export interface FrequenciaFiltersState {
  mes: number;
  ano: number;
  servidor: string;
  categoria: string;
  setor: string;
  status: string;
  busca: string;
  viewMode: FrequenciaViewMode;
}

export interface FrequenciaKpiItem {
  id: string;
  label: string;
  value: number;
  hint?: string;
  tone?:
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'violet';
}

export interface FrequenciaServerSummary {
  id: string;
  nome: string;
  cpf?: string;
  matricula?: string;
  categoria?: string;
  setor?: string;
  status?: string;
  cargo?: string;
  avatar?: string | null;
  resumo?: string;
  totalDias?: number;
  diasLancados?: number;
  pendencias?: number;
  faltas?: number;
  atestados?: number;
  ferias?: number;
  raw?: any;
}

export interface FrequenciaDayItem {
  id: string;
  dia: number;
  dataIso: string;
  weekday: number;
  weekdayLabel: string;
  isToday?: boolean;
  isWeekend?: boolean;
  isSaturday?: boolean;
  isSunday?: boolean;
  isHoliday?: boolean;
  isPontoFacultativo?: boolean;
  isFerias?: boolean;
  isAtestado?: boolean;
  isFalta?: boolean;
  isPending?: boolean;
  hasOcorrencia?: boolean;
  turno1?: string;
  turno2?: string;
  rubrica?: string;
  ocorrencia?: string;
  observacoes?: string;
  statusFinal: FrequenciaDayStatus;
  channel: FrequenciaChannel;
  chips?: string[];
  raw?: any;
}

export interface FrequenciaMonthData {
  servidor: FrequenciaServerSummary;
  mes: number;
  ano: number;
  totalDiasMes: number;
  hiddenRowsFrom?: number | null;
  hiddenRowsTo?: number | null;
  warnings?: string[];
  dayItems: FrequenciaDayItem[];
  raw?: any;
}

export interface FrequenciaLegendItem {
  key: FrequenciaDayStatus;
  label: string;
  description?: string;
}

export interface FrequenciaOption {
  label: string;
  value: string;
}

export interface FrequenciaServiceListResult {
  ok?: boolean;
  data?: any;
  items?: any[];
  servidores?: any[];
  results?: any[];
  [key: string]: any;
}
