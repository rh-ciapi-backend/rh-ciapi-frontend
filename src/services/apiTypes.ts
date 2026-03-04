import { Categoria, StatusServidor } from '../types';

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  erro?: string;
}

export interface ListarServidoresParams {
  nome?: string;
  busca?: string; // Mantido para compatibilidade com o código atual
  categoria?: Categoria;
  setor?: string;
  status?: StatusServidor;
  sexo?: string;
}

export interface ListarFeriasParams {
  ano?: number;
  mes?: number;
  categoria?: Categoria;
  servidorId?: string;
}

export interface ListarFrequenciaParams {
  ano?: number;
  mes?: number;
  servidorId?: string;
}

export interface ListarEventosParams {
  ano?: number;
  mes?: number;
  tipo?: string;
}

export interface GerarMapaParams {
  mes?: number;
  ano?: number;
  categoria?: Categoria;
  setor?: string;
}
