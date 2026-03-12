import { API_BASE_URL } from '../config/api';

type Nullable<T> = T | null | undefined;

export type StatusConsolidadoDia =
  | 'NORMAL'
  | 'SABADO'
  | 'DOMINGO'
  | 'FERIADO'
  | 'FERIAS'
  | 'ATESTADO'
  | 'FALTA'
  | 'PONTO_FACULTATIVO'
  | 'MANUAL';

export interface ServidorFrequencia {
  id?: string;
  servidor?: string;
  uuid?: string;
  servidor_id?: string;
  nome?: string;
  nomeCompleto?: string;
  nome_completo?: string;
  cpf?: string;
  matricula?: string;
  categoria?: string;
  setor?: string;
  cargo?: string;
  chDiaria?: string | number | null;
  ch_diaria?: string | number | null;
  chSemanal?: string | number | null;
  ch_semanal?: string | number | null;
  status?: string;
  [key: string]: any;
}

export interface DayMapItem {
  dia: number;
  dataISO: string;
  weekday: number;
  weekdayLabel: string;
  isSaturday: boolean;
  isSunday: boolean;
  isHoliday: boolean;
  isPontoFacultativo: boolean;
  isVacation: boolean;
  isAtestado: boolean;
  isFalta: boolean;
  rubrica: string;
  rubrica1: string;
  rubrica2: string;
  ocorrencia1: string;
  ocorrencia2: string;
  observacoes: string;
  finalStatus: StatusConsolidadoDia;
  conflitos: string[];
  avisos: string[];
  fontes: {
    evento?: any | null;
    ponto?: any | null;
    ferias?: any | null;
    atestado?: any | null;
    falta?: any | null;
    manual?: any | null;
  };
}

export type DayMap = Record<number, DayMapItem>;

export interface ConsolidarFrequenciaOptions {
  servidor: ServidorFrequencia;
  mes: number;
  ano: number;
  incluirPontoFacultativo?: boolean;
  faltaVaiParaRubrica?: boolean;
}

export interface ConsolidacaoFrequenciaResult {
  servidor: NormalizedServidor;
  ano: number;
  mes: number;
  totalDiasMes: number;
  hiddenRowsFrom: number;
  hiddenRowsTo: number;
  dayMap: DayMap;
  templateData: Record<string, string | boolean | number>;
  warnings: string[];
}

export interface FrequenciaExportPayload {
  templateData: Record<string, string | boolean | number>;
  formato: 'docx' | 'pdf';
  outputFileName: string;
  removerLinhasExcedentes: boolean;
  metadata: {
    servidor: NormalizedServidor;
    ano: number;
    mes: number;
    totalDiasMes: number;
    hiddenRowsFrom: number;
    hiddenRowsTo: number;
  };
}

interface NormalizedServidor {
  id: string;
  cpf: string;
  nome: string;
  matricula: string;
  categoria: string;
  setor: string;
  cargo: string;
  chDiaria: string;
  chSemanal: string;
  status: string;
}

interface BackendServidorShape {
  id?: string;
  uuid?: string;
  servidor?: string;
  servidor_id?: string;
  nome?: string;
  nomeCompleto?: string;
  nome_completo?: string;
  cpf?: string;
  matricula?: string;
  cargo?: string;
  categoria?: string;
  setor?: string;
  status?: string;
  chDiaria?: string | number | null;
  ch_diaria?: string | number | null;
  chSemanal?: string | number | null;
  ch_semanal?: string | number | null;
}

interface BackendOcorrenciaItem {
  id?: string | number;
  tipo?: string;
  turno?: string;
  observacao?: string;
  observacoes?: string;
  descricao?: string;
  texto?: string;
  detalhe?: string;
  nome?: string;
  titulo?: string;
}

interface BackendEventoItem {
  id?: string | number;
  tipo?: string;
  titulo?: string;
  nome?: string;
  descricao?: string;
  observacao?: string;
}

