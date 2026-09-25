import { supabase } from '../lib/supabaseClient';
import { API_BASE_URL } from '../config/api';

export type Requerimento = {
  id: string;
  servidor_id: string;
  tipo: string;
  detalhes: string;
  status: 'RECEBIDO' | 'EM_ANALISE' | 'CONCLUIDO' | 'INDEFERIDO';
  criado_em: string;
  atualizado_em?: string;
  servidor_nome?: string;
};

export type FormularioServidor = {
  servidor: Record<string, unknown>;
  complemento: Record<string, string>;
};

export type NovoRequerimento = {
  servidorId?: string;
  tipo: string;
  detalhes: string;
  dados: Record<string, string>;
};

async function chamarApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const token = data.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  const response = await fetch(`${base}/api/admin/requerimentos${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error || `Erro ao acessar requerimentos (${response.status}).`);
  }
  return body as T;
}

export const requerimentosService = {
  async listar(): Promise<Requerimento[]> {
    const result = await chamarApi<{ requerimentos: Requerimento[] }>('');
    return result.requerimentos || [];
  },

  async obterFormulario(servidorId?: string): Promise<FormularioServidor> {
    const query = servidorId
      ? `?servidorId=${encodeURIComponent(servidorId)}`
      : '';
    return chamarApi<FormularioServidor>(`/formulario${query}`);
  },

  async criar(payload: NovoRequerimento): Promise<Requerimento> {
    const result = await chamarApi<{ requerimento: Requerimento }>('', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return result.requerimento;
  },
};
