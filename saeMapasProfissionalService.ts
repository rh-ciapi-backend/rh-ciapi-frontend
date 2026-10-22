import { supabase } from '../../lib/supabaseClient';
import { API_BASE_URL } from '../../config/api';

export type SaeMapaAtendimentoItem = {
  id: string;
  data: string;
  prontuario: string;
  nome: string;
  sexo: string;
  idade: string;
  turno: string;
  observacao: string;
  servicoId: string;
};

export type SaeMapaProfissionalResponse = {
  profissional: {
    id: string;
    nome: string;
    cargoFuncao?: string | null;
    registroProfissional?: string | null;
    conselho?: string | null;
    ativo: boolean;
    servicos: Array<{ id: string; nome: string; sigla?: string | null }>;
  };
  mes: number;
  ano: number;
  servicoId?: string | null;
  turno: string;
  total: number;
  itens: SaeMapaAtendimentoItem[];
};

const buildUrl = (path = '') => {
  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  const suffix = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  return `${base}/api/sae/mapas-profissional${suffix}`;
};

async function token() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.access_token) throw new Error('Sessão expirada. Faça login novamente.');
  return data.session.access_token;
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(buildUrl(path), {
    headers: { Authorization: `Bearer ${await token()}` },
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json?.error || 'Falha ao carregar o mapa de atendimento.');
  return json as T;
}

function params(mes: number, ano: number, servicoId?: string) {
  const p = new URLSearchParams({
    mes: String(mes),
    ano: String(ano),
  });
  if (servicoId) p.set('servicoId', servicoId);
  return p.toString();
}

export const saeMapasProfissionalService = {
  async listar(mes: number, ano: number, servicoId?: string) {
    return request<SaeMapaProfissionalResponse>(`?${params(mes, ano, servicoId)}`);
  },

  async baixarDocx(mes: number, ano: number, servicoId?: string) {
    const response = await fetch(buildUrl(`/docx?${params(mes, ano, servicoId)}`), {
      headers: { Authorization: `Bearer ${await token()}` },
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new Error(json?.error || 'Não foi possível gerar o mapa.');
    }

    const blob = await response.blob();
    const header = response.headers.get('content-disposition') || '';
    const match = header.match(/filename="?([^"]+)"?/i);
    const filename = match?.[1] || `mapa-atendimento-${ano}-${String(mes).padStart(2, '0')}.docx`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    return {
      truncated: response.headers.get('X-CIAPI-Mapa-Truncado') === 'true',
      total: Number(response.headers.get('X-CIAPI-Mapa-Total') || 0),
    };
  },
};

export default saeMapasProfissionalService;
