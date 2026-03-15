import { API_BASE_URL } from '../config/api';

export type FrequenciaDay = {
  dia: number;
  dataISO: string;
  weekdayLabel: string;
  rubrica: string;
  ocorrencia1: string;
  ocorrencia2: string;
  statusFinal: string;
  observacoes: string[];
};

export type FrequenciaServidor = {
  id: string;
  nome: string;
  cpf: string;
  matricula: string;
  categoria: string;
  setor: string;
  status: string;
  cargo: string;
  dias: FrequenciaDay[];
  raw: any;
};

export type FrequenciaListResult = {
  items: FrequenciaServidor[];
  meta: Record<string, any>;
  raw: any;
};

export type FrequenciaListParams = {
  ano: number;
  mes: number;
};

export type FrequenciaExportFormat = 'docx' | 'pdf' | 'csv';

export type FrequenciaExportParams = {
  ano: number;
  mes: number;
  servidorId?: string;
  servidorCpf?: string;
  categoria?: string;
  setor?: string;
  status?: string;
  formato: FrequenciaExportFormat;
};

const DEFAULT_HEADERS: HeadersInit = {
  Accept: 'application/json',
};

const BASE_URL = String(API_BASE_URL || '').replace(/\/+$/, '');

function isObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function ensureArray<T = any>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value == null) return [];
  return [value as T];
}

function cleanString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  return '';
}

function firstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    const text = cleanString(value);
    if (text) return text;
  }
  return '';
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function safeLower(value: unknown): string {
  return cleanString(value).toLowerCase();
}

function normalizeMonthNumber(value: unknown): number {
  const num = firstNumber(value);
  if (!num || num < 1 || num > 12) return new Date().getMonth() + 1;
  return num;
}

function normalizeYearNumber(value: unknown): number {
  const num = firstNumber(value);
  if (!num || num < 2000 || num > 3000) return new Date().getFullYear();
  return num;
}

function parseDayFromUnknown(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value >= 1 && value <= 31 ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (/^\d{1,2}$/.test(trimmed)) {
      const num = Number(trimmed);
      return num >= 1 && num <= 31 ? num : null;
    }

    const isoLike = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoLike) {
      const day = Number(isoLike[3]);
      return day >= 1 && day <= 31 ? day : null;
    }

    const brLike = trimmed.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (brLike) {
      const day = Number(brLike[1]);
      return day >= 1 && day <= 31 ? day : null;
    }
  }

  return null;
}

function monthLabelShort(date: Date): string {
  return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
}

function safeDateISO(ano: number, mes: number, dia: number): string {
  const mm = String(mes).padStart(2, '0');
  const dd = String(dia).padStart(2, '0');
  return `${ano}-${mm}-${dd}`;
}

function uniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of values) {
    const text = cleanString(item);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }

  return out;
}

function getCandidateValue(obj: any, paths: string[]): unknown {
  for (const path of paths) {
    const parts = path.split('.');
    let current: any = obj;
    let ok = true;

    for (const part of parts) {
      if (current == null) {
        ok = false;
        break;
      }
      current = current[part];
    }

    if (!ok) continue;

    if (current !== undefined && current !== null) {
      if (typeof current === 'string' && !current.trim()) continue;
      return current;
    }
  }

  return undefined;
}

function deepFindArray(root: any, depth = 0): any[] | null {
  if (Array.isArray(root)) return root;
  if (!isObject(root) || depth > 4) return null;

  const priorityKeys = [
    'data',
    'items',
    'results',
    'rows',
    'servidores',
    'frequencias',
    'lista',
    'registros',
    'content',
    'payload',
  ];

  for (const key of priorityKeys) {
    const value = root[key];
    if (Array.isArray(value)) return value;
  }

  for (const value of Object.values(root)) {
    if (Array.isArray(value)) return value;
  }

  for (const value of Object.values(root)) {
    if (isObject(value)) {
      const nested = deepFindArray(value, depth + 1);
      if (nested) return nested;
    }
  }

  return null;
}

function extractArrayPayload(payload: any): any[] {
  if (Array.isArray(payload)) return payload;

  if (!isObject(payload)) return [];

  const direct = deepFindArray(payload);
  if (direct) return direct;

  return [];
}

function extractMeta(payload: any): Record<string, any> {
  if (!isObject(payload)) return {};

  const metaCandidate =
    payload.meta ??
    payload.pagination ??
    payload.page ??
    payload.summary ??
    payload.resumo ??
    {};

  return isObject(metaCandidate) ? metaCandidate : {};
}

