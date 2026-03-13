import { API_BASE_URL } from '../config/api';

export type FormatoExportacaoFrequencia = 'docx' | 'pdf' | 'csv';

export type FrequenciaDiaItem = {
  dia: number;
  data?: string;
  dataIso?: string;
  diaSemana?: string;
  weekdayLabel?: string;
  rubrica?: string;
  referencia?: string;
  ocorrencia1?: string;
  ocorrencia2?: string;
  ocorrenciaManha?: string;
  ocorrenciaTarde?: string;
  statusFinal?: string;
  status?: string;
  titulo?: string;
  descricao?: string;
  observacoes?: string[];
};

export type FrequenciaServidorItem = {
  id?: string;
  servidor?: string;
  cpf: string;
  matricula?: string;
  nome: string;
  cargo?: string;
  categoria?: string;
  setor?: string;
  status?: string;
  chDiaria?: string;
  chSemanal?: string;
  dias: FrequenciaDiaItem[];
};

export type ListarFrequenciaPayload = {
  ano: number;
  mes: number;
  categoria?: string;
  setor?: string;
  status?: string;
  busca?: string;
};

export type ExportarFrequenciaPayload = {
  ano: number;
  mes: number;
  formato?: FormatoExportacaoFrequencia;
  servidorCpf?: string;
  servidorId?: string;
  categoria?: string;
  setor?: string;
  status?: string;
  incluirPontoFacultativo?: boolean;
};

export type FrequenciaOcorrenciaPayload = Record<string, unknown>;

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

function asNumber(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
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

function normalizeObservacoes(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }

  const text = asString(value);
  return text ? [text] : [];
}

function normalizeDiaItem(raw: unknown): FrequenciaDiaItem | null {
  if (!isObject(raw)) return null;

  const dia =
    asNumber(raw.dia) ??
    asNumber(raw.day) ??
    asNumber(raw.numero) ??
    asNumber(raw.index);

  if (!dia || dia <= 0) return null;

  const dataIso =
    asString(raw.dataIso) ||
    asString(raw.data) ||
    asString(raw.date);

  const weekdayLabel =
    asString(raw.weekdayLabel) ||
    asString(raw.diaSemana) ||
    asString(raw.weekday);

  const rubrica =
    asString(raw.rubrica) ||
    asString(raw.rubricaServidor) ||
    asString(raw.situacao);

  const referencia =
    asString(raw.referencia) ||
    asString(raw.t) ||
    weekdayLabel;

  const ocorrencia1 =
    asString(raw.ocorrencia1) ||
    asString(raw.o1) ||
    asString(raw.turno1) ||
    asString(raw.ocorrenciaManha);

  const ocorrencia2 =
    asString(raw.ocorrencia2) ||
    asString(raw.o2) ||
    asString(raw.turno2) ||
    asString(raw.ocorrenciaTarde);

  const statusFinal =
    asString(raw.statusFinal) ||
    asString(raw.status) ||
    asString(raw.finalStatus) ||
    rubrica ||
    [ocorrencia1, ocorrencia2].filter(Boolean).join(' | ');

  const observacoes = normalizeObservacoes(
    raw.observacoes ?? raw.avisos ?? raw.notes ?? raw.descricao,
  );

  return {
    dia,
    data: dataIso,
    dataIso,
    diaSemana: weekdayLabel,
    weekdayLabel,
    rubrica,
    referencia,
    ocorrencia1,
    ocorrencia2,
    ocorrenciaManha: ocorrencia1,
    ocorrenciaTarde: ocorrencia2,
    statusFinal,
    status: statusFinal,
    titulo: asString(raw.titulo),
    descricao: asString(raw.descricao),
    observacoes,
  };
}

function normalizeServidorItem(raw: unknown): FrequenciaServidorItem | null {
  if (!isObject(raw)) return null;

  const diasRaw =
    raw.dias ??
    raw.dayItems ??
    raw.items ??
    raw.ocorrencias ??
    raw.registros ??
    raw.days ??
    [];

  const dias = asArray(diasRaw)
    .map(normalizeDiaItem)
    .filter((item): item is FrequenciaDiaItem => Boolean(item));

  const cpf = asString(raw.cpf ?? raw.servidor_cpf ?? raw.documento);
  const nome = asString(raw.nome ?? raw.nomeCompleto ?? raw.servidor_nome);

  if (!cpf && !nome) return null;

  return {
    id: asString(raw.id ?? raw.servidor ?? raw.servidorId ?? raw.uuid),
    servidor: asString(raw.servidor ?? raw.id ?? raw.uuid),
    cpf,
    matricula: asString(raw.matricula ?? raw.registration),
    nome: nome || 'Servidor sem nome',
    cargo: asString(raw.cargo ?? raw.funcao),
    categoria: asString(raw.categoria ?? raw.category),
    setor: asString(raw.setor ?? raw.lotacao),
    status: asString(raw.status),
    chDiaria: asString(raw.chDiaria ?? raw.ch_diaria ?? raw.cargaHorariaDiaria),
    chSemanal: asString(raw.chSemanal ?? raw.ch_semanal ?? raw.cargaHorariaSemanal),
    dias,
  };
}

