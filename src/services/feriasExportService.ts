import { API_CONFIG } from '../config/api';

export type ExportCategoria =
  | 'TODOS'
  | 'EFETIVO SESAU'
  | 'SELETIVO SESAU'
  | 'EFETIVO SETRABES'
  | 'SELETIVO SETRABES'
  | 'FEDERAIS SETRABES'
  | 'COMISSIONADOS';

export type ExportStatus = 'TODOS' | 'ATIVO' | 'INATIVO';

export type ExportTipoExtracao =
  | 'TODOS_SERVIDORES'
  | 'COM_FERIAS'
  | 'NO_MES'
  | 'PLANEJAMENTO_ANUAL'
  | 'APENAS_1_PERIODO'
  | 'APENAS_2_PERIODO'
  | 'APENAS_3_PERIODO';

export type ExportOrdenacao = 'NOME' | 'MATRICULA' | 'CATEGORIA' | 'SETOR';
export type ExportFormato = 'DOCX' | 'PDF' | 'CSV';

export interface ExportFeriasFilters {
  ano: number;
  categoria?: ExportCategoria | 'TODOS';
  setor?: string | 'TODOS';
  status?: ExportStatus;
  mes?: number | 'TODOS';
  tipoExtracao: ExportTipoExtracao;
  ordenacao?: ExportOrdenacao;
  formato: ExportFormato;
}

export interface FeriasExportServidorInput {
  id?: string;
  nome?: string;
  nomeCompleto?: string;
  matricula?: string;
  cpf?: string;
  setor?: string;
  categoria?: string;
  status?: string;
}

export interface FeriasExportRowInput {
  id?: string;
  rowId?: string;
  servidorId?: string;
  servidorNome?: string;
  matricula?: string;
  cpf?: string;
  setor?: string;
  categoria?: string;
  statusServidor?: string;
  ano?: number;
  observacao?: string;
  slot?: number;
  inicio?: string;
  fim?: string;
}

export interface FeriasPeriodoConsolidado {
  inicio: string;
  fim: string;
}

export interface FeriasExportConsolidatedRow {
  key: string;
  nome: string;
  matricula: string;
  cpf: string;
  categoria: string;
  setor: string;
  status: string;
  exercicio: string;
  periodo1: FeriasPeriodoConsolidado | null;
  periodo2: FeriasPeriodoConsolidado | null;
  periodo3: FeriasPeriodoConsolidado | null;
}

export interface FeriasExportSectionPreview {
  categoria: string;
  subtitle: string;
  setorDocumento: string;
  rows: FeriasExportConsolidatedRow[];
}

export interface FeriasExportPreview {
  sections: FeriasExportSectionPreview[];
  totalLinhas: number;
  totalComFerias: number;
  totalSemFerias: number;
}

const CATEGORIAS_CANONICAS: ExportCategoria[] = [
  'EFETIVO SESAU',
  'SELETIVO SESAU',
  'EFETIVO SETRABES',
  'SELETIVO SETRABES',
  'FEDERAIS SETRABES',
  'COMISSIONADOS',
  'TODOS',
];

const safe = (value: unknown) => String(value ?? '').trim();
const normalizeCpf = (value: unknown) => safe(value).replace(/\D/g, '');
const normalizeCategoria = (value: unknown) => safe(value).toUpperCase();
const normalizeStatus = (value: unknown) => safe(value).toUpperCase() || 'ATIVO';

