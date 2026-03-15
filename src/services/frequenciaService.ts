import { API_BASE_URL } from '../config/api';

export type FormatoExportacaoFrequencia = 'pdf' | 'docx' | 'csv';

export type FrequenciaDiaItem = {
  dia: number;
  data?: string;
  weekday?: string;
  rubrica?: string;
  ocorrencia1?: string;
  ocorrencia2?: string;
  statusFinal?: string;
  observacoes?: string[];
  isWeekend?: boolean;
};

export type FrequenciaServidorItem = {
  id?: string;
  servidorId?: string;
  cpf?: string;
  matricula?: string;
  nome: string;
  categoria?: string;
  setor?: string;
  status?: string;
  cargo?: string;
  dias: FrequenciaDiaItem[];
};

export type ExportarFrequenciaPayload = {
  ano: number;
  mes: number;
  servidorCpf?: string;
  servidorId?: string;
  categoria?: string;
  setor?: string;
  status?: string;
  busca?: string;
  incluirPontoFacultativo?: boolean;
};

export type FrequenciaOcorrenciaPayload = {
  id?: string;
  servidorCpf?: string;
  servidorId?: string;
  data?: string;
  dia?: number;
  mes?: number;
  ano?: number;
  rubrica?: string;
  ocorrencia1?: string;
  ocorrencia2?: string;
  statusFinal?: string;
  observacoes?: string[];
  [key: string]: unknown;
};

type JsonValue = unknown;
type QueryParams = Record<string, string | number | boolean | null | undefined>;

function normalizeBaseUrl(url: string): string {
  return String(url || '').replace(/\/+$/, '');
}

const BASE_URL = normalizeBaseUrl(API_BASE_URL || '');
const FREQUENCIA_URL = `${BASE_URL}/api/frequencia`;

function sanitizeMes(mes: number): number {
  const value = Number(mes);
  if (!Number.isFinite(value) || value < 1 || value > 12) return new Date().getMonth() + 1;
  return Math.trunc(value);
}

function sanitizeAno(ano: number): number {
  const value = Number(ano);
  if (!Number.isFinite(value) || value < 2000 || value > 2100) return new Date().getFullYear();
  return Math.trunc(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  return '';
}

function asNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter(Boolean);
  }
  const single = asString(value);
  return single ? [single] : [];
}

function buildQuery(params: QueryParams): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    const text = String(value).trim();
    if (!text) return;
    query.set(key, text);
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

async function parseResponse(response: Response): Promise<JsonValue> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

function extractErrorMessage(body: JsonValue, status: number): string {
  if (isObject(body)) {
    const message = asString(body.error) || asString(body.message) || asString(body.details);
    if (message) return message;
  }
  if (typeof body === 'string' && body.trim()) return body.trim();
  return `Falha na requisição (${status})`;
}

async function httpJson<T = unknown>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const body = await parseResponse(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(body, response.status));
  }

  return body as T;
}

function extractArrayPayload(payload: JsonValue): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isObject(payload)) return [];

  const directCandidates = [
    payload.data,
    payload.items,
    payload.results,
    payload.rows,
    payload.registros,
    payload.servidores,
    payload.frequencias,
    payload.lista,
    payload.list,
  ];

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  const nestedCandidates = [payload.data, payload.items, payload.results, payload.payload, payload.response];

  for (const candidate of nestedCandidates) {
    if (!isObject(candidate)) continue;

    const nested = [
      candidate.data,
      candidate.items,
      candidate.results,
      candidate.rows,
      candidate.registros,
      candidate.servidores,
      candidate.frequencias,
      candidate.lista,
      candidate.list,
    ];

    for (const inner of nested) {
      if (Array.isArray(inner)) return inner;
    }
  }

  return [];
}

function normalizeStatus(value: unknown): string {
  const text = asString(value);
  return text || '';
}

