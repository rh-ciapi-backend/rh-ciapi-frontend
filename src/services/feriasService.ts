import { API_CONFIG } from '../config/api';
import { supabase } from '../lib/supabaseClient';
import { logsService } from './logsService';
import type { Ferias, Servidor } from '../types';
import type { ListarFeriasParams } from './apiTypes';
import { MOCK_FERIAS } from '../data/ferias';

type NullableString = string | null | undefined;

type DbFeriasRow = {
  id: string;
  servidor_id: string;
  ano: number;
  periodo1_inicio?: string | null;
  periodo1_fim?: string | null;
  periodo2_inicio?: string | null;
  periodo2_fim?: string | null;
  periodo3_inicio?: string | null;
  periodo3_fim?: string | null;
  observacao?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type FeriasPeriodoSlot = 1 | 2 | 3;

type FeriasUiRecord = {
  id: string;
  rowId: string;
  slot: FeriasPeriodoSlot;
  servidorId: string;
  ano: number;
  inicio: string;
  fim: string;
  dias: number;
  observacao?: string;
  servidorNome?: string;
  matricula?: string;
  cpf?: string;
  setor?: string;
};

type FeriasSavePayload = Partial<FeriasUiRecord> & {
  id?: string;
  servidorId?: string;
  servidorNome?: string;
  matricula?: string;
  cpf?: string;
  setor?: string;
  inicio?: string;
  fim?: string;
  dias?: number;
  observacao?: string;
  ano?: number;
};

const TABLE_FERIAS = 'ferias';
const TABLE_SERVIDORES = 'servidores';

let feriasMock = Array.isArray(MOCK_FERIAS) ? [...MOCK_FERIAS] : [];

const safeString = (value: unknown) => String(value ?? '').trim();

const normalizeCpf = (value: unknown) => safeString(value).replace(/\D/g, '');

const parseDate = (value?: NullableString): Date | null => {
  const safe = safeString(value);
  if (!safe) return null;
  const parsed = new Date(`${safe}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatIsoDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const calculateDays = (inicio?: NullableString, fim?: NullableString) => {
  const start = parseDate(inicio);
  const end = parseDate(fim);
  if (!start || !end) return 0;
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return diff >= 0 ? diff + 1 : 0;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === 'object' &&
    error &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
};

const toYear = (value?: NullableString | number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const safe = safeString(value);
  if (!safe) return new Date().getFullYear();

  const isoMatch = safe.match(/^(\d{4})-\d{2}-\d{2}$/);
  if (isoMatch) return Number(isoMatch[1]);

  const asNumber = Number(safe);
  if (Number.isFinite(asNumber)) return asNumber;

  return new Date().getFullYear();
};

const overlaps = (
  startA?: NullableString,
  endA?: NullableString,
  startB?: NullableString,
  endB?: NullableString,
) => {
  const a1 = parseDate(startA);
  const a2 = parseDate(endA);
  const b1 = parseDate(startB);
  const b2 = parseDate(endB);

  if (!a1 || !a2 || !b1 || !b2) return false;
  return a1 <= b2 && b1 <= a2;
};

const sortByInicio = <T extends { inicio: string }>(items: T[]) =>
  [...items].sort((a, b) => a.inicio.localeCompare(b.inicio));

const mapLegacyRowToFerias = (row: DbFeriasRow): Ferias => ({
  id: safeString(row.id),
  servidorId: safeString(row.servidor_id),
  ano: Number(row.ano || 0),
  periodo1Inicio: safeString(row.periodo1_inicio),
  periodo1Fim: safeString(row.periodo1_fim),
  periodo2Inicio: safeString(row.periodo2_inicio),
  periodo2Fim: safeString(row.periodo2_fim),
  periodo3Inicio: safeString(row.periodo3_inicio),
  periodo3Fim: safeString(row.periodo3_fim),
  observacao: safeString(row.observacao),
});

const getPeriodoFieldNames = (slot: FeriasPeriodoSlot) => ({
  inicio: `periodo${slot}_inicio` as const,
  fim: `periodo${slot}_fim` as const,
});

const buildPeriodoSyntheticId = (rowId: string, slot: FeriasPeriodoSlot) => `${rowId}::periodo${slot}`;

const parsePeriodoSyntheticId = (value: string): { rowId: string; slot: FeriasPeriodoSlot } | null => {
  const safe = safeString(value);
  const match = safe.match(/^(.+)::periodo([123])$/);
  if (!match) return null;

  return {
    rowId: match[1],
    slot: Number(match[2]) as FeriasPeriodoSlot,
  };
};

const mapServidorRow = (row: any): Servidor => {
  const nomeCompleto = safeString(
    row?.nome_completo ?? row?.nomeCompleto ?? row?.nome ?? row?.servidor_nome ?? row?.servidorNome,
  );
  const cpf = normalizeCpf(row?.cpf ?? row?.cpf_numero);

  return {
    id: safeString(row?.servidor ?? row?.id ?? row?.servidor_id ?? row?.uuid ?? cpf ?? nomeCompleto),
    nome: nomeCompleto || safeString(row?.nome),
    nomeCompleto,
    matricula: safeString(row?.matricula ?? row?.matricula_funcional),
    cpf,
    dataNascimento: row?.data_nascimento ?? row?.dataNascimento ?? null,
    sexo: (safeString(row?.sexo).toUpperCase() as Servidor['sexo']) || '',
    rgNumero: safeString(row?.rg_numero ?? row?.rgNumero),
    rgOrgaoEmissor: safeString(row?.rg_orgao_emissor ?? row?.rgOrgaoEmissor),
    rgUf: safeString(row?.rg_uf ?? row?.rgUf),
    email: safeString(row?.email),
    escolaridade: safeString(row?.escolaridade),
    profissao: safeString(row?.profissao),
    vinculo: safeString(row?.vinculo),
    funcao: safeString(row?.funcao),
    cargaHoraria: safeString(row?.carga_horaria ?? row?.cargaHoraria),
    inicioExercicio: row?.inicio_exercicio ?? row?.inicioExercicio ?? null,
    categoria: (safeString(row?.categoria).toUpperCase() as Servidor['categoria']) || '',
    setor: safeString(row?.setor ?? row?.lotacao ?? row?.lotacao_interna),
    cargo: safeString(row?.cargo),
    telefone: safeString(row?.telefone),
    lotacaoInterna: safeString(row?.lotacao_interna ?? row?.lotacaoInterna),
    turno: safeString(row?.turno),
    status: (safeString(row?.status).toUpperCase() as Servidor['status']) || 'ATIVO',
    observacao: safeString(row?.observacao),
    aniversario: row?.aniversario ?? null,
  };
};

const uniqueServidores = (items: Servidor[]) => {
  const map = new Map<string, Servidor>();

  for (const item of items) {
    const key = normalizeCpf(item.cpf) || safeString(item.id) || safeString(item.nomeCompleto);
    if (!key) continue;
    if (!map.has(key)) map.set(key, item);
  }

  return Array.from(map.values()).sort((a, b) =>
    safeString(a.nomeCompleto || a.nome).localeCompare(safeString(b.nomeCompleto || b.nome), 'pt-BR', {
      sensitivity: 'base',
    }),
  );
};

const flattenRowToPeriods = (
  row: DbFeriasRow,
  servidoresMap?: Map<string, Servidor>,
): FeriasUiRecord[] => {
  const servidorId = safeString(row.servidor_id);
  const servidor =
    servidoresMap?.get(servidorId) ||
    servidoresMap?.get(normalizeCpf(servidorId)) ||
    servidoresMap?.get(safeString(servidorId));

  const observacao = safeString(row.observacao);
  const periods: FeriasUiRecord[] = [];

  const pushIfValid = (slot: FeriasPeriodoSlot, inicioRaw?: NullableString, fimRaw?: NullableString) => {
    const inicio = safeString(inicioRaw);
    const fim = safeString(fimRaw);
    if (!inicio || !fim) return;

    periods.push({
      id: buildPeriodoSyntheticId(safeString(row.id), slot),
      rowId: safeString(row.id),
      slot,
      servidorId,
      ano: Number(row.ano || toYear(inicio)),
      inicio,
      fim,
      dias: calculateDays(inicio, fim),
      observacao,
      servidorNome: servidor?.nomeCompleto || servidor?.nome || '',
      matricula: servidor?.matricula || '',
      cpf: servidor?.cpf || '',
      setor: servidor?.setor || '',
    });
  };

  pushIfValid(1, row.periodo1_inicio, row.periodo1_fim);
  pushIfValid(2, row.periodo2_inicio, row.periodo2_fim);
  pushIfValid(3, row.periodo3_inicio, row.periodo3_fim);

  return sortByInicio(periods);
};

const getNextAvailableSlot = (row: DbFeriasRow): FeriasPeriodoSlot | null => {
  if (!safeString(row.periodo1_inicio) && !safeString(row.periodo1_fim)) return 1;
  if (!safeString(row.periodo2_inicio) && !safeString(row.periodo2_fim)) return 2;
  if (!safeString(row.periodo3_inicio) && !safeString(row.periodo3_fim)) return 3;
  return null;
};

const rowHasAnyPeriod = (row: Partial<DbFeriasRow>) =>
  !!(
    safeString(row.periodo1_inicio) ||
    safeString(row.periodo1_fim) ||
    safeString(row.periodo2_inicio) ||
    safeString(row.periodo2_fim) ||
    safeString(row.periodo3_inicio) ||
    safeString(row.periodo3_fim)
  );

const ensureValidPeriodo = (inicio?: NullableString, fim?: NullableString) => {
  const safeInicio = safeString(inicio);
  const safeFim = safeString(fim);

  if (!safeInicio || !safeFim) {
    throw new Error('Informe a data inicial e final do período de férias.');
  }

  if (calculateDays(safeInicio, safeFim) <= 0) {
    throw new Error('O período informado é inválido.');
  }
};

const fetchServidoresMap = async () => {
  const { data, error } = await supabase
    .from(TABLE_SERVIDORES)
    .select('*')
    .order('nome_completo', { ascending: true });

  if (error) {
    console.error('Erro ao carregar servidores para férias:', error);
    return new Map<string, Servidor>();
  }

  const servidores = uniqueServidores((Array.isArray(data) ? data : []).map(mapServidorRow));
  const map = new Map<string, Servidor>();

  for (const servidor of servidores) {
    if (safeString(servidor.id)) map.set(safeString(servidor.id), servidor);
    if (normalizeCpf(servidor.cpf)) map.set(normalizeCpf(servidor.cpf), servidor);
  }

  return map;
};

const fetchFeriasRows = async (filtros?: ListarFeriasParams) => {
  let query = supabase.from(TABLE_FERIAS).select('*');

  if (filtros?.ano) {
    query = query.eq('ano', filtros.ano);
  }

  if (filtros?.servidorId) {
    const raw = safeString(filtros.servidorId);
    query = query.eq('servidor_id', raw);
  }

  const { data, error } = await query.order('ano', { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error, 'Falha ao listar férias.'));
  }

  return (Array.isArray(data) ? data : []) as DbFeriasRow[];
};

const fetchRowById = async (rowId: string) => {
  const { data, error } = await supabase.from(TABLE_FERIAS).select('*').eq('id', rowId).single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Registro de férias não encontrado.'));
  }

  return data as DbFeriasRow;
};

const findRowsByServidorAno = async (servidorId: string, ano: number) => {
  const { data, error } = await supabase
    .from(TABLE_FERIAS)
    .select('*')
    .eq('servidor_id', servidorId)
    .eq('ano', ano)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(getErrorMessage(error, 'Falha ao buscar férias do servidor.'));
  }

  return (Array.isArray(data) ? data : []) as DbFeriasRow[];
};

const registrarLog = async (
  acao: 'CRIAR' | 'EDITAR' | 'EXCLUIR',
  entidadeId: string,
  detalhes: unknown,
) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await logsService.registrar({
      user_id: user?.id || 'sistema',
      user_email: user?.email,
      acao,
      entidade: 'FERIAS',
      entidade_id: entidadeId,
      detalhes,
    });
  } catch (error) {
    console.error(`Falha ao registrar log de ${acao} em férias:`, error);
  }
};

const validateNoOverlap = (
  rows: DbFeriasRow[],
  incoming: { inicio: string; fim: string; ignoreSyntheticId?: string },
) => {
  for (const row of rows) {
    const flattened = flattenRowToPeriods(row);

    for (const periodo of flattened) {
      if (incoming.ignoreSyntheticId && periodo.id === incoming.ignoreSyntheticId) continue;

      if (overlaps(periodo.inicio, periodo.fim, incoming.inicio, incoming.fim)) {
        throw new Error(
          `O período informado conflita com outro período já cadastrado (${periodo.inicio} até ${periodo.fim}).`,
        );
      }
    }
  }
};

export const apiFerias = {
  async listar(filtros?: ListarFeriasParams): Promise<FeriasUiRecord[]> {
    if (API_CONFIG.useMock) {
      const rows = [...feriasMock];

      const flattened = rows.flatMap((item) => {
        const row: DbFeriasRow = {
          id: item.id,
          servidor_id: item.servidorId,
          ano: item.ano,
          periodo1_inicio: item.periodo1Inicio,
          periodo1_fim: item.periodo1Fim,
          periodo2_inicio: item.periodo2Inicio,
          periodo2_fim: item.periodo2Fim,
          periodo3_inicio: item.periodo3Inicio,
          periodo3_fim: item.periodo3Fim,
          observacao: item.observacao,
        };

        return flattenRowToPeriods(row);
      });

      return flattened.filter((item) => {
        if (filtros?.ano && item.ano !== filtros.ano) return false;
        if (filtros?.servidorId && safeString(item.servidorId) !== safeString(filtros.servidorId)) return false;
        return true;
      });
    }

    const [rows, servidoresMap] = await Promise.all([fetchFeriasRows(filtros), fetchServidoresMap()]);

    return rows
      .flatMap((row) => flattenRowToPeriods(row, servidoresMap))
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
  },

  async list(filtros?: ListarFeriasParams): Promise<FeriasUiRecord[]> {
    return this.listar(filtros);
  },

  async getAll(filtros?: ListarFeriasParams): Promise<FeriasUiRecord[]> {
    return this.listar(filtros);
  },

  async listarLegado(filtros?: ListarFeriasParams): Promise<Ferias[]> {
    if (API_CONFIG.useMock) {
      return [...feriasMock]
        .filter((item) => {
          if (filtros?.ano && item.ano !== filtros.ano) return false;
          if (filtros?.servidorId && safeString(item.servidorId) !== safeString(filtros.servidorId)) return false;
          return true;
        })
        .sort((a, b) => b.ano - a.ano);
    }

    const rows = await fetchFeriasRows(filtros);
    return rows.map(mapLegacyRowToFerias);
  },

  async obterPorId(id: string): Promise<FeriasUiRecord> {
    if (API_CONFIG.useMock) {
      const parsed = parsePeriodoSyntheticId(id);

      if (parsed) {
        const row = feriasMock.find((item) => safeString(item.id) === parsed.rowId);
        if (!row) throw new Error('Registro de férias não encontrado.');

        const dbRow: DbFeriasRow = {
          id: row.id,
          servidor_id: row.servidorId,
          ano: row.ano,
          periodo1_inicio: row.periodo1Inicio,
          periodo1_fim: row.periodo1Fim,
          periodo2_inicio: row.periodo2Inicio,
          periodo2_fim: row.periodo2Fim,
          periodo3_inicio: row.periodo3Inicio,
          periodo3_fim: row.periodo3Fim,
          observacao: row.observacao,
        };

        const period = flattenRowToPeriods(dbRow).find((item) => item.id === id);
        if (!period) throw new Error('Período de férias não encontrado.');
        return period;
      }

      const row = feriasMock.find((item) => safeString(item.id) === safeString(id));
      if (!row) throw new Error('Registro de férias não encontrado.');

      const period = flattenRowToPeriods({
        id: row.id,
        servidor_id: row.servidorId,
        ano: row.ano,
        periodo1_inicio: row.periodo1Inicio,
        periodo1_fim: row.periodo1Fim,
        periodo2_inicio: row.periodo2Inicio,
        periodo2_fim: row.periodo2Fim,
        periodo3_inicio: row.periodo3Inicio,
        periodo3_fim: row.periodo3Fim,
        observacao: row.observacao,
      })[0];

      if (!period) throw new Error('Período de férias não encontrado.');
      return period;
    }

    const parsed = parsePeriodoSyntheticId(id);

    if (parsed) {
      const [row, servidoresMap] = await Promise.all([fetchRowById(parsed.rowId), fetchServidoresMap()]);
      const flattened = flattenRowToPeriods(row, servidoresMap);
      const found = flattened.find((item) => item.id === id);

      if (!found) throw new Error('Período de férias não encontrado.');
      return found;
    }

    const [row, servidoresMap] = await Promise.all([fetchRowById(id), fetchServidoresMap()]);
    const firstPeriod = flattenRowToPeriods(row, servidoresMap)[0];

    if (!firstPeriod) {
      throw new Error('Registro de férias não possui período válido.');
    }

    return firstPeriod;
  },

  async criar(payload: FeriasSavePayload): Promise<FeriasUiRecord> {
    const servidorId = safeString(payload.servidorId || payload.cpf);
    const inicio = safeString(payload.inicio);
    const fim = safeString(payload.fim);
    const observacao = safeString(payload.observacao);
    const ano = Number(payload.ano || toYear(inicio));

    if (!servidorId) {
      throw new Error('Servidor não informado para o cadastro de férias.');
    }

    ensureValidPeriodo(inicio, fim);

    if (API_CONFIG.useMock) {
      const existingIndex = feriasMock.findIndex(
        (item) => safeString(item.servidorId) === servidorId && Number(item.ano) === ano,
      );

      if (existingIndex >= 0) {
        const row = feriasMock[existingIndex];
        const dbRow: DbFeriasRow = {
          id: row.id,
          servidor_id: row.servidorId,
          ano: row.ano,
          periodo1_inicio: row.periodo1Inicio,
          periodo1_fim: row.periodo1Fim,
          periodo2_inicio: row.periodo2Inicio,
          periodo2_fim: row.periodo2Fim,
          periodo3_inicio: row.periodo3Inicio,
          periodo3_fim: row.periodo3Fim,
          observacao: row.observacao,
        };

        validateNoOverlap([dbRow], { inicio, fim });

        const nextSlot = getNextAvailableSlot(dbRow);
        if (!nextSlot) {
          throw new Error('Este servidor já possui 3 períodos cadastrados para esse ano.');
        }

        if (nextSlot === 1) {
          row.periodo1Inicio = inicio;
          row.periodo1Fim = fim;
        }
        if (nextSlot === 2) {
          row.periodo2Inicio = inicio;
          row.periodo2Fim = fim;
        }
        if (nextSlot === 3) {
          row.periodo3Inicio = inicio;
          row.periodo3Fim = fim;
        }

        row.observacao = observacao || row.observacao;

        return {
          id: buildPeriodoSyntheticId(row.id, nextSlot),
          rowId: row.id,
          slot: nextSlot,
          servidorId,
          ano,
          inicio,
          fim,
          dias: calculateDays(inicio, fim),
          observacao: row.observacao,
          servidorNome: safeString(payload.servidorNome),
          matricula: safeString(payload.matricula),
          cpf: normalizeCpf(payload.cpf),
          setor: safeString(payload.setor),
        };
      }

      const novo: Ferias = {
        id: Math.random().toString(36).slice(2, 10),
        servidorId,
        ano,
        periodo1Inicio: inicio,
        periodo1Fim: fim,
        periodo2Inicio: '',
        periodo2Fim: '',
        periodo3Inicio: '',
        periodo3Fim: '',
        observacao,
      };

      feriasMock.push(novo);

      return {
        id: buildPeriodoSyntheticId(novo.id, 1),
        rowId: novo.id,
        slot: 1,
        servidorId,
        ano,
        inicio,
        fim,
        dias: calculateDays(inicio, fim),
        observacao,
        servidorNome: safeString(payload.servidorNome),
        matricula: safeString(payload.matricula),
        cpf: normalizeCpf(payload.cpf),
        setor: safeString(payload.setor),
      };
    }

    const existingRows = await findRowsByServidorAno(servidorId, ano);
    validateNoOverlap(existingRows, { inicio, fim });

    let savedRowId = '';
    let savedSlot: FeriasPeriodoSlot = 1;

    if (existingRows.length > 0) {
      let targetRow: DbFeriasRow | null = null;

      for (const row of existingRows) {
        const slot = getNextAvailableSlot(row);
        if (slot) {
          targetRow = row;
          savedSlot = slot;
          break;
        }
      }

      if (!targetRow) {
        throw new Error('Este servidor já possui 3 períodos cadastrados para esse ano.');
      }

      const fieldNames = getPeriodoFieldNames(savedSlot);
      const updatePayload: Record<string, unknown> = {
        [fieldNames.inicio]: inicio,
        [fieldNames.fim]: fim,
      };

      if (observacao) {
        updatePayload.observacao = observacao;
      }

      const { data, error } = await supabase
        .from(TABLE_FERIAS)
        .update(updatePayload)
        .eq('id', targetRow.id)
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(getErrorMessage(error, 'Falha ao adicionar período de férias.'));
      }

      savedRowId = safeString(data.id);
    } else {
      const insertPayload = {
        servidor_id: servidorId,
        ano,
        periodo1_inicio: inicio,
        periodo1_fim: fim,
        periodo2_inicio: null,
        periodo2_fim: null,
        periodo3_inicio: null,
        periodo3_fim: null,
        observacao: observacao || null,
      };

      const { data, error } = await supabase
        .from(TABLE_FERIAS)
        .insert(insertPayload)
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(getErrorMessage(error, 'Falha ao criar férias.'));
      }

      savedRowId = safeString(data.id);
      savedSlot = 1;
    }

    const syntheticId = buildPeriodoSyntheticId(savedRowId, savedSlot);
    await registrarLog('CRIAR', syntheticId, {
      servidorId,
      ano,
      inicio,
      fim,
      observacao,
    });

    const saved = await this.obterPorId(syntheticId);
    return {
      ...saved,
      servidorNome: safeString(saved.servidorNome || payload.servidorNome),
      matricula: safeString(saved.matricula || payload.matricula),
      cpf: normalizeCpf(saved.cpf || payload.cpf),
      setor: safeString(saved.setor || payload.setor),
    };
  },

  async adicionar(payload: FeriasSavePayload): Promise<FeriasUiRecord> {
    return this.criar(payload);
  },

  async create(payload: FeriasSavePayload): Promise<FeriasUiRecord> {
    return this.criar(payload);
  },

  async editar(id: string, payload: FeriasSavePayload): Promise<FeriasUiRecord> {
    const parsed = parsePeriodoSyntheticId(id);

    if (!parsed) {
      throw new Error(
        'Identificador de férias inválido. Esperado formato de período, por exemplo: rowId::periodo1.',
      );
    }

    const inicio = safeString(payload.inicio);
    const fim = safeString(payload.fim);
    const observacao = safeString(payload.observacao);

    ensureValidPeriodo(inicio, fim);

    if (API_CONFIG.useMock) {
      const row = feriasMock.find((item) => safeString(item.id) === parsed.rowId);
      if (!row) throw new Error('Registro de férias não encontrado.');

      const dbRow: DbFeriasRow = {
        id: row.id,
        servidor_id: row.servidorId,
        ano: row.ano,
        periodo1_inicio: row.periodo1Inicio,
        periodo1_fim: row.periodo1Fim,
        periodo2_inicio: row.periodo2Inicio,
        periodo2_fim: row.periodo2Fim,
        periodo3_inicio: row.periodo3Inicio,
        periodo3_fim: row.periodo3Fim,
        observacao: row.observacao,
      };

      validateNoOverlap([dbRow], { inicio, fim, ignoreSyntheticId: id });

      if (parsed.slot === 1) {
        row.periodo1Inicio = inicio;
        row.periodo1Fim = fim;
      }
      if (parsed.slot === 2) {
        row.periodo2Inicio = inicio;
        row.periodo2Fim = fim;
      }
      if (parsed.slot === 3) {
        row.periodo3Inicio = inicio;
        row.periodo3Fim = fim;
      }

      row.observacao = observacao || row.observacao;

      return {
        id,
        rowId: row.id,
        slot: parsed.slot,
        servidorId: row.servidorId,
        ano: row.ano,
        inicio,
        fim,
        dias: calculateDays(inicio, fim),
        observacao: row.observacao,
        servidorNome: safeString(payload.servidorNome),
        matricula: safeString(payload.matricula),
        cpf: normalizeCpf(payload.cpf),
        setor: safeString(payload.setor),
      };
    }

    const row = await fetchRowById(parsed.rowId);
    const rowsSameServidorAno = await findRowsByServidorAno(safeString(row.servidor_id), Number(row.ano));

    validateNoOverlap(rowsSameServidorAno, { inicio, fim, ignoreSyntheticId: id });

    const fieldNames = getPeriodoFieldNames(parsed.slot);
    const updatePayload: Record<string, unknown> = {
      [fieldNames.inicio]: inicio,
      [fieldNames.fim]: fim,
    };

    if (observacao) {
      updatePayload.observacao = observacao;
    }

    const { error } = await supabase.from(TABLE_FERIAS).update(updatePayload).eq('id', parsed.rowId);

    if (error) {
      throw new Error(getErrorMessage(error, 'Falha ao editar férias.'));
    }

    await registrarLog('EDITAR', id, {
      inicio,
      fim,
      observacao,
    });

    const saved = await this.obterPorId(id);

    return {
      ...saved,
      servidorNome: safeString(saved.servidorNome || payload.servidorNome),
      matricula: safeString(saved.matricula || payload.matricula),
      cpf: normalizeCpf(saved.cpf || payload.cpf),
      setor: safeString(saved.setor || payload.setor),
    };
  },

  async atualizar(id: string, payload: FeriasSavePayload): Promise<FeriasUiRecord> {
    return this.editar(id, payload);
  },

  async update(id: string, payload: FeriasSavePayload): Promise<FeriasUiRecord> {
    return this.editar(id, payload);
  },

  async excluir(id: string): Promise<void> {
    const parsed = parsePeriodoSyntheticId(id);

    if (!parsed) {
      throw new Error(
        'Identificador de férias inválido. Esperado formato de período, por exemplo: rowId::periodo1.',
      );
    }

    if (API_CONFIG.useMock) {
      const index = feriasMock.findIndex((item) => safeString(item.id) === parsed.rowId);
      if (index < 0) throw new Error('Registro de férias não encontrado.');

      const row = feriasMock[index];

      if (parsed.slot === 1) {
        row.periodo1Inicio = '';
        row.periodo1Fim = '';
      }
      if (parsed.slot === 2) {
        row.periodo2Inicio = '';
        row.periodo2Fim = '';
      }
      if (parsed.slot === 3) {
        row.periodo3Inicio = '';
        row.periodo3Fim = '';
      }

      if (
        !row.periodo1Inicio &&
        !row.periodo1Fim &&
        !row.periodo2Inicio &&
        !row.periodo2Fim &&
        !row.periodo3Inicio &&
        !row.periodo3Fim
      ) {
        feriasMock.splice(index, 1);
      }

      return;
    }

    const row = await fetchRowById(parsed.rowId);
    const fieldNames = getPeriodoFieldNames(parsed.slot);

    const updatePayload: Record<string, unknown> = {
      [fieldNames.inicio]: null,
      [fieldNames.fim]: null,
    };

    const { data, error } = await supabase
      .from(TABLE_FERIAS)
      .update(updatePayload)
      .eq('id', parsed.rowId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(getErrorMessage(error, 'Falha ao excluir período de férias.'));
    }

    const updatedRow = data as DbFeriasRow;

    if (!rowHasAnyPeriod(updatedRow)) {
      const { error: deleteError } = await supabase.from(TABLE_FERIAS).delete().eq('id', parsed.rowId);

      if (deleteError) {
        throw new Error(getErrorMessage(deleteError, 'Falha ao limpar registro de férias.'));
      }
    }

    await registrarLog('EXCLUIR', id, {
      rowId: parsed.rowId,
      slot: parsed.slot,
      servidorId: row.servidor_id,
      ano: row.ano,
    });
  },

  async remover(id: string): Promise<void> {
    return this.excluir(id);
  },

  async delete(id: string): Promise<void> {
    return this.excluir(id);
  },
};

export const feriasService = apiFerias;
export default feriasService;
