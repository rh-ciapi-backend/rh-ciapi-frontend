import { Servidor } from '../types';
import { MOCK_SERVIDORES } from '../data/servidores';
import { API_CONFIG, fetchJson } from '../config/api';
import { supabase } from '../lib/supabaseClient';
import { ListarServidoresParams } from './apiTypes';
import { logsService } from './logsService';

let servidoresMock = [...MOCK_SERVIDORES];

const mapFromDB = (data: any): Servidor => ({
  id: data?.id,
  nome: data?.nome_completo ?? '',
  nomeCompleto: data?.nome_completo ?? '',
  matricula: data?.matricula ?? '',
  cpf: data?.cpf ?? '',
  dataNascimento: data?.data_nascimento ?? null,
  sexo: data?.sexo ?? '',
  rgNumero: data?.rg_numero ?? '',
  rgOrgaoEmissor: data?.rg_orgao_emissor ?? '',
  rgUf: data?.rg_uf ?? '',
  email: data?.email ?? '',
  escolaridade: data?.escolaridade ?? '',
  profissao: data?.profissao ?? '',
  vinculo: data?.vinculo ?? '',
  funcao: data?.funcao ?? '',
  cargaHoraria: data?.carga_horaria ?? '',
  inicioExercicio: data?.inicio_exercicio ?? null,
  categoria: data?.categoria ?? '',
  setor: data?.setor ?? '',
  cargo: data?.cargo ?? '',
  telefone: data?.telefone ?? '',
  lotacaoInterna: data?.lotacao_interna ?? '',
  turno: data?.turno ?? '',
  status: data?.status ?? 'ATIVO',
  observacao: data?.observacao ?? '',
  aniversario: data?.aniversario ?? null,
});

const mapToDB = (data: any) => ({
  nome_completo: data?.nomeCompleto || data?.nome,
  matricula: data?.matricula,
  cpf: data?.cpf,
  data_nascimento: data?.dataNascimento,
  sexo: data?.sexo,
  rg_numero: data?.rgNumero,
  rg_orgao_emissor: data?.rgOrgaoEmissor,
  rg_uf: data?.rgUf,
  email: data?.email,
  escolaridade: data?.escolaridade,
  profissao: data?.profissao,
  vinculo: data?.vinculo,
  funcao: data?.funcao,
  carga_horaria: data?.cargaHoraria,
  inicio_exercicio: data?.inicioExercicio,
  categoria: data?.categoria,
  setor: data?.setor,
  cargo: data?.cargo,
  telefone: data?.telefone,
  lotacao_interna: data?.lotacaoInterna,
  turno: data?.turno,
  status: data?.status,
  observacao: data?.observacao,
  aniversario: data?.aniversario,
});

// ✅ Normalizador: aceita array direto OU { ok, data: [] } OU { data: [] } OU { items: [] } etc.
const normalizeToArray = <T>(resp: any): T[] => {
  if (Array.isArray(resp)) return resp;
  if (resp && Array.isArray(resp.data)) return resp.data;
  if (resp && Array.isArray(resp.items)) return resp.items;
  if (resp && Array.isArray(resp.rows)) return resp.rows;
  return [];
};

// ✅ Garante que o frontend SEMPRE receba um Servidor "completo" no shape esperado
// - se vier do DB (snake_case): usa mapFromDB
// - se vier do backend já em camelCase: garante defaults para evitar undefined
const normalizeServidor = (row: any): Servidor => {
  if (!row || typeof row !== 'object') {
    // fallback seguro
    return {
      id: undefined as any,
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
    };
  }

  // Detecta retorno snake_case (supabase direto ou backend repassando)
  if ('nome_completo' in row || 'data_nascimento' in row || 'rg_numero' in row) {
    return mapFromDB(row);
  }

  // Já veio camelCase: só blinda para evitar undefined (principal causa do charAt quebrar)
  const nomeCompleto = String(row.nomeCompleto ?? row.nome ?? '').trim();
  const nome = String(row.nome ?? nomeCompleto ?? '').trim();

  return {
    ...row,
    nome: nome || '',
    nomeCompleto: nomeCompleto || nome || '',
    matricula: row.matricula ?? '',
    cpf: row.cpf ?? '',
    email: row.email ?? '',
    setor: row.setor ?? '',
    categoria: row.categoria ?? '',
    cargo: row.cargo ?? '',
    status: row.status ?? 'ATIVO',
  } as Servidor;
};

