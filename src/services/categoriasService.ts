import { supabase } from '../lib/supabaseClient';
import { CategoriaAdmin } from '../types';
import { logsService } from './logsService';

export const categoriasService = {
  listar: async (): Promise<CategoriaAdmin[]> => {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome');
    
    if (error) {
      console.warn('Tabela categorias não encontrada:', error.message);
      return [];
    }
    return data || [];
  },

  adicionar: async (nome: string): Promise<CategoriaAdmin> => {
    const { data, error } = await supabase
      .from('categorias')
      .insert({ nome, ativo: true })
      .select()
      .single();
    
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'CRIAR',
      entidade: 'CATEGORIA',
      entidade_id: data.id,
      detalhes: { nome }
    });

    return data;
  },

  editar: async (id: string, dados: Partial<CategoriaAdmin>): Promise<CategoriaAdmin> => {
    const { data, error } = await supabase
      .from('categorias')
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
      entidade: 'CATEGORIA',
      entidade_id: id,
      detalhes: dados
    });

    return data;
  },

  excluir: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao: 'EXCLUIR',
      entidade: 'CATEGORIA',
      entidade_id: id,
      detalhes: {}
    });
  }
};