function normalizeDay(raw: unknown, fallbackDay: number, ano: number, mes: number): FrequenciaDiaItem {
  const day = isObject(raw) ? raw : {};
  const dia = Math.max(1, Math.trunc(asNumber(day.dia ?? day.day, fallbackDay)));

  const computedDate = new Date(ano, mes - 1, dia);
  const weekday = computedDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  const jsWeekday = computedDate.getDay();
  const isWeekend = jsWeekday === 0 || jsWeekday === 6;

  return {
    dia,
    data: asString(day.data ?? day.date) || `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
    weekday: asString(day.weekday ?? day.diaSemana) || weekday,
    rubrica: asString(day.rubrica ?? day.descricao ?? day.label),
    ocorrencia1: asString(day.ocorrencia1 ?? day.o1 ?? day.turno1),
    ocorrencia2: asString(day.ocorrencia2 ?? day.o2 ?? day.turno2),
    statusFinal: normalizeStatus(day.statusFinal ?? day.status ?? day.finalStatus ?? day.codigo),
    observacoes: ensureStringArray(day.observacoes ?? day.observacao ?? day.obs),
    isWeekend: Boolean(day.isWeekend ?? isWeekend),
  };
}

function normalizeServidor(raw: unknown, ano: number, mes: number): FrequenciaServidorItem {
  const item = isObject(raw) ? raw : {};
  const rawDias = extractArrayPayload(item.dias ?? item.dayItems ?? item.frequencia ?? item.days);
  const totalDiasMes = new Date(ano, mes, 0).getDate();

  const normalizedDays = rawDias.length
    ? rawDias.map((day, index) => normalizeDay(day, index + 1, ano, mes))
    : Array.from({ length: totalDiasMes }, (_, index) => normalizeDay({}, index + 1, ano, mes));

  return {
    id: asString(item.id ?? item.uuid ?? item.servidorId ?? item.servidor_id),
    servidorId: asString(item.servidorId ?? item.servidor_id ?? item.id),
    cpf: asString(item.cpf),
    matricula: asString(item.matricula),
    nome: asString(item.nome ?? item.nomeCompleto ?? item.servidorNome ?? item.servidor) || 'Servidor sem nome',
    categoria: asString(item.categoria),
    setor: asString(item.setor),
    status: asString(item.status) || 'ATIVO',
    cargo: asString(item.cargo),
    dias: normalizedDays,
  };
}

export async function listarPorMes(ano: number, mes: number): Promise<FrequenciaServidorItem[]> {
  const safeAno = sanitizeAno(ano);
  const safeMes = sanitizeMes(mes);

  const payload = await httpJson<JsonValue>(
    `${FREQUENCIA_URL}${buildQuery({ ano: safeAno, mes: safeMes })}`,
    { method: 'GET' },
  );

  return extractArrayPayload(payload).map((item) => normalizeServidor(item, safeAno, safeMes));
}

export async function listarFrequenciaPorMes(params: {
  ano: number;
  mes: number;
  categoria?: string;
  setor?: string;
  status?: string;
  busca?: string;
}): Promise<FrequenciaServidorItem[]> {
  const safeAno = sanitizeAno(params.ano);
  const safeMes = sanitizeMes(params.mes);

  const payload = await httpJson<JsonValue>(
    `${FREQUENCIA_URL}${buildQuery({
      ano: safeAno,
      mes: safeMes,
      categoria: params.categoria,
      setor: params.setor,
      status: params.status,
      busca: params.busca,
      search: params.busca,
    })}`,
    { method: 'GET' },
  );

  return extractArrayPayload(payload).map((item) => normalizeServidor(item, safeAno, safeMes));
}

export async function registrarOcorrencia(payload: FrequenciaOcorrenciaPayload): Promise<unknown> {
  return httpJson(FREQUENCIA_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function editar(id: string, payload: Partial<FrequenciaOcorrenciaPayload>): Promise<unknown> {
  return httpJson(`${FREQUENCIA_URL}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function excluir(id: string): Promise<unknown> {
  return httpJson(`${FREQUENCIA_URL}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

async function tryExportEndpoint(endpoint: string, payload: Record<string, unknown>): Promise<Response | null> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return null;
    return response;
  } catch {
    return null;
  }
}

function resolveFilename(response: Response, fallback: string): string {
  const disposition = response.headers.get('content-disposition') || '';
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const asciiMatch = disposition.match(/filename="?([^"]+)"?/i);
  const raw = utf8Match?.[1] || asciiMatch?.[1] || fallback;

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function baixarFrequenciaArquivo(
  payload: ExportarFrequenciaPayload & { formato: FormatoExportacaoFrequencia },
): Promise<void> {
  const safePayload = {
    ...payload,
    ano: sanitizeAno(payload.ano),
    mes: sanitizeMes(payload.mes),
  };

  const fallbackName = `frequencia_${safePayload.ano}_${String(safePayload.mes).padStart(2, '0')}.${safePayload.formato}`;
  const primaryEndpoint = `${FREQUENCIA_URL}/exportar`;
  const fallbackEndpoint = `${FREQUENCIA_URL}/exportar/${safePayload.formato}`;

  let response = await tryExportEndpoint(primaryEndpoint, safePayload);
  if (!response) response = await tryExportEndpoint(fallbackEndpoint, safePayload);

  if (!response) {
    throw new Error('Não foi possível exportar a frequência neste momento.');
  }

  const blob = await response.blob();
  const filename = resolveFilename(response, fallbackName);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportarFrequenciaArquivo(
  payload: ExportarFrequenciaPayload,
  formato: FormatoExportacaoFrequencia,
): Promise<void> {
  return baixarFrequenciaArquivo({ ...payload, formato });
}

export async function exportarDocx(payload: ExportarFrequenciaPayload): Promise<void> {
  return baixarFrequenciaArquivo({ ...payload, formato: 'docx' });
}

export async function exportarPdf(payload: ExportarFrequenciaPayload): Promise<void> {
  return baixarFrequenciaArquivo({ ...payload, formato: 'pdf' });
}

export async function exportarCsv(payload: ExportarFrequenciaPayload): Promise<void> {
  return baixarFrequenciaArquivo({ ...payload, formato: 'csv' });
}
