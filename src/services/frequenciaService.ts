import { API_BASE_URL } from '../config/api';
import type {
  FrequenciaExportFormat,
  FrequenciaExportMode,
  FrequenciaExportPayload as FrequenciaExportPayloadType,
  FrequenciaExportScope,
} from '../types/frequencia';

export type FrequenciaFormatoExportacao = FrequenciaExportFormat;
export type ModoExportacaoFrequencia = FrequenciaExportMode;
export type EscopoExportacaoFrequencia = FrequenciaExportScope;

export type FrequenciaSourceFlags = {
  isWeekend?: boolean;
  isHoliday?: boolean;
  isFacultativo?: boolean;
  isFerias?: boolean;
  hasAtestado?: boolean;
  hasFalta?: boolean;
  hasEvento?: boolean;
};

export type FrequenciaTurno = {
  rubrica: string;
  ocorrencia: string;
  entrada?: string;
  saida?: string;
  abono?: string;
};

export type FrequenciaDayItem = {
  dia: number;
  data: string;
  turno1: FrequenciaTurno;
  turno2: FrequenciaTurno;
  statusFinal?: string;
  sourceFlags?: FrequenciaSourceFlags;
  sourceMeta?: Record<string, unknown>;
};

export type FrequenciaServidor = {
  id?: string | number;
  nome: string;
  cpf?: string;
  matricula?: string;
  categoria?: string;
  cargo?: string;
  setor?: string;
  unidade?: string;
  lotacao?: string;
  status?: string;
  chDiaria?: string;
  chSemanal?: string;
};

export type FrequenciaMensalItem = {
  servidor: FrequenciaServidor;
  mes: number;
  ano: number;
  totalDiasMes: number;
  dayItems: FrequenciaDayItem[];
  templateData?: Record<string, unknown>;
};

export type FrequenciaMensalResponse = {
  ok: boolean;
  data: FrequenciaMensalItem[];
  meta?: {
    ano?: number;
    mes?: number;
    totalServidores?: number;
  };
};

export type FrequenciaFiltros = {
  ano: number;
  mes: number;
  cpf?: string;
  categoria?: string;
  setor?: string;
  status?: string;
};

export type FrequenciaExportPayload = FrequenciaExportPayloadType;

function getBaseUrl(): string {
  return String(API_BASE_URL || '').replace(/\/+$/, '');
}

function onlyDigits(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

function safeString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function extractArrayPayload(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload;

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;

    if (Array.isArray(obj.data)) return obj.data as any[];
    if (Array.isArray(obj.items)) return obj.items as any[];
    if (Array.isArray(obj.rows)) return obj.rows as any[];
    if (Array.isArray(obj.registros)) return obj.registros as any[];
    if (Array.isArray(obj.servidores)) return obj.servidores as any[];
    if (Array.isArray(obj.frequencias)) return obj.frequencias as any[];

    if (obj.data && typeof obj.data === 'object') {
      const data = obj.data as Record<string, unknown>;

      if (Array.isArray(data.data)) return data.data as any[];
      if (Array.isArray(data.items)) return data.items as any[];
      if (Array.isArray(data.rows)) return data.rows as any[];
      if (Array.isArray(data.registros)) return data.registros as any[];
    }
  }

  return [];
}

function normalizeTurno(raw: any): FrequenciaTurno {
  return {
    rubrica: safeString(raw?.rubrica),
    ocorrencia: safeString(raw?.ocorrencia),
    entrada: safeString(raw?.entrada),
    saida: safeString(raw?.saida),
    abono: safeString(raw?.abono),
  };
}

function normalizeDayItem(raw: any): FrequenciaDayItem {
  return {
    dia: Number(raw?.dia || 0),
    data: safeString(raw?.data || raw?.dataIso),
    turno1: normalizeTurno(raw?.turno1),
    turno2: normalizeTurno(raw?.turno2),
    statusFinal: safeString(raw?.statusFinal ?? raw?.finalStatus),
    sourceFlags: raw?.sourceFlags || {},
    sourceMeta: raw?.sourceMeta || {},
  };
}

function normalizeServidor(raw: any): FrequenciaServidor {
  const cpf = onlyDigits(raw?.cpf ?? raw?.servidor_cpf ?? raw?.cpf_servidor ?? raw?.documento);

  const id =
    raw?.id ??
    raw?.servidor ??
    raw?.uuid ??
    raw?.servidor_id ??
    raw?.employee_id ??
    cpf ??
    raw?.matricula ??
    '';

  return {
    id,
    nome: safeString(
      raw?.nome ?? raw?.nome_completo ?? raw?.servidor_nome ?? raw?.full_name ?? raw?.name,
      'Servidor sem nome'
    ),
    cpf,
    matricula: safeString(raw?.matricula ?? raw?.registro ?? raw?.mat),
    categoria: safeString(raw?.categoria ?? raw?.categoria_canonica ?? raw?.categoria_canonic),
    cargo: safeString(raw?.cargo ?? raw?.funcao ?? raw?.role),
    setor: safeString(raw?.setor ?? raw?.departamento),
    unidade: safeString(raw?.unidade ?? raw?.orgao ?? raw?.secretaria),
    lotacao: safeString(raw?.lotacao ?? raw?.setor ?? raw?.departamento),
    status: safeString(raw?.status ?? raw?.situacao, 'ATIVO'),
    chDiaria: safeString(raw?.chDiaria ?? raw?.ch_diaria),
    chSemanal: safeString(raw?.chSemanal ?? raw?.ch_semanal),
  };
}

