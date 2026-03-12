export type FrequenciaDayStatus =
  | 'presente'
  | 'falta'
  | 'atestado'
  | 'ferias'
  | 'feriado'
  | 'ponto_facultativo'
  | 'fim_de_semana'
  | 'aniversario'
  | 'evento'
  | 'pendente'
  | 'sem_registro';

export type FrequenciaExportFormat = 'docx' | 'pdf' | 'csv';

export interface FrequenciaApiResponse<T = unknown> {
  ok?: boolean;
  message?: string;
  error?: string;
  data?: T;
  items?: T;
  results?: T;
}

export interface FrequenciaFiltersState {
  mes: number;
  ano: number;
  busca: string;
  categoria: string;
  setor: string;
  statusServidor: string;
}

export interface FrequenciaDayItem {
  dia: number;
  dataIso: string;
  weekdayLabel: string;
  isWeekend: boolean;
  status: FrequenciaDayStatus;
  rubrica: string;
  referencia: string;
  ocorrenciaManha: string;
  ocorrenciaTarde: string;
  titulo: string;
  descricao: string;
  badges: string[];
  avisos: string[];
  raw?: unknown;
}

export interface FrequenciaResumo {
  totalDiasMes: number;
  presentes: number;
  faltas: number;
  atestados: number;
  ferias: number;
  feriados: number;
  pontosFacultativos: number;
  finsDeSemana: number;
  semRegistro: number;
}

export interface FrequenciaServidorItem {
  id: string;
  servidorId?: string;
  cpf: string;
  nome: string;
  matricula: string;
  cargo: string;
  categoria: string;
  setor: string;
  statusServidor: string;
  fotoUrl?: string;
  resumo: FrequenciaResumo;
  dias: FrequenciaDayItem[];
  warnings: string[];
  raw?: unknown;
}

export interface FrequenciaKpisData {
  totalServidores: number;
  servidoresAtivos: number;
  totalFaltas: number;
  totalAtestados: number;
  totalFerias: number;
  totalFeriados: number;
  totalSemRegistro: number;
}

export interface FrequenciaExportPayload {
  ano: number;
  mes: number;
  formato: FrequenciaExportFormat;
  servidorCpf?: string;
  servidorId?: string;
  categoria?: string;
  setor?: string;
}

export interface FrequenciaOcorrenciaPayload {
  id?: string;
  servidorCpf: string;
  ano: number;
  mes: number;
  dia: number;
  turno?: 'MANHA' | 'TARDE' | 'INTEGRAL';
  tipo:
    | 'FALTA'
    | 'ATESTADO'
    | 'FERIAS'
    | 'FERIADO'
    | 'PONTO_FACULTATIVO'
    | 'EVENTO'
    | 'OBSERVACAO';
  descricao?: string;
  rubrica?: string;
}

export interface FrequenciaMonthGridProps {
  servidor: FrequenciaServidorItem | null;
  selectedDay: number | null;
  onSelectDay: (day: FrequenciaDayItem) => void;
  loading?: boolean;
}

export interface FrequenciaDayDrawerProps {
  open: boolean;
  servidor: FrequenciaServidorItem | null;
  day: FrequenciaDayItem | null;
  onClose: () => void;
}

export interface FrequenciaServerListProps {
  servidores: FrequenciaServidorItem[];
  selectedCpf: string;
  onSelect: (cpf: string) => void;
  loading?: boolean;
}

export interface FrequenciaActionBarProps {
  disabled?: boolean;
  exporting?: boolean;
  onRefresh: () => void;
  onExport: (format: FrequenciaExportFormat) => void;
}

export interface FrequenciaLegendItem {
  key: FrequenciaDayStatus;
  label: string;
  dotClassName: string;
  chipClassName: string;
}

export const FREQUENCIA_STATUS_META: Record<FrequenciaDayStatus, FrequenciaLegendItem> = {
  presente: {
    key: 'presente',
    label: 'Presente',
    dotClassName: 'bg-emerald-400',
    chipClassName: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  },
  falta: {
    key: 'falta',
    label: 'Falta',
    dotClassName: 'bg-rose-400',
    chipClassName: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  },
  atestado: {
    key: 'atestado',
    label: 'Atestado',
    dotClassName: 'bg-amber-400',
    chipClassName: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
  ferias: {
    key: 'ferias',
    label: 'Férias',
    dotClassName: 'bg-sky-400',
    chipClassName: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  },
  feriado: {
    key: 'feriado',
    label: 'Feriado',
    dotClassName: 'bg-fuchsia-400',
    chipClassName: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300',
  },
  ponto_facultativo: {
    key: 'ponto_facultativo',
    label: 'Ponto facultativo',
    dotClassName: 'bg-violet-400',
    chipClassName: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  },
  fim_de_semana: {
    key: 'fim_de_semana',
    label: 'Fim de semana',
    dotClassName: 'bg-slate-400',
    chipClassName: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  },
  aniversario: {
    key: 'aniversario',
    label: 'Aniversário',
    dotClassName: 'bg-pink-400',
    chipClassName: 'border-pink-500/30 bg-pink-500/10 text-pink-300',
  },
  evento: {
    key: 'evento',
    label: 'Evento',
    dotClassName: 'bg-cyan-400',
    chipClassName: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  },
  pendente: {
    key: 'pendente',
    label: 'Pendente',
    dotClassName: 'bg-yellow-400',
    chipClassName: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
  },
  sem_registro: {
    key: 'sem_registro',
    label: 'Sem registro',
    dotClassName: 'bg-zinc-400',
    chipClassName: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
  },
};
