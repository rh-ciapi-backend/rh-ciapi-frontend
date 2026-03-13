import { API_BASE_URL } from '../config/api';
import type {
  FrequenciaApiResponse,
  FrequenciaExportPayload,
  FrequenciaOcorrenciaPayload,
  FrequenciaServidorItem,
} from '../types/frequencia';

type JsonValue = unknown;

function normalizeBaseUrl(url: string): string {
  return String(url || '').replace(/\/+$/, '');
}

const BASE_URL = normalizeBaseUrl(API_BASE_URL || '');
const FREQUENCIA_URL = `${BASE_URL}/api/frequencia`;

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  return '';
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
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

function extractArrayPayload(payload: JsonValue): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;

  const directCandidates = [
    record.data,
    record.items,
    record.results,
    record.rows,
    record.registros,
    record.servidores,
    record.frequencias,
    record.lista,
    record.list,
  ];

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  const nestedCandidates = [
    record.data,
    record.items,
    record.results,
    record.payload,
    record.response,
  ];

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
    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      throw new Error(
        String(record.error || record.message || `Falha na requisição (${response.status})`),
      );
    }

    if (typeof body === 'string' && body.trim()) {
      throw new Error(body);
    }

    throw new Error(`Falha na requisição (${response.status})`);
  }

  return body as T;
}

export async function listarPorMes(ano: number, mes: number): Promise<unknown[]> {
  const safeAno = sanitizeAno(ano);
  const safeMes = sanitizeMes(mes);

  const payload = await httpJson<FrequenciaApiResponse<unknown[]>>(
    `${FREQUENCIA_URL}?ano=${safeAno}&mes=${safeMes}`,
    { method: 'GET' },
  );

  return extractArrayPayload(payload);
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

async function tryExportEndpoint(
  endpoint: string,
  payload: FrequenciaExportPayload,
): Promise<Response | null> {
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

export async function baixarFrequenciaArquivo(payload: FrequenciaExportPayload): Promise<void> {
  const safePayload: FrequenciaExportPayload = {
    ...payload,
    ano: sanitizeAno(payload.ano),
    mes: sanitizeMes(payload.mes),
    formato: payload.formato,
  };

  const fallbackName = `frequencia_${safePayload.ano}_${String(safePayload.mes).padStart(2, '0')}.${safePayload.formato}`;

  const primaryEndpoint = `${FREQUENCIA_URL}/exportar`;
  const fallbackEndpoint = `${FREQUENCIA_URL}/exportar/${safePayload.formato}`;

  let response = await tryExportEndpoint(primaryEndpoint, safePayload);

  if (!response) {
    response = await tryExportEndpoint(fallbackEndpoint, safePayload);
  }

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
  URL.revokeObjectURL(url);
}

export async function exportarDocx(payload: Omit<FrequenciaExportPayload, 'formato'>): Promise<void> {
  return baixarFrequenciaArquivo({ ...payload, formato: 'docx' });
}

export async function exportarPdf(payload: Omit<FrequenciaExportPayload, 'formato'>): Promise<void> {
  return baixarFrequenciaArquivo({ ...payload, formato: 'pdf' });
}

export async function exportarCsv(payload: Omit<FrequenciaExportPayload, 'formato'>): Promise<void> {
  return baixarFrequenciaArquivo({ ...payload, formato: 'csv' });
}

function csvEscape(value: unknown): string {
  const text = asString(value);
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function baixarCsvLocalFrequencia(
  servidor: FrequenciaServidorItem,
  ano: number,
  mes: number,
): void {
  const safeAno = sanitizeAno(ano);
  const safeMes = sanitizeMes(mes);

  const header = [
    'DIA',
    'DATA',
    'SEMANA',
    'STATUS',
    'RUBRICA',
    'REFERENCIA',
    'OCORRENCIA_MANHA',
    'OCORRENCIA_TARDE',
    'TITULO',
    'DESCRICAO',
    'SERVIDOR',
    'CPF',
    'MATRICULA',
    'CATEGORIA',
    'SETOR',
    'CARGO',
  ];

  const lines = [
    header.join(';'),
    ...asArray(servidor.dias).map((dia) =>
      [
        csvEscape(dia.dia),
        csvEscape(dia.dataIso),
        csvEscape(dia.weekdayLabel),
        csvEscape(dia.status),
        csvEscape(dia.rubrica),
        csvEscape(dia.referencia),
        csvEscape(dia.ocorrenciaManha),
        csvEscape(dia.ocorrenciaTarde),
        csvEscape(dia.titulo),
        csvEscape(dia.descricao),
        csvEscape(servidor.nome),
        csvEscape(servidor.cpf),
        csvEscape(servidor.matricula),
        csvEscape(servidor.categoria),
        csvEscape(servidor.setor),
        csvEscape(servidor.cargo),
      ].join(';'),
    ),
  ];

  const bom = '\uFEFF';
  const blob = new Blob([bom + lines.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });

  const nomeBase = asString(servidor.nome)
    .replace(/[^\p{L}\p{N}\-_ ]/gu, '')
    .trim()
    .replace(/\s+/g, '_');

  const fileName = `frequencia_${nomeBase || 'servidor'}_${safeAno}_${String(safeMes).padStart(2, '0')}.csv`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function getFrequenciaServiceErrorMessage(error: unknown): string {
  return toErrorMessage(error, 'Falha ao processar a operação de frequência.');
}

const frequenciaService = {
  listarPorMes,
  registrarOcorrencia,
  editar,
  excluir,
  baixarFrequenciaArquivo,
  exportarDocx,
  exportarPdf,
  exportarCsv,
  baixarCsvLocalFrequencia,
  getFrequenciaServiceErrorMessage,
};

export default frequenciaService;
