import { API_BASE_URL } from '../config/api';
import { supabase } from '../lib/supabaseClient';

export type TipoEvento = 'FERIADO' | 'PONTO_FACULTATIVO' | 'EVENTO';

export type EventoCalendario = {
  id: string;
  data: string;
  ano: number | null;
  mes: number | null;
  dia: number | null;
  tipo: TipoEvento;
  titulo: string;
  descricao: string;
  ativo: boolean;
  isFeriado: boolean;
  isPontoFacultativo: boolean;
  isEvento: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type EventoInput = {
  id?: string;
  data?: string;
  ano?: number;
  mes?: number;
  dia?: number;
  tipo: TipoEvento;
  titulo?: string;
  descricao?: string;
  ativo?: boolean;
};

export type EventosFiltros = {
  ano?: number;
  mes?: number;
  tipo?: TipoEvento;
  ativo?: boolean;
};

export type TipoEventoOption = {
  value: TipoEvento;
  label: string;
};

function getBaseUrl(): string {
  return String(API_BASE_URL || '').replace(/\/+$/, '');
}

function safeString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

async function safeJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

function parseError(payload: any, fallback: string): string {
  return safeString(payload?.error ?? payload?.message ?? payload?.details, fallback);
}

function httpError(response: Response, payload: any, fallback: string): Error {
  const detail = parseError(payload, fallback);
  return new Error(`${detail} (HTTP ${response.status} em /api/eventos).`);
}

async function consultarEventos(path: string, init: RequestInit, fallback: string): Promise<any> {
  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (error || !token) {
    throw new Error('Sessão Supabase ausente ou expirada. Entre novamente no Portal CIAPI para consultar ou alterar feriados.');
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, { ...init, headers });
  } catch {
    throw new Error(`Não foi possível conectar ao servidor de eventos (${getBaseUrl()}). Verifique a API, a rede e o CORS. Nenhum registro foi confirmado.`);
  }
  const payload = await safeJson(response);
  if (!response.ok) throw httpError(response, payload, fallback);
  return payload;
}

function extractArrayPayload(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.eventos)) return payload.eventos;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

function normalizeTipo(value: unknown): TipoEvento {
  const text = safeString(value).toUpperCase().replace(/\s+/g, '_') as TipoEvento;
  if (text === 'FERIADO' || text === 'PONTO_FACULTATIVO' || text === 'EVENTO') {
    return text;
  }
  return 'EVENTO';
}

function normalizeEvento(raw: any): EventoCalendario {
  const data = safeString(raw?.data);
  const tipo = normalizeTipo(raw?.tipo);

  return {
    id: safeString(raw?.id),
    data,
    ano: Number.isFinite(Number(raw?.ano)) ? Number(raw?.ano) : data ? Number(data.slice(0, 4)) : null,
    mes: Number.isFinite(Number(raw?.mes)) ? Number(raw?.mes) : data ? Number(data.slice(5, 7)) : null,
    dia: Number.isFinite(Number(raw?.dia)) ? Number(raw?.dia) : data ? Number(data.slice(8, 10)) : null,
    tipo,
    titulo: safeString(raw?.titulo, tipo === 'FERIADO' ? 'Feriado' : tipo === 'PONTO_FACULTATIVO' ? 'Ponto Facultativo' : 'Evento'),
    descricao: safeString(raw?.descricao),
    ativo: Boolean(raw?.ativo ?? true),
    isFeriado: tipo === 'FERIADO',
    isPontoFacultativo: tipo === 'PONTO_FACULTATIVO',
    isEvento: tipo === 'EVENTO',
    createdAt: raw?.createdAt ?? raw?.created_at ?? null,
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? null,
  };
}

function buildQuery(filters: EventosFiltros = {}): string {
  const params = new URLSearchParams();

  if (filters.ano !== undefined) params.set('ano', String(filters.ano));
  if (filters.mes !== undefined) params.set('mes', String(filters.mes));
  if (filters.tipo) params.set('tipo', filters.tipo);
  if (filters.ativo !== undefined) params.set('ativo', String(filters.ativo));

  const query = params.toString();
  return query ? `?${query}` : '';
}

function sortEventos(rows: EventoCalendario[]): EventoCalendario[] {
  return [...rows].sort((a, b) => {
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    return a.tipo.localeCompare(b.tipo);
  });
}

export async function listarEventos(filters: EventosFiltros = {}): Promise<EventoCalendario[]> {
  const payload = await consultarEventos(`/api/eventos${buildQuery(filters)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  }, 'Não foi possível listar os eventos.');

  return sortEventos(extractArrayPayload(payload).map(normalizeEvento));
}

export async function obterEventoPorId(id: string): Promise<EventoCalendario> {
  const payload = await consultarEventos(`/api/eventos/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  }, 'Não foi possível carregar o evento.');

  return normalizeEvento(payload?.data ?? payload);
}

export async function criarEvento(input: EventoInput): Promise<EventoCalendario> {
  const payload = await consultarEventos(`/api/eventos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(input),
  }, 'Não foi possível criar o evento.');

  return normalizeEvento(payload?.data ?? payload);
}

export async function atualizarEvento(id: string, input: Partial<EventoInput>): Promise<EventoCalendario> {
  const payload = await consultarEventos(`/api/eventos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(input),
  }, 'Não foi possível atualizar o evento.');

  return normalizeEvento(payload?.data ?? payload);
}

export async function excluirEvento(id: string): Promise<EventoCalendario> {
  const payload = await consultarEventos(`/api/eventos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  }, 'Não foi possível excluir o evento.');

  return normalizeEvento(payload?.data ?? payload);
}

export async function listarTiposEvento(): Promise<TipoEventoOption[]> {
  const payload = await consultarEventos(`/api/eventos/tipos`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  }, 'Não foi possível listar os tipos de evento.');

  const rows = extractArrayPayload(payload);
  return rows.map((item) => ({
    value: normalizeTipo(item?.value),
    label: safeString(item?.label, safeString(item?.value)),
  }));
}

export function getEventoBadgeLabel(tipo: TipoEvento): string {
  if (tipo === 'FERIADO') return 'Feriado';
  if (tipo === 'PONTO_FACULTATIVO') return 'Ponto Facultativo';
  return 'Evento';
}

export function formatarDataEvento(dataIso: string): string {
  if (!dataIso) return 'Sem data';
  const [ano, mes, dia] = dataIso.split('-');
  if (!ano || !mes || !dia) return dataIso;
  return `${dia}/${mes}/${ano}`;
}

const eventosService = {
  listarEventos,
  obterEventoPorId,
  criarEvento,
  atualizarEvento,
  excluirEvento,
  listarTiposEvento,
  getEventoBadgeLabel,
  formatarDataEvento,
};

export default eventosService;