interface BackendDiaItem {
  dia?: number | string;
  data?: string;
  dataISO?: string;
  ocorrencias?: BackendOcorrenciaItem[] | any;
  eventos?: BackendEventoItem[] | any;
  ferias?: boolean | string | number | any;
  atestado?: boolean | string | number | any;
  falta?: boolean | string | number | any;
  pontoFacultativo?: boolean | string | number | any;
  feriado?: boolean | string | number | any;
  rubrica?: string;
  rubrica1?: string;
  rubrica2?: string;
  ocorrencia1?: string;
  ocorrencia2?: string;
  observacoes?: string;
  observacao?: string;
}

interface BackendServidorItem {
  servidor?: BackendServidorShape | null;
  dias?: BackendDiaItem[] | any;
  dayMap?: Record<string, BackendDiaItem> | BackendDiaItem[] | any;
  id?: string;
  uuid?: string;
  servidor_id?: string;
  cpf?: string;
  nome?: string;
  matricula?: string;
  categoria?: string;
  setor?: string;
  cargo?: string;
  status?: string;
}

const WEEKDAY_LABELS = [
  'DOMINGO',
  'SEGUNDA-FEIRA',
  'TERÇA-FEIRA',
  'QUARTA-FEIRA',
  'QUINTA-FEIRA',
  'SEXTA-FEIRA',
  'SÁBADO'
];

function normalizeBaseUrl(url: string): string {
  return String(url ?? '').replace(/\/+$/, '');
}

function onlyDigits(value: Nullable<string | number>): string {
  return String(value ?? '').replace(/\D+/g, '');
}

