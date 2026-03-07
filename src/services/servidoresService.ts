import { Servidor, Categoria, Sexo, StatusServidor, OpcaoFiltro } from '../types';
import { MOCK_SERVIDORES } from '../data/servidores';
import { API_CONFIG } from '../config/api';
import { supabase } from '../lib/supabaseClient';
import { ListarServidoresParams } from './apiTypes';
import { logsService } from './logsService';
import { http } from './http';

let servidoresMock = Array.isArray(MOCK_SERVIDORES) ? [...MOCK_SERVIDORES] : [];

const CATEGORIAS_VALIDAS: readonly Categoria[] = [
  'EFETIVO SESAU',
  'SELETIVO SESAU',
  'EFETIVO SETRABES',
  'SELETIVO SETRABES',
  'FEDERAIS SETRABES',
  'COMISSIONADOS',
] as const;

const SEXOS_VALIDOS: readonly Sexo[] = ['M', 'F', 'OUTRO'] as const;
const STATUS_VALIDOS: readonly StatusServidor[] = ['ATIVO', 'INATIVO'] as const;

const FALLBACK_SEXO = 'NÃO INFORMADO';
const FALLBACK_SETOR = 'NÃO INFORMADO';
const FALLBACK_CATEGORIA = 'NÃO INFORMADO';
const FALLBACK_STATUS = 'ATIVO';

const isObject = (value: unknown): value is Record<string, any> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const asString = (value: unknown, fallback = ''): string => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const asNullableString = (value: unknown): string | null => {
  const v = asString(value, '');
  return v ? v : null;
};

const asCategoria = (value: unknown): Categoria | '' => {
  const v = asString(value);
  return (CATEGORIAS_VALIDAS as readonly string[]).includes(v) ? (v as Categoria) : '';
};

const asSexo = (value: unknown): Sexo | '' => {
  const v = asString(value).toUpperCase();
  return (SEXOS_VALIDOS as readonly string[]).includes(v) ? (v as Sexo) : '';
};

const asStatus = (value: unknown): StatusServidor => {
  const v = asString(value).toUpperCase();
  return (STATUS_VALIDOS as readonly string[]).includes(v) ? (v as StatusServidor) : 'ATIVO';
};

const getRowId = (data: any): string =>
  asString(
    data?.cpf ??
    data?.servidor ??
    data?.id ??
    data?.servidor_id ??
    data?.uuid
  );

const emptyServidor = (): Servidor => ({
  id: '',
  nome: '',
  nomeCompleto: '',
  matricula: '',
  cpf: '',
  dataNascimento: null,
  sexo: '',
  rgNumero: '',
  rgOrgaoEmissor: '',
  rgUf: '',
  email: '',
  escolaridade: '',
  profissao: '',
  vinculo: '',
  funcao: '',
  cargaHoraria: '',
  inicioExercicio: null,
  categoria: '',
  setor: '',
  cargo: '',
  telefone: '',
  lotacaoInterna: '',
  turno: '',
  status: 'ATIVO',
  observacao: '',
  aniversario: null,
});

const mapFromDB = (data: any): Servidor => {
  const nomeCompleto = asString(data?.nome_completo ?? data?.nomeCompleto ?? data?.nome);

  return {
    id: asString(data?.cpf ?? getRowId(data)),
    nome: nomeCompleto,
    nomeCompleto,
    matricula: asString(data?.matricula),
    cpf: asString(data?.cpf),
    dataNascimento: asNullableString(data?.data_nascimento ?? data?.dataNascimento),
    sexo: asSexo(data?.sexo),
    rgNumero: asString(data?.rg_numero ?? data?.rgNumero),
    rgOrgaoEmissor: asString(data?.rg_orgao_emissor ?? data?.rgOrgaoEmissor),
    rgUf: asString(data?.rg_uf ?? data?.rgUf),
    email: asString(data?.email),
    escolaridade: asString(data?.escolaridade),
    profissao: asString(data?.profissao),
    vinculo: asString(data?.vinculo),
    funcao: asString(data?.funcao),
    cargaHoraria: asString(data?.carga_horaria ?? data?.cargaHoraria),
    inicioExercicio: asNullableString(data?.inicio_exercicio ?? data?.inicioExercicio),
    categoria: asCategoria(data?.categoria),
    setor: asString(data?.setor),
    cargo: asString(data?.cargo),
    telefone: asString(data?.telefone),
    lotacaoInterna: asString(data?.lotacao_interna ?? data?.lotacaoInterna),
    turno: asString(data?.turno),
    status: asStatus(data?.status),
    observacao: asString(data?.observacao),
    aniversario: asNullableString(data?.aniversario),
  };
};