function normalizeListResponse(payload: JsonValue): FrequenciaServidorItem[] {
  const items = extractArrayPayload(payload);

  return items
    .map(normalizeServidorItem)
    .filter((item): item is FrequenciaServidorItem => Boolean(item));
}

export async function listarPorMes(ano: number, mes: number): Promise<FrequenciaServidorItem[]> {
  const safeAno = sanitizeAno(ano);
  const safeMes = sanitizeMes(mes);

  const payload = await httpJson<JsonValue>(
    `${FREQUENCIA_URL}?ano=${safeAno}&mes=${safeMes}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  );

  return normalizeListResponse(payload);
}

export async function listarFrequenciaPorMes(
  payload: ListarFrequenciaPayload,
): Promise<FrequenciaServidorItem[]> {
  const safeAno = sanitizeAno(payload.ano);
  const safeMes = sanitizeMes(payload.mes);

  const query = new URLSearchParams();
  query.set('ano', String(safeAno));
  query.set('mes', String(safeMes));

  if (payload.categoria) query.set('categoria', payload.categoria);
  if (payload.setor) query.set('setor', payload.setor);
  if (payload.status) query.set('status', payload.status);
  if (payload.busca) query.set('busca', payload.busca);

  const response = await httpJson<JsonValue>(`${FREQUENCIA_URL}?${query.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  return normalizeListResponse(response);
}

export async function registrarOcorrencia(payload: FrequenciaOcorrenciaPayload): Promise<unknown> {
  return httpJson(FREQUENCIA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function editar(
  id: string,
  payload: Partial<FrequenciaOcorrenciaPayload>,
): Promise<unknown> {
  return httpJson(`${FREQUENCIA_URL}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
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
  payload: ExportarFrequenciaPayload,
): Promise<Response | null> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept:
          payload.formato === 'pdf'
            ? 'application/pdf, application/json, */*'
            : payload.formato === 'docx'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/json, */*'
            : 'text/csv, application/json, */*',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return null;
    }

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

async function extractExportError(response: Response): Promise<string> {
  const body = await parseResponse(response);

  if (isObject(body)) {
    const message = asString(body.error) || asString(body.message) || asString(body.details);
    if (message) return message;
  }

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  return 'Não foi possível exportar a frequência neste momento.';
}

async function baixarBlobResponse(response: Response, fallbackName: string): Promise<void> {
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

export async function baixarFrequenciaArquivo(payload: ExportarFrequenciaPayload): Promise<void> {
  const safePayload: ExportarFrequenciaPayload = {
    ...payload,
    ano: sanitizeAno(payload.ano),
    mes: sanitizeMes(payload.mes),
    formato: payload.formato || 'docx',
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

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    throw new Error(await extractExportError(response));
  }

  await baixarBlobResponse(response, fallbackName);
}

export async function exportarFrequenciaArquivo(
  payload: Omit<ExportarFrequenciaPayload, 'formato'>,
  formato: 'docx' | 'pdf',
): Promise<void> {
  return baixarFrequenciaArquivo({
    ...payload,
    formato,
  });
}

export async function exportarDocx(
  payload: Omit<ExportarFrequenciaPayload, 'formato'>,
): Promise<void> {
  return baixarFrequenciaArquivo({ ...payload, formato: 'docx' });
}

export async function exportarPdf(
  payload: Omit<ExportarFrequenciaPayload, 'formato'>,
): Promise<void> {
  return baixarFrequenciaArquivo({ ...payload, formato: 'pdf' });
}

export async function exportarCsv(
  payload: Omit<ExportarFrequenciaPayload, 'formato'>,
): Promise<void> {
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
        csvEscape(dia.dataIso || dia.data),
        csvEscape(dia.weekdayLabel || dia.diaSemana),
        csvEscape(dia.statusFinal || dia.status),
        csvEscape(dia.rubrica),
        csvEscape(dia.referencia),
        csvEscape(dia.ocorrenciaManha || dia.ocorrencia1),
        csvEscape(dia.ocorrenciaTarde || dia.ocorrencia2),
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
  listarFrequenciaPorMes,
  registrarOcorrencia,
  editar,
  excluir,
  baixarFrequenciaArquivo,
  exportarFrequenciaArquivo,
  exportarDocx,
  exportarPdf,
  exportarCsv,
  baixarCsvLocalFrequencia,
  getFrequenciaServiceErrorMessage,
};

export default frequenciaService;
