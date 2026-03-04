import { EventoCalendario } from '../types';
import { MOCK_EVENTOS } from '../data/eventos';
import { API_CONFIG } from '../config/api';
import { supabase } from '../lib/supabaseClient';
import { ListarEventosParams } from './apiTypes';
import { logsService } from './logsService';

let eventosMock = [...MOCK_EVENTOS];

export const apiEventos = {
  listar: async (filtros?: ListarEventosParams): Promise<EventoCalendario[]> => {
    if (API_CONFIG.useMock) {
      let result = [...eventosMock];
      
      if (filtros?.ano && filtros?.mes) {
        const prefix = `${filtros.ano}-${String(filtros.mes).padStart(2, '0')}`;
        result = result.filter(e => e.data.startsWith(prefix));
      }

      if (filtros?.tipo) {
        result = result.filter(e => e.tipo === filtros.tipo);
      }
      
      return result;
    }

    let query = supabase.from('eventos').select('*');

    if (filtros?.ano && filtros?.mes) {
      const startDate = `${filtros.ano}-${String(filtros.mes).padStart(2, '0')}-01`;
      const endDate = `${filtros.ano}-${String(filtros.mes).padStart(2, '0')}-31`;
      query = query.gte('data', startDate).lte('data', endDate);
    }
    if (filtros?.tipo) query = query.eq('tipo', filtros.tipo);

    const { data, error } = await query.order('data');
    if (error) throw error;
    return data || [];
  },

  obterPorId: async (id: string): Promise<EventoCalendario> => {
    if (API_CONFIG.useMock) {
      const e = eventosMock.find(e => e.id === id);
      if (!e) throw new Error('Evento não encontrado');
      return e;
    }
    const { data, error } = await supabase.from('eventos').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  adicionar: async (dados: Omit<EventoCalendario, 'id'>): Promise<EventoCalendario> => {
    if (API_CONFIG.useMock) {
      const novo: EventoCalendario = {
        ...dados,
        id: Math.random().toString(36).substring(2, 9)
      };
      eventosMock.push(novo);
      return novo;
    }
    const { data, error } = await supabase.from('eventos').insert(dados).select().single();
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'CRIAR',
      entidade: 'EVENTO',
      entidade_id: data.id,
      detalhes: dados
    });

    return data;
  },

  editar: async (id: string, dados: Partial<EventoCalendario>): Promise<EventoCalendario> => {
    if (API_CONFIG.useMock) {
      const index = eventosMock.findIndex(e => e.id === id);
      if (index === -1) throw new Error('Evento não encontrado');
      
      eventosMock[index] = { ...eventosMock[index], ...dados };
      return eventosMock[index];
    }
    const { data, error } = await supabase.from('eventos').update(dados).eq('id', id).select().single();
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'EDITAR',
      entidade: 'EVENTO',
      entidade_id: id,
      detalhes: dados
    });

    return data;
  },

  excluir: async (id: string): Promise<void> => {
    if (API_CONFIG.useMock) {
      eventosMock = eventosMock.filter(e => e.id !== id);
      return;
    }
    const { error } = await supabase.from('eventos').delete().eq('id', id);
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'EXCLUIR',
      entidade: 'EVENTO',
      entidade_id: id,
      detalhes: {}
    });
  }
};

export const eventosService = apiEventos;
