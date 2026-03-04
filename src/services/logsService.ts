import { supabase } from '../lib/supabaseClient';
import { LogAtividade } from '../types';

export const logsService = {
  listar: async (): Promise<LogAtividade[]> => {
    const { data, error } = await supabase
      .from('logs_atividade')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Tabela logs_atividade não encontrada ou erro ao buscar:', error.message);
      return [];
    }
    return data || [];
  },

  registrar: async (log: Omit<LogAtividade, 'id' | 'created_at'>): Promise<void> => {
    try {
      const { error } = await supabase.from('logs_atividade').insert(log);
      if (error) {
        console.warn('Erro ao registrar log (tabela pode não existir):', error.message);
      }
    } catch (err) {
      console.warn('Erro silencioso ao registrar log:', err);
    }
  }
};