const normalizeMes = (mes?: number | 'TODOS') => {
  if (mes === undefined || mes === null || mes === 'TODOS') return 0;
  const parsed = Number(mes);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeSetor = (setor?: string | 'TODOS') => {
  const value = safe(setor);
  return !value || value === 'TODOS' ? '' : value;
};

const parseDate = (value?: string | null) => {
  const raw = safe(value);
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const overlapsMonth = (inicio?: string | null, fim?: string | null, ano?: number, mes?: number) => {
  if (!ano) return false;

  const start = parseDate(inicio);
  const end = parseDate(fim);

  if (!start || !end) return false;

  if (!mes || mes === 0) {
    return start.getFullYear() === ano || end.getFullYear() === ano;
  }

  const monthStart = new Date(ano, mes - 1, 1);
  const monthEnd = new Date(ano, mes, 0, 23, 59, 59);

  return start <= monthEnd && end >= monthStart;
};

const buildKey = (input: {
  cpf?: string;
  id?: string;
  nome?: string;
  matricula?: string;
}) => {
  const cpf = normalizeCpf(input.cpf);
  if (cpf) return `cpf:${cpf}`;

  const id = safe(input.id);
  if (id) return `id:${id}`;

  return `fallback:${safe(input.nome).toUpperCase()}|${safe(input.matricula).toUpperCase()}`;
};

const buildSubtitle = (categoria: string) => {
  const normalized = safe(categoria);
  return normalized ? `SERVIDORES ${normalized}` : 'SERVIDORES';
};

const buildSetorDocumento = (categoria: string, filters: ExportFeriasFilters) => {
  const setor = normalizeSetor(filters.setor);
  if (setor) return setor;

  if ((filters.categoria || 'TODOS') === 'TODOS') {
    return safe(categoria) || 'TODOS OS SETORES';
  }

  return 'TODOS OS SETORES';
};

const hasAnyPeriod = (row: FeriasExportConsolidatedRow) =>
  !!(
    row.periodo1?.inicio ||
    row.periodo1?.fim ||
    row.periodo2?.inicio ||
    row.periodo2?.fim ||
    row.periodo3?.inicio ||
    row.periodo3?.fim
  );

const hasPeriodInMonth = (row: FeriasExportConsolidatedRow, filters: ExportFeriasFilters) => {
  const ano = Number(filters.ano) || new Date().getFullYear();
  const mes = normalizeMes(filters.mes);

  return (
    overlapsMonth(row.periodo1?.inicio, row.periodo1?.fim, ano, mes) ||
    overlapsMonth(row.periodo2?.inicio, row.periodo2?.fim, ano, mes) ||
    overlapsMonth(row.periodo3?.inicio, row.periodo3?.fim, ano, mes)
  );
};

const cloneRow = (row: FeriasExportConsolidatedRow): FeriasExportConsolidatedRow => ({
  ...row,
  periodo1: row.periodo1 ? { ...row.periodo1 } : null,
  periodo2: row.periodo2 ? { ...row.periodo2 } : null,
  periodo3: row.periodo3 ? { ...row.periodo3 } : null,
});

const applyTipoExtracao = (
  row: FeriasExportConsolidatedRow,
  filters: ExportFeriasFilters,
): FeriasExportConsolidatedRow => {
  const next = cloneRow(row);

  if (filters.tipoExtracao === 'APENAS_1_PERIODO') {
    next.periodo2 = null;
    next.periodo3 = null;
  } else if (filters.tipoExtracao === 'APENAS_2_PERIODO') {
    next.periodo1 = null;
    next.periodo3 = null;
  } else if (filters.tipoExtracao === 'APENAS_3_PERIODO') {
    next.periodo1 = null;
    next.periodo2 = null;
  }

  return next;
};

const shouldIncludeByTipo = (row: FeriasExportConsolidatedRow, filters: ExportFeriasFilters) => {
  if (filters.tipoExtracao === 'TODOS_SERVIDORES') return true;
  if (filters.tipoExtracao === 'COM_FERIAS') return hasAnyPeriod(row);
  if (filters.tipoExtracao === 'NO_MES') return hasPeriodInMonth(row, filters);
  if (filters.tipoExtracao === 'PLANEJAMENTO_ANUAL') return hasAnyPeriod(row);
  if (filters.tipoExtracao === 'APENAS_1_PERIODO') return !!(row.periodo1?.inicio && row.periodo1?.fim);
  if (filters.tipoExtracao === 'APENAS_2_PERIODO') return !!(row.periodo2?.inicio && row.periodo2?.fim);
  if (filters.tipoExtracao === 'APENAS_3_PERIODO') return !!(row.periodo3?.inicio && row.periodo3?.fim);
  return true;
};

const sortRows = (rows: FeriasExportConsolidatedRow[], ordenacao: ExportOrdenacao) => {
  const list = [...rows];

  list.sort((a, b) => {
    if (ordenacao === 'MATRICULA') {
      return a.matricula.localeCompare(b.matricula, 'pt-BR', { sensitivity: 'base' });
    }

    if (ordenacao === 'CATEGORIA') {
      const diff = a.categoria.localeCompare(b.categoria, 'pt-BR', { sensitivity: 'base' });
      return diff !== 0 ? diff : a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
    }

    if (ordenacao === 'SETOR') {
      const diff = a.setor.localeCompare(b.setor, 'pt-BR', { sensitivity: 'base' });
      return diff !== 0 ? diff : a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
    }

    return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
  });

  return list;
};

export const getDefaultFeriasExportFilters = (ano?: number): ExportFeriasFilters => ({
  ano: Number(ano) || new Date().getFullYear(),
  categoria: 'TODOS',
  setor: 'TODOS',
  status: 'ATIVO',
  mes: 'TODOS',
  tipoExtracao: 'COM_FERIAS',
  ordenacao: 'NOME',
  formato: 'DOCX',
});

export const feriasExportLabels = {
  meses: [
    'Todos os meses',
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  categorias: CATEGORIAS_CANONICAS,
  tiposExtracao: {
    TODOS_SERVIDORES: 'Todos os servidores',
    COM_FERIAS: 'Somente servidores com férias cadastradas',
    NO_MES: 'Somente servidores com férias no mês selecionado',
    PLANEJAMENTO_ANUAL: 'Planejamento anual completo',
    APENAS_1_PERIODO: 'Apenas 1º período',
    APENAS_2_PERIODO: 'Apenas 2º período',
    APENAS_3_PERIODO: 'Apenas 3º período',
  } as Record<ExportTipoExtracao, string>,
  ordenacao: {
    NOME: 'Nome A-Z',
    MATRICULA: 'Matrícula',
    CATEGORIA: 'Categoria',
    SETOR: 'Setor',
  } as Record<ExportOrdenacao, string>,
};

export const buildFeriasExportData = (
  filters: ExportFeriasFilters,
  feriasRows: FeriasExportRowInput[],
  servidores: FeriasExportServidorInput[],
): FeriasExportPreview => {
  const normalizedFilters: ExportFeriasFilters = {
    ...getDefaultFeriasExportFilters(filters.ano),
    ...filters,
  };

  const baseMap = new Map<string, FeriasExportConsolidatedRow>();

  for (const servidor of Array.isArray(servidores) ? servidores : []) {
    const row: FeriasExportConsolidatedRow = {
      key: buildKey({
        cpf: servidor.cpf,
        id: servidor.id,
        nome: servidor.nomeCompleto || servidor.nome,
        matricula: servidor.matricula,
      }),
      nome: safe(servidor.nomeCompleto || servidor.nome),
      matricula: safe(servidor.matricula),
      cpf: normalizeCpf(servidor.cpf),
      categoria: normalizeCategoria(servidor.categoria),
      setor: safe(servidor.setor),
      status: normalizeStatus(servidor.status),
      exercicio: String(normalizedFilters.ano),
      periodo1: null,
      periodo2: null,
      periodo3: null,
    };

    baseMap.set(row.key, row);
  }

  const flattenedPeriods = (Array.isArray(feriasRows) ? feriasRows : [])
    .map((item) => ({
      key: buildKey({
        cpf: item.cpf || item.servidorId,
        id: item.servidorId,
        nome: item.servidorNome,
        matricula: item.matricula,
      }),
      nome: safe(item.servidorNome),
      matricula: safe(item.matricula),
      cpf: normalizeCpf(item.cpf || item.servidorId),
      categoria: normalizeCategoria(item.categoria),
      setor: safe(item.setor),
      status: normalizeStatus(item.statusServidor),
      inicio: safe(item.inicio),
      fim: safe(item.fim),
    }))
    .filter((item) => item.inicio && item.fim)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));

  const groupedPeriods = new Map<string, typeof flattenedPeriods>();

  for (const item of flattenedPeriods) {
    const bucket = groupedPeriods.get(item.key) || [];
    bucket.push(item);
    groupedPeriods.set(item.key, bucket);
  }

  for (const [key, periods] of groupedPeriods.entries()) {
    const current =
      baseMap.get(key) ||
      {
        key,
        nome: safe(periods[0]?.nome),
        matricula: safe(periods[0]?.matricula),
        cpf: normalizeCpf(periods[0]?.cpf),
        categoria: normalizeCategoria(periods[0]?.categoria),
        setor: safe(periods[0]?.setor),
        status: normalizeStatus(periods[0]?.status),
        exercicio: String(normalizedFilters.ano),
        periodo1: null,
        periodo2: null,
        periodo3: null,
      };

    const sorted = [...periods].sort((a, b) => a.inicio.localeCompare(b.inicio));

    current.periodo1 = sorted[0] ? { inicio: sorted[0].inicio, fim: sorted[0].fim } : null;
    current.periodo2 = sorted[1] ? { inicio: sorted[1].inicio, fim: sorted[1].fim } : null;
    current.periodo3 = sorted[2] ? { inicio: sorted[2].inicio, fim: sorted[2].fim } : null;

    if (!current.nome) current.nome = safe(sorted[0]?.nome);
    if (!current.matricula) current.matricula = safe(sorted[0]?.matricula);
    if (!current.cpf) current.cpf = normalizeCpf(sorted[0]?.cpf);
    if (!current.categoria) current.categoria = normalizeCategoria(sorted[0]?.categoria);
    if (!current.setor) current.setor = safe(sorted[0]?.setor);
    if (!current.status) current.status = normalizeStatus(sorted[0]?.status);

    baseMap.set(key, current);
  }

  const categoriaFiltro = normalizedFilters.categoria || 'TODOS';
  const setorFiltro = normalizeSetor(normalizedFilters.setor);
  const statusFiltro = normalizedFilters.status || 'ATIVO';
  const ordenacao = normalizedFilters.ordenacao || 'NOME';

  const filtered = Array.from(baseMap.values())
    .filter((row) => {
      if (categoriaFiltro !== 'TODOS' && row.categoria !== categoriaFiltro) return false;
      if (setorFiltro && row.setor !== setorFiltro) return false;
      if (statusFiltro !== 'TODOS' && row.status !== statusFiltro) return false;
      return true;
    })
    .filter((row) => shouldIncludeByTipo(row, normalizedFilters))
    .map((row) => applyTipoExtracao(row, normalizedFilters));

  const totalComFerias = filtered.filter((row) => hasAnyPeriod(row)).length;
  const totalSemFerias = filtered.filter((row) => !hasAnyPeriod(row)).length;

  const sections: FeriasExportSectionPreview[] = [];

  if (categoriaFiltro === 'TODOS') {
    const categoriesInRows = Array.from(
      new Set(filtered.map((row) => row.categoria).filter((item) => safe(item))),
    );

    const orderedCategories = [
      ...CATEGORIAS_CANONICAS.filter((item) => item !== 'TODOS' && categoriesInRows.includes(item)),
      ...categoriesInRows.filter((item) => !CATEGORIAS_CANONICAS.includes(item as ExportCategoria)).sort((a, b) =>
        a.localeCompare(b, 'pt-BR'),
      ),
    ];

    for (const categoria of orderedCategories) {
      const rows = filtered.filter((row) => row.categoria === categoria);
      if (!rows.length) continue;

      sections.push({
        categoria,
        subtitle: buildSubtitle(categoria),
        setorDocumento: buildSetorDocumento(categoria, normalizedFilters),
        rows: sortRows(rows, ordenacao),
      });
    }
  } else {
    sections.push({
      categoria: safe(categoriaFiltro),
      subtitle: buildSubtitle(safe(categoriaFiltro)),
      setorDocumento: buildSetorDocumento(safe(categoriaFiltro), normalizedFilters),
      rows: sortRows(filtered, ordenacao),
    });
  }

  return {
    sections,
    totalLinhas: filtered.length,
    totalComFerias,
    totalSemFerias,
  };
};

const resolveApiBaseUrl = () => {
  const envBase =
    (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_API_BACKEND_URL) ||
    '';

  const configBase =
    (API_CONFIG as any)?.backendUrl ||
    (API_CONFIG as any)?.apiBaseUrl ||
    (API_CONFIG as any)?.baseUrl ||
    '';

  return String(envBase || configBase || '').replace(/\/+$/, '');
};

const parseFilenameFromHeader = (headerValue: string | null) => {
  if (!headerValue) return '';
  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);

  const plainMatch = headerValue.match(/filename="?([^"]+)"?/i);
  return plainMatch?.[1] || '';
};

export const exportFeriasFile = async (
  filters: ExportFeriasFilters,
): Promise<{ filename: string; size: number }> => {
  const apiBase = resolveApiBaseUrl();
  const endpoint = `${apiBase}/api/ferias/exportar`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filters),
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    let errorMessage = 'Falha ao exportar férias.';

    if (contentType.includes('application/json')) {
      try {
        const json = await response.json();
        errorMessage = json?.error || json?.message || errorMessage;
      } catch {
        errorMessage = 'Falha ao exportar férias.';
      }
    } else {
      try {
        const text = await response.text();
        errorMessage = text || errorMessage;
      } catch {
        errorMessage = 'Falha ao exportar férias.';
      }
    }

    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition');
  const filename =
    parseFilenameFromHeader(disposition) ||
    `ferias_${filters.ano}.${filters.formato.toLowerCase() === 'docx' ? 'docx' : filters.formato.toLowerCase()}`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 1500);

  return {
    filename,
    size: blob.size,
  };
};