function extractDayArray(item: any): any[] {
  const candidates = [
    item?.dias,
    item?.days,
    item?.dayItems,
    item?.frequencia,
    item?.frequencias,
    item?.registros,
    item?.ocorrencias,
    item?.data?.dias,
    item?.data?.days,
    item?.data?.frequencia,
    item?.payload?.dias,
    item?.payload?.days,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  for (const value of Object.values(item || {})) {
    if (Array.isArray(value) && value.length > 0 && value.some((row) => isObject(row))) {
      const hasDaySignal = value.some((row) => {
        if (!isObject(row)) return false;
        return (
          'dia' in row ||
          'day' in row ||
          'data' in row ||
          'date' in row ||
          'rubrica' in row ||
          'descricao' in row ||
          'ocorrencia1' in row ||
          'ocorrencia_1' in row ||
          'o1' in row
        );
      });

      if (hasDaySignal) return value;
    }
  }

  return [];
}

function normalizeDay(raw: any, ano: number, mes: number, fallbackIndex: number): FrequenciaDay {
  const dia =
    parseDayFromUnknown(
      getCandidateValue(raw, ['dia', 'day', 'data', 'date', 'dia_numero', 'numero_dia'])
    ) ?? fallbackIndex + 1;

  const dataISO =
    firstNonEmpty(
      getCandidateValue(raw, ['dataISO', 'data_iso', 'dateISO', 'date_iso']),
      safeDateISO(ano, mes, dia)
    ) || safeDateISO(ano, mes, dia);

  const referenceDate = new Date(`${safeDateISO(ano, mes, dia)}T12:00:00`);
  const weekdayLabel = monthLabelShort(referenceDate);

  const rubrica = firstNonEmpty(
    getCandidateValue(raw, [
      'rubrica',
      'descricao',
      'descricao',
      'referencia',
      'referência',
      'statusRubrica',
      'status_rubrica',
      's',
    ])
  );

  const ocorrencia1 = firstNonEmpty(
    getCandidateValue(raw, [
      'ocorrencia1',
      'ocorrencia_1',
      'o1',
      'turno1',
      'turno_1',
      'manha',
      'manhã',
      'entrada1',
    ])
  );

  const ocorrencia2 = firstNonEmpty(
    getCandidateValue(raw, [
      'ocorrencia2',
      'ocorrencia_2',
      'o2',
      'turno2',
      'turno_2',
      'tarde',
      'saida2',
      'entrada2',
    ])
  );

  const statusFinal = firstNonEmpty(
    getCandidateValue(raw, [
      'statusFinal',
      'status_final',
      'finalStatus',
      'final_status',
      'status',
      'situacao',
      'situação',
    ]),
    rubrica,
    ocorrencia1,
    ocorrencia2
  );

  const observacoes = uniqueStrings([
    getCandidateValue(raw, ['observacoes', 'observação', 'observacao', 'obs']),
    ...(Array.isArray(raw?.avisos) ? raw.avisos : []),
    ...(Array.isArray(raw?.warnings) ? raw.warnings : []),
  ]);

  return {
    dia,
    dataISO,
    weekdayLabel,
    rubrica,
    ocorrencia1,
    ocorrencia2,
    statusFinal,
    observacoes,
  };
}

function normalizeServidor(raw: any, ano: number, mes: number, index: number): FrequenciaServidor {
  const nestedServidor = isObject(raw?.servidor) ? raw.servidor : {};
  const nestedPessoa = isObject(raw?.pessoa) ? raw.pessoa : {};
  const nestedFuncionario = isObject(raw?.funcionario) ? raw.funcionario : {};

  const id = firstNonEmpty(
    getCandidateValue(raw, ['id', 'uuid', 'servidor_id', 'servidorId', 'cpf', 'matricula']),
    getCandidateValue(nestedServidor, ['id', 'uuid', 'servidor_id', 'servidorId', 'cpf', 'matricula']),
    `freq-${index + 1}`
  );

  const nome = firstNonEmpty(
    getCandidateValue(raw, [
      'nome',
      'nome_completo',
      'nomeCompleto',
      'servidor_nome',
      'servidorNome',
      'displayName',
      'display_name',
      'servidor',
    ]),
    getCandidateValue(nestedServidor, [
      'nome',
      'nome_completo',
      'nomeCompleto',
      'servidor_nome',
      'servidorNome',
    ]),
    getCandidateValue(nestedPessoa, ['nome', 'nome_completo', 'nomeCompleto']),
    getCandidateValue(nestedFuncionario, ['nome', 'nome_completo', 'nomeCompleto']),
    ''
  );

  const cpf = firstNonEmpty(
    getCandidateValue(raw, ['cpf', 'servidor_cpf', 'servidorCpf', 'documento']),
    getCandidateValue(nestedServidor, ['cpf', 'servidor_cpf', 'servidorCpf']),
    getCandidateValue(nestedPessoa, ['cpf']),
    getCandidateValue(nestedFuncionario, ['cpf'])
  );

  const matricula = firstNonEmpty(
    getCandidateValue(raw, ['matricula', 'matrícula', 'registro', 'mat']),
    getCandidateValue(nestedServidor, ['matricula', 'matrícula', 'registro', 'mat']),
    getCandidateValue(nestedPessoa, ['matricula']),
    getCandidateValue(nestedFuncionario, ['matricula'])
  );

  const categoria = firstNonEmpty(
    getCandidateValue(raw, ['categoria', 'category', 'categoria_nome', 'categoriaNome']),
    getCandidateValue(nestedServidor, ['categoria', 'category', 'categoria_nome', 'categoriaNome']),
    'NÃO INFORMADA'
  );

  const setor = firstNonEmpty(
    getCandidateValue(raw, ['setor', 'lotacao', 'lotação', 'setor_nome', 'setorNome']),
    getCandidateValue(nestedServidor, ['setor', 'lotacao', 'lotação', 'setor_nome', 'setorNome']),
    'NÃO INFORMADO'
  );

  const status = firstNonEmpty(
    getCandidateValue(raw, ['status', 'situacao', 'situação', 'status_servidor']),
    getCandidateValue(nestedServidor, ['status', 'situacao', 'situação', 'status_servidor']),
    'NÃO INFORMADO'
  );

  const cargo = firstNonEmpty(
    getCandidateValue(raw, ['cargo', 'funcao', 'função', 'cargo_nome']),
    getCandidateValue(nestedServidor, ['cargo', 'funcao', 'função', 'cargo_nome']),
    ''
  );

  const rawDays = extractDayArray(raw);
  const normalizedDays = rawDays
    .map((day, dayIndex) => normalizeDay(day, ano, mes, dayIndex))
    .sort((a, b) => a.dia - b.dia);

  return {
    id,
    nome: nome || 'Servidor sem nome',
    cpf,
    matricula,
    categoria,
    setor,
    status,
    cargo,
    dias: normalizedDays,
    raw,
  };
}

function normalizeServidores(payload: any, ano: number, mes: number): FrequenciaListResult {
  const rows = extractArrayPayload(payload);
  const items = rows.map((row, index) => normalizeServidor(row, ano, mes, index));
  const meta = extractMeta(payload);

  return {
    items,
    meta,
    raw: payload,
  };
}

async function parseJsonSafely(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: response.ok,
      rawText: text,
    };
  }
}