export const apiServidores = {
  listar: async (filtros?: ListarServidoresParams): Promise<Servidor[]> => {
    if (API_CONFIG.useMock) {
      let result = [...servidoresMock];

      if (filtros?.busca) {
        const b = String(filtros.busca).toLowerCase();
        result = result.filter((s: any) => {
          const nome = String(s?.nomeCompleto || s?.nome || '').toLowerCase();
          const mat = String(s?.matricula || '');
          const cpf = String(s?.cpf || '');
          const email = String(s?.email || '').toLowerCase();
          return (
            nome.includes(b) ||
            mat.includes(b) ||
            cpf.includes(b) ||
            email.includes(b)
          );
        });
      }

      if (filtros?.categoria) {
        result = result.filter((s: any) => s?.categoria === filtros.categoria);
      }

      if (filtros?.setor) {
        result = result.filter((s: any) => s?.setor === filtros.setor);
      }

      if (filtros?.status) {
        result = result.filter((s: any) => s?.status === filtros.status);
      }

      if (filtros?.sexo) {
        result = result.filter((s: any) => s?.sexo === filtros.sexo);
      }

      // ✅ garante shape seguro também no mock
      return result.map(normalizeServidor);
    }

    // ✅ Usar a API centralizada
    try {
      const queryParams = new URLSearchParams();
      if (filtros?.busca) queryParams.append('busca', filtros.busca);
      if (filtros?.categoria) queryParams.append('categoria', filtros.categoria);
      if (filtros?.setor) queryParams.append('setor', filtros.setor);
      if (filtros?.status) queryParams.append('status', filtros.status);
      if (filtros?.sexo) queryParams.append('sexo', filtros.sexo);

      const queryString = queryParams.toString();
      const path = `/api/servidores${queryString ? `?${queryString}` : ''}`;

      // ⚠️ fetchJson pode retornar array OU { ok, data: [] } OU outro wrapper
      const resp = await fetchJson<any>(path);

      const arr = normalizeToArray<any>(resp);

      // ✅ Correção principal: normaliza cada item pro shape esperado
      return arr.map(normalizeServidor);
    } catch (error) {
      console.warn(
        '[ServidoresService] Falha ao buscar da API, tentando Supabase diretamente...',
        error
      );

      // ✅ Fallback Supabase
      let query = supabase.from('servidores').select('*');

      if (filtros?.busca) {
        const b = filtros.busca;
        query = query.or(
          `nome_completo.ilike.%${b}%,matricula.ilike.%${b}%,cpf.ilike.%${b}%`
        );
      }
      if (filtros?.categoria) query = query.eq('categoria', filtros.categoria);
      if (filtros?.setor) query = query.eq('setor', filtros.setor);
      if (filtros?.status) query = query.eq('status', filtros.status);
      if (filtros?.sexo) query = query.eq('sexo', filtros.sexo);

      const { data, error: sbError } = await query.order('nome_completo');

      if (sbError) {
        console.error(
          'Erro detalhado na consulta ao Supabase (servidores):',
          sbError
        );
        throw sbError;
      }

      return (data || []).map(mapFromDB);
    }
  },

  obterPorId: async (id: string): Promise<Servidor> => {
    if (API_CONFIG.useMock) {
      const s = servidoresMock.find((s: any) => s.id === id);
      if (!s) throw new Error('Servidor não encontrado');
      return normalizeServidor(s);
    }
    const { data, error } = await supabase
      .from('servidores')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapFromDB(data);
  },

  adicionar: async (servidor: Omit<Servidor, 'id'>): Promise<Servidor> => {
    if (API_CONFIG.useMock) {
      const novo: Servidor = {
        ...servidor,
        id: Math.random().toString(36).substring(2, 9),
      };
      servidoresMock.push(novo);
      return normalizeServidor(novo);
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
      entidade_id: data.id,
      detalhes: { nome: data.nome_completo },
    });

    return mapFromDB(data);
  },

  editar: async (id: string, dados: Partial<Servidor>): Promise<Servidor> => {
    if (API_CONFIG.useMock) {
      const index = servidoresMock.findIndex((s: any) => s.id === id);
      if (index === -1) throw new Error('Servidor não encontrado');

      servidoresMock[index] = { ...servidoresMock[index], ...dados };
      return normalizeServidor(servidoresMock[index]);
    }

    const { data, error } = await supabase
      .from('servidores')
      .update(mapToDB(dados))
      .eq('id', id)
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

    return mapFromDB(data);
  },

  excluir: async (id: string): Promise<void> => {
    if (API_CONFIG.useMock) {
      servidoresMock = servidoresMock.filter((s: any) => s.id !== id);
      return;
    }

    const { error } = await supabase.from('servidores').delete().eq('id', id);
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
