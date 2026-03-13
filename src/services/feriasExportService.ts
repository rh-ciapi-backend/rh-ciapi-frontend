import { API_BASE_URL } from '../config/api';

export type FeriasExportFormato = 'docx' | 'pdf' | 'csv';
export type ExportCategoria = 'TODOS' | 'EFETIVO' | 'SELETIVADO' | 'FEDERAL' | 'COMISSIONADO';

export interface FeriasExportRowInput {
  nome?: string;
  cpf?: string;
  matricula?: string;
  categoria?: string;
  setor?: string;
  status?: string;
  periodo1_inicio?: string;
  periodo1_fim?: string;
  periodo2_inicio?: string;
  periodo2_fim?: string;
  periodo3_inicio?: string;
  periodo3_fim?: string;
}

export interface FeriasExportServidorInput {
  servidorCpf?: string;
  servidorId?: string;
  nome?: string;
}

export interface ExportFeriasFilters {
  formato: FeriasExportFormato;
  mes?: number;
  ano?: number;
  categoria?: string;
  setor?: string;
  status?: string;
  servidorCpf?: string;
  servidorId?: string;
  incluirInativos?: boolean;
}

export interface FeriasExportPayload extends ExportFeriasFilters {
  rows?: FeriasExportRowInput[];
}

export const feriasExportLabels: Record<string, string> = {
  formato: 'Formato',
  mes: 'Mês',
  ano: 'Ano',
  categoria: 'Categoria',
  setor: 'Setor',
  status: 'Status',
  servidorCpf: 'CPF do servidor',
  servidorId: 'ID do servidor',
  incluirInativos: 'Incluir inativos',
};

function normalizeBaseUrl(url: string): string {
  return String(url || '').replace(/\/+$/, '');
}

const BASE_URL = normalizeBaseUrl(API_BASE_URL || '');
const FERIAS_EXPORT_URL = `${BASE_URL}/api/ferias/exportar`;

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  return '';
}

function sanitizeMes(mes?: number): number | undefined {
  const value = Number(mes);
  if (!Number.isFinite(value) || value < 1 || value > 12) return undefined;
  return Math.trunc(value);
}

function sanitizeAno(ano?: number): number | undefined {
  const value = Number(ano);
  if (!Number.isFinite(value) || value < 2000 || value > 2100) return undefined;
  return Math.trunc(value);
}

export function getDefaultFeriasExportFilters(): ExportFeriasFilters {
  const now = new Date();

  return {
    formato: 'docx',
    mes: now.getMonth() + 1,
    ano: now.getFullYear(),
    categoria: '',
    setor: '',
    status: 'ATIVO',
    servidorCpf: '',
    servidorId: '',
    incluirInativos: false,
  };
}

export function buildFeriasExportData(
  filters: Partial<ExportFeriasFilters> = {},
  rows: FeriasExportRowInput[] = [],
): FeriasExportPayload {
  const defaults = getDefaultFeriasExportFilters();

  return {
    formato: (filters.formato as FeriasExportFormato) || defaults.formato,
    mes: sanitizeMes(filters.mes ?? defaults.mes),
    ano: sanitizeAno(filters.ano ?? defaults.ano),
    categoria: asString(filters.categoria ?? defaults.categoria),
    setor: asString(filters.setor ?? defaults.setor),
    status: asString(filters.status ?? defaults.status),
    servidorCpf: asString(filters.servidorCpf ?? defaults.servidorCpf),
    servidorId: asString(filters.servidorId ?? defaults.servidorId),
    incluirInativos:
      typeof filters.incluirInativos === 'boolean'
        ? filters.incluirInativos
        : Boolean(defaults.incluirInativos),
    rows: Array.isArray(rows) ? rows : [],
  };
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

async function parseError(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const json = await response.json();
      return String(json?.error || json?.message || `Falha na exportação (${response.status})`);
    }

    const text = await response.text();
    return text?.trim() || `Falha na exportação (${response.status})`;
  } catch {
    return `Falha na exportação (${response.status})`;
  }
}

export async function exportarFerias(payload: FeriasExportPayload): Promise<void> {
  const safePayload = buildFeriasExportData(payload, payload.rows || []);

  const fallbackName = `ferias_${safePayload.ano || 'geral'}_${String(safePayload.mes || '00')}.${safePayload.formato}`;

  const response = await fetch(FERIAS_EXPORT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(safePayload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
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

export async function exportFeriasFile(payload: FeriasExportPayload): Promise<void> {
  return exportarFerias(payload);
}

const feriasExportService = {
  exportarFerias,
  exportFeriasFile,
  buildFeriasExportData,
  getDefaultFeriasExportFilters,
  feriasExportLabels,
};

export default feriasExportService;
