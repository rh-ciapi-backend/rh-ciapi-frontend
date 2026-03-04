import { OcorrenciaFrequencia } from '../types';
import { MOCK_FREQUENCIA } from '../data/frequencia';
import { API_CONFIG, fetchJson } from '../config/api';
import { supabase } from '../lib/supabaseClient';
import { ListarFrequenciaParams } from './apiTypes';
import { logsService } from './logsService';

let frequenciaMock = [...MOCK_FREQUENCIA];

const mapFromDB = (data: any): OcorrenciaFrequencia => ({
  id: data.id,
  servidorId: data.servidor_id,
  data: data.data,
  tipo: data.tipo,
  turno: data.turno,
  descricao: data.descricao,
});

const mapToDB = (data: any) => ({
  servidor_id: data.servidorId,
  data: data.data,
  tipo: data.tipo,
  turno: data.turno,
  descricao: data.descricao,
});

export const apiFrequencia = {
  listar: async (filtros?: ListarFrequenciaParams): Promise<OcorrenciaFrequencia[]> => {
    if (API_CONFIG.useMock) {
      // ... mock logic ...
      let result = [...frequenciaMock];
      
      if (filtros?.servidorId) {
        result = result.filter(f => f.servidorId === filtros.servidorId);
      }
      
      if (filtros?.ano && filtros?.mes) {
        const prefix = `${filtros.ano}-${String(filtros.mes).padStart(2, '0')}`;
        result = result.filter(f => f.data.startsWith(prefix));
      }
      
      return result;
    }

    try {
      const queryParams = new URLSearchParams();
      if (filtros?.servidorId) queryParams.append('servidorId', filtros.servidorId);
      if (filtros?.ano) queryParams.append('ano', String(filtros.ano));
      if (filtros?.mes) queryParams.append('mes', String(filtros.mes));

      const queryString = queryParams.toString();
      return await fetchJson<OcorrenciaFrequencia[]>(`/api/frequencia${queryString ? `?${queryString}` : ''}`);
    } catch (error) {
      console.warn('[FrequenciaService] Falha ao buscar da API, tentando Supabase diretamente...', error);
      
      let query = supabase.from('frequencia').select('*');

      if (filtros?.servidorId) query = query.eq('servidor_id', filtros.servidorId);
      if (filtros?.ano && filtros?.mes) {
        const startDate = `${filtros.ano}-${String(filtros.mes).padStart(2, '0')}-01`;
        const endDate = `${filtros.ano}-${String(filtros.mes).padStart(2, '0')}-31`;
        query = query.gte('data', startDate).lte('data', endDate);
      }

      const { data, error: sbError } = await query.order('data');
      if (sbError) throw sbError;
      return (data || []).map(mapFromDB);
    }
  },

  obterPorId: async (id: string): Promise<OcorrenciaFrequencia> => {
    if (API_CONFIG.useMock) {
      const f = frequenciaMock.find(f => f.id === id);
      if (!f) throw new Error('Ocorrência não encontrada');
      return f;
    }
    const { data, error } = await supabase.from('frequencia').select('*').eq('id', id).single();
    if (error) throw error;
    return mapFromDB(data);
  },

  adicionar: async (dados: Omit<OcorrenciaFrequencia, 'id'>): Promise<OcorrenciaFrequencia> => {
    if (API_CONFIG.useMock) {
      const novo: OcorrenciaFrequencia = {
        ...dados,
        id: Math.random().toString(36).substring(2, 9)
      };
      frequenciaMock.push(novo);
      return novo;
    }
    const { data, error } = await supabase.from('frequencia').insert(mapToDB(dados)).select().single();
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'CRIAR',
      entidade: 'FREQUENCIA',
      entidade_id: data.id,
      detalhes: dados
    });

    return mapFromDB(data);
  },

  editar: async (id: string, dados: Partial<OcorrenciaFrequencia>): Promise<OcorrenciaFrequencia> => {
    if (API_CONFIG.useMock) {
      const index = frequenciaMock.findIndex(f => f.id === id);
      if (index === -1) throw new Error('Ocorrência não encontrada');
      
      frequenciaMock[index] = { ...frequenciaMock[index], ...dados };
      return frequenciaMock[index];
    }
    const { data, error } = await supabase.from('frequencia').update(mapToDB(dados)).eq('id', id).select().single();
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'EDITAR',
      entidade: 'FREQUENCIA',
      entidade_id: id,
      detalhes: dados
    });

    return mapFromDB(data);
  },

  excluir: async (id: string): Promise<void> => {
    if (API_CONFIG.useMock) {
      frequenciaMock = frequenciaMock.filter(f => f.id !== id);
      return;
    }
    const { error } = await supabase.from('frequencia').delete().eq('id', id);
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'EXCLUIR',
      entidade: 'FREQUENCIA',
      entidade_id: id,
      detalhes: {}
    });
  }
};

export const frequenciaService = apiFrequencia;
