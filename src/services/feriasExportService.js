const { createClient } = require('@supabase/supabase-js');
const { buildDocxBuffer, convertDocxBufferToPdfBuffer } = require('../utils/feriasTemplateBuilder');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórios para exportação de férias.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const CATEGORIAS_CANONICAS = [
  'EFETIVO SESAU',
  'SELETIVO SESAU',
  'EFETIVO SETRABES',
  'SELETIVO SETRABES',
  'FEDERAIS SETRABES',
  'COMISSIONADOS',
];

const safe = (value) => String(value ?? '').trim();
const normalizeCpf = (value) => safe(value).replace(/\D/g, '');
const normalizeCategoria = (value) => safe(value).toUpperCase();
const normalizeStatus = (value) => safe(value).toUpperCase() || 'ATIVO';
const normalizeSetor = (value) => {
  const text = safe(value);
  return !text || text === 'TODOS' ? '' : text;
};

const normalizeMes = (value) => {
  if (value === undefined || value === null || value === 'TODOS') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDate = (value) => {
  const raw = safe(value);
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = parseDate(value);
  return date ? date.toLocaleDateString('pt-BR') : '';
};

const overlapsMonth = (inicio, fim, ano, mes) => {
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

const buildKey = ({ cpf, id, nome, matricula }) => {
  const cpfDigits = normalizeCpf(cpf);
  if (cpfDigits) return `cpf:${cpfDigits}`;

  const safeId = safe(id);
  if (safeId) return `id:${safeId}`;

  return `fallback:${safe(nome).toUpperCase()}|${safe(matricula).toUpperCase()}`;
};

const defaultFilters = (filters) => ({
  ano: Number(filters?.ano) || new Date().getFullYear(),
  categoria: filters?.categoria || 'TODOS',
  setor: filters?.setor || 'TODOS',
  status: filters?.status || 'ATIVO',
  mes: filters?.mes ?? 'TODOS',
  tipoExtracao: filters?.tipoExtracao || 'COM_FERIAS',
  ordenacao: filters?.ordenacao || 'NOME',
  formato: filters?.formato || 'DOCX',
});

async function fetchServidores() {
  const { data, error } = await supabase
    .from('servidores')
    .select('*')
    .order('nome_completo', { ascending: true });

  if (error) {
    throw new Error(`Falha ao buscar servidores: ${error.message}`);
  }

  return Array.isArray(data) ? data : [];
}

async function fetchFerias(ano) {
  const { data, error } = await supabase
    .from('ferias')
    .select('*')
    .eq('ano', ano)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Falha ao buscar férias: ${error.message}`);
  }

  return Array.isArray(data) ? data : [];
}

function mapServidor(raw) {
  return {
    id: safe(raw?.servidor || raw?.id || raw?.uuid || raw?.cpf),
    nome: safe(raw?.nome_completo || raw?.nomeCompleto || raw?.nome || raw?.servidor_nome),
    matricula: safe(raw?.matricula),
    cpf: normalizeCpf(raw?.cpf),
    categoria: normalizeCategoria(raw?.categoria_canonica || raw?.categoria),
    setor: safe(raw?.setor || raw?.lotacao || raw?.lotacao_interna),
    status: normalizeStatus(raw?.status),
  };
}

function flattenFeriasRow(raw, servidorMap) {
  const cpf = normalizeCpf(raw?.servidor_cpf);
  const servidor = servidorMap.get(cpf);

  const base = {
    key: buildKey({
      cpf,
      id: cpf,
      nome: safe(servidor?.nome),
      matricula: safe(servidor?.matricula),
    }),
    nome: safe(servidor?.nome),
    matricula: safe(servidor?.matricula),
    cpf,
    categoria: normalizeCategoria(servidor?.categoria),
    setor: safe(servidor?.setor),
    status: normalizeStatus(servidor?.status),
  };

  const periods = [
    { slot: 1, inicio: safe(raw?.periodo1_inicio), fim: safe(raw?.periodo1_fim) },
    { slot: 2, inicio: safe(raw?.periodo2_inicio), fim: safe(raw?.periodo2_fim) },
    { slot: 3, inicio: safe(raw?.periodo3_inicio), fim: safe(raw?.periodo3_fim) },
  ];

  return periods
    .filter((item) => item.inicio && item.fim)
    .map((item) => ({
      ...base,
      slot: item.slot,
      inicio: item.inicio,
      fim: item.fim,
      ano: Number(raw?.ano) || 0,
    }));
}

function consolidateData(rawServidores, rawFerias, filters) {
  const servidores = rawServidores.map(mapServidor);
  const servidorMap = new Map();

  for (const servidor of servidores) {
    if (servidor.cpf) servidorMap.set(servidor.cpf, servidor);
  }

  const map = new Map();

  for (const servidor of servidores) {
    const key = buildKey({
      cpf: servidor.cpf,
      id: servidor.id,
      nome: servidor.nome,
      matricula: servidor.matricula,
    });

    map.set(key, {
      key,
      nome: safe(servidor.nome),
      matricula: safe(servidor.matricula),
      cpf: normalizeCpf(servidor.cpf),
      categoria: normalizeCategoria(servidor.categoria),
      setor: safe(servidor.setor),
      status: normalizeStatus(servidor.status),
      exercicio: String(filters.ano),
      periodo1: null,
      periodo2: null,
      periodo3: null,
    });
  }

  const flatFerias = rawFerias
    .flatMap((row) => flattenFeriasRow(row, servidorMap))
    .sort((a, b) => a.inicio.localeCompare(b.inicio));

  const grouped = new Map();

  for (const item of flatFerias) {
    const bucket = grouped.get(item.key) || [];
    bucket.push(item);
    grouped.set(item.key, bucket);
  }

  for (const [key, periods] of grouped.entries()) {
    const base =
      map.get(key) ||
      {
        key,
        nome: safe(periods[0]?.nome),
        matricula: safe(periods[0]?.matricula),
        cpf: normalizeCpf(periods[0]?.cpf),
        categoria: normalizeCategoria(periods[0]?.categoria),
        setor: safe(periods[0]?.setor),
        status: normalizeStatus(periods[0]?.status),
        exercicio: String(filters.ano),
        periodo1: null,
        periodo2: null,
        periodo3: null,
      };

    const sorted = [...periods].sort((a, b) => a.inicio.localeCompare(b.inicio));

    base.periodo1 = sorted[0] ? { inicio: sorted[0].inicio, fim: sorted[0].fim } : null;
    base.periodo2 = sorted[1] ? { inicio: sorted[1].inicio, fim: sorted[1].fim } : null;
    base.periodo3 = sorted[2] ? { inicio: sorted[2].inicio, fim: sorted[2].fim } : null;

    if (!base.nome) base.nome = safe(sorted[0]?.nome);
    if (!base.matricula) base.matricula = safe(sorted[0]?.matricula);
    if (!base.cpf) base.cpf = normalizeCpf(sorted[0]?.cpf);
    if (!base.categoria) base.categoria = normalizeCategoria(sorted[0]?.categoria);
    if (!base.setor) base.setor = safe(sorted[0]?.setor);
    if (!base.status) base.status = normalizeStatus(sorted[0]?.status);

    map.set(key, base);
  }

  return Array.from(map.values());
}

function hasAnyPeriod(row) {
  return !!(
    row.periodo1?.inicio ||
    row.periodo1?.fim ||
    row.periodo2?.inicio ||
    row.periodo2?.fim ||
    row.periodo3?.inicio ||
    row.periodo3?.fim
  );
}

function hasPeriodInMonth(row, filters) {
  const mes = normalizeMes(filters.mes);

  return (
    overlapsMonth(row.periodo1?.inicio, row.periodo1?.fim, filters.ano, mes) ||
    overlapsMonth(row.periodo2?.inicio, row.periodo2?.fim, filters.ano, mes) ||
    overlapsMonth(row.periodo3?.inicio, row.periodo3?.fim, filters.ano, mes)
  );
}

function shouldIncludeByTipo(row, filters) {
  if (filters.tipoExtracao === 'TODOS_SERVIDORES') return true;
  if (filters.tipoExtracao === 'COM_FERIAS') return hasAnyPeriod(row);
  if (filters.tipoExtracao === 'NO_MES') return hasPeriodInMonth(row, filters);
  if (filters.tipoExtracao === 'PLANEJAMENTO_ANUAL') return hasAnyPeriod(row);
  if (filters.tipoExtracao === 'APENAS_1_PERIODO') return !!(row.periodo1?.inicio && row.periodo1?.fim);
  if (filters.tipoExtracao === 'APENAS_2_PERIODO') return !!(row.periodo2?.inicio && row.periodo2?.fim);
  if (filters.tipoExtracao === 'APENAS_3_PERIODO') return !!(row.periodo3?.inicio && row.periodo3?.fim);
  return true;
}

function applyTipoVisual(row, filters) {
  const next = {
    ...row,
    periodo1: row.periodo1 ? { ...row.periodo1 } : null,
    periodo2: row.periodo2 ? { ...row.periodo2 } : null,
    periodo3: row.periodo3 ? { ...row.periodo3 } : null,
  };

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
}

function sortRows(rows, ordenacao) {
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
}

function buildPreparedData(filters, consolidatedRows) {
  const categoriaFiltro = filters.categoria || 'TODOS';
  const setorFiltro = normalizeSetor(filters.setor);
  const statusFiltro = filters.status || 'ATIVO';
  const ordenacao = filters.ordenacao || 'NOME';

  const filtered = consolidatedRows
    .filter((row) => {
      if (categoriaFiltro !== 'TODOS' && row.categoria !== categoriaFiltro) return false;
      if (setorFiltro && row.setor !== setorFiltro) return false;
      if (statusFiltro !== 'TODOS' && row.status !== statusFiltro) return false;
      return true;
    })
    .filter((row) => shouldIncludeByTipo(row, filters))
    .map((row) => applyTipoVisual(row, filters));

  if (!filtered.length) {
    throw new Error('Nenhum registro encontrado para os filtros informados.');
  }

  const totalComFerias = filtered.filter((row) => hasAnyPeriod(row)).length;
  const totalSemFerias = filtered.filter((row) => !hasAnyPeriod(row)).length;

  const sections = [];

  const setorDocumento = (categoria) => {
    const setor = normalizeSetor(filters.setor);
    if (setor) return setor;
    if ((filters.categoria || 'TODOS') === 'TODOS') return categoria || 'TODOS OS SETORES';
    return 'TODOS OS SETORES';
  };

  const subtitle = (categoria) => {
    const cat = safe(categoria);
    return cat ? `SERVIDORES ${cat}` : 'SERVIDORES';
  };

  if ((filters.categoria || 'TODOS') === 'TODOS') {
    const categoriesInRows = Array.from(new Set(filtered.map((row) => row.categoria).filter(Boolean)));

    const orderedCategories = [
      ...CATEGORIAS_CANONICAS.filter((item) => categoriesInRows.includes(item)),
      ...categoriesInRows.filter((item) => !CATEGORIAS_CANONICAS.includes(item)).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    ];

    for (const categoria of orderedCategories) {
      const rows = filtered.filter((row) => row.categoria === categoria);
      if (!rows.length) continue;

      sections.push({
        categoria,
        subtitle: subtitle(categoria),
        setorDocumento: setorDocumento(categoria),
        rows: sortRows(rows, ordenacao),
      });
    }
  } else {
    const categoria = safe(filters.categoria || 'SERVIDORES');
    sections.push({
      categoria,
      subtitle: subtitle(categoria),
      setorDocumento: setorDocumento(categoria),
      rows: sortRows(filtered, ordenacao),
    });
  }

  return {
    sections,
    totalLinhas: filtered.length,
    totalComFerias,
    totalSemFerias,
  };
}

function buildCsvBuffer(preparedData) {
  const header = [
    'nome',
    'matrícula',
    'cpf',
    'categoria',
    'setor',
    'status',
    'exercício',
    'periodo1_inicio',
    'periodo1_fim',
    'periodo2_inicio',
    'periodo2_fim',
    'periodo3_inicio',
    'periodo3_fim',
  ];

  const escapeCsv = (value) => {
    const text = safe(value);
    if (text.includes(';') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const lines = [
    header.join(';'),
    ...preparedData.sections.flatMap((section) =>
      section.rows.map((row) =>
        [
          row.nome,
          row.matricula,
          row.cpf,
          row.categoria,
          row.setor,
          row.status,
          row.exercicio,
          formatDate(row.periodo1?.inicio),
          formatDate(row.periodo1?.fim),
          formatDate(row.periodo2?.inicio),
          formatDate(row.periodo2?.fim),
          formatDate(row.periodo3?.inicio),
          formatDate(row.periodo3?.fim),
        ]
          .map(escapeCsv)
          .join(';'),
      ),
    ),
  ].join('\n');

  return Buffer.from(`\uFEFF${lines}`, 'utf8');
}

function buildFilename(filters) {
  const categoria = safe(filters.categoria || 'TODOS').toLowerCase().replace(/\s+/g, '_');
  const setor = safe(filters.setor || 'TODOS')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const mes = normalizeMes(filters.mes);
  const ext = filters.formato === 'CSV' ? 'csv' : filters.formato === 'PDF' ? 'pdf' : 'docx';

  return `ferias_${filters.ano}_${categoria}_${setor || 'todos'}_${String(filters.tipoExtracao).toLowerCase()}_${mes || 'todos'}.${ext}`;
}

async function exportarFerias(rawFilters) {
  const filters = defaultFilters(rawFilters);
  const [servidores, ferias] = await Promise.all([fetchServidores(), fetchFerias(filters.ano)]);
  const consolidatedRows = consolidateData(servidores, ferias, filters);
  const preparedData = buildPreparedData(filters, consolidatedRows);

  if (filters.formato === 'CSV') {
    return {
      filename: buildFilename(filters),
      contentType: 'text/csv; charset=utf-8',
      buffer: buildCsvBuffer(preparedData),
    };
  }

  const docxBuffer = await buildDocxBuffer(preparedData, filters);

  if (filters.formato === 'PDF') {
    const pdfBuffer = await convertDocxBufferToPdfBuffer(docxBuffer);
    return {
      filename: buildFilename(filters),
      contentType: 'application/pdf',
      buffer: pdfBuffer,
    };
  }

  return {
    filename: buildFilename(filters),
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: docxBuffer,
  };
}

module.exports = {
  exportarFerias,
};
