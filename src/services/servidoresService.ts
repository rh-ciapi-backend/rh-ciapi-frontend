import { supabase } from '../lib/supabaseClient';
import type { Categoria, Servidor, Sexo, StatusServidor } from '../types';
import type { ListarServidoresParams } from './apiTypes';

type DbServidorRow = Record<string, unknown>;

const TABLE_SERVIDORES = 'servidores';

const CATEGORIAS_VALIDAS: readonly Categoria[] = [
  'EFETIVO SESAU',
  'SELETIVO SESAU',
  'EFETIVO SETRABES',
  'SELETIVO SETRABES',
  'FEDERAIS SETRABES',
  'COMISSIONADOS',
] as const;

const STATUS_VALIDOS: readonly StatusServidor[] = ['ATIVO', 'INATIVO'] as const;
const SEXOS_VALIDOS: readonly Sexo[] = ['M', 'F', 'OUTRO'] as const;

const normalizeCpf = (value: unknown) => String(value ?? '').replace(/\D/g, '');

const formatCpf = (value: unknown) => {
  const digits = normalizeCpf(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
};

const safeString = (value: unknown) => String(value ?? '').trim();

const firstFilled = (...values: unknown[]) => {
  for (const value of values) {
    const normalized = safeString(value);
    if (normalized) return normalized;
  }
  return '';
};

const normalizeCategoria = (value: unknown): Categoria | '' => {
  const normalized = safeString(value).toUpperCase();
  return CATEGORIAS_VALIDAS.includes(normalized as Categoria) ? (normalized as Categoria) : '';
};

const normalizeStatus = (value: unknown): StatusServidor => {
  const normalized = safeString(value).toUpperCase();
  return STATUS_VALIDOS.includes(normalized as StatusServidor) ? (normalized as StatusServidor) : 'ATIVO';
};

const normalizeSexo = (value: unknown): Sexo | '' => {
  const normalized = safeString(value).toUpperCase();
  return SEXOS_VALIDOS.includes(normalized as Sexo) ? (normalized as Sexo) : '';
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === 'object' &&
    error &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
};

const mapFromDB = (row: DbServidorRow): Servidor => {
  const nomeCompleto = firstFilled(
    row.nome_completo,
    row.nomeCompleto,
    row.nome,
    row.servidor_nome,
    row.servidorNome,
  );

  const cpfDigits = normalizeCpf(firstFilled(row.cpf, row.cpf_numero));
  const matricula = firstFilled(row.matricula, row.matricula_funcional, row.matriculaFuncional);

  return {
    id: firstFilled(row.servidor, row.id, row.servidor_id, row.uuid, cpfDigits, matricula, nomeCompleto),
    nome: nomeCompleto || firstFilled(row.nome, row.apelido),
    nomeCompleto,
    matricula,
    cpf: formatCpf(cpfDigits),
    dataNascimento: firstFilled(row.data_nascimento, row.dataNascimento, row.nascimento) || null,
    sexo: normalizeSexo(firstFilled(row.sexo, row.genero)),
    rgNumero: firstFilled(row.rg_numero, row.rgNumero, row.rg),
    rgOrgaoEmissor: firstFilled(row.rg_orgao_emissor, row.rgOrgaoEmissor, row.orgao_emissor, row.orgaoEmissor),
    rgUf: firstFilled(row.rg_uf, row.rgUf),
    email: firstFilled(row.email),
    escolaridade: firstFilled(row.escolaridade),
    profissao: firstFilled(row.profissao, row.profissão),
    vinculo: firstFilled(row.vinculo, row.vínculo),
    funcao: firstFilled(row.funcao, row.função),
    cargaHoraria: firstFilled(row.carga_horaria, row.cargaHoraria, row.ch, row['c/h']),
    inicioExercicio: firstFilled(row.inicio_exercicio, row.inicioExercicio) || null,
    categoria: normalizeCategoria(firstFilled(row.categoria_canonica, row.categoria, row.categoriaCanonica)),
    setor: firstFilled(row.setor, row.lotacao, row.lotação, row.lotacao_interna, row.lotacaoInterna),
    cargo: firstFilled(row.cargo),
    telefone: firstFilled(row.telefone, row.celular),
    lotacaoInterna: firstFilled(row.lotacao_interna, row.lotacaoInterna),
    turno: firstFilled(row.turno),
    status: normalizeStatus(firstFilled(row.status, row.ativo ? 'ATIVO' : 'INATIVO')),
    observacao: firstFilled(row.observacao, row.observação),
    aniversario: firstFilled(row.aniversario, row.data_nascimento, row.dataNascimento) || null,
  };
};

const mapToInsert = (input: Partial<Servidor>) => ({
  nome_completo: safeString(input.nomeCompleto || input.nome),
  matricula: safeString(input.matricula),
  cpf: normalizeCpf(input.cpf),
  data_nascimento: input.dataNascimento || null,
  sexo: safeString(input.sexo),
  rg_numero: safeString(input.rgNumero),
  rg_orgao_emissor: safeString(input.rgOrgaoEmissor),
  rg_uf: safeString(input.rgUf),
  email: safeString(input.email),
  escolaridade: safeString(input.escolaridade),
  profissao: safeString(input.profissao),
  vinculo: safeString(input.vinculo),
  funcao: safeString(input.funcao),
  carga_horaria: safeString(input.cargaHoraria),
  inicio_exercicio: input.inicioExercicio || null,
  categoria: safeString(input.categoria),
  setor: safeString(input.setor),
  cargo: safeString(input.cargo),
  telefone: safeString(input.telefone),
  lotacao_interna: safeString(input.lotacaoInterna),
  turno: safeString(input.turno),
  status: safeString(input.status || 'ATIVO'),
  observacao: safeString(input.observacao),
});

const buildListQuery = (params?: ListarServidoresParams) => {
  let query = supabase.from(TABLE_SERVIDORES).select('*');

  if (params?.busca) {
    const busca = safeString(params.busca);
    const cpfDigits = normalizeCpf(busca);
    const orParts: string[] = [];

    if (busca) {
      orParts.push(`nome_completo.ilike.%${busca}%`);
      orParts.push(`matricula.ilike.%${busca}%`);
      orParts.push(`setor.ilike.%${busca}%`);
      orParts.push(`categoria.ilike.%${busca}%`);
    }

    if (cpfDigits) {
      orParts.push(`cpf.ilike.%${cpfDigits}%`);
    }

    if (orParts.length) {
      query = query.or(orParts.join(','));
    }
  }

  if (params?.categoria && safeString(params.categoria) !== 'TODOS') {
    query = query.eq('categoria', safeString(params.categoria));
  }

  if (params?.setor && safeString(params.setor) !== 'TODOS') {
    query = query.eq('setor', safeString(params.setor));
  }

  if (params?.status && safeString(params.status) !== 'TODOS') {
    query = query.eq('status', safeString(params.status).toUpperCase());
  }

  return query;
};

const sortServidores = (list: Servidor[]) =>
  [...list].sort((a, b) =>
    safeString(a.nomeCompleto || a.nome).localeCompare(safeString(b.nomeCompleto || b.nome), 'pt-BR'),
  );

export const servidoresService = {
  async listar(params?: ListarServidoresParams): Promise<Servidor[]> {
    try {
      const query = buildListQuery(params)
        .order('nome_completo', { ascending: true })
        .limit(params?.limite && Number(params.limite) > 0 ? Number(params.limite) : 1000);

      const { data, error } = await query;

      if (error) {
        throw new Error(getErrorMessage(error, 'Falha ao listar servidores.'));
      }

      return sortServidores((Array.isArray(data) ? data : []).map(mapFromDB));
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Falha ao listar servidores.'));
    }
  },

  async obterPorId(idOrCpf: string): Promise<Servidor | null> {
    try {
      const raw = safeString(idOrCpf);
      const cpfDigits = normalizeCpf(raw);

      const searchValue = raw.replace(/,/g, ' ');
      const orParts = [
        `servidor.eq.${searchValue}`,
        `id.eq.${searchValue}`,
        `servidor_id.eq.${searchValue}`,
        `uuid.eq.${searchValue}`,
      ];

      if (cpfDigits.length === 11) {
        orParts.unshift(`cpf.eq.${cpfDigits}`);
      }

      const { data, error } = await supabase
        .from(TABLE_SERVIDORES)
        .select('*')
        .or(orParts.join(','))
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error(getErrorMessage(error, 'Falha ao obter servidor.'));
      }

      return data ? mapFromDB(data) : null;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Falha ao obter servidor.'));
    }
  },

  async buscarSugestoes(term: string, limite = 8): Promise<Servidor[]> {
    const searchTerm = safeString(term);

    if (searchTerm.length < 3) {
      return [];
    }

    try {
      const cpfDigits = normalizeCpf(searchTerm);
      const orParts: string[] = [
        `nome_completo.ilike.%${searchTerm}%`,
        `matricula.ilike.%${searchTerm}%`,
      ];

      if (cpfDigits) {
        orParts.push(`cpf.ilike.%${cpfDigits}%`);
      }

      const { data, error } = await supabase
        .from(TABLE_SERVIDORES)
        .select('*')
        .or(orParts.join(','))
        .order('nome_completo', { ascending: true })
        .limit(Math.max(1, Math.min(limite || 8, 20)));

      if (error) {
        throw new Error(getErrorMessage(error, 'Falha ao buscar sugestões de servidores.'));
      }

      const mapped = sortServidores((Array.isArray(data) ? data : []).map(mapFromDB));

      const unique = new Map<string, Servidor>();
      for (const item of mapped) {
        const key = [
          normalizeCpf(item.cpf),
          safeString(item.matricula),
          safeString(item.nomeCompleto || item.nome),
        ].join('|');

        if (!unique.has(key)) {
          unique.set(key, item);
        }
      }

      return Array.from(unique.values()).slice(0, Math.max(1, Math.min(limite || 8, 20)));
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Falha ao buscar sugestões de servidores.'));
    }
  },

  async adicionar(input: Partial<Servidor>): Promise<Servidor> {
    try {
      const payload = mapToInsert(input);

      const { data, error } = await supabase
        .from(TABLE_SERVIDORES)
        .insert(payload)
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(getErrorMessage(error, 'Falha ao adicionar servidor.'));
      }

      return mapFromDB(data);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Falha ao adicionar servidor.'));
    }
  },

  async editar(idOrCpf: string, input: Partial<Servidor>): Promise<Servidor> {
    try {
      const payload = mapToInsert(input);
      const raw = safeString(idOrCpf);
      const cpfDigits = normalizeCpf(raw);

      let query = supabase.from(TABLE_SERVIDORES).update(payload).select('*');

      if (cpfDigits.length === 11) {
        query = query.eq('cpf', cpfDigits);
      } else {
        query = query.eq('servidor', raw);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        throw new Error(getErrorMessage(error, 'Falha ao editar servidor.'));
      }

      return mapFromDB(data);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Falha ao editar servidor.'));
    }
  },

  async excluir(idOrCpf: string): Promise<void> {
    try {
      const raw = safeString(idOrCpf);
      const cpfDigits = normalizeCpf(raw);

      let query = supabase.from(TABLE_SERVIDORES).delete();

      if (cpfDigits.length === 11) {
        query = query.eq('cpf', cpfDigits);
      } else {
        query = query.eq('servidor', raw);
      }

      const { error } = await query;

      if (error) {
        throw new Error(getErrorMessage(error, 'Falha ao excluir servidor.'));
      }
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Falha ao excluir servidor.'));
    }
  },
};

export default servidoresService;
