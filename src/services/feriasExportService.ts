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
  | 'COM_FERIAS_CADASTRADAS'
  | 'COM_FERIAS_NO_MES'
  | 'PLANEJAMENTO_ANUAL_COMPLETO'
  | 'APENAS_1_PERIODO'
  | 'APENAS_2_PERIODO'
  | 'APENAS_3_PERIODO';

export type ExportOrdenacao =
  | 'NOME_ASC'
  | 'MATRICULA'
  | 'CATEGORIA'
  | 'SETOR';

export type ExportFormato = 'DOCX' | 'PDF' | 'CSV';

export interface FeriasExportFilters {
  ano: number;
  categoria: ExportCategoria;
  setor: string;
  status: ExportStatus;
  mes: number; // 0 = todos
  tipoExtracao: ExportTipoExtracao;
  ordenacao: ExportOrdenacao;
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

interface ExportPreparedData {
  rows: ConsolidatedRow[];
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
  COM_FERIAS_CADASTRADAS: 'Somente servidores com férias cadastradas',
  COM_FERIAS_NO_MES: 'Somente servidores com férias no mês selecionado',
  PLANEJAMENTO_ANUAL_COMPLETO: 'Planejamento anual completo',
  APENAS_1_PERIODO: 'Apenas 1º período',
  APENAS_2_PERIODO: 'Apenas 2º período',
  APENAS_3_PERIODO: 'Apenas 3º período',
};

const ORDENACAO_LABEL: Record<ExportOrdenacao, string> = {
  NOME_ASC: 'Nome A-Z',
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
  categoria: safe(servidor.categoria).toUpperCase(),
  status: safe(servidor.status).toUpperCase() || 'ATIVO',
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
});

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

const matchesBaseFilters = (row: ConsolidatedRow, filters: FeriasExportFilters) => {
  if (filters.categoria !== 'TODOS' && row.categoria !== filters.categoria) return false;
  if (filters.setor && row.setor !== filters.setor) return false;
  if (filters.status !== 'TODOS' && row.status !== filters.status) return false;
  return true;
};

const hasAnyPeriod = (row: ConsolidatedRow) =>
  !!(
    row.periodo1?.inicio ||
    row.periodo1?.fim ||
    row.periodo2?.inicio ||
    row.periodo2?.fim ||
    row.periodo3?.inicio ||
    row.periodo3?.fim
  );

const hasPeriodInMonth = (row: ConsolidatedRow, filters: FeriasExportFilters) =>
  overlapsMonth(row.periodo1?.inicio, row.periodo1?.fim, filters.ano, filters.mes) ||
  overlapsMonth(row.periodo2?.inicio, row.periodo2?.fim, filters.ano, filters.mes) ||
  overlapsMonth(row.periodo3?.inicio, row.periodo3?.fim, filters.ano, filters.mes);

const applyExtractionView = (row: ConsolidatedRow, filters: FeriasExportFilters): ConsolidatedRow => {
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

  return next;
};

const shouldIncludeByType = (row: ConsolidatedRow, filters: FeriasExportFilters) => {
  if (filters.tipoExtracao === 'TODOS_SERVIDORES') return true;
  if (filters.tipoExtracao === 'COM_FERIAS_CADASTRADAS') return hasAnyPeriod(row);
  if (filters.tipoExtracao === 'COM_FERIAS_NO_MES') return hasPeriodInMonth(row, filters);
  if (filters.tipoExtracao === 'PLANEJAMENTO_ANUAL_COMPLETO') return hasAnyPeriod(row);
  if (filters.tipoExtracao === 'APENAS_1_PERIODO') return !!(row.periodo1?.inicio && row.periodo1?.fim);
  if (filters.tipoExtracao === 'APENAS_2_PERIODO') return !!(row.periodo2?.inicio && row.periodo2?.fim);
  if (filters.tipoExtracao === 'APENAS_3_PERIODO') return !!(row.periodo3?.inicio && row.periodo3?.fim);
  return true;
};

export const buildFeriasExportData = (
  filters: FeriasExportFilters,
  feriasRows: FeriasExportRowInput[],
  servidores: FeriasExportServidorInput[],
): ExportPreparedData => {
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
        categoria: safe(item.categoria).toUpperCase(),
        status: safe(item.statusServidor).toUpperCase() || 'ATIVO',
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
    if (!current.categoria) current.categoria = safe(item.categoria).toUpperCase();
    if (!current.status) current.status = safe(item.statusServidor).toUpperCase() || 'ATIVO';

    rowsMap.set(key, current);
  }

  const filtered = Array.from(rowsMap.values())
    .filter((row) => matchesBaseFilters(row, filters))
    .filter((row) => shouldIncludeByType(row, filters))
    .map((row) => applyExtractionView(row, filters));

  const sorted = sortRows(filtered, filters.ordenacao);

  return {
    rows: sorted,
    totalLinhas: sorted.length,
    totalComFerias: sorted.filter((row) => hasAnyPeriod(row)).length,
    totalSemFerias: sorted.filter((row) => !hasAnyPeriod(row)).length,
  };
};

