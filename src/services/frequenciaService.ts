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
] as const;

const STATUS_PRIORITY: StatusConsolidadoDia[] = [
  'SABADO',
  'DOMINGO',
  'FERIADO',
  'FERIAS',
  'ATESTADO',
  'FALTA',
  'PONTO_FACULTATIVO',
  'MANUAL'
];

function createDefaultLogger(): Pick<Console, 'warn' | 'log' | 'error'> {
  return console;
}

function pad2(value: number | string): string {
  return String(value).padStart(2, '0');
}

function toUpperSafe(value: Nullable<any>): string {
  return String(value ?? '').trim().toUpperCase();
}

function normalizeSpaces(value: Nullable<any>): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function removeNonDigits(value: Nullable<any>): string {
  return String(value ?? '').replace(/\D+/g, '');
}

function normalizeName(value: Nullable<any>): string {
  const raw = normalizeSpaces(value);
  if (!raw) return '';
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function isoFromParts(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseDateToISO(value: Nullable<any>): string | null {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const brMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
  }

  return null;
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getWeekday(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
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
  return names[month] ?? '';
}

function toStringSafe(value: Nullable<any>): string {
  return String(value ?? '').trim();
}

function dateBetweenInclusive(dateISO: string, startISO?: string, endISO?: string): boolean {
  if (!dateISO || !startISO || !endISO) return false;
  return dateISO >= startISO && dateISO <= endISO;
}

function buildServidorIdentityKeys(servidor: ServidorFrequencia): string[] {
  const id = toStringSafe(
    servidor.id ??
      servidor.servidor ??
      servidor.uuid ??
      servidor.servidor_id
  );

  const cpf = removeNonDigits(servidor.cpf);
  const nome = normalizeName(servidor.nomeCompleto ?? servidor.nome_completo ?? servidor.nome);

  return [cpf && `cpf:${cpf}`, id && `id:${id}`, nome && `nome:${nome}`].filter(Boolean) as string[];
}

function resolveRegistroIdentityKey(registro: any): string {
  const cpf = removeNonDigits(registro?.cpf ?? registro?.servidor_cpf);
  if (cpf) return `cpf:${cpf}`;

  const id = toStringSafe(
    registro?.servidor_id ??
      registro?.servidorId ??
      registro?.servidor ??
      registro?.id_servidor
  );
  if (id) return `id:${id}`;

  const nome = normalizeName(registro?.nome_completo ?? registro?.nome);
  if (nome) return `nome:${nome}`;

  return '';
}

function matchesServidor(servidor: ServidorFrequencia, registro: any): boolean {
  const keys = buildServidorIdentityKeys(servidor);
  const registroKey = resolveRegistroIdentityKey(registro);
  return !!registroKey && keys.includes(registroKey);
}

function normalizeServidor(servidor: ServidorFrequencia): NormalizedServidor {
  return {
    id: toStringSafe(servidor.id ?? servidor.servidor ?? servidor.uuid ?? servidor.servidor_id),
    cpf: removeNonDigits(servidor.cpf),
    nome: normalizeSpaces(servidor.nomeCompleto ?? servidor.nome_completo ?? servidor.nome),
    matricula: normalizeSpaces(servidor.matricula),
    categoria: normalizeSpaces(servidor.categoria),
    setor: normalizeSpaces(servidor.setor),
    cargo: normalizeSpaces(servidor.cargo),
    chDiaria: toStringSafe(servidor.chDiaria ?? servidor.ch_diaria),
    chSemanal: toStringSafe(servidor.chSemanal ?? servidor.ch_semanal),
    status: normalizeSpaces(servidor.status)
  };
}

function normalizeEventType(value: Nullable<any>): TipoEventoCalendario {
  const v = toUpperSafe(value);

  if (v === 'FERIADO') return 'FERIADO';
  if (v === 'PONTO' || v === 'PONTO FACULTATIVO') return 'PONTO FACULTATIVO';
  if (v === 'EVENTO') return 'EVENTO';
  return 'OUTRO';
}

function normalizeEventos(eventos: EventoCalendario[] = []): NormalizedEvent[] {
  return eventos
    .map((evento, index) => {
      const dataISO = parseDateToISO(evento.data ?? evento.date ?? evento.dataISO);
      if (!dataISO) return null;

      return {
        id: toStringSafe(evento.id ?? index + 1),
        dataISO,
        tipo: normalizeEventType(evento.tipo ?? evento.type),
        titulo: normalizeSpaces(evento.titulo ?? evento.title),
        descricao: normalizeSpaces(evento.descricao ?? evento.description),
        raw: evento
      };
    })
    .filter(Boolean) as NormalizedEvent[];
}

function normalizeFerias(servidor: ServidorFrequencia, ferias: FeriasRegistro[] = []): NormalizedPeriod[] {
  const filtradas = ferias.filter((item) => matchesServidor(servidor, item));

  const periods: NormalizedPeriod[] = [];

  filtradas.forEach((item, index) => {
    const servidorKey = resolveRegistroIdentityKey(item);

    const periodos = [
      {
        inicio: item.periodo1_inicio ?? item.inicio,
        fim: item.periodo1_fim ?? item.fim
      },
      {
        inicio: item.periodo2_inicio,
        fim: item.periodo2_fim
      },
      {
        inicio: item.periodo3_inicio,
        fim: item.periodo3_fim
      }
    ];

    periodos.forEach((periodo, pIndex) => {
      const inicio = parseDateToISO(periodo.inicio);
      const fim = parseDateToISO(periodo.fim);

      if (!inicio || !fim) return;

      periods.push({
        id: `${toStringSafe(item.id ?? index + 1)}_${pIndex + 1}`,
        servidorKey,
        inicio,
        fim,
        observacao: normalizeSpaces(item.observacao ?? item.descricao ?? 'Férias'),
        raw: item
      });
    });
  });

  return periods;
}

function normalizeAtestados(
  servidor: ServidorFrequencia,
  atestados: AtestadoRegistro[] = []
): NormalizedPeriod[] {
  return atestados
    .filter((item) => matchesServidor(servidor, item))
    .map((item, index) => {
      const inicio = parseDateToISO(
        item.data_inicio ?? item.inicio ?? item.periodo_inicio
      );
      const fim = parseDateToISO(
        item.data_fim ?? item.fim ?? item.periodo_fim
      );

      if (!inicio || !fim) return null;

      return {
        id: toStringSafe(item.id ?? index + 1),
        servidorKey: resolveRegistroIdentityKey(item),
        inicio,
        fim,
        observacao: normalizeSpaces(item.observacao ?? item.motivo ?? item.descricao ?? 'Atestado'),
        raw: item
      };
    })
    .filter(Boolean) as NormalizedPeriod[];
}

function normalizeOcorrencias(
  servidor: ServidorFrequencia,
  ocorrencias: OcorrenciaFrequencia[] = []
): NormalizedOcorrencia[] {
  return ocorrencias
    .filter((item) => matchesServidor(servidor, item))
    .map((item, index) => {
      const dataISO = parseDateToISO(item.data ?? item.date ?? item.dataISO) ?? undefined;
      const inicio = parseDateToISO(item.inicio) ?? undefined;
      const fim = parseDateToISO(item.fim) ?? undefined;

      return {
        id: toStringSafe(item.id ?? index + 1),
        servidorKey: resolveRegistroIdentityKey(item),
        dataISO,
        inicio,
        fim,
        tipo: toUpperSafe(item.tipo),
        turno: toUpperSafe(item.turno),
        rubrica: normalizeSpaces(item.rubrica),
        rubrica1: normalizeSpaces(item.rubrica1),
        rubrica2: normalizeSpaces(item.rubrica2),
        ocorrencia1: normalizeSpaces(item.ocorrencia1 ?? item.o1),
        ocorrencia2: normalizeSpaces(item.ocorrencia2 ?? item.o2),
        observacao: normalizeSpaces(item.observacao ?? item.descricao),
        raw: item
      };
    });
}

function findEventoByDate(eventos: NormalizedEvent[], dateISO: string, tipo: TipoEventoCalendario): NormalizedEvent | null {
  return eventos.find((e) => e.dataISO === dateISO && e.tipo === tipo) ?? null;
}

function findPeriodoByDate(periodos: NormalizedPeriod[], dateISO: string): NormalizedPeriod | null {
  return periodos.find((p) => dateBetweenInclusive(dateISO, p.inicio, p.fim)) ?? null;
}

function findOcorrenciaByDate(ocorrencias: NormalizedOcorrencia[], dateISO: string): NormalizedOcorrencia | null {
  return (
    ocorrencias.find((o) => {
      if (o.dataISO) return o.dataISO === dateISO;
      if (o.inicio && o.fim) return dateBetweenInclusive(dateISO, o.inicio, o.fim);
      return false;
    }) ?? null
  );
}

function hasTipoFalta(ocorrencia: NormalizedOcorrencia | null): boolean {
  if (!ocorrencia) return false;
  return toUpperSafe(ocorrencia.tipo) === 'FALTA';
}

function hasManualContent(ocorrencia: NormalizedOcorrencia | null): boolean {
  if (!ocorrencia) return false;
  return Boolean(
    ocorrencia.rubrica ||
      ocorrencia.rubrica1 ||
      ocorrencia.rubrica2 ||
      ocorrencia.ocorrencia1 ||
      ocorrencia.ocorrencia2 ||
      ocorrencia.observacao
  );
}

function chooseFinalStatus(candidates: Record<StatusConsolidadoDia, boolean>): StatusConsolidadoDia {
  for (const status of STATUS_PRIORITY) {
    if (candidates[status]) return status;
  }
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
    case 'FALTA':
      return 'FALTA';
    case 'PONTO_FACULTATIVO':
      return 'PONTO FACULTATIVO';
    default:
      return '';
  }
}

function addAviso(
  warnings: string[],
  logger: Pick<Console, 'warn' | 'log' | 'error'>,
  message: string
): void {
  warnings.push(message);
  logger.warn(`[frequenciaService] ${message}`);
}

function collectConflitos(input: {
  isSaturday: boolean;
  isSunday: boolean;
  evento: NormalizedEvent | null;
  ponto: NormalizedEvent | null;
  ferias: NormalizedPeriod | null;
  atestado: NormalizedPeriod | null;
  falta: NormalizedOcorrencia | null;
  manual: NormalizedOcorrencia | null;
}): string[] {
  const conflitos: string[] = [];

  if (input.ferias && input.atestado) conflitos.push('Conflito: férias + atestado');
  if (input.evento && input.falta) conflitos.push('Conflito: feriado + falta');
  if ((input.isSaturday || input.isSunday) && input.manual) conflitos.push('Conflito: fim de semana + ocorrência manual');
  if (input.ponto && input.falta) conflitos.push('Conflito: ponto facultativo + falta');

  return conflitos;
}

function buildDayItem(args: {
  ano: number;
  mes: number;
  dia: number;
  eventos: NormalizedEvent[];
  ferias: NormalizedPeriod[];
  atestados: NormalizedPeriod[];
  ocorrencias: NormalizedOcorrencia[];
  incluirPontoFacultativo: boolean;
  faltaVaiParaRubrica: boolean;
  warnings: string[];
  logger: Pick<Console, 'warn' | 'log' | 'error'>;
}): DayMapItem {
  const {
    ano,
    mes,
    dia,
    eventos,
    ferias,
    atestados,
    ocorrencias,
    incluirPontoFacultativo,
    faltaVaiParaRubrica,
    warnings,
    logger
  } = args;

  const dataISO = isoFromParts(ano, mes, dia);
  const weekday = getWeekday(ano, mes, dia);
  const isSaturday = weekday === 6;
  const isSunday = weekday === 0;

  const evento = findEventoByDate(eventos, dataISO, 'FERIADO');
  const ponto = findEventoByDate(eventos, dataISO, 'PONTO FACULTATIVO');
  const feriasDia = findPeriodoByDate(ferias, dataISO);
  const atestadoDia = findPeriodoByDate(atestados, dataISO);
  const ocorrenciaDia = findOcorrenciaByDate(ocorrencias, dataISO);

  const faltaDia = hasTipoFalta(ocorrenciaDia) ? ocorrenciaDia : null;
  const manualDia = hasManualContent(ocorrenciaDia) ? ocorrenciaDia : null;

  const conflitos = collectConflitos({
    isSaturday,
    isSunday,
    evento,
    ponto,
    ferias: feriasDia,
    atestado: atestadoDia,
    falta: faltaDia,
    manual: manualDia
  });

  if (conflitos.length > 0) {
    conflitos.forEach((conflito) => {
      addAviso(warnings, logger, `${dataISO} - ${conflito}`);
    });
  }

  const candidates: Record<StatusConsolidadoDia, boolean> = {
    NORMAL: false,
    SABADO: isSaturday,
    DOMINGO: isSunday,
    FERIADO: Boolean(evento),
    FERIAS: Boolean(feriasDia),
    ATESTADO: Boolean(atestadoDia),
    FALTA: Boolean(faltaDia) && faltaVaiParaRubrica,
    PONTO_FACULTATIVO: Boolean(ponto) && incluirPontoFacultativo,
    MANUAL:
      Boolean(manualDia?.rubrica) ||
      Boolean(manualDia?.rubrica1) ||
      Boolean(manualDia?.rubrica2)
  };

  const finalStatus = chooseFinalStatus(candidates);

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
    weekdayLabel: WEEKDAY_LABELS[weekday],
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

export function consolidarFrequenciaMensal(
  options: ConsolidarFrequenciaOptions
): ConsolidacaoFrequenciaResult {
  const logger = options.logger ?? createDefaultLogger();
  const warnings: string[] = [];

  const ano = Number(options.ano);
  const mes = Number(options.mes);

  if (!ano || !mes || mes < 1 || mes > 12) {
    throw new Error('Mês/ano inválidos para consolidação da frequência.');
  }

  const servidor = normalizeServidor(options.servidor);

  const eventos = normalizeEventos(options.eventos ?? []);
  const ferias = normalizeFerias(options.servidor, options.ferias ?? []);
  const atestados = normalizeAtestados(options.servidor, options.atestados ?? []);
  const ocorrencias = normalizeOcorrencias(options.servidor, options.ocorrencias ?? []);

  const totalDiasMes = getLastDayOfMonth(ano, mes);
  const dayMap: DayMap = {};

  for (let dia = 1; dia <= totalDiasMes; dia += 1) {
    dayMap[dia] = buildDayItem({
      ano,
      mes,
      dia,
      eventos,
      ferias,
      atestados,
      ocorrencias,
      incluirPontoFacultativo: Boolean(options.incluirPontoFacultativo),
      faltaVaiParaRubrica: options.faltaVaiParaRubrica !== false,
      warnings,
      logger
    });
  }

  return {
    servidor,
    ano,
    mes,
    totalDiasMes,
    hiddenRowsFrom: totalDiasMes + 1,
    hiddenRowsTo: 31,
    dayMap,
    templateData: buildTemplateData(servidor, ano, mes, dayMap),
    warnings
  };
}

export async function carregarDadosConsolidadosFrequencia(params: {
  servidor: ServidorFrequencia;
  mes: number;
  ano: number;
  incluirPontoFacultativo?: boolean;
  faltaVaiParaRubrica?: boolean;
}): Promise<ConsolidacaoFrequenciaResult> {
  const { servidor, mes, ano, incluirPontoFacultativo, faltaVaiParaRubrica } = params;

  const cpf = removeNonDigits(servidor.cpf);
  const servidorId = toStringSafe(servidor.id ?? servidor.servidor ?? servidor.uuid ?? servidor.servidor_id);

  const firstDay = `${ano}-${pad2(mes)}-01`;
  const lastDay = `${ano}-${pad2(mes)}-${pad2(getLastDayOfMonth(ano, mes))}`;

  let eventos: EventoCalendario[] = [];
  let ferias: FeriasRegistro[] = [];
  let atestados: AtestadoRegistro[] = [];
  let ocorrencias: OcorrenciaFrequencia[] = [];

  const eventosQuery = await supabase
    .from('eventos')
    .select('*')
    .gte('data', firstDay)
    .lte('data', lastDay);

  if (!eventosQuery.error && Array.isArray(eventosQuery.data)) {
    eventos = eventosQuery.data;
  }

  let feriasQuery: any = null;
  if (cpf) {
    feriasQuery = await supabase
      .from('ferias')
      .select('*')
      .eq('servidor_cpf', cpf);
  } else if (servidorId) {
    feriasQuery = await supabase
      .from('ferias')
      .select('*')
      .or(`servidor_id.eq.${servidorId},servidor.eq.${servidorId}`);
  }

  if (feriasQuery && !feriasQuery.error && Array.isArray(feriasQuery.data)) {
    ferias = feriasQuery.data;
  }

  let atestadosQuery: any = null;
  if (cpf) {
    atestadosQuery = await supabase
      .from('atestados')
      .select('*')
      .eq('servidor_cpf', cpf);
  } else if (servidorId) {
    atestadosQuery = await supabase
      .from('atestados')
      .select('*')
      .or(`servidor_id.eq.${servidorId},servidor.eq.${servidorId}`);
  }

  if (atestadosQuery && !atestadosQuery.error && Array.isArray(atestadosQuery.data)) {
    atestados = atestadosQuery.data;
  }

  let ocorrenciasQuery: any = null;
  if (cpf) {
    ocorrenciasQuery = await supabase
      .from('frequencia_ocorrencias')
      .select('*')
      .eq('servidor_cpf', cpf)
      .gte('data', firstDay)
      .lte('data', lastDay);
  }

  if (ocorrenciasQuery?.error || !Array.isArray(ocorrenciasQuery?.data)) {
    let fallbackQuery: any = null;

    if (cpf) {
      fallbackQuery = await supabase
        .from('faltas')
        .select('*')
        .eq('cpf', cpf)
        .gte('data', firstDay)
        .lte('data', lastDay);
    } else if (servidorId) {
      fallbackQuery = await supabase
        .from('faltas')
        .select('*')
        .or(`servidor_id.eq.${servidorId},servidor.eq.${servidorId}`)
        .gte('data', firstDay)
        .lte('data', lastDay);
    }

    if (!fallbackQuery?.error && Array.isArray(fallbackQuery?.data)) {
      ocorrencias = fallbackQuery.data;
    }
  } else {
    ocorrencias = ocorrenciasQuery.data;
  }

  return consolidarFrequenciaMensal({
    servidor,
    mes,
    ano,
    eventos,
    ferias,
    atestados,
    ocorrencias,
    incluirPontoFacultativo,
    faltaVaiParaRubrica
  });
}

export function montarPayloadExportacaoFrequencia(params: ConsolidarFrequenciaOptions & {
  formato?: 'docx' | 'pdf';
  outputFileName?: string;
}): FrequenciaExportPayload {
  const result = consolidarFrequenciaMensal(params);

  const formato = params.formato ?? 'docx';
  const baseName = `${result.servidor.nome || 'servidor'}_${pad2(result.mes)}_${result.ano}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_');

  return {
    templateData: result.templateData,
    formato,
    outputFileName: params.outputFileName || `frequencia_${baseName}.${formato}`,
    removerLinhasExcedentes: true,
    metadata: {
      servidor: result.servidor,
      ano: result.ano,
      mes: result.mes,
      totalDiasMes: result.totalDiasMes,
      hiddenRowsFrom: result.hiddenRowsFrom,
      hiddenRowsTo: result.hiddenRowsTo
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

  const normalMatch = headerValue.match(/filename="?([^"]+)"?/i);
  return normalMatch?.[1] ?? null;
}

function saveBlob(blob: Blob, fileName: string): void {
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

async function buildExportError(response: Response): Promise<string> {
  let errorMessage = 'Falha ao exportar frequência.';

  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const errorBody = await response.json();
      errorMessage = errorBody?.error || errorBody?.details || errorBody?.message || errorMessage;
    } else {
      const text = await response.text();
      if (text) errorMessage = text;
    }
  } catch {
    // noop
  }

  return errorMessage;
}

export async function exportarFrequenciaArquivo(params: ConsolidarFrequenciaOptions & {
  formato?: 'docx' | 'pdf';
  templatePath?: string;
  outputFileName?: string;
}): Promise<{
  blob: Blob;
  fileName: string;
  contentType: string;
  payload: FrequenciaExportPayload;
}> {
  const payload = montarPayloadExportacaoFrequencia(params);
  const baseUrl = String(API_BASE_URL || '').replace(/\/+$/, '');

  if (!baseUrl) {
    throw new Error('API_BASE_URL não configurada para exportação da frequência.');
  }

  const endpoint = `${baseUrl}/api/frequencia/exportar`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...payload,
      templatePath: params.templatePath || undefined
    })
  });

  if (!response.ok) {
    throw new Error(await buildExportError(response));
  }

  const blob = await response.blob();
  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const fileName =
    parseFilenameFromContentDisposition(response.headers.get('content-disposition')) ||
    payload.outputFileName;

  return {
    blob,
    fileName,
    contentType,
    payload
  };
}

export async function baixarFrequenciaArquivo(params: ConsolidarFrequenciaOptions & {
  formato?: 'docx' | 'pdf';
  templatePath?: string;
  outputFileName?: string;
}): Promise<{
  fileName: string;
  contentType: string;
  payload: FrequenciaExportPayload;
}> {
  const { blob, fileName, contentType, payload } = await exportarFrequenciaArquivo(params);
  saveBlob(blob, fileName);
  return { fileName, contentType, payload };
}

export function montarDayMapParaExportacao(params: ConsolidarFrequenciaOptions): DayMap {
  return consolidarFrequenciaMensal(params).dayMap;
}

export function montarTemplateDataFrequencia(params: ConsolidarFrequenciaOptions): Record<string, string | boolean | number> {
  return consolidarFrequenciaMensal(params).templateData;
}

export function montarDiagnosticoFrequencia(params: ConsolidarFrequenciaOptions): Array<{
  dia: number;
  dataISO: string;
  weekdayLabel: string;
  finalStatus: StatusConsolidadoDia;
  rubrica: string;
  ocorrencia1: string;
  ocorrencia2: string;
  observacoes: string;
  conflitos: string[];
}> {
  const result = consolidarFrequenciaMensal(params);

  return Object.values(result.dayMap).map((item) => ({
    dia: item.dia,
    dataISO: item.dataISO,
    weekdayLabel: item.weekdayLabel,
    finalStatus: item.finalStatus,
    rubrica: item.rubrica,
    ocorrencia1: item.ocorrencia1,
    ocorrencia2: item.ocorrencia2,
    observacoes: item.observacoes,
    conflitos: item.conflitos
  }));
}
