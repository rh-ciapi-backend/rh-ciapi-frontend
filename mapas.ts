export type TipoLayoutMapa = 'automatico' | 'setrabes_simples' | 'sesau_detalhado' | 'sesau_seletivo';
export type ModoExportacaoMapa = 'arquivo_unico' | 'separado_categoria' | 'separado_setor' | 'zip_consolidado';
export type StatusFiltroMapa = 'ATIVO' | 'INATIVO' | 'TODOS';

export interface MapaFilters {
  mes: number;
  ano: number;
  categoria?: string;
  setor?: string;
  status?: StatusFiltroMapa;
  layout?: TipoLayoutMapa;
  modoExportacao?: ModoExportacaoMapa;
}

export interface LinhaMapa {
  ordem: number;
  matricula: string;
  matriculaSigrh?: string;
  nomeCompleto: string;
  cpf: string;
  cargo: string;
  categoria: string;
  setor: string;
  lotacao?: string;
  lotacaoInterna?: string;
  frequenciaTexto: string;
  faltas: string;
  observacao: string;
  dataInicioSetor?: string;
  cargaHoraria?: string;
  status?: string;
  tipoLayout: TipoLayoutMapa | string;
  inconsistencias?: string[];
}

export interface RegistroInvalidoMapa {
  ordem?: number;
  nomeCompleto?: string;
  matricula?: string;
  cpf?: string;
  motivos: string[];
}

export interface MapaDiagnostics {
  totalRegistros: number;
  totalComCpfAusente: number;
  totalComMatriculaAusente: number;
  totalComCargoAusente: number;
  totalComDuplicidadeCpf: number;
  totalComDuplicidadeMatricula: number;
  totalComObservacao: number;
  totalComObservacaoLonga: number;
  totalComPendenciaGrave: number;
  paginasPrevistas: number;
  registrosInvalidos: RegistroInvalidoMapa[];
  alertas: string[];
  sugestoes: string[];
}

export interface MapaStats {
  totalServidores: number;
  totalPendencias: number;
  totalComObservacao: number;
  totalAptosExportacao: number;
}

export interface MapaPreviewResponse {
  ok: boolean;
  layout: TipoLayoutMapa;
  filtros: MapaFilters;
  stats: MapaStats;
  diagnostics: MapaDiagnostics;
  linhas: LinhaMapa[];
}