const getFilenameBase = (filters: FeriasExportFilters) => {
  const categoria =
    filters.categoria === 'TODOS'
      ? 'todas_categorias'
      : filters.categoria.toLowerCase().replace(/\s+/g, '_');

  const setor = (filters.setor || 'todos_setores')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const tipo = filters.tipoExtracao.toLowerCase();
  const formato = filters.formato.toLowerCase();
  const mes = filters.mes === 0 ? 'todos_os_meses' : safe(MESES[filters.mes]).toLowerCase().replace(/\s+/g, '_');

  return `ferias_${filters.ano}_${categoria}_${setor}_${tipo}_${mes}.${formato === 'docx' ? 'doc' : formato}`;
};

const buildHtmlDocument = (filters: FeriasExportFilters, prepared: ExportPreparedData) => {
  const rowsHtml = prepared.rows
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
  }

  .sheet {
    width: 100%;
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

  tfoot {
    display: table-footer-group;
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
  <section class="sheet">
    <div class="header">
      <div class="gov">GOVERNO DO ESTADO DE RORAIMA</div>
      <div class="org">SECRETARIA DE ESTADO DO TRABALHO E BEM-ESTAR SOCIAL</div>
      <div class="org">CENTRO INTEGRADO DE ATENÇÃO À PESSOA IDOSA - CIAPI</div>
      <div class="title">PROGRAMAÇÃO ANUAL DE FÉRIAS - EXERCÍCIO/${escapeHtml(filters.ano)}</div>
    </div>

    <div class="meta">
      <div><strong>GRUPO/CATEGORIA:</strong> ${escapeHtml(filters.categoria === 'TODOS' ? 'TODOS' : filters.categoria)}</div>
      <div><strong>SETOR:</strong> ${escapeHtml(filters.setor || 'TODOS')}</div>
    </div>

    <div class="summary">
      <strong>Tipo:</strong> ${escapeHtml(TIPOS_EXTRACAO_LABEL[filters.tipoExtracao])} &nbsp;&nbsp;
      <strong>Status:</strong> ${escapeHtml(filters.status)} &nbsp;&nbsp;
      <strong>Mês:</strong> ${escapeHtml(MESES[filters.mes] || 'Todos os meses')} &nbsp;&nbsp;
      <strong>Ordenação:</strong> ${escapeHtml(ORDENACAO_LABEL[filters.ordenacao])}<br/>
      <strong>Total de linhas:</strong> ${prepared.totalLinhas} &nbsp;&nbsp;
      <strong>Com férias:</strong> ${prepared.totalComFerias} &nbsp;&nbsp;
      <strong>Sem férias:</strong> ${prepared.totalSemFerias}
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
  filters: FeriasExportFilters,
  feriasRows: FeriasExportRowInput[],
  servidores: FeriasExportServidorInput[],
) => {
  const prepared = buildFeriasExportData(filters, feriasRows, servidores);

  if (!prepared.totalLinhas) {
    throw new Error('Nenhum registro encontrado para exportação com os filtros informados.');
  }

  const filename = getFilenameBase(filters);

  if (filters.formato === 'CSV') {
    const header = [
      'NOME DO SERVIDOR',
      'MATRÍCULA',
      'EXERCÍCIO',
      'CATEGORIA',
      'SETOR',
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
      ...prepared.rows.map((row) =>
        [
          row.nome,
          row.matricula,
          row.exercicio,
          row.categoria,
          row.setor,
          row.status,
          formatDatePtBr(row.periodo1?.inicio),
          formatDatePtBr(row.periodo1?.fim),
          formatDatePtBr(row.periodo2?.inicio),
          formatDatePtBr(row.periodo2?.fim),
          formatDatePtBr(row.periodo3?.inicio),
          formatDatePtBr(row.periodo3?.fim),
          row.assinatura,
        ]
          .map(csvEscape)
          .join(';'),
      ),
    ].join('\n');

    downloadBlob(new Blob(['\uFEFF', lines], { type: 'text/csv;charset=utf-8' }), filename);
    return prepared;
  }

  const html = buildHtmlDocument(filters, prepared);

  if (filters.formato === 'PDF') {
    const win = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
    if (!win) {
      throw new Error('Não foi possível abrir a janela de impressão para gerar o PDF.');
    }

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();

    setTimeout(() => {
      win.print();
    }, 300);

    return prepared;
  }

  downloadBlob(
    new Blob(['\uFEFF', html], { type: 'application/msword;charset=utf-8' }),
    filename,
  );

  return prepared;
};

export const getDefaultFeriasExportFilters = (ano?: number): FeriasExportFilters => ({
  ano: Number(ano) || new Date().getFullYear(),
  categoria: 'TODOS',
  setor: '',
  status: 'ATIVO',
  mes: 0,
  tipoExtracao: 'COM_FERIAS_CADASTRADAS',
  ordenacao: 'NOME_ASC',
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