function normalizeItem(raw: any): FrequenciaMensalItem {
  const dayItemsRaw = Array.isArray(raw?.dayItems) ? raw.dayItems : [];

  return {
    servidor: normalizeServidor(raw?.servidor || raw),
    mes: Number(raw?.mes || 0),
    ano: Number(raw?.ano || 0),
    totalDiasMes: Number(raw?.totalDiasMes || dayItemsRaw.length || 0),
    dayItems: dayItemsRaw.map(normalizeDayItem),
    templateData:
      raw?.templateData && typeof raw.templateData === 'object'
        ? raw.templateData
        : undefined,
  };
}

function monthLabel(month: number): string {
  const months = [
    '',
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ];
  return months[month] || String(month);
}

function slugify(value: string): string {
  return safeString(value, 'servidor')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getFriendlyFileName(
  servidor: FrequenciaServidor,
  ano: number,
  mes: number,
  formato: FrequenciaFormatoExportacao
): string {
  const nome = slugify(servidor?.nome || 'servidor');
  const yyyy = String(ano).padStart(4, '0');
  const mm = String(mes).padStart(2, '0');
  return `frequencia_${nome}_${yyyy}_${mm}.${formato}`;
}

function parseErrorMessage(payload: any, fallback: string): string {
  return safeString(payload?.details ?? payload?.error ?? payload?.message, fallback);
}

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : '';
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

function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function buildCsvContent(item: FrequenciaMensalItem): string {
  const headers = [
    'Dia',
    'Data',
    'Rubrica Turno 1',
    'Ocorrência Turno 1',
    'Rubrica Turno 2',
    'Ocorrência Turno 2',
    'Status Final',
  ];

  const lines = [headers];

  item.dayItems.forEach((day) => {
    lines.push([
      String(day.dia),
      safeString(day.data),
      safeString(day.turno1?.rubrica),
      safeString(day.turno1?.ocorrencia),
      safeString(day.turno2?.rubrica),
      safeString(day.turno2?.ocorrencia),
      safeString(day.statusFinal),
    ]);
  });

  const csv = lines
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');

  return `\uFEFF${csv}`;
}

function findMatchingItem(
  data: FrequenciaMensalItem[],
  payload: {
    servidorId?: string | number;
    servidorCpf?: string;
  }
): FrequenciaMensalItem | null {
  if (!Array.isArray(data) || !data.length) return null;

  const cpf = onlyDigits(payload.servidorCpf);

  const found =
    data.find((row) => {
      const sameCpf = cpf && onlyDigits(row.servidor?.cpf) === cpf;
      const sameId =
        payload.servidorId !== undefined &&
        String(row.servidor?.id ?? '') === String(payload.servidorId);
      return Boolean(sameCpf || sameId);
    }) || null;

  return found || data[0] || null;
}

function normalizeExportPayload(payload: FrequenciaExportPayload): FrequenciaExportPayload {
  return {
    ...payload,
    modoExportacao: payload.modoExportacao || 'individual',
    escopoExportacao:
      payload.escopoExportacao ||
      (payload.modoExportacao === 'lote' ? 'filtros_atuais' : 'servidor_selecionado'),
    servidorCpf: payload.servidorCpf ? onlyDigits(payload.servidorCpf) : undefined,
    servidoresCpf: Array.isArray(payload.servidoresCpf)
      ? payload.servidoresCpf.map(onlyDigits).filter(Boolean)
      : undefined,
    servidoresIds: Array.isArray(payload.servidoresIds)
      ? payload.servidoresIds.filter((item) => item !== undefined && item !== null && `${item}` !== '')
      : undefined,
  };
}

export async function listarFrequenciaMensal(
  filtros: FrequenciaFiltros
): Promise<FrequenciaMensalResponse> {
  const baseUrl = getBaseUrl();
  const query = buildQuery({
    ano: filtros.ano,
    mes: filtros.mes,
    cpf: filtros.cpf,
    categoria: filtros.categoria,
    setor: filtros.setor,
    status: filtros.status,
  });

  const response = await fetch(`${baseUrl}/api/frequencia${query}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const payload = await safeJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(payload, 'Não foi possível carregar a frequência.'));
  }

  const rows = extractArrayPayload(payload).map(normalizeItem);

  return {
    ok: true,
    data: rows,
    meta:
      payload?.meta && typeof payload.meta === 'object'
        ? payload.meta
        : payload?.data?.meta && typeof payload.data.meta === 'object'
        ? payload.data.meta
        : {
            ano: filtros.ano,
            mes: filtros.mes,
            totalServidores: rows.length,
          },
  };
}

export async function baixarFrequenciaArquivo(
  rawPayload: FrequenciaExportPayload,
  servidor?: FrequenciaServidor
): Promise<void> {
  const payload = normalizeExportPayload(rawPayload);
  const baseUrl = getBaseUrl();

  if (!payload.ano || !payload.mes) {
    throw new Error('Ano e mês são obrigatórios para exportar a frequência.');
  }

  if (payload.formato === 'csv') {
    if (!payload.servidorId && !payload.servidorCpf) {
      throw new Error('Selecione um servidor antes de exportar o CSV.');
    }

    const result = await listarFrequenciaMensal({
      ano: payload.ano,
      mes: payload.mes,
      cpf: payload.servidorCpf,
      categoria: payload.categoria,
      setor: payload.setor,
      status: payload.status,
    });

    const item = findMatchingItem(result.data, {
      servidorId: payload.servidorId,
      servidorCpf: payload.servidorCpf,
    });

    if (!item) {
      throw new Error('Não foi possível gerar o CSV da frequência.');
    }

    const csvContent = buildCsvContent(item);
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    triggerBrowserDownload(
      blob,
      getFriendlyFileName(item.servidor, payload.ano, payload.mes, 'csv')
    );

    return;
  }

  if (
    payload.modoExportacao !== 'lote' &&
    !payload.servidorId &&
    !payload.servidorCpf
  ) {
    throw new Error('Selecione um servidor antes de exportar.');
  }

  const acceptHeader =
    payload.formato === 'pdf'
      ? 'application/pdf,application/zip,application/json'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,application/json';

  const response = await fetch(`${baseUrl}/api/frequencia/exportar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: acceptHeader,
    },
    body: JSON.stringify({
      ano: payload.ano,
      mes: payload.mes,
      servidorId: payload.servidorId,
      servidorCpf: payload.servidorCpf,
      categoria: payload.categoria,
      setor: payload.setor,
      status: payload.status,
      formato: payload.formato,
      modoExportacao: payload.modoExportacao,
      escopoExportacao: payload.escopoExportacao,
      apenasAtivos: payload.apenasAtivos,
      usarFiltrosAtuais: payload.usarFiltrosAtuais,
      servidoresCpf: payload.servidoresCpf,
      servidoresIds: payload.servidoresIds,
    }),
  });

  if (!response.ok) {
    const errorPayload = await safeJson(response);
    throw new Error(
      parseErrorMessage(
        errorPayload,
        `Não foi possível exportar a frequência em ${payload.formato.toUpperCase()}.`
      )
    );
  }

  const blob = await response.blob();

  const fallbackServidor = servidor || { nome: 'servidor' };
  let fileName = getFriendlyFileName(
    fallbackServidor,
    payload.ano,
    payload.mes,
    payload.formato
  );

  const disposition = response.headers.get('Content-Disposition');
  const match =
    disposition?.match(/filename\*=UTF-8''([^;]+)/i) ||
    disposition?.match(/filename="([^"]+)"/i);

  if (match?.[1]) {
    fileName = decodeURIComponent(match[1]);
  } else if (response.headers.get('Content-Type')?.includes('application/zip')) {
    fileName = `frequencias_${payload.ano}_${String(payload.mes).padStart(2, '0')}.zip`;
  }

  triggerBrowserDownload(blob, fileName);
}

export function buildResumoFrequencia(item: FrequenciaMensalItem) {
  const resumo = {
    totalDias: item.totalDiasMes || item.dayItems.length,
    finsDeSemana: 0,
    feriados: 0,
    facultativos: 0,
    ferias: 0,
    atestados: 0,
    faltas: 0,
  };

  item.dayItems.forEach((day) => {
    if (day.sourceFlags?.isWeekend) resumo.finsDeSemana += 1;
    if (day.sourceFlags?.isHoliday) resumo.feriados += 1;
    if (day.sourceFlags?.isFacultativo) resumo.facultativos += 1;
    if (day.sourceFlags?.isFerias) resumo.ferias += 1;
    if (day.sourceFlags?.hasAtestado) resumo.atestados += 1;
    if (day.sourceFlags?.hasFalta) resumo.faltas += 1;
  });

  return resumo;
}

export function getCompetenciaLabel(ano: number, mes: number): string {
  return `${monthLabel(mes)} de ${ano}`;
}

export const frequenciaService = {
  listarFrequenciaMensal,
  baixarFrequenciaArquivo,
  buildResumoFrequencia,
  getCompetenciaLabel,
};

export default frequenciaService;
