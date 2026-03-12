import { supabase } from '../lib/supabaseClient';
import { API_BASE_URL } from '../config/api';

type Nullable<T> = T | null | undefined;

export type TipoEventoCalendario =
  | 'FERIADO'
  | 'PONTO'
  | 'PONTO FACULTATIVO'
  | 'EVENTO'
  | 'OUTRO';

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

export interface EventoCalendario {
  id?: string | number;
  data?: string | null;
  date?: string | null;
  dataISO?: string | null;
  tipo?: string | null;
  type?: string | null;
  titulo?: string | null;
  title?: string | null;
  descricao?: string | null;
  description?: string | null;
  [key: string]: any;
}

export interface FeriasRegistro {
  id?: string | number;
  servidor_id?: string | null;
  servidorId?: string | null;
  servidor?: string | null;
  cpf?: string | null;
  servidor_cpf?: string | null;
  nome?: string | null;
  nome_completo?: string | null;

  periodo1_inicio?: string | null;
  periodo1_fim?: string | null;
  periodo2_inicio?: string | null;
  periodo2_fim?: string | null;
  periodo3_inicio?: string | null;
  periodo3_fim?: string | null;

  inicio?: string | null;
  fim?: string | null;

  observacao?: string | null;
  descricao?: string | null;
  [key: string]: any;
}

export interface AtestadoRegistro {
  id?: string | number;
  servidor_id?: string | null;
  servidorId?: string | null;
  servidor?: string | null;
  cpf?: string | null;
  servidor_cpf?: string | null;
  nome?: string | null;
  nome_completo?: string | null;

  data_inicio?: string | null;
  data_fim?: string | null;
  inicio?: string | null;
  fim?: string | null;
  periodo_inicio?: string | null;
  periodo_fim?: string | null;

  motivo?: string | null;
  observacao?: string | null;
  descricao?: string | null;
  [key: string]: any;
}

export interface OcorrenciaFrequencia {
  id?: string | number;
  servidor_id?: string | null;
  servidorId?: string | null;
  servidor?: string | null;
  cpf?: string | null;
  servidor_cpf?: string | null;
  nome?: string | null;
  nome_completo?: string | null;

  data?: string | null;
  date?: string | null;
  dataISO?: string | null;
  inicio?: string | null;
  fim?: string | null;

  tipo?: string | null;
  turno?: string | null;
  rubrica?: string | null;
  rubrica1?: string | null;
  rubrica2?: string | null;
  ocorrencia1?: string | null;
  ocorrencia2?: string | null;
  o1?: string | null;
  o2?: string | null;
  observacao?: string | null;
  descricao?: string | null;
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
    evento?: EventoCalendario | null;
    ponto?: EventoCalendario | null;
    ferias?: NormalizedPeriod | null;
    atestado?: NormalizedPeriod | null;
    falta?: NormalizedOcorrencia | null;
    manual?: NormalizedOcorrencia | null;
  };
}

export type DayMap = Record<number, DayMapItem>;

