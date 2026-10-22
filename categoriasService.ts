import { supabase } from '../lib/supabaseClient';
import { CategoriaAdmin, OpcaoFiltro } from '../types';
import { logsService } from './logsService';
import { servidoresService } from './servidoresService';

const FALLBACK_CATEGORIA = 'NÃO INFORMADO';

const asString = (value: unknown, fallback = ''): string => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const sortUnique = (values: string[]) =>
  [...new Set(values.map((v) => asString(v)).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  );

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

  listarOpcoesFiltro: async (): Promise<OpcaoFiltro[]> => {
    const [categoriasAdmin, servidores] = await Promise.all([
      categoriasService.listar().catch(() => []),
      servidoresService.listar().catch(() => []),
    ]);

    const nomesAdmin = categoriasAdmin
      .filter((item) => item?.ativo !== false)
      .map((item) => asString(item?.nome));

    const nomesServidores = servidores.map((servidor) =>
      asString(servidor?.categoria, FALLBACK_CATEGORIA)
    );

    const values = sortUnique([...nomesAdmin, ...nomesServidores]);

    return values.map((value) => ({
      value,
      label: value,
    }));
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