function normalizeSpaces(value: any): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function safeUpper(value: any): string {
  return normalizeSpaces(value).toUpperCase();
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function monthNamePtBr(month: number): string {
  const names = [
    '',
    'JANEIRO',
    'FEVEREIRO',
    'MARÇO',
    'ABRIL',
    'MAIO',
    'JUNHO',
    'JULHO',
    'AGOSTO',
    'SETEMBRO',
    'OUTUBRO',
    'NOVEMBRO',
    'DEZEMBRO'
  ];

  return names[month] || String(month);
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function asArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function safeObjectValues<T = any>(value: any): T[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  try {
    return Object.values(value) as T[];
  } catch {
    return [];
  }
}

function toFiniteNumber(value: any, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isTruthyLike(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  const normalized = safeUpper(value);
  return ['1', 'SIM', 'TRUE', 'VERDADEIRO', 'YES', 'Y'].includes(normalized);
}

function firstBy<T>(items: T[] | any, predicate: (item: T) => boolean): T | null {
  const list = asArray<T>(items);
  for (const item of list) {
    if (predicate(item)) return item;
  }
  return null;
}

function normalizeServidor(input: ServidorFrequencia): NormalizedServidor {
  const id = normalizeSpaces(
    input.id || input.servidor || input.uuid || input.servidor_id || input.cpf
  );
  const cpf = onlyDigits(input.cpf);
  const nome = normalizeSpaces(input.nomeCompleto || input.nome_completo || input.nome);
  const matricula = normalizeSpaces(input.matricula);
  const categoria = normalizeSpaces(input.categoria);
  const setor = normalizeSpaces(input.setor);
  const cargo = normalizeSpaces(input.cargo);
  const chDiaria = normalizeSpaces(input.chDiaria ?? input.ch_diaria);
  const chSemanal = normalizeSpaces(input.chSemanal ?? input.ch_semanal);
  const status = normalizeSpaces(input.status || 'ATIVO');

  if (!cpf) throw new Error('Servidor sem CPF válido para consolidar frequência.');
  if (!nome) throw new Error('Servidor sem nome válido para consolidar frequência.');

  return {
    id: id || cpf,
    cpf,
    nome,
    matricula,
    categoria,
    setor,
    cargo,
    chDiaria,
    chSemanal,
    status
  };
}

function normalizeIsoDate(value: Nullable<string>): string | null {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const slash = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) {
    const [, dd, mm, yyyy] = slash;
    return `${yyyy}-${mm}-${dd}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
}

function createEmptyDayMap(year: number, month: number): DayMap {
  const totalDiasMes = getLastDayOfMonth(year, month);
  const result: DayMap = {};

  for (let dia = 1; dia <= totalDiasMes; dia += 1) {
    const date = new Date(year, month - 1, dia);
    const weekday = date.getDay();
    const isSaturday = weekday === 6;
    const isSunday = weekday === 0;
    const dataISO = `${year}-${pad2(month)}-${pad2(dia)}`;

    result[dia] = {
      dia,
      dataISO,
      weekday,
      weekdayLabel: WEEKDAY_LABELS[weekday],
      isSaturday,
      isSunday,
      isHoliday: false,
      isPontoFacultativo: false,
      isVacation: false,
      isAtestado: false,
      isFalta: false,
      rubrica: '',
      rubrica1: '',
      rubrica2: '',
      ocorrencia1: '',
      ocorrencia2: '',
      observacoes: '',
      finalStatus: isSaturday ? 'SABADO' : isSunday ? 'DOMINGO' : 'NORMAL',
      conflitos: [],
      avisos: [],
      fontes: {}
    };
  }

  return result;
}

function statusToRubrica(status: StatusConsolidadoDia): string {
  switch (status) {
    case 'SABADO':
      return 'SÁBADO';
    case 'DOMINGO':
      return 'DOMINGO';
    case 'FERIADO':
      return 'FERIADO';
    case 'FERIAS':
      return 'FÉRIAS';
    case 'ATESTADO':
      return 'ATESTADO';
    case 'PONTO_FACULTATIVO':
      return 'PONTO FACULTATIVO';
    case 'FALTA':
      return 'FALTA';
    default:
      return '';
  }
}

function buildTemplateData(
  servidor: NormalizedServidor,
  ano: number,
  mes: number,
  dayMap: DayMap
): Record<string, string | boolean | number> {
  const totalDiasMes = getLastDayOfMonth(ano, mes);

  const data: Record<string, string | boolean | number> = {
    NOME: servidor.nome,
    MATRICULA: servidor.matricula,
    CATEGORIA: servidor.categoria,
    CPF: servidor.cpf,
    CARGO: servidor.cargo,
    CH_DIARIA: servidor.chDiaria ? `CH_DIARIA: ${servidor.chDiaria}` : '',
    CH_SEMANAL: servidor.chSemanal ? `CH_SEMANAL: ${servidor.chSemanal}` : '',
    MES: monthNamePtBr(mes),
    ANO: String(ano),
    SETOR: servidor.setor || '',
    NOME_COMPLETO: servidor.nome,
    C_H_DIARIA: servidor.chDiaria || '',
    C_H_SEMANAL: servidor.chSemanal || '',
    LAST_DAY: totalDiasMes,
    HIDDEN_ROWS_FROM: totalDiasMes < 31 ? totalDiasMes + 1 : '',
    HIDDEN_ROWS_TO: totalDiasMes < 31 ? 31 : '',
    HAS_EXCESS_ROWS: totalDiasMes < 31
  };

  for (let dia = 1; dia <= 31; dia += 1) {
    const item = dayMap[dia];

    if (item) {
      data[`D${dia}`] = String(dia);
      data[`T${dia}`] = item.weekdayLabel;
      data[`S${dia}`] = item.rubrica;
      data[`R1_${dia}`] = item.rubrica1;
      data[`R2_${dia}`] = item.rubrica2;
      data[`O1_${dia}`] = item.ocorrencia1;
      data[`O2_${dia}`] = item.ocorrencia2;
      data[`OBS_${dia}`] = item.observacoes;
      data[`SHOW_ROW_${dia}`] = true;
      data[`VIS_${dia}`] = true;
    } else {
      data[`D${dia}`] = '';
      data[`T${dia}`] = '';
      data[`S${dia}`] = '';
      data[`R1_${dia}`] = '';
      data[`R2_${dia}`] = '';
      data[`O1_${dia}`] = '';
      data[`O2_${dia}`] = '';
      data[`OBS_${dia}`] = '';
      data[`SHOW_ROW_${dia}`] = false;
      data[`VIS_${dia}`] = false;
    }
  }

  return data;
}

function parseApiError(payload: any, fallback: string): string {
  if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error.trim();
  if (typeof payload?.details === 'string' && payload.details.trim()) return payload.details.trim();
  if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message.trim();
  if (typeof payload === 'string' && payload.trim()) return payload.trim();
  return fallback;
}

function extractServidorShape(item: BackendServidorItem | any): BackendServidorShape {
  const nested = item?.servidor ?? {};
  return {
    id: normalizeSpaces(
      nested?.id || nested?.uuid || nested?.servidor || nested?.servidor_id || item?.id || item?.uuid || item?.servidor || item?.servidor_id
    ),
    uuid: normalizeSpaces(nested?.uuid || item?.uuid),
    servidor: normalizeSpaces(nested?.servidor || item?.servidor),
    servidor_id: normalizeSpaces(nested?.servidor_id || item?.servidor_id),
    nome: normalizeSpaces(
      nested?.nome || nested?.nomeCompleto || nested?.nome_completo || item?.nome || item?.nomeCompleto || item?.nome_completo
    ),
    cpf: onlyDigits(nested?.cpf || item?.cpf),
    matricula: normalizeSpaces(nested?.matricula || item?.matricula),
    cargo: normalizeSpaces(nested?.cargo || item?.cargo),
    categoria: normalizeSpaces(nested?.categoria || item?.categoria),
    setor: normalizeSpaces(nested?.setor || item?.setor),
    status: normalizeSpaces(nested?.status || item?.status),
    chDiaria: nested?.chDiaria ?? nested?.ch_diaria ?? item?.chDiaria ?? item?.ch_diaria ?? '',
    ch_diaria: nested?.ch_diaria ?? item?.ch_diaria ?? '',
    chSemanal: nested?.chSemanal ?? nested?.ch_semanal ?? item?.chSemanal ?? item?.ch_semanal ?? '',
    ch_semanal: nested?.ch_semanal ?? item?.ch_semanal ?? ''
  };
}

function choosePrimaryBackendItem(
  data: BackendServidorItem[] | any,
  servidor: NormalizedServidor
): BackendServidorItem | null {
  const list = asArray<BackendServidorItem>(data);
  if (list.length === 0) return null;

  const cpfDigits = onlyDigits(servidor.cpf);
  const id = normalizeSpaces(servidor.id);
  const matricula = normalizeSpaces(servidor.matricula);

  for (const item of list) {
    const extracted = extractServidorShape(item);

    if (cpfDigits && onlyDigits(extracted.cpf) === cpfDigits) {
      return item;
    }

    if (id) {
      const candidateIds = [
        normalizeSpaces(extracted.id),
        normalizeSpaces(extracted.uuid),
        normalizeSpaces(extracted.servidor),
        normalizeSpaces(extracted.servidor_id)
      ].filter(Boolean);

      if (candidateIds.includes(id)) {
        return item;
      }
    }

    if (matricula && normalizeSpaces(extracted.matricula) === matricula) {
      return item;
    }
  }

  return list[0] || null;
}

function normalizeDiaItems(item: BackendServidorItem | any): BackendDiaItem[] {
  const directDias = asArray<BackendDiaItem>(item?.dias);
  if (directDias.length > 0) return directDias;

  const fromDayMapArray = asArray<BackendDiaItem>(item?.dayMap);
  if (fromDayMapArray.length > 0) return fromDayMapArray;

  const fromDayMapObject = safeObjectValues<BackendDiaItem>(item?.dayMap);
  if (fromDayMapObject.length > 0) return fromDayMapObject;

  return [];
}

function normalizeEventoTitulo(evento: BackendEventoItem | null): string {
  return normalizeSpaces(
    evento?.titulo || evento?.nome || evento?.descricao || evento?.observacao
  );
}

function normalizeOcorrenciaTexto(ocorrencia: BackendOcorrenciaItem | null): string {
  return normalizeSpaces(
    ocorrencia?.observacao ||
      ocorrencia?.observacoes ||
      ocorrencia?.descricao ||
      ocorrencia?.texto ||
      ocorrencia?.detalhe ||
      ocorrencia?.titulo ||
      ocorrencia?.nome
  );
}

function normalizeOcorrenciaTurno(ocorrencia: BackendOcorrenciaItem | null): string {
  return normalizeSpaces(ocorrencia?.turno);
}

function buildDayMapFromBackend(params: {
  ano: number;
  mes: number;
  item: BackendServidorItem;
  incluirPontoFacultativo: boolean;
  faltaVaiParaRubrica: boolean;
}) {
  const { ano, mes, item, incluirPontoFacultativo, faltaVaiParaRubrica } = params;

  const dayMap = createEmptyDayMap(ano, mes);
  const warnings: string[] = [];
  const dias = normalizeDiaItems(item);

  for (const diaRaw of dias) {
    const dia = toFiniteNumber(diaRaw?.dia, NaN);
    if (!Number.isFinite(dia) || !dayMap[dia]) continue;

    const atual = dayMap[dia];
    const ocorrencias = asArray<BackendOcorrenciaItem>(diaRaw?.ocorrencias);
    const eventos = asArray<BackendEventoItem>(diaRaw?.eventos);

    const falta =
      firstBy<BackendOcorrenciaItem>(ocorrencias, (o) => safeUpper(o?.tipo) === 'FALTA') || null;

    const atestado =
      firstBy<BackendOcorrenciaItem>(ocorrencias, (o) => safeUpper(o?.tipo) === 'ATESTADO') || null;

    const manual =
      firstBy<BackendOcorrenciaItem>(ocorrencias, (o) => {
        const tipo = safeUpper(o?.tipo);
        return Boolean(tipo) && tipo !== 'FALTA' && tipo !== 'ATESTADO';
      }) || null;

    const feriado =
      firstBy<BackendEventoItem>(eventos, (e) => safeUpper(e?.tipo) === 'FERIADO') || null;

    const ponto =
      firstBy<BackendEventoItem>(eventos, (e) => {
        const tipo = safeUpper(e?.tipo);
        return tipo === 'PONTO' || tipo === 'PONTO FACULTATIVO' || tipo === 'PONTO_FACULTATIVO';
      }) || null;

    const isVacation = Boolean(diaRaw?.ferias) && diaRaw?.ferias !== false || isTruthyLike(diaRaw?.ferias);
    const isAtestado = Boolean(atestado) || isTruthyLike(diaRaw?.atestado);
    const isHoliday = Boolean(feriado) || isTruthyLike(diaRaw?.feriado);
    const isPontoFacultativo =
      (Boolean(ponto) || isTruthyLike(diaRaw?.pontoFacultativo)) && incluirPontoFacultativo;
    const isFalta = Boolean(falta) || isTruthyLike(diaRaw?.falta);

    let finalStatus: StatusConsolidadoDia = atual.finalStatus;

    if (isVacation) {
      finalStatus = 'FERIAS';
    } else if (isAtestado) {
      finalStatus = 'ATESTADO';
    } else if (isHoliday) {
      finalStatus = 'FERIADO';
    } else if (isPontoFacultativo) {
      finalStatus = 'PONTO_FACULTATIVO';
    } else if (atual.isSunday) {
      finalStatus = 'DOMINGO';
    } else if (atual.isSaturday) {
      finalStatus = 'SABADO';
    } else if (isFalta) {
      finalStatus = 'FALTA';
    } else if (manual) {
      finalStatus = 'MANUAL';
    } else {
      finalStatus = 'NORMAL';
    }

    let rubrica = '';
    let rubrica1 = '';
    let rubrica2 = '';
    let ocorrencia1 = '';
    let ocorrencia2 = '';
    const observacoes: string[] = [];

    if (normalizeSpaces(diaRaw?.rubrica)) {
      rubrica = normalizeSpaces(diaRaw.rubrica);
      rubrica1 = normalizeSpaces(diaRaw?.rubrica1 || diaRaw?.rubrica || '');
      rubrica2 = normalizeSpaces(diaRaw?.rubrica2 || diaRaw?.rubrica || '');
    }

    if (normalizeSpaces(diaRaw?.ocorrencia1)) {
      ocorrencia1 = normalizeSpaces(diaRaw.ocorrencia1);
    }

    if (normalizeSpaces(diaRaw?.ocorrencia2)) {
      ocorrencia2 = normalizeSpaces(diaRaw.ocorrencia2);
    }

    if (
      !rubrica &&
      (finalStatus === 'SABADO' ||
        finalStatus === 'DOMINGO' ||
        finalStatus === 'FERIADO' ||
        finalStatus === 'FERIAS' ||
        finalStatus === 'ATESTADO' ||
        finalStatus === 'PONTO_FACULTATIVO')
    ) {
      rubrica = statusToRubrica(finalStatus);
      rubrica1 = rubrica;
      rubrica2 = rubrica;
    }

    if (finalStatus === 'FALTA') {
      if (faltaVaiParaRubrica) {
        rubrica = rubrica || 'FALTA';
        rubrica1 = rubrica1 || 'FALTA';
        rubrica2 = rubrica2 || 'FALTA';
      } else {
        ocorrencia1 = ocorrencia1 || 'FALTA';
        ocorrencia2 = ocorrencia2 || 'FALTA';
      }
    }

    if (manual) {
      const manualTipo = safeUpper(manual?.tipo);
      const manualLabel = normalizeSpaces(manual?.tipo);

      if (!rubrica && manualTipo && manualTipo !== 'NORMAL') {
        rubrica = manualLabel;
        rubrica1 = manualLabel;
        rubrica2 = manualLabel;
      }

      const manualTexto = normalizeOcorrenciaTexto(manual);
      const manualTurno = normalizeOcorrenciaTurno(manual);

      if (!ocorrencia1 && manualTexto) {
        ocorrencia1 = manualTexto;
      }

      if (!ocorrencia2 && manualTurno) {
        ocorrencia2 = manualTurno;
      }
    }

    const tituloFeriado = normalizeEventoTitulo(feriado);
    if (tituloFeriado) {
      observacoes.push(`Feriado: ${tituloFeriado}`);
    }

    const tituloPonto = normalizeEventoTitulo(ponto);
    if (tituloPonto) {
      observacoes.push(`Ponto facultativo: ${tituloPonto}`);
    }

    const textoFalta = normalizeOcorrenciaTexto(falta);
    if (textoFalta) {
      observacoes.push(textoFalta);
    }

    const textoAtestado = normalizeOcorrenciaTexto(atestado);
    if (textoAtestado) {
      observacoes.push(textoAtestado);
    }

    const textoManual = normalizeOcorrenciaTexto(manual);
    if (textoManual) {
      observacoes.push(textoManual);
    }

    if (normalizeSpaces(diaRaw?.observacoes || diaRaw?.observacao)) {
      observacoes.push(normalizeSpaces(diaRaw?.observacoes || diaRaw?.observacao));
    }

    const conflitos: string[] = [];
    const avisos: string[] = [];

    if (isVacation && isAtestado) {
      const conflito = 'Conflito: férias e atestado no mesmo dia';
      conflitos.push(conflito);
      avisos.push(conflito);
      warnings.push(`Dia ${dia}: conflito entre férias e atestado.`);
    }

    const dataIsoNormalizada = normalizeIsoDate(diaRaw?.data || diaRaw?.dataISO) || atual.dataISO;

    dayMap[dia] = {
      ...atual,
      dataISO: dataIsoNormalizada,
      isHoliday,
      isPontoFacultativo,
      isVacation,
      isAtestado,
      isFalta,
      rubrica: normalizeSpaces(rubrica),
      rubrica1: normalizeSpaces(rubrica1),
      rubrica2: normalizeSpaces(rubrica2),
      ocorrencia1: normalizeSpaces(ocorrencia1),
      ocorrencia2: normalizeSpaces(ocorrencia2),
      observacoes: observacoes.map(normalizeSpaces).filter(Boolean).join(' | '),
      finalStatus,
      conflitos,
      avisos,
      fontes: {
        evento: feriado,
        ponto,
        ferias: isVacation ? diaRaw?.ferias || diaRaw : null,
        atestado,
        falta,
        manual
      }
    };
  }

  return { dayMap, warnings };
}

async function readResponsePayload(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
}

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new Error(parseApiError(payload, 'Falha ao consultar a frequência.'));
  }

  return payload;
}

function normalizeBackendList(payload: any): BackendServidorItem[] {
  const list = asArray<BackendServidorItem>(payload?.data ?? payload?.items ?? payload?.results ?? payload);

  if (list.length > 0) return list;

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const maybeSingle =
      payload?.servidor ||
      payload?.dias ||
      payload?.dayMap ||
      payload?.cpf ||
      payload?.nome
        ? [payload as BackendServidorItem]
        : [];
    return maybeSingle;
  }

  return [];
}

export async function carregarDadosConsolidadosFrequencia(
  options: ConsolidarFrequenciaOptions
): Promise<ConsolidacaoFrequenciaResult> {
  const servidor = normalizeServidor(options.servidor);

  if (!options.mes || options.mes < 1 || options.mes > 12) {
    throw new Error('Mês inválido para consolidar frequência.');
  }

  if (!options.ano || options.ano < 2000 || options.ano > 2100) {
    throw new Error('Ano inválido para consolidar frequência.');
  }

  const baseUrl = normalizeBaseUrl(API_BASE_URL);
  if (!baseUrl) {
    throw new Error('API_BASE_URL não está configurada.');
  }

  const incluirPontoFacultativo = options.incluirPontoFacultativo !== false;
  const faltaVaiParaRubrica = options.faltaVaiParaRubrica !== false;

  const url =
    `${baseUrl}/api/frequencia?ano=${encodeURIComponent(options.ano)}` +
    `&mes=${encodeURIComponent(options.mes)}` +
    `&servidorCpf=${encodeURIComponent(servidor.cpf)}`;

  const payload = await fetchJson(url);
  const lista = normalizeBackendList(payload);
  const item = choosePrimaryBackendItem(lista, servidor);

  if (!item) {
    throw new Error('Nenhum dado de frequência foi encontrado para o servidor selecionado.');
  }

  const servidorApi = extractServidorShape(item);
  const servidorNormalizado: NormalizedServidor = {
    id: normalizeSpaces(
      servidorApi.id || servidorApi.uuid || servidorApi.servidor || servidorApi.servidor_id || servidor.id || servidor.cpf
    ) || servidor.cpf,
    cpf: onlyDigits(servidorApi.cpf || servidor.cpf),
    nome: normalizeSpaces(servidorApi.nome || servidor.nome),
    matricula: normalizeSpaces(servidorApi.matricula || servidor.matricula),
    categoria: normalizeSpaces(servidorApi.categoria || servidor.categoria),
    setor: normalizeSpaces(servidorApi.setor || servidor.setor),
    cargo: normalizeSpaces(servidorApi.cargo || servidor.cargo),
    chDiaria: normalizeSpaces(
      servidorApi.chDiaria ?? servidorApi.ch_diaria ?? servidor.chDiaria ?? servidor.ch_diaria
    ),
    chSemanal: normalizeSpaces(
      servidorApi.chSemanal ?? servidorApi.ch_semanal ?? servidor.chSemanal ?? servidor.ch_semanal
    ),
    status: normalizeSpaces(servidorApi.status || servidor.status || 'ATIVO')
  };

  const { dayMap, warnings } = buildDayMapFromBackend({
    ano: options.ano,
    mes: options.mes,
    item,
    incluirPontoFacultativo,
    faltaVaiParaRubrica
  });

  const totalDiasMes = getLastDayOfMonth(options.ano, options.mes);
  const templateData = buildTemplateData(servidorNormalizado, options.ano, options.mes, dayMap);

  return {
    servidor: servidorNormalizado,
    ano: options.ano,
    mes: options.mes,
    totalDiasMes,
    hiddenRowsFrom: totalDiasMes < 31 ? totalDiasMes + 1 : 0,
    hiddenRowsTo: totalDiasMes < 31 ? 31 : 0,
    dayMap,
    templateData,
    warnings
  };
}

export function montarPayloadExportacaoFrequencia(
  consolidado: ConsolidacaoFrequenciaResult,
  formato: 'docx' | 'pdf'
): FrequenciaExportPayload {
  const nomeBase = normalizeSpaces(consolidado.servidor.nome)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const outputFileName = `frequencia_${nomeBase || 'servidor'}_${consolidado.ano}_${pad2(
    consolidado.mes
  )}.${formato}`;

  return {
    templateData: consolidado.templateData,
    formato,
    outputFileName,
    removerLinhasExcedentes: true,
    metadata: {
      servidor: consolidado.servidor,
      ano: consolidado.ano,
      mes: consolidado.mes,
      totalDiasMes: consolidado.totalDiasMes,
      hiddenRowsFrom: consolidado.hiddenRowsFrom,
      hiddenRowsTo: consolidado.hiddenRowsTo
    }
  };
}

function parseFilenameFromContentDisposition(headerValue: string | null): string | null {
  if (!headerValue) return null;

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const plainMatch = headerValue.match(/filename="?([^"]+)"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1];
  }

  return null;
}

function saveBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function exportarFrequenciaArquivo(
  params: ConsolidarFrequenciaOptions & {
    formato: 'docx' | 'pdf';
  }
): Promise<{ blob: Blob; fileName: string; payload: FrequenciaExportPayload }> {
  const consolidado = await carregarDadosConsolidadosFrequencia(params);
  const payload = montarPayloadExportacaoFrequencia(consolidado, params.formato);

  const baseUrl = normalizeBaseUrl(API_BASE_URL);
  if (!baseUrl) {
    throw new Error('API_BASE_URL não está configurada para exportação da frequência.');
  }

  const response = await fetch(`${baseUrl}/api/frequencia/exportar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const json = await readResponsePayload(response);
    throw new Error(parseApiError(json, 'Falha ao exportar a folha.'));
  }

  const blob = await response.blob();
  const fileName =
    parseFilenameFromContentDisposition(response.headers.get('content-disposition')) ||
    payload.outputFileName;

  return { blob, fileName, payload };
}

export async function baixarFrequenciaArquivo(
  params: ConsolidarFrequenciaOptions & {
    formato: 'docx' | 'pdf';
  }
): Promise<{ fileName: string }> {
  const result = await exportarFrequenciaArquivo(params);
  saveBlob(result.blob, result.fileName);
  return { fileName: result.fileName };
}

export default {
  carregarDadosConsolidadosFrequencia,
  montarPayloadExportacaoFrequencia,
  exportarFrequenciaArquivo,
  baixarFrequenciaArquivo
};
