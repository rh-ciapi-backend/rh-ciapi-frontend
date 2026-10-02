import { supabase } from '../../lib/supabaseClient':
import { API_BASE_URL } from '../../config/api';

export type SaeCampoModeloDocumento = {
  name: string;
  label: string;
  type: 'text' | 'date' | 'textarea' | 'select' | 'multiselect';
  section?: string;
  options?: string[];
  placeholder?: string;
};

export type SaeModeloDocumento = {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string | null;
  servicoId: string;
  servicoNome?: string | null;
  servicoSigla?: string | null;
  campos: SaeCampoModeloDocumento[];
  ativo: boolean;
};

export type SaeProfissionalDocumento = {
  id: string;
  authUserId: string;
  nome: string;
  registroProfissional?: string | null;
  conselho?: string | null;
  cargoFuncao?: string | null;
  email?: string | null;
  ativo: boolean;
  servicoIds: string[];
};

export type SaeDocumentoProntuario = {
  id: string;
  usuarioId: string;
  modeloId: string;
  profissionalId: string;
  servicoId: string;
  titulo: string;
  status: 'RASCUNHO' | 'FINALIZADO' | 'ASSINADO';
  dados: Record<string, any>;
  arquivoAssinadoNome?: string | null;
  arquivoAssinadoMime?: string | null;
  versao: number;
  finalizadoAt?: string | null;
  assinadoAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  modeloNome?: string | null;
  modeloCodigo?: string | null;
  profissionalNome?: string | null;
  servicoNome?: string | null;
  servicoSigla?: string | null;
};

export type SaeUsuarioBuscaDocumento = {
  id: string;
  prontuario: string;
  nome: string;
  sexo?: string | null;
  dataNascimento?: string | null;
  idade?: number | null;
};

const buildUrl = (path = '') => {
  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  const suffix = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  return `${base}/api/sae/documentos${suffix}`;
};

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');
  return token;
}

async function request<T>(path = '', options?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.error || 'Erro ao processar documentos do prontuário.');
  }
  return json as T;
}

async function download(path: string, fallbackName: string) {
  const token = await getAccessToken();
  const response = await fetch(buildUrl(path), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json?.error || 'Não foi possível baixar o documento.');
  }

  const blob = await response.blob();
  const header = response.headers.get('content-disposition') || '';
  const matched = header.match(/filename="?([^"]+)"?/i);
  const filename = matched?.[1] || fallbackName;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const saeDocumentosService = {
  async contexto(): Promise<{
    profissional: SaeProfissionalDocumento | null;
    podeCriar: boolean;
    podeAdministrar: boolean;
    modelos: SaeModeloDocumento[];
  }> {
    return request('/contexto');
  },

  async buscarUsuarios(termo: string): Promise<SaeUsuarioBuscaDocumento[]> {
    const params = new URLSearchParams({ termo });
    const response = await request<{ usuarios: SaeUsuarioBuscaDocumento[] }>(
      `/usuarios/buscar?${params.toString()}`,
    );
    return response.usuarios || [];
  },

  async listarUsuario(usuarioId: string): Promise<{
    usuario: { id: string; prontuario: string; nome: string };
    documentos: SaeDocumentoProntuario[];
  }> {
    return request(`/usuario/${encodeURIComponent(usuarioId)}`);
  },

  async criar(usuarioId: string, modeloId: string) {
    return request<{
      documento: SaeDocumentoProntuario;
      modelo: SaeModeloDocumento;
      profissional: SaeProfissionalDocumento;
    }>(`/usuario/${encodeURIComponent(usuarioId)}`, {
      method: 'POST',
      body: JSON.stringify({ modeloId }),
    });
  },

  async salvar(
    documentoId: string,
    payload: {
      titulo?: string;
      dados: Record<string, any>;
      status?: 'RASCUNHO' | 'FINALIZADO';
    },
  ) {
    return request<{ documento: SaeDocumentoProntuario }>(
      `/${encodeURIComponent(documentoId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    );
  },

  async baixarDocx(documentoId: string, titulo = 'documento') {
    await download(
      `/${encodeURIComponent(documentoId)}/docx`,
      `${titulo}.docx`,
    );
  },

  async anexarAssinado(documentoId: string, file: File) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }

    const base64 = btoa(binary);

    return request<{ documento: SaeDocumentoProntuario }>(
      `/${encodeURIComponent(documentoId)}/assinado`,
      {
        method: 'POST',
        body: JSON.stringify({
          nome: file.name,
          mime: file.type,
          base64,
        }),
      },
    );
  },

  async baixarAssinado(documentoId: string) {
    const response = await request<{ url: string; nome?: string | null }>(
      `/${encodeURIComponent(documentoId)}/assinado`,
    );
    if (!response.url) throw new Error('Arquivo assinado indisponível.');
    window.open(response.url, '_blank', 'noopener,noreferrer');
  },
};

export default saeDocumentosService;
