import { Ferias } from '../types';
import { MOCK_FERIAS } from '../data/ferias';
import { API_CONFIG } from '../config/api';
import { supabase } from '../lib/supabaseClient';
import { ListarFeriasParams } from './apiTypes';
import { logsService } from './logsService';

let feriasMock = [...MOCK_FERIAS];

const mapFromDB = (data: any): Ferias => ({
  id: data.id,
  servidorId: data.servidor_id,
  ano: data.ano,
  periodo1Inicio: data.periodo1_inicio,
  periodo1Fim: data.periodo1_fim,
  periodo2Inicio: data.periodo2_inicio,
  periodo2Fim: data.periodo2_fim,
  periodo3Inicio: data.periodo3_inicio,
  periodo3Fim: data.periodo3_fim,
  observacao: data.observacao,
});

const mapToDB = (data: any) => ({
  servidor_id: data.servidorId,
  ano: data.ano,
  periodo1_inicio: data.periodo1Inicio,
  periodo1_fim: data.periodo1Fim,
  periodo2_inicio: data.periodo2Inicio,
  periodo2_fim: data.periodo2Fim,
  periodo3_inicio: data.periodo3Inicio,
  periodo3_fim: data.periodo3Fim,
  observacao: data.observacao,
});

export const apiFerias = {
  listar: async (filtros?: ListarFeriasParams): Promise<Ferias[]> => {
    if (API_CONFIG.useMock) {
      let result = [...feriasMock];
      
      if (filtros?.ano) {
        result = result.filter(f => f.ano === filtros.ano);
      }
      
      if (filtros?.servidorId) {
        result = result.filter(f => f.servidorId === filtros.servidorId);
      }
      
      return result;
    }

    let query = supabase.from('ferias').select('*');

    if (filtros?.ano) query = query.eq('ano', filtros.ano);
    if (filtros?.servidorId) query = query.eq('servidor_id', filtros.servidorId);

    const { data, error } = await query.order('ano', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapFromDB);
  },

  obterPorId: async (id: string): Promise<Ferias> => {
    if (API_CONFIG.useMock) {
      const f = feriasMock.find(f => f.id === id);
      if (!f) throw new Error('Registro de férias não encontrado');
      return f;
    }
    const { data, error } = await supabase.from('ferias').select('*').eq('id', id).single();
    if (error) throw error;
    return mapFromDB(data);
  },

  adicionar: async (dados: Omit<Ferias, 'id'>): Promise<Ferias> => {
    if (API_CONFIG.useMock) {
      const novo: Ferias = {
        ...dados,
        id: Math.random().toString(36).substring(2, 9)
      };
      feriasMock.push(novo);
      return novo;
    }
    const { data, error } = await supabase.from('ferias').insert(mapToDB(dados)).select().single();
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'CRIAR',
      entidade: 'FERIAS',
      entidade_id: data.id,
      detalhes: dados
    });

    return mapFromDB(data);
  },

  editar: async (id: string, dados: Partial<Ferias>): Promise<Ferias> => {
    if (API_CONFIG.useMock) {
      const index = feriasMock.findIndex(f => f.id === id);
      if (index === -1) throw new Error('Registro de férias não encontrado');
      
      feriasMock[index] = { ...feriasMock[index], ...dados };
      return feriasMock[index];
    }
    const { data, error } = await supabase.from('ferias').update(mapToDB(dados)).eq('id', id).select().single();
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'EDITAR',
      entidade: 'FERIAS',
      entidade_id: id,
      detalhes: dados
    });

    return mapFromDB(data);
  },

  excluir: async (id: string): Promise<void> => {
    if (API_CONFIG.useMock) {
      feriasMock = feriasMock.filter(f => f.id !== id);
      return;
    }
    const { error } = await supabase.from('ferias').delete().eq('id', id);
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'EXCLUIR',
      entidade: 'FERIAS',
      entidade_id: id,
      detalhes: {}
    });
  }
};

export const feriasService = apiFerias;
