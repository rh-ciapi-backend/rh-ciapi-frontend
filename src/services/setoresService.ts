import { supabase } from '../lib/supabaseClient';
import { SetorAdmin } from '../types';
import { logsService } from './logsService';

export const setoresService = {
  listar: async (): Promise<SetorAdmin[]> => {
    const { data, error } = await supabase
      .from('setores')
      .select('*')
      .order('nome');
    
    if (error) {
      console.warn('Tabela setores não encontrada:', error.message);
      return [];
    }
    return data || [];
  },

  adicionar: async (nome: string): Promise<SetorAdmin> => {
    const { data, error } = await supabase
      .from('setores')
      .insert({ nome, ativo: true })
      .select()
      .single();
    
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'CRIAR',
      entidade: 'SETOR',
      entidade_id: data.id,
      detalhes: { nome }
    });

    return data;
  },

  editar: async (id: string, dados: Partial<SetorAdmin>): Promise<SetorAdmin> => {
    const { data, error } = await supabase
      .from('setores')
      .update(dados)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'EDITAR',
      entidade: 'SETOR',
      entidade_id: id,
      detalhes: dados
    });

    return data;
  },

  excluir: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('setores')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'EXCLUIR',
      entidade: 'SETOR',
      entidade_id: id,
      detalhes: {}
    });
  }
};
