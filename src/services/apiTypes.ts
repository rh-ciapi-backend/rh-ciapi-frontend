import { Categoria, Sexo, StatusServidor } from '../types';

export interface ApiResponse<T> {
  ok?: boolean;
  data?: T;
  items?: T;
  rows?: T;
  results?: T;
  list?: T;
  payload?: T;
  result?: T;
  erro?: string;
  error?: string;
  message?: string;
}

export interface ListarServidoresParams {
  nome?: string;
  busca?: string;
  categoria?: Categoria;
  setor?: string;
  status?: StatusServidor;
  sexo?: Sexo | '';
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
