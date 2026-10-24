/**
 * Assinaturas institucionais da frequência CIAPI.
 * Reutiliza o cliente Supabase autenticado do sistema; não cria sessão paralela.
 * Requer tabela ciapi_config_assinaturas_frequencia e políticas RLS compatíveis
 * com os perfis autorizados (leitura do RH; gravação somente administradores).
 */
import { supabase } from '../lib/supabaseClient';

export type AutoridadeAssinatura = { nome: string; matricula: string; cargo: string };
export type AssinaturasFrequencia = { gerente: AutoridadeAssinatura; secretario: AutoridadeAssinatura };

export const ASSINATURAS_INICIAIS: AssinaturasFrequencia = {
  gerente: {
    nome: 'RAIMUNDA ARTEMES FREITAS DAS NEVES',
    matricula: '0164392-4-02',
    cargo: 'Gerente do Centro Integrado de Atenção à Pessoa Idosa',
  },
  secretario: { nome: '', matricula: '', cargo: 'Secretário(a) de Estado' },
};

const TABLE_NAME = 'ciapi_config_assinaturas_frequencia';
const clean = (value: unknown) => String(value ?? '').trim();

function toMessage(error: { message?: string; code?: string } | null, operation: string) {
  if (!error) return '';
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return `A tabela ${TABLE_NAME} não foi encontrada. Confira se o SQL de configuração foi executado no Supabase correto.`;
  }
  if (error.code === '42501' || /permission denied|row.level.security|42501/i.test(error.message ?? '')) {
    return `Sem permissão para ${operation} as assinaturas. Confira as políticas RLS e o perfil autenticado.`;
  }
  return `Não foi possível ${operation} as assinaturas: ${error.message || 'erro desconhecido'}`;
}

export async function carregarAssinaturas(): Promise<AssinaturasFrequencia> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('gerente_nome, gerente_matricula, gerente_cargo, secretario_nome, secretario_matricula, secretario_cargo')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw new Error(toMessage(error, 'consultar'));
  if (!data) return {
    gerente: { ...ASSINATURAS_INICIAIS.gerente },
    secretario: { ...ASSINATURAS_INICIAIS.secretario },
  };

  return {
    gerente: {
      nome: clean(data.gerente_nome),
      matricula: clean(data.gerente_matricula),
      cargo: clean(data.gerente_cargo),
    },
    secretario: {
      nome: clean(data.secretario_nome),
      matricula: clean(data.secretario_matricula),
      cargo: clean(data.secretario_cargo),
    },
  };
}

export async function salvarAssinaturas(a: AssinaturasFrequencia): Promise<void> {
  if (!clean(a.gerente.nome) || !clean(a.gerente.cargo)) {
    throw new Error('Preencha o nome e o cargo do gerente.');
  }
  if (!clean(a.secretario.nome) || !clean(a.secretario.cargo)) {
    throw new Error('Preencha o nome e o cargo do secretário.');
  }

  const payload = {
    id: 1,
    gerente_nome: clean(a.gerente.nome),
    gerente_matricula: clean(a.gerente.matricula),
    gerente_cargo: clean(a.gerente.cargo),
    secretario_nome: clean(a.secretario.nome),
    secretario_matricula: clean(a.secretario.matricula),
    secretario_cargo: clean(a.secretario.cargo),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(payload, { onConflict: 'id' });

  if (error) throw new Error(toMessage(error, 'salvar'));
}
