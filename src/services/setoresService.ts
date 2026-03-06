import { supabase } from '../lib/supabaseClient';
import { SetorAdmin, OpcaoFiltro } from '../types';
import { logsService } from './logsService';
import { servidoresService } from './servidoresService';

const FALLBACK_SETOR = 'NÃO INFORMADO';

const asString = (value: unknown, fallback = ''): string => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const sortUnique = (values: string[]) =>
  [...new Set(values.map((v) => asString(v)).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  );

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

  listarOpcoesFiltro: async (): Promise<OpcaoFiltro[]> => {
    const [setoresAdmin, servidores] = await Promise.all([
      setoresService.listar().catch(() => []),
      servidoresService.listar().catch(() => []),
    ]);

    const nomesAdmin = setoresAdmin
      .filter((item) => item?.ativo !== false)
      .map((item) => asString(item?.nome));

    const nomesServidores = servidores.map((servidor) =>
      asString(servidor?.setor, FALLBACK_SETOR)
    );

    const values = sortUnique([...nomesAdmin, ...nomesServidores]);

    return values.map((value) => ({
      value,
      label: value,
    }));
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
