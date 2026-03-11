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

export type ExportOrdenacao =
  | 'NOME'
  | 'MATRICULA'
  | 'CATEGORIA'
  | 'SETOR';

export type ExportFormato = 'DOCX' | 'PDF' | 'CSV';

export interface ExportFeriasFilters {
  ano: number;
  categoria?: ExportCategoria | 'TODOS';
  setor?: string | 'TODOS';
  status?: ExportStatus;
  mes?: number | 'TODOS';
  tipoExtracao:
    | 'TODOS_SERVIDORES'
    | 'COM_FERIAS'
    | 'NO_MES'
    | 'PLANEJAMENTO_ANUAL'
    | 'APENAS_1_PERIODO'
    | 'APENAS_2_PERIODO'
    | 'APENAS_3_PERIODO';
  ordenacao?: ExportOrdenacao;
  formato: ExportFormato;
}

export interface FeriasExportPeriodo {
  inicio: string;
  fim: string;
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

interface ConsolidatedRow {
  key: string;
  nome: string;
  matricula: string;
  cpf: string;
  setor: string;
  categoria: string;
  status: string;
  exercicio: string;
  assinatura: string;
  periodo1: FeriasExportPeriodo | null;
  periodo2: FeriasExportPeriodo | null;
  periodo3: FeriasExportPeriodo | null;
}

interface ExportSection {
  categoria: string;
  subtitle: string;
  setorDocumento: string;
  rows: ConsolidatedRow[];
}

interface ExportPreparedData {
  sections: ExportSection[];
  totalLinhas: number;
  totalComFerias: number;
  totalSemFerias: number;
}

const CATEGORIAS_ORDEM: ExportCategoria[] = [
  'EFETIVO SESAU',
  'SELETIVO SESAU',
  'EFETIVO SETRABES',
  'SELETIVO SETRABES',
  'FEDERAIS SETRABES',
  'COMISSIONADOS',
  'TODOS',
];

const TIPOS_EXTRACAO_LABEL: Record<ExportTipoExtracao, string> = {
  TODOS_SERVIDORES: 'Todos os servidores',
  COM_FERIAS: 'Somente servidores com férias cadastradas',
  NO_MES: 'Somente servidores com férias no mês selecionado',
  PLANEJAMENTO_ANUAL: 'Planejamento anual completo',
  APENAS_1_PERIODO: 'Apenas 1º período',
  APENAS_2_PERIODO: 'Apenas 2º período',
  APENAS_3_PERIODO: 'Apenas 3º período',
};

const ORDENACAO_LABEL: Record<ExportOrdenacao, string> = {
  NOME: 'Nome A-Z',
  MATRICULA: 'Matrícula',
  CATEGORIA: 'Categoria',
  SETOR: 'Setor',
};

const FORMATO_LABEL: Record<ExportFormato, string> = {
  DOCX: 'DOCX',
  PDF: 'PDF',
  CSV: 'CSV',
};

const MESES = [
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
];

const safe = (value: unknown) => String(value ?? '').trim();
const digits = (value: unknown) => safe(value).replace(/\D/g, '');

const parseDate = (value?: string | null) => {
  const v = safe(value);
  if (!v) return null;
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDatePtBr = (value?: string | null) => {
  const d = parseDate(value);
  return d ? d.toLocaleDateString('pt-BR') : '';
};

const escapeHtml = (value: unknown) =>
  safe(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const normalizeCategoria = (value: unknown) => safe(value).toUpperCase();
const normalizeStatus = (value: unknown) => safe(value).toUpperCase() || 'ATIVO';

const normalizeSetorFiltro = (setor?: string | 'TODOS') => {
  const s = safe(setor);
  return !s || s === 'TODOS' ? '' : s;
};

const normalizeMesFiltro = (mes?: number | 'TODOS') => {
  if (mes === 'TODOS' || mes === undefined || mes === null) return 0;
  const n = Number(mes);
  return Number.isFinite(n) ? n : 0;
};

const overlapsMonth = (inicio?: string | null, fim?: string | null, ano?: number, mes?: number) => {
  if (!ano) return false;

  const s = parseDate(inicio);
  const e = parseDate(fim);

  if (!s || !e) return false;

  if (!mes || mes === 0) {
    return s.getFullYear() === ano || e.getFullYear() === ano;
  }

  const monthStart = new Date(ano, mes - 1, 1);
  const monthEnd = new Date(ano, mes, 0, 23, 59, 59);

  return s <= monthEnd && e >= monthStart;
};

const buildServidorKey = (input: {
  cpf?: string;
  id?: string;
  nome?: string;
  matricula?: string;
}) => {
  const cpf = digits(input.cpf);
  if (cpf) return `cpf:${cpf}`;

  const id = safe(input.id);
  if (id) return `id:${id}`;

  return `fallback:${safe(input.nome).toUpperCase()}|${safe(input.matricula).toUpperCase()}`;
};

const normalizeServidorRow = (servidor: FeriasExportServidorInput, ano: number): ConsolidatedRow => ({
  key: buildServidorKey({
    cpf: servidor.cpf,
    id: servidor.id,
    nome: servidor.nomeCompleto || servidor.nome,
    matricula: servidor.matricula,
  }),
  nome: safe(servidor.nomeCompleto || servidor.nome),
  matricula: safe(servidor.matricula),
  cpf: digits(servidor.cpf),
  setor: safe(servidor.setor),
  categoria: normalizeCategoria(servidor.categoria),
  status: normalizeStatus(servidor.status),
  exercicio: String(ano),
  assinatura: '',
  periodo1: null,
  periodo2: null,
  periodo3: null,
});

const cloneRow = (row: ConsolidatedRow): ConsolidatedRow => ({
  ...row,
  periodo1: row.periodo1 ? { ...row.periodo1 } : null,
  periodo2: row.periodo2 ? { ...row.periodo2 } : null,
  periodo3: row.periodo3 ? { ...row.periodo3 } : null,
  assinatura: '',
});

const hasAnyPeriod = (row: ConsolidatedRow) =>
  !!(
    row.periodo1?.inicio ||
    row.periodo1?.fim ||
    row.periodo2?.inicio ||
    row.periodo2?.fim ||
    row.periodo3?.inicio ||
    row.periodo3?.fim
  );

const hasPeriodInMonth = (row: ConsolidatedRow, filters: Required<ExportFeriasFilters>) =>
  overlapsMonth(row.periodo1?.inicio, row.periodo1?.fim, filters.ano, normalizeMesFiltro(filters.mes)) ||
  overlapsMonth(row.periodo2?.inicio, row.periodo2?.fim, filters.ano, normalizeMesFiltro(filters.mes)) ||
  overlapsMonth(row.periodo3?.inicio, row.periodo3?.fim, filters.ano, normalizeMesFiltro(filters.mes));

const applyExtractionView = (
  row: ConsolidatedRow,
  filters: Required<ExportFeriasFilters>,
): ConsolidatedRow => {
  const next = cloneRow(row);

  if (filters.tipoExtracao === 'APENAS_1_PERIODO') {
    next.periodo2 = null;
    next.periodo3 = null;
  }

  if (filters.tipoExtracao === 'APENAS_2_PERIODO') {
    next.periodo1 = null;
    next.periodo3 = null;
  }

  if (filters.tipoExtracao === 'APENAS_3_PERIODO') {
    next.periodo1 = null;
    next.periodo2 = null;
  }

  next.assinatura = '';
  return next;
};

const shouldIncludeByType = (row: ConsolidatedRow, filters: Required<ExportFeriasFilters>) => {
  if (filters.tipoExtracao === 'TODOS_SERVIDORES') return true;
  if (filters.tipoExtracao === 'COM_FERIAS') return hasAnyPeriod(row);
  if (filters.tipoExtracao === 'NO_MES') return hasPeriodInMonth(row, filters);
  if (filters.tipoExtracao === 'PLANEJAMENTO_ANUAL') return hasAnyPeriod(row);
  if (filters.tipoExtracao === 'APENAS_1_PERIODO') return !!(row.periodo1?.inicio && row.periodo1?.fim);
  if (filters.tipoExtracao === 'APENAS_2_PERIODO') return !!(row.periodo2?.inicio && row.periodo2?.fim);
  if (filters.tipoExtracao === 'APENAS_3_PERIODO') return !!(row.periodo3?.inicio && row.periodo3?.fim);
  return true;
};

const sortRows = (rows: ConsolidatedRow[], ordenacao: ExportOrdenacao) => {
  const list = [...rows];

  list.sort((a, b) => {
    if (ordenacao === 'MATRICULA') {
      return a.matricula.localeCompare(b.matricula, 'pt-BR', { sensitivity: 'base' });
    }

    if (ordenacao === 'CATEGORIA') {
      const cat = a.categoria.localeCompare(b.categoria, 'pt-BR', { sensitivity: 'base' });
      if (cat !== 0) return cat;
      return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
    }

    if (ordenacao === 'SETOR') {
      const setor = a.setor.localeCompare(b.setor, 'pt-BR', { sensitivity: 'base' });
      if (setor !== 0) return setor;
      return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
    }

    return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
  });

  return list;
};

const subtitleForCategoria = (categoria: string, filters: Required<ExportFeriasFilters>) => {
  if (safe(filters.categoria) && filters.categoria !== 'TODOS') {
    return categoria ? `SERVIDORES ${categoria}` : 'SERVIDORES';
  }
  return categoria ? `SERVIDORES ${categoria}` : 'SERVIDORES';
};

const setorForDocumento = (categoria: string, filters: Required<ExportFeriasFilters>) => {
  const setor = normalizeSetorFiltro(filters.setor);
  if (setor) return setor;

  if (filters.categoria === 'TODOS') {
    return categoria || 'TODOS OS SETORES';
  }

  return 'TODOS OS SETORES';
};

const completeFilters = (filters: ExportFeriasFilters): Required<ExportFeriasFilters> => ({
  ano: Number(filters.ano) || new Date().getFullYear(),
  categoria: (filters.categoria || 'TODOS') as Required<ExportFeriasFilters>['categoria'],
  setor: (filters.setor || 'TODOS') as Required<ExportFeriasFilters>['setor'],
  status: (filters.status || 'ATIVO') as Required<ExportFeriasFilters>['status'],
  mes: (filters.mes ?? 0) as Required<ExportFeriasFilters>['mes'],
  tipoExtracao: filters.tipoExtracao,
  ordenacao: (filters.ordenacao || 'NOME') as Required<ExportFeriasFilters>['ordenacao'],
  formato: filters.formato,
});

export const buildFeriasExportData = (
  rawFilters: ExportFeriasFilters,
  feriasRows: FeriasExportRowInput[],
  servidores: FeriasExportServidorInput[],
): ExportPreparedData => {
  const filters = completeFilters(rawFilters);
  const rowsMap = new Map<string, ConsolidatedRow>();

  for (const servidor of servidores) {
    const normalized = normalizeServidorRow(servidor, filters.ano);
    rowsMap.set(normalized.key, normalized);
  }

  for (const item of feriasRows) {
    const key = buildServidorKey({
      cpf: item.cpf || item.servidorId,
      id: item.servidorId,
      nome: item.servidorNome,
      matricula: item.matricula,
    });

    const current =
      rowsMap.get(key) ||
      {
        key,
        nome: safe(item.servidorNome),
        matricula: safe(item.matricula),
        cpf: digits(item.cpf || item.servidorId),
        setor: safe(item.setor),
        categoria: normalizeCategoria(item.categoria),
        status: normalizeStatus(item.statusServidor),
        exercicio: String(filters.ano),
        assinatura: '',
        periodo1: null,
        periodo2: null,
        periodo3: null,
      };

    const slot = Number(item.slot || 0);
    const periodo =
      item.inicio && item.fim
        ? {
            inicio: safe(item.inicio),
            fim: safe(item.fim),
          }
        : null;

    if (slot === 1) current.periodo1 = periodo;
    if (slot === 2) current.periodo2 = periodo;
    if (slot === 3) current.periodo3 = periodo;

    if (!current.nome) current.nome = safe(item.servidorNome);
    if (!current.matricula) current.matricula = safe(item.matricula);
    if (!current.cpf) current.cpf = digits(item.cpf || item.servidorId);
    if (!current.setor) current.setor = safe(item.setor);
    if (!current.categoria) current.categoria = normalizeCategoria(item.categoria);
    if (!current.status) current.status = normalizeStatus(item.statusServidor);

    current.assinatura = '';
    rowsMap.set(key, current);
  }

  const categoriaFiltro = filters.categoria;
  const setorFiltro = normalizeSetorFiltro(filters.setor);
  const statusFiltro = filters.status;
  const ordenacao = filters.ordenacao;

  const baseRows = Array.from(rowsMap.values())
    .filter((row) => {
      if (categoriaFiltro !== 'TODOS' && row.categoria !== categoriaFiltro) return false;
      if (setorFiltro && row.setor !== setorFiltro) return false;
      if (statusFiltro !== 'TODOS' && row.status !== statusFiltro) return false;
      return true;
    })
    .filter((row) => shouldIncludeByType(row, filters))
    .map((row) => applyExtractionView(row, filters));

  const totalComFerias = baseRows.filter((row) => hasAnyPeriod(row)).length;
  const totalSemFerias = baseRows.filter((row) => !hasAnyPeriod(row)).length;

  const sections: ExportSection[] = [];

  if (categoriaFiltro === 'TODOS') {
    for (const categoria of CATEGORIAS_ORDEM) {
      if (categoria === 'TODOS') continue;

      const rowsCategoria = baseRows.filter((row) => row.categoria === categoria);
      if (!rowsCategoria.length) continue;

      sections.push({
        categoria,
        subtitle: subtitleForCategoria(categoria, filters),
        setorDocumento: setorForDocumento(categoria, filters),
        rows: sortRows(rowsCategoria, ordenacao),
      });
    }

    const extras = Array.from(
      new Set(
        baseRows
          .map((row) => row.categoria)
          .filter((categoria) => categoria && !CATEGORIAS_ORDEM.includes(categoria as ExportCategoria)),
      ),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    for (const categoria of extras) {
      const rowsCategoria = baseRows.filter((row) => row.categoria === categoria);
      if (!rowsCategoria.length) continue;

      sections.push({
        categoria,
        subtitle: subtitleForCategoria(categoria, filters),
        setorDocumento: setorForDocumento(categoria, filters),
        rows: sortRows(rowsCategoria, ordenacao),
      });
    }
  } else {
    const categoria = categoriaFiltro || 'SERVIDORES';
    sections.push({
      categoria,
      subtitle: subtitleForCategoria(categoria, filters),
      setorDocumento: setorForDocumento(categoria, filters),
      rows: sortRows(baseRows, ordenacao),
    });
  }

  return {
    sections,
    totalLinhas: baseRows.length,
    totalComFerias,
    totalSemFerias,
  };
};

const getFilenameBase = (filters: Required<ExportFeriasFilters>) => {
  const categoria =
    filters.categoria === 'TODOS'
      ? 'todas_categorias'
      : safe(filters.categoria).toLowerCase().replace(/\s+/g, '_');

  const setor = (normalizeSetorFiltro(filters.setor) || 'todos_setores')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const tipo = filters.tipoExtracao.toLowerCase();
  const formato = filters.formato.toLowerCase();
  const mes = normalizeMesFiltro(filters.mes) === 0
    ? 'todos_os_meses'
    : safe(MESES[normalizeMesFiltro(filters.mes)]).toLowerCase().replace(/\s+/g, '_');

  return `ferias_${filters.ano}_${categoria}_${setor}_${tipo}_${mes}.${formato === 'docx' ? 'doc' : formato}`;
};

const buildSectionHtml = (
  section: ExportSection,
  filters: Required<ExportFeriasFilters>,
  prepared: ExportPreparedData,
  sectionIndex: number,
) => {
  const rowsHtml = section.rows
    .map((row, index) => {
      return `
        <tr>
          <td class="cell center">${index + 1}</td>
          <td class="cell left">${escapeHtml(row.nome)}</td>
          <td class="cell center">${escapeHtml(row.matricula)}</td>
          <td class="cell center">${escapeHtml(row.exercicio)}</td>
          <td class="cell center">${escapeHtml(formatDatePtBr(row.periodo1?.inicio))}</td>
          <td class="cell center">${escapeHtml(formatDatePtBr(row.periodo1?.fim))}</td>
          <td class="cell center">${escapeHtml(formatDatePtBr(row.periodo2?.inicio))}</td>
          <td class="cell center">${escapeHtml(formatDatePtBr(row.periodo2?.fim))}</td>
          <td class="cell center">${escapeHtml(formatDatePtBr(row.periodo3?.inicio))}</td>
          <td class="cell center">${escapeHtml(formatDatePtBr(row.periodo3?.fim))}</td>
          <td class="cell signature">&nbsp;</td>
        </tr>
      `;
    })
    .join('');

  return `
    <section class="sheet ${sectionIndex < prepared.sections.length - 1 ? 'page-break' : ''}">
      <div class="header">
        <div class="gov">GOVERNO DO ESTADO DE RORAIMA</div>
        <div class="org">SECRETARIA DE ESTADO DO TRABALHO E BEM-ESTAR SOCIAL</div>
        <div class="org">CENTRO INTEGRADO DE ATENÇÃO À PESSOA IDOSA - CIAPI</div>
        <div class="title">PROGRAMAÇÃO ANUAL DE FÉRIAS - EXERCÍCIO/${escapeHtml(filters.ano)}</div>
        <div class="subtitle">${escapeHtml(section.subtitle)}</div>
      </div>

      <div class="meta">
        <div><strong>GRUPO/CATEGORIA:</strong> ${escapeHtml(section.categoria || 'SERVIDORES')}</div>
        <div><strong>SETOR:</strong> ${escapeHtml(section.setorDocumento)}</div>
      </div>

      <div class="summary">
        <strong>Tipo:</strong> ${escapeHtml(TIPOS_EXTRACAO_LABEL[filters.tipoExtracao])} &nbsp;&nbsp;
        <strong>Status:</strong> ${escapeHtml(filters.status)} &nbsp;&nbsp;
        <strong>Mês:</strong> ${escapeHtml(MESES[normalizeMesFiltro(filters.mes)] || 'Todos os meses')} &nbsp;&nbsp;
        <strong>Ordenação:</strong> ${escapeHtml(ORDENACAO_LABEL[filters.ordenacao])}<br />
        <strong>Linhas desta seção:</strong> ${section.rows.length} &nbsp;&nbsp;
        <strong>Total do arquivo:</strong> ${prepared.totalLinhas}
      </div>

      <table>
        <thead>
          <tr>
            <th rowspan="2" class="ncol">Nº</th>
            <th rowspan="2">NOME DO SERVIDOR</th>
            <th rowspan="2">MATRÍCULA</th>
            <th rowspan="2">EXERCÍCIO</th>
            <th colspan="2">1º PERÍODO</th>
            <th colspan="2">2º PERÍODO</th>
            <th colspan="2">3º PERÍODO</th>
            <th rowspan="2" class="acol">ASSINATURA</th>
          </tr>
          <tr>
            <th>INÍCIO</th>
            <th>TÉRMINO</th>
            <th>INÍCIO</th>
            <th>TÉRMINO</th>
            <th>INÍCIO</th>
            <th>TÉRMINO</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </section>
  `;
};

const buildHtmlDocument = (rawFilters: ExportFeriasFilters, prepared: ExportPreparedData) => {
  const filters = completeFilters(rawFilters);

  const sectionsHtml = prepared.sections
    .map((section, index) => buildSectionHtml(section, filters, prepared, index))
    .join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Programação Anual de Férias</title>
<style>
  @page {
    size: A4 landscape;
    margin: 1.1cm;
  }

  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    margin: 0;
    padding: 0;
    font-size: 10pt;
    background: #fff;
  }

  .sheet {
    width: 100%;
  }

  .page-break {
    page-break-after: always;
  }

  .header {
    text-align: center;
    margin-bottom: 10px;
  }

  .gov { font-size: 11pt; font-weight: 700; }
  .org { font-size: 9pt; font-weight: 700; }
  .title {
    margin-top: 8px;
    font-size: 12pt;
    font-weight: 700;
    text-transform: uppercase;
  }

  .subtitle {
    margin-top: 4px;
    font-size: 10pt;
    font-weight: 700;
    text-transform: uppercase;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin: 10px 0;
    font-size: 9pt;
    font-weight: 700;
  }

  .summary {
    margin-bottom: 10px;
    border: 1px solid #000;
    padding: 8px;
    font-size: 8.5pt;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  thead {
    display: table-header-group;
  }

  tr {
    page-break-inside: avoid;
  }

  th, td {
    border: 1px solid #000;
    padding: 4px;
    vertical-align: middle;
  }

  th {
    background: #efefef;
    text-align: center;
    font-size: 8.8pt;
  }

  .cell { font-size: 8.8pt; }
  .left { text-align: left; }
  .center { text-align: center; }
  .signature { height: 22px; }
  .ncol { width: 28px; }
  .acol { width: 110px; }
</style>
</head>
<body>
  ${sectionsHtml}
</body>
</html>
`;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const csvEscape = (value: unknown) => {
  const text = safe(value);
  if (text.includes(';') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const exportFeriasFile = (
  rawFilters: ExportFeriasFilters,
  feriasRows: FeriasExportRowInput[],
  servidores: FeriasExportServidorInput[],
) => {
  const filters = completeFilters(rawFilters);
  const prepared = buildFeriasExportData(filters, feriasRows, servidores);

  if (!prepared.totalLinhas) {
    throw new Error('Nenhum registro encontrado para exportação com os filtros informados.');
  }

  const filename = getFilenameBase(filters);

  if (filters.formato === 'CSV') {
    const header = [
      'CATEGORIA',
      'SETOR_DOCUMENTO',
      'NOME DO SERVIDOR',
      'MATRÍCULA',
      'EXERCÍCIO',
      'STATUS',
      '1º INÍCIO',
      '1º TÉRMINO',
      '2º INÍCIO',
      '2º TÉRMINO',
      '3º INÍCIO',
      '3º TÉRMINO',
      'ASSINATURA',
    ];

    const lines = [
      header.join(';'),
      ...prepared.sections.flatMap((section) =>
        section.rows.map((row) =>
          [
            section.categoria,
            section.setorDocumento,
            row.nome,
            row.matricula,
            row.exercicio,
            row.status,
            formatDatePtBr(row.periodo1?.inicio),
            formatDatePtBr(row.periodo1?.fim),
            formatDatePtBr(row.periodo2?.inicio),
            formatDatePtBr(row.periodo2?.fim),
            formatDatePtBr(row.periodo3?.inicio),
            formatDatePtBr(row.periodo3?.fim),
            '',
          ]
            .map(csvEscape)
            .join(';'),
        ),
      ),
    ].join('\n');

    downloadBlob(new Blob(['\uFEFF', lines], { type: 'text/csv;charset=utf-8' }), filename);
    return prepared;
  }

  const html = buildHtmlDocument(filters, prepared);

  if (filters.formato === 'PDF') {
    const win = window.open('', '_blank', 'noopener,noreferrer,width=1280,height=900');
    if (!win) {
      throw new Error('Não foi possível abrir a janela de impressão para gerar o PDF.');
    }

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();

    setTimeout(() => {
      win.print();
    }, 350);

    return prepared;
  }

  downloadBlob(
    new Blob(['\uFEFF', html], { type: 'application/msword;charset=utf-8' }),
    filename,
  );

  return prepared;
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
  tiposExtracao: TIPOS_EXTRACAO_LABEL,
  ordenacao: ORDENACAO_LABEL,
  formato: FORMATO_LABEL,
  meses: MESES,
  categorias: CATEGORIAS_ORDEM,
};

export default {
  buildFeriasExportData,
  exportFeriasFile,
  getDefaultFeriasExportFilters,
  feriasExportLabels,
};
