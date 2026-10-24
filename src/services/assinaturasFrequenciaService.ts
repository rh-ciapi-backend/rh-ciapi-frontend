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

const table = 'ciapi_config_assinaturas_frequencia';

function mensagemErro(error: { code?: string; message?: string }): string {
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return 'Tabela de assinaturas não encontrada no Supabase.';
  }
  if (error.code === '42501' || /permission denied|row.level security|policy/i.test(error.message || '')) {
    return 'Sem permissão para salvar as assinaturas. Verifique o login Supabase Auth e as políticas RLS.';
  }
  return error.message || 'Erro desconhecido ao acessar o Supabase.';
}

async function verificarSessao(): Promise<void> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('Não existe uma sessão Supabase Auth válida neste navegador. Entre novamente pelo login integrado do RH CIAPI.');
  }
}

export async function carregarAssinaturas(): Promise<AssinaturasFrequencia> {
  await verificarSessao();
  const { data, error } = await supabase
    .from(table)
    .select('gerente_nome,gerente_matricula,gerente_cargo,secretario_nome,secretario_matricula,secretario_cargo')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw new Error(`Não foi possível consultar responsáveis: ${mensagemErro(error)}`);
  if (!data) throw new Error('Registro de assinaturas não está visível para este usuário. Confira a política SELECT e a sessão autenticada.');

  return {
    gerente: {
      nome: data.gerente_nome || '',
      matricula: data.gerente_matricula || '',
      cargo: data.gerente_cargo || '',
    },
    secretario: {
      nome: data.secretario_nome || '',
      matricula: data.secretario_matricula || '',
      cargo: data.secretario_cargo || '',
    },
  };
}

export async function salvarAssinaturas(a: AssinaturasFrequencia): Promise<void> {
  await verificarSessao();
  // O registro id=1 é criado pelo SQL de instalação. UPDATE evita exigir INSERT do upsert.
  const { data, error } = await supabase
    .from(table)
    .update({
      gerente_nome: a.gerente.nome.trim(),
      gerente_matricula: a.gerente.matricula.trim(),
      gerente_cargo: a.gerente.cargo.trim(),
      secretario_nome: a.secretario.nome.trim(),
      secretario_matricula: a.secretario.matricula.trim(),
      secretario_cargo: a.secretario.cargo.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
    .select('id');

  if (error) throw new Error(`Não foi possível salvar: ${mensagemErro(error)}`);
  if (!data?.length) {
    throw new Error('Nenhum registro foi atualizado. A política RLS pode estar bloqueando o UPDATE ou a leitura do registro id=1.');
  }
}