function buildQuery(params: Record<string, any>): string {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });

  return search.toString();
}

export async function listarFrequenciaPorMes(params: FrequenciaListParams): Promise<FrequenciaListResult> {
  const ano = normalizeYearNumber(params.ano);
  const mes = normalizeMonthNumber(params.mes);

  const query = buildQuery({ ano, mes });
  const response = await fetch(`${BASE_URL}/api/frequencia?${query}`, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      cleanString(payload?.error) ||
        cleanString(payload?.message) ||
        'Não foi possível carregar os dados da frequência.'
    );
  }

  const normalized = normalizeServidores(payload, ano, mes);

  if (typeof window !== 'undefined') {
    console.log('FREQUENCIA RAW RESPONSE', payload);
    console.log('FREQUENCIA NORMALIZED', normalized);
  }

  return normalized;
}

export async function baixarFrequenciaArquivo(params: FrequenciaExportParams): Promise<void> {
  const query = buildQuery({
    ano: params.ano,
    mes: params.mes,
    servidorId: params.servidorId,
    servidorCpf: params.servidorCpf,
    categoria: params.categoria,
    setor: params.setor,
    status: params.status,
    formato: params.formato,
  });

  const endpoint =
    `${BASE_URL}/api/frequencia/exportar?${query}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: '*/*',
    },
  });

  if (!response.ok) {
    const errorPayload = await parseJsonSafely(response);
    throw new Error(
      cleanString(errorPayload?.error) ||
        cleanString(errorPayload?.message) ||
        `Falha ao exportar arquivo ${params.formato.toUpperCase()}.`
    );
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition') || '';
  const filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
  const filename =
    decodeURIComponent(filenameMatch?.[1] || filenameMatch?.[2] || '') ||
    `frequencia_${params.ano}_${params.mes}.${params.formato}`;

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export const frequenciaService = {
  listarPorMes: listarFrequenciaPorMes,
  baixarFrequenciaArquivo,
};

export default frequenciaService;