export interface ConsolidarFrequenciaOptions {
  servidor: ServidorFrequencia;
  mes: number;
  ano: number;
  eventos?: EventoCalendario[];
  ferias?: FeriasRegistro[];
  atestados?: AtestadoRegistro[];
  ocorrencias?: OcorrenciaFrequencia[];
  incluirPontoFacultativo?: boolean;
  faltaVaiParaRubrica?: boolean;
  logger?: Pick<Console, 'warn' | 'log' | 'error'>;
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

interface NormalizedEvent {
  id: string;
  dataISO: string;
  tipo: TipoEventoCalendario;
  titulo: string;
  descricao: string;
  raw: EventoCalendario;
}

interface NormalizedPeriod {
  id: string;
  servidorKey: string;
  inicio: string;
  fim: string;
  observacao: string;
  raw: any;
}

interface NormalizedOcorrencia {
  id: string;
  servidorKey: string;
  dataISO?: string;
  inicio?: string;
  fim?: string;
  tipo: string;
  turno: string;
  rubrica: string;
  rubrica1: string;
  rubrica2: string;
  ocorrencia1: string;
  ocorrencia2: string;
  observacao: string;
  raw: any;
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

function onlyDigits(value: Nullable<string | number>) {
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

function normalizeBaseUrl(url: string): string {
  return String(url ?? '').replace(/\/+$/, '');
}

function normalizeIsoDate(value: Nullable<string>): string | null {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slash = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) {
    const [, dd, mm, yyyy] = slash;
    return `${yyyy}-${mm}-${dd}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  const yyyy = parsed.getFullYear();
  const mm = pad2(parsed.getMonth() + 1);
  const dd = pad2(parsed.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function formatCpf(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length !== 11) return value || '';
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function monthNamePtBr(month: number): string {
  return (
    [
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
    ][month] || String(month)
  );
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function buildMonthInterval(year: number, month: number) {
  const lastDay = getLastDayOfMonth(year, month);
  return {
    start: `${year}-${pad2(month)}-01`,
    end: `${year}-${pad2(month)}-${pad2(lastDay)}`
  };
}

function createDayMapShell(year: number, month: number): DayMap {
  const total = getLastDayOfMonth(year, month);
  const map: DayMap = {};

  for (let day = 1; day <= total; day += 1) {
    const date = new Date(year, month - 1, day);
    const dataISO = `${year}-${pad2(month)}-${pad2(day)}`;
    const weekday = date.getDay();
    const isSaturday = weekday === 6;
    const isSunday = weekday === 0;

    map[day] = {
      dia: day,
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

  return map;
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

function servidorKeys(servidor: NormalizedServidor): string[] {
  return Array.from(
    new Set(
      [
        onlyDigits(servidor.cpf),
        normalizeSpaces(servidor.id),
        safeUpper(servidor.nome),
        safeUpper(servidor.matricula)
      ].filter(Boolean)
    )
  );
}

function buildPeriod(
  raw: any,
  servidorKey: string,
  inicio: string | null,
  fim: string | null,
  observacao: string
): NormalizedPeriod | null {
  if (!inicio || !fim) return null;
  return {
    id: normalizeSpaces(raw?.id || `${servidorKey}-${inicio}-${fim}`),
    servidorKey,
    inicio,
    fim,
    observacao,
    raw
  };
}

function normalizeFeriasRegistros(
  items: FeriasRegistro[] | undefined,
  keys: string[]
): NormalizedPeriod[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const keySet = new Set(keys);

  const matchServidor = (item: FeriasRegistro): string | null => {
    const options = [
      onlyDigits(item.cpf),
      onlyDigits(item.servidor_cpf),
      normalizeSpaces(item.servidor_id),
      normalizeSpaces(item.servidorId),
      normalizeSpaces(item.servidor),
      safeUpper(item.nome),
      safeUpper(item.nome_completo)
    ].filter(Boolean);

    return options.find((candidate) => keySet.has(candidate)) ?? null;
  };

  const results: NormalizedPeriod[] = [];

  for (const item of items) {
    const servidorKey = matchServidor(item);
    if (!servidorKey) continue;

    const observacao = normalizeSpaces(item.observacao || item.descricao || 'FÉRIAS');

    const periods = [
      buildPeriod(
        item,
        servidorKey,
        normalizeIsoDate(item.periodo1_inicio || item.inicio),
        normalizeIsoDate(item.periodo1_fim || item.fim),
        observacao
      ),
      buildPeriod(
        item,
        servidorKey,
        normalizeIsoDate(item.periodo2_inicio),
        normalizeIsoDate(item.periodo2_fim),
        observacao
      ),
      buildPeriod(
        item,
        servidorKey,
        normalizeIsoDate(item.periodo3_inicio),
        normalizeIsoDate(item.periodo3_fim),
        observacao
      )
    ].filter(Boolean) as NormalizedPeriod[];

    results.push(...periods);
  }

  return results;
}

function normalizeAtestadosRegistros(
  items: AtestadoRegistro[] | undefined,
  keys: string[]
): NormalizedPeriod[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const keySet = new Set(keys);

  const matchServidor = (item: AtestadoRegistro): string | null => {
    const options = [
      onlyDigits(item.cpf),
      onlyDigits(item.servidor_cpf),
      normalizeSpaces(item.servidor_id),
      normalizeSpaces(item.servidorId),
      normalizeSpaces(item.servidor),
      safeUpper(item.nome),
      safeUpper(item.nome_completo)
    ].filter(Boolean);

    return options.find((candidate) => keySet.has(candidate)) ?? null;
  };

  const results: NormalizedPeriod[] = [];

  for (const item of items) {
    const servidorKey = matchServidor(item);
    if (!servidorKey) continue;

    const inicio = normalizeIsoDate(item.data_inicio || item.periodo_inicio || item.inicio);
    const fim = normalizeIsoDate(item.data_fim || item.periodo_fim || item.fim);
    const observacao = normalizeSpaces(item.motivo || item.observacao || item.descricao || 'ATESTADO');

    const period = buildPeriod(item, servidorKey, inicio, fim, observacao);
    if (period) results.push(period);
  }

  return results;
}

function normalizeEventos(items: EventoCalendario[] | undefined): NormalizedEvent[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  return items
    .map((item) => {
      const dataISO = normalizeIsoDate(item.data || item.date || item.dataISO);
      if (!dataISO) return null;

      const tipoRaw = safeUpper(item.tipo || item.type);
      const tipo: TipoEventoCalendario =
        tipoRaw === 'FERIADO'
          ? 'FERIADO'
          : tipoRaw === 'PONTO'
            ? 'PONTO'
            : tipoRaw === 'PONTO FACULTATIVO'
              ? 'PONTO FACULTATIVO'
              : tipoRaw === 'EVENTO'
                ? 'EVENTO'
                : 'OUTRO';

      return {
        id: normalizeSpaces(item.id || `${dataISO}-${tipoRaw || 'EVENTO'}`),
        dataISO,
        tipo,
        titulo: normalizeSpaces(item.titulo || item.title || tipoRaw || 'EVENTO'),
        descricao: normalizeSpaces(item.descricao || item.description),
        raw: item
      };
    })
    .filter(Boolean) as NormalizedEvent[];
}

function normalizeOcorrencias(
  items: OcorrenciaFrequencia[] | undefined,
  keys: string[]
): NormalizedOcorrencia[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const keySet = new Set(keys);

  const matchServidor = (item: OcorrenciaFrequencia): string | null => {
    const options = [
      onlyDigits(item.cpf),
      onlyDigits(item.servidor_cpf),
      normalizeSpaces(item.servidor_id),
      normalizeSpaces(item.servidorId),
      normalizeSpaces(item.servidor),
      safeUpper(item.nome),
      safeUpper(item.nome_completo)
    ].filter(Boolean);

    return options.find((candidate) => keySet.has(candidate)) ?? null;
  };

  const results: NormalizedOcorrencia[] = [];

  for (const item of items) {
    const servidorKey = matchServidor(item);
    if (!servidorKey) continue;

    const tipo = safeUpper(item.tipo || 'MANUAL');
    const dataISO = normalizeIsoDate(item.data || item.date || item.dataISO || item.inicio);
    const inicio = normalizeIsoDate(item.inicio);
    const fim = normalizeIsoDate(item.fim);
    const turno = safeUpper(item.turno);
    const rubrica = normalizeSpaces(item.rubrica);
    const rubrica1 = normalizeSpaces(item.rubrica1 || rubrica);
    const rubrica2 = normalizeSpaces(item.rubrica2 || rubrica);
    const ocorrencia1 = normalizeSpaces(item.ocorrencia1 || item.o1);
    const ocorrencia2 = normalizeSpaces(item.ocorrencia2 || item.o2);
    const observacao = normalizeSpaces(item.observacao || item.descricao);

    results.push({
      id: normalizeSpaces(item.id || `${servidorKey}-${dataISO || inicio || 'ocorrencia'}`),
      servidorKey,
      dataISO: dataISO || undefined,
      inicio: inicio || undefined,
      fim: fim || undefined,
      tipo,
      turno,
      rubrica,
      rubrica1,
      rubrica2,
      ocorrencia1,
      ocorrencia2,
      observacao,
      raw: item
    });
  }

  return results;
}

function isDateWithin(dateISO: string, startISO?: string | null, endISO?: string | null) {
  if (!startISO || !endISO) return false;
  return dateISO >= startISO && dateISO <= endISO;
}

function chooseFinalStatus(params: {
  item: DayMapItem;
  evento?: NormalizedEvent | null;
  ponto?: NormalizedEvent | null;
  feriasDia?: NormalizedPeriod | null;
  atestadoDia?: NormalizedPeriod | null;
  faltaDia?: NormalizedOcorrencia | null;
  manualDia?: NormalizedOcorrencia | null;
  incluirPontoFacultativo: boolean;
}): StatusConsolidadoDia {
  const { item, evento, ponto, feriasDia, atestadoDia, faltaDia, manualDia, incluirPontoFacultativo } =
    params;

  if (feriasDia) return 'FERIAS';
  if (atestadoDia) return 'ATESTADO';
  if (evento?.tipo === 'FERIADO') return 'FERIADO';
  if (ponto && incluirPontoFacultativo) return 'PONTO_FACULTATIVO';
  if (item.isSunday) return 'DOMINGO';
  if (item.isSaturday) return 'SABADO';
  if (faltaDia) return 'FALTA';

  const hasManual =
    Boolean(manualDia?.ocorrencia1) ||
    Boolean(manualDia?.ocorrencia2) ||
    Boolean(manualDia?.rubrica) ||
    Boolean(manualDia?.rubrica1) ||
    Boolean(manualDia?.rubrica2);

  if (hasManual) return 'MANUAL';

  return 'NORMAL';
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

function buildDayItem(params: {
  item: DayMapItem;
  incluirPontoFacultativo: boolean;
  faltaVaiParaRubrica: boolean;
  evento?: NormalizedEvent | null;
  ponto?: NormalizedEvent | null;
  feriasDia?: NormalizedPeriod | null;
  atestadoDia?: NormalizedPeriod | null;
  faltaDia?: NormalizedOcorrencia | null;
  manualDia?: NormalizedOcorrencia | null;
}): DayMapItem {
  const {
    item,
    incluirPontoFacultativo,
    faltaVaiParaRubrica,
    evento,
    ponto,
    feriasDia,
    atestadoDia,
    faltaDia,
    manualDia
  } = params;

  const { dia, dataISO, weekday, weekdayLabel, isSaturday, isSunday } = item;
  const conflitos: string[] = [];

  if (feriasDia && atestadoDia) {
    conflitos.push('Conflito: férias e atestado no mesmo dia');
  }

  const finalStatus = chooseFinalStatus({
    item,
    evento,
    ponto,
    feriasDia,
    atestadoDia,
    faltaDia,
    manualDia,
    incluirPontoFacultativo
  });

  let rubrica = '';
  let rubrica1 = '';
  let rubrica2 = '';
  let ocorrencia1 = '';
  let ocorrencia2 = '';
  const observacoesList: string[] = [];

  const statusInstitucionalBloqueiaOcorrencia =
    finalStatus === 'SABADO' ||
    finalStatus === 'DOMINGO' ||
    finalStatus === 'FERIADO' ||
    finalStatus === 'FERIAS' ||
    finalStatus === 'ATESTADO' ||
    finalStatus === 'PONTO_FACULTATIVO' ||
    (finalStatus === 'FALTA' && faltaVaiParaRubrica);

  if (finalStatus !== 'NORMAL' && finalStatus !== 'MANUAL') {
    rubrica = statusToRubrica(finalStatus);
    rubrica1 = rubrica;
    rubrica2 = rubrica;
  }

  if (finalStatus === 'MANUAL' && manualDia) {
    rubrica = manualDia.rubrica || manualDia.rubrica1 || manualDia.rubrica2 || '';
    rubrica1 = manualDia.rubrica1 || manualDia.rubrica || '';
    rubrica2 = manualDia.rubrica2 || manualDia.rubrica || '';
  }

  if (faltaDia && !faltaVaiParaRubrica) {
    if (!statusInstitucionalBloqueiaOcorrencia) {
      ocorrencia1 = 'FALTA';
      ocorrencia2 = 'FALTA';
    } else {
      observacoesList.push('Falta registrada no dia');
    }
  }

  if (!statusInstitucionalBloqueiaOcorrencia && manualDia) {
    if (!ocorrencia1) ocorrencia1 = manualDia.ocorrencia1 || '';
    if (!ocorrencia2) ocorrencia2 = manualDia.ocorrencia2 || '';
  }

  if (evento?.titulo) observacoesList.push(`Feriado: ${evento.titulo}`);
  if (ponto?.titulo) observacoesList.push(`Ponto facultativo: ${ponto.titulo}`);
  if (feriasDia?.observacao) observacoesList.push(feriasDia.observacao);
  if (atestadoDia?.observacao) observacoesList.push(atestadoDia.observacao);
  if (faltaDia?.observacao) observacoesList.push(faltaDia.observacao);
  if (manualDia?.observacao) observacoesList.push(manualDia.observacao);

  return {
    dia,
    dataISO,
    weekday,
    weekdayLabel,
    isSaturday,
    isSunday,
    isHoliday: Boolean(evento),
    isPontoFacultativo: Boolean(ponto) && incluirPontoFacultativo,
    isVacation: Boolean(feriasDia),
    isAtestado: Boolean(atestadoDia),
    isFalta: Boolean(faltaDia),
    rubrica,
    rubrica1,
    rubrica2,
    ocorrencia1,
    ocorrencia2,
    observacoes: observacoesList.filter(Boolean).join(' | '),
    finalStatus,
    conflitos,
    avisos: [...conflitos],
    fontes: {
      evento: evento?.raw ?? null,
      ponto: ponto?.raw ?? null,
      ferias: feriasDia ?? null,
      atestado: atestadoDia ?? null,
      falta: faltaDia ?? null,
      manual: manualDia ?? null
    }
  };
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

async function listarEventosCalendario(ano: number, mes: number): Promise<EventoCalendario[]> {
  const { start, end } = buildMonthInterval(ano, mes);

  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .gte('data', start)
    .lte('data', end);

  if (error) {
    console.warn('Falha ao buscar eventos do calendário:', error.message);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

async function listarFerias(servidor: NormalizedServidor): Promise<FeriasRegistro[]> {
  const cpf = onlyDigits(servidor.cpf);

  const { data, error } = await supabase
    .from('ferias')
    .select('*')
    .or(
      [
        cpf ? `servidor_cpf.eq.${cpf}` : '',
        cpf ? `cpf.eq.${cpf}` : '',
        servidor.id ? `servidor_id.eq.${servidor.id}` : '',
        servidor.nome ? `nome.ilike.%${servidor.nome}%` : '',
        servidor.nome ? `nome_completo.ilike.%${servidor.nome}%` : ''
      ]
        .filter(Boolean)
        .join(',')
    );

  if (error) {
    console.warn('Falha ao buscar férias:', error.message);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

async function listarAtestados(servidor: NormalizedServidor): Promise<AtestadoRegistro[]> {
  const cpf = onlyDigits(servidor.cpf);

  const { data, error } = await supabase
    .from('atestados')
    .select('*')
    .or(
      [
        cpf ? `servidor_cpf.eq.${cpf}` : '',
        cpf ? `cpf.eq.${cpf}` : '',
        servidor.id ? `servidor_id.eq.${servidor.id}` : '',
        servidor.nome ? `nome.ilike.%${servidor.nome}%` : '',
        servidor.nome ? `nome_completo.ilike.%${servidor.nome}%` : ''
      ]
        .filter(Boolean)
        .join(',')
    );

  if (error) {
    console.warn('Falha ao buscar atestados:', error.message);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

async function listarOcorrencias(
  servidor: NormalizedServidor,
  ano: number,
  mes: number
): Promise<OcorrenciaFrequencia[]> {
  const { start, end } = buildMonthInterval(ano, mes);
  const cpf = onlyDigits(servidor.cpf);

  const tableCandidates = ['frequencia_ocorrencias', 'faltas'];

  for (const table of tableCandidates) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .or(
        [
          cpf ? `servidor_cpf.eq.${cpf}` : '',
          cpf ? `cpf.eq.${cpf}` : '',
          servidor.id ? `servidor_id.eq.${servidor.id}` : '',
          servidor.nome ? `nome.ilike.%${servidor.nome}%` : '',
          servidor.nome ? `nome_completo.ilike.%${servidor.nome}%` : ''
        ]
          .filter(Boolean)
          .join(',')
      )
      .or(`data.gte.${start},date.gte.${start},inicio.gte.${start}`)
      .or(`data.lte.${end},date.lte.${end},inicio.lte.${end}`);

    if (error) {
      console.warn(`Falha ao buscar ocorrências em ${table}:`, error.message);
      continue;
    }

    if (Array.isArray(data)) return data;
  }

  return [];
}

export function consolidarFrequencia(
  options: ConsolidarFrequenciaOptions
): ConsolidacaoFrequenciaResult {
  const {
    servidor: inputServidor,
    mes,
    ano,
    eventos = [],
    ferias = [],
    atestados = [],
    ocorrencias = [],
    incluirPontoFacultativo = true,
    faltaVaiParaRubrica = true
  } = options;

  if (!mes || mes < 1 || mes > 12) throw new Error('Mês inválido para consolidar frequência.');
  if (!ano || ano < 2000 || ano > 2100) throw new Error('Ano inválido para consolidar frequência.');

  const servidor = normalizeServidor(inputServidor);
  const keys = servidorKeys(servidor);
  const dayMap = createDayMapShell(ano, mes);

  const eventosNorm = normalizeEventos(eventos);
  const feriasNorm = normalizeFeriasRegistros(ferias, keys);
  const atestadosNorm = normalizeAtestadosRegistros(atestados, keys);
  const ocorrenciasNorm = normalizeOcorrencias(ocorrencias, keys);

  const warnings: string[] = [];

  for (let dia = 1; dia <= getLastDayOfMonth(ano, mes); dia += 1) {
    const item = dayMap[dia];
    const dataISO = item.dataISO;

    const evento = eventosNorm.find((e) => e.dataISO === dataISO && e.tipo === 'FERIADO') ?? null;
    const ponto =
      eventosNorm.find(
        (e) => e.dataISO === dataISO && (e.tipo === 'PONTO' || e.tipo === 'PONTO FACULTATIVO')
      ) ?? null;
    const feriasDia = feriasNorm.find((f) => isDateWithin(dataISO, f.inicio, f.fim)) ?? null;
    const atestadoDia = atestadosNorm.find((a) => isDateWithin(dataISO, a.inicio, a.fim)) ?? null;
    const faltaDia =
      ocorrenciasNorm.find((o) => o.dataISO === dataISO && safeUpper(o.tipo) === 'FALTA') ?? null;
    const manualDia =
      ocorrenciasNorm.find((o) => o.dataISO === dataISO && safeUpper(o.tipo) !== 'FALTA') ?? null;

    const built = buildDayItem({
      item,
      incluirPontoFacultativo,
      faltaVaiParaRubrica,
      evento,
      ponto,
      feriasDia,
      atestadoDia,
      faltaDia,
      manualDia
    });

    dayMap[dia] = built;

    if (built.conflitos.length > 0) {
      warnings.push(`Dia ${dia}: ${built.conflitos.join('; ')}`);
    }
  }

  const templateData = buildTemplateData(servidor, ano, mes, dayMap);
  const totalDiasMes = getLastDayOfMonth(ano, mes);

  return {
    servidor,
    ano,
    mes,
    totalDiasMes,
    hiddenRowsFrom: totalDiasMes < 31 ? totalDiasMes + 1 : 0,
    hiddenRowsTo: totalDiasMes < 31 ? 31 : 0,
    dayMap,
    templateData,
    warnings
  };
}

export async function carregarDadosConsolidadosFrequencia(
  options: ConsolidarFrequenciaOptions
): Promise<ConsolidacaoFrequenciaResult> {
  const servidor = normalizeServidor(options.servidor);

  const [eventos, ferias, atestados, ocorrencias] = await Promise.all([
    options.eventos ? Promise.resolve(options.eventos) : listarEventosCalendario(options.ano, options.mes),
    options.ferias ? Promise.resolve(options.ferias) : listarFerias(servidor),
    options.atestados ? Promise.resolve(options.atestados) : listarAtestados(servidor),
    options.ocorrencias
      ? Promise.resolve(options.ocorrencias)
      : listarOcorrencias(servidor, options.ano, options.mes)
  ]);

  return consolidarFrequencia({
    ...options,
    servidor,
    eventos,
    ferias,
    atestados,
    ocorrencias
  });
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
    let errorText = 'Falha ao exportar a folha.';
    try {
      const json = await response.json();
      errorText = json?.error || json?.details || errorText;
    } catch {
      // noop
    }
    throw new Error(errorText);
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
  consolidarFrequencia,
  carregarDadosConsolidadosFrequencia,
  montarPayloadExportacaoFrequencia,
  exportarFrequenciaArquivo,
  baixarFrequenciaArquivo
};