const mapToDB = (data: Partial<Servidor> | any) => ({
  nome_completo: asString(data?.nomeCompleto ?? data?.nome),
  matricula: asString(data?.matricula),
  cpf: asString(data?.cpf),
  data_nascimento: asNullableString(data?.dataNascimento),
  sexo: asString(data?.sexo),
  rg_numero: asString(data?.rgNumero),
  rg_orgao_emissor: asString(data?.rgOrgaoEmissor),
  rg_uf: asString(data?.rgUf),
  email: asString(data?.email),
  escolaridade: asString(data?.escolaridade),
  profissao: asString(data?.profissao),
  vinculo: asString(data?.vinculo),
  funcao: asString(data?.funcao),
  carga_horaria: asString(data?.cargaHoraria),
  inicio_exercicio: asNullableString(data?.inicioExercicio),
  categoria: asString(data?.categoria),
  setor: asString(data?.setor),
  cargo: asString(data?.cargo),
  telefone: asString(data?.telefone),
  lotacao_interna: asString(data?.lotacaoInterna),
  turno: asString(data?.turno),
  status: asStatus(data?.status),
  observacao: asString(data?.observacao),
  aniversario: asNullableString(data?.aniversario),
});

const normalizeToArray = <T = any>(resp: any): T[] => {
  if (Array.isArray(resp)) return resp;
  if (!isObject(resp)) return [];

  const candidates = [
    resp.data,
    resp.items,
    resp.rows,
    resp.results,
    resp.list,
    resp.content,
    resp.records,
    resp.payload,
    resp.result,
    isObject(resp.data) ? resp.data.items : undefined,
    isObject(resp.data) ? resp.data.rows : undefined,
    isObject(resp.data) ? resp.data.results : undefined,
    isObject(resp.data) ? resp.data.list : undefined,
    isObject(resp.payload) ? resp.payload.items : undefined,
    isObject(resp.payload) ? resp.payload.rows : undefined,
    isObject(resp.payload) ? resp.payload.results : undefined,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

const normalizeServidor = (row: any): Servidor => {
  if (!isObject(row)) {
    return emptyServidor();
  }

  const hasSnakeCase =
    'nome_completo' in row ||
    'data_nascimento' in row ||
    'rg_numero' in row ||
    'rg_orgao_emissor' in row ||
    'rg_uf' in row ||
    'lotacao_interna' in row ||
    'inicio_exercicio' in row ||
    'servidor' in row;

  if (hasSnakeCase) {
    return mapFromDB(row);
  }

  const nomeCompleto = asString(row.nomeCompleto ?? row.nome);
  const nome = asString(row.nome ?? nomeCompleto);

  return {
    id: asString(row.cpf ?? getRowId(row)),
    nome: nome || nomeCompleto,
    nomeCompleto: nomeCompleto || nome,
    matricula: asString(row.matricula),
    cpf: asString(row.cpf),
    dataNascimento: asNullableString(row.dataNascimento),
    sexo: asSexo(row.sexo),
    rgNumero: asString(row.rgNumero),
    rgOrgaoEmissor: asString(row.rgOrgaoEmissor),
    rgUf: asString(row.rgUf),
    email: asString(row.email),
    escolaridade: asString(row.escolaridade),
    profissao: asString(row.profissao),
    vinculo: asString(row.vinculo),
    funcao: asString(row.funcao),
    cargaHoraria: asString(row.cargaHoraria),
    inicioExercicio: asNullableString(row.inicioExercicio),
    categoria: asCategoria(row.categoria),
    setor: asString(row.setor),
    cargo: asString(row.cargo),
    telefone: asString(row.telefone),
    lotacaoInterna: asString(row.lotacaoInterna),
    turno: asString(row.turno),
    status: asStatus(row.status),
    observacao: asString(row.observacao),
    aniversario: asNullableString(row.aniversario),
  };
};

const normalizeServidores = (resp: any): Servidor[] => {
  const arr = normalizeToArray<any>(resp);
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeServidor);
};

const normalizeTextForFilter = (value: unknown, fallback = '') =>
  asString(value, fallback).trim();

const uniqueSorted = (values: string[]) =>
  [...new Set(values.map((v) => normalizeTextForFilter(v)).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  );

const getCategoriaFiltro = (servidor: Servidor) =>
  normalizeTextForFilter(servidor.categoria, FALLBACK_CATEGORIA);

const getSetorFiltro = (servidor: Servidor) =>
  normalizeTextForFilter(servidor.setor, FALLBACK_SETOR);

const getStatusFiltro = (servidor: Servidor) =>
  normalizeTextForFilter(servidor.status, FALLBACK_STATUS);

const getSexoFiltro = (servidor: Servidor) =>
  normalizeTextForFilter(servidor.sexo, FALLBACK_SEXO);

export const apiServidores = {
  listar: async (filtros?: ListarServidoresParams): Promise<Servidor[]> => {
    if (API_CONFIG.useMock) {
      let result = Array.isArray(servidoresMock) ? [...servidoresMock] : [];

      if (filtros?.busca) {
        const b = asString(filtros.busca).toLowerCase();
        result = result.filter((s: any) => {
          const normalizado = normalizeServidor(s);
          const nome = normalizado.nomeCompleto.toLowerCase();
          const mat = normalizado.matricula.toLowerCase();
          const cpf = normalizado.cpf.toLowerCase();
          const email = normalizado.email.toLowerCase();

          return (
            nome.includes(b) ||
            mat.includes(b) ||
            cpf.includes(b) ||
            email.includes(b)
          );
        });
      }

      if (filtros?.categoria) {
        result = result.filter(
          (s: any) => getCategoriaFiltro(normalizeServidor(s)) === filtros.categoria
        );
      }

      if (filtros?.setor) {
        result = result.filter(
          (s: any) => getSetorFiltro(normalizeServidor(s)) === filtros.setor
        );
      }

      if (filtros?.status) {
        result = result.filter(
          (s: any) => getStatusFiltro(normalizeServidor(s)) === filtros.status
        );
      }

      if (filtros?.sexo) {
        result = result.filter(
          (s: any) => getSexoFiltro(normalizeServidor(s)) === filtros.sexo
        );
      }

      return result.map(normalizeServidor);
    }

    try {
      const queryParams = new URLSearchParams();

      if (filtros?.busca) queryParams.append('busca', filtros.busca);
      if (filtros?.nome) queryParams.append('nome', filtros.nome);
      if (filtros?.categoria) queryParams.append('categoria', filtros.categoria);
      if (filtros?.setor) queryParams.append('setor', filtros.setor);
      if (filtros?.status) queryParams.append('status', filtros.status);
      if (filtros?.sexo) queryParams.append('sexo', filtros.sexo);

      const queryString = queryParams.toString();
      const path = `/api/servidores${queryString ? `?${queryString}` : ''}`;

      const resp = await http.get<any>(path);
      return normalizeServidores(resp);
    } catch (error) {
      console.warn(
        '[ServidoresService] Falha ao buscar da API, tentando Supabase diretamente...',
        error
      );

      let query = supabase.from('servidores').select('*');

      if (filtros?.busca) {
        const b = asString(filtros.busca);
        query = query.or(
          `nome_completo.ilike.%${b}%,matricula.ilike.%${b}%,cpf.ilike.%${b}%`
        );
      }

      if (filtros?.nome) {
        query = query.ilike('nome_completo', `%${filtros.nome}%`);
      }

      if (filtros?.categoria && filtros.categoria !== FALLBACK_CATEGORIA) {
        query = query.eq('categoria', filtros.categoria);
      }

      if (filtros?.setor && filtros.setor !== FALLBACK_SETOR) {
        query = query.eq('setor', filtros.setor);
      }

      if (filtros?.status && filtros.status !== FALLBACK_STATUS) {
        query = query.eq('status', filtros.status);
      }

      if (filtros?.sexo && filtros.sexo !== FALLBACK_SEXO) {
        query = query.eq('sexo', filtros.sexo);
      }

      const { data, error: sbError } = await query.order('nome_completo');

      if (sbError) {
        console.error('Erro detalhado na consulta ao Supabase (servidores):', sbError);
        throw sbError;
      }

      return Array.isArray(data) ? data.map(mapFromDB) : [];
    }
  },

  listarFiltrosDisponiveis: async (): Promise<{
    categorias: OpcaoFiltro[];
    setores: OpcaoFiltro[];
    status: OpcaoFiltro[];
    sexo: OpcaoFiltro[];
  }> => {
    const servidores = await apiServidores.listar();

    const categorias = uniqueSorted(servidores.map(getCategoriaFiltro)).map((value) => ({
      value,
      label: value,
    }));

    const setores = uniqueSorted(servidores.map(getSetorFiltro)).map((value) => ({
      value,
      label: value,
    }));

    const status = uniqueSorted(servidores.map(getStatusFiltro)).map((value) => ({
      value,
      label: value,
    }));

    const sexo = uniqueSorted(servidores.map(getSexoFiltro)).map((value) => ({
      value,
      label: value,
    }));

    return { categorias, setores, status, sexo };
  },

  obterPorId: async (id: string): Promise<Servidor> => {
    if (API_CONFIG.useMock) {
      const s = Array.isArray(servidoresMock)
        ? servidoresMock.find((item: any) => normalizeServidor(item).cpf === id)
        : undefined;

      if (!s) throw new Error('Servidor não encontrado');
      return normalizeServidor(s);
    }

    const { data, error } = await supabase
      .from('servidores')
      .select('*')
      .eq('cpf', id)
      .single();

    if (error) throw error;

    return normalizeServidor(data);
  },

  adicionar: async (servidor: Omit<Servidor, 'id'>): Promise<Servidor> => {
    if (API_CONFIG.useMock) {
      const novo: Servidor = normalizeServidor({
        ...servidor,
        id: asString(servidor.cpf || Math.random().toString(36).substring(2, 11)),
      });

      servidoresMock.push(novo);
      return novo;
    }

    const { data, error } = await supabase
      .from('servidores')
      .insert(mapToDB(servidor))
      .select()
      .single();

    if (error) throw error;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'CRIAR',
      entidade: 'SERVIDOR',
      entidade_id: asString(data?.cpf),
      detalhes: { nome: data?.nome_completo },
    });

    return normalizeServidor(data);
  },

  editar: async (id: string, dados: Partial<Servidor>): Promise<Servidor> => {
    if (API_CONFIG.useMock) {
      const index = Array.isArray(servidoresMock)
        ? servidoresMock.findIndex((s: any) => normalizeServidor(s).cpf === id)
        : -1;

      if (index === -1) throw new Error('Servidor não encontrado');

      servidoresMock[index] = normalizeServidor({
        ...servidoresMock[index],
        ...dados,
        cpf: id,
        id,
      });

      return servidoresMock[index];
    }

    const { data, error } = await supabase
      .from('servidores')
      .update(mapToDB(dados))
      .eq('cpf', id)
      .select()
      .single();

    if (error) throw error;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'EDITAR',
      entidade: 'SERVIDOR',
      entidade_id: id,
      detalhes: dados,
    });

    return normalizeServidor(data);
  },

  excluir: async (id: string): Promise<void> => {
    if (API_CONFIG.useMock) {
      servidoresMock = Array.isArray(servidoresMock)
        ? servidoresMock.filter((s: any) => normalizeServidor(s).cpf !== id)
        : [];
      return;
    }

    const { error } = await supabase
      .from('servidores')
      .delete()
      .eq('cpf', id);

    if (error) throw error;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'EXCLUIR',
      entidade: 'SERVIDOR',
      entidade_id: id,
      detalhes: {},
    });
  },
};

export const servidoresService = apiServidores;
