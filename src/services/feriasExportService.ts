export type ExportCategoria =
  | 'TODOS'
  | 'EFETIVO SESAU'
  | 'SELETIVO SESAU'
  | 'EFETIVO SETRABES'
  | 'SELETIVO SETRABES'
  | 'FEDERAIS SETRABES'
  | 'COMISSIONADOS';

export type ExportStatus = 'TODOS' | 'ATIVO' | 'INATIVO';

export interface FeriasExportFilters {
  ano: number;
  categoria: ExportCategoria;
  setor: string;
  status: ExportStatus;
  mes: number; // 0 = todos
}

export interface FeriasExportPeriodoInput {
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

interface AggregatedPeriodo {
  inicio: string;
  fim: string;
}

interface AggregatedRow {
  nome: string;
  matricula: string;
  exercicio: string;
  setor: string;
  categoria: string;
  status: string;
  assinatura: string;
  periodos: [AggregatedPeriodo | null, AggregatedPeriodo | null, AggregatedPeriodo | null];
}

interface ExportSection {
  categoria: string;
  rows: AggregatedRow[];
}

interface ExportPreparedData {
  sections: ExportSection[];
  totalLinhas: number;
  totalSecoes: number;
  filtersLabel: string;
}

const CATEGORIAS_CANONICAS: ExportCategoria[] = [
  'TODOS',
  'EFETIVO SESAU',
  'SELETIVO SESAU',
  'EFETIVO SETRABES',
  'SELETIVO SETRABES',
  'FEDERAIS SETRABES',
  'COMISSIONADOS',
];

const MONTHS = [
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

const normalizeString = (value: unknown) => String(value ?? '').trim();
const normalizeCpf = (value: unknown) => normalizeString(value).replace(/\D/g, '');

const parseDate = (value?: string | null) => {
  const safe = normalizeString(value);
  if (!safe) return null;
  const date = new Date(`${safe}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDatePtBr = (value?: string | null) => {
  const date = parseDate(value);
  return date ? date.toLocaleDateString('pt-BR') : '';
};

const escapeHtml = (value: unknown) =>
  normalizeString(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const buildKey = (cpf?: string, id?: string, nome?: string, matricula?: string) => {
  const cpfKey = normalizeCpf(cpf);
  if (cpfKey) return `cpf:${cpfKey}`;

  const idKey = normalizeString(id);
  if (idKey) return `id:${idKey}`;

  const nomeKey = normalizeString(nome).toUpperCase();
  const matriculaKey = normalizeString(matricula).toUpperCase();
  return `fallback:${nomeKey}|${matriculaKey}`;
};

const sortRows = (rows: AggregatedRow[]) =>
  [...rows].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));

const getMonthRange = (ano: number, mes: number) => {
  if (!mes) {
    return {
      start: new Date(`${ano}-01-01T00:00:00`),
      end: new Date(`${ano}-12-31T23:59:59`),
    };
  }

  const start = new Date(ano, mes - 1, 1);
  const end = new Date(ano, mes, 0, 23, 59, 59);
  return { start, end };
};

const periodMatchesFilters = (
  periodo: FeriasExportPeriodoInput,
  filters: FeriasExportFilters,
) => {
  const inicio = parseDate(periodo.inicio);
  const fim = parseDate(periodo.fim);

  if (!inicio || !fim) return false;

  const { start, end } = getMonthRange(filters.ano, filters.mes);
  return inicio <= end && fim >= start;
};

const buildFiltersLabel = (filters: FeriasExportFilters) => {
  const parts = [
    `Exercício: ${filters.ano}`,
    `Categoria: ${filters.categoria === 'TODOS' ? 'Todas' : filters.categoria}`,
    `Setor: ${filters.setor || 'Todos'}`,
    `Status: ${filters.status}`,
    `Mês: ${MONTHS[filters.mes] || 'Todos os meses'}`,
  ];

  return parts.join(' • ');
};

const prepareExportData = (
  periods: FeriasExportPeriodoInput[],
  servidores: FeriasExportServidorInput[],
  filters: FeriasExportFilters,
): ExportPreparedData => {
  const periodMap = new Map<string, FeriasExportPeriodoInput[]>();

  for (const periodo of periods) {
    if (!periodMatchesFilters(periodo, filters)) continue;

    const key = buildKey(
      periodo.cpf,
      periodo.servidorId,
      periodo.servidorNome,
      periodo.matricula,
    );

    const bucket = periodMap.get(key) ?? [];
    bucket.push(periodo);
    periodMap.set(key, bucket);
  }

  const grouped = new Map<string, AggregatedRow[]>();
  const processedKeys = new Set<string>();

  for (const servidor of servidores) {
    const key = buildKey(
      servidor.cpf,
      servidor.id,
      servidor.nomeCompleto || servidor.nome,
      servidor.matricula,
    );

    const categoria = normalizeString(servidor.categoria).toUpperCase();
    const setor = normalizeString(servidor.setor);
    const status = normalizeString(servidor.status).toUpperCase() || 'ATIVO';

    if (filters.categoria !== 'TODOS' && categoria !== filters.categoria) continue;
    if (filters.setor && setor !== filters.setor) continue;
    if (filters.status !== 'TODOS' && status !== filters.status) continue;

    const foundPeriods = [...(periodMap.get(key) ?? [])]
      .sort((a, b) => normalizeString(a.inicio).localeCompare(normalizeString(b.inicio)))
      .slice(0, 3);

    if (!foundPeriods.length) continue;

    processedKeys.add(key);

    const row: AggregatedRow = {
      nome: normalizeString(servidor.nomeCompleto || servidor.nome),
      matricula: normalizeString(servidor.matricula),
      exercicio: String(filters.ano),
      setor,
      categoria: categoria || 'SEM CATEGORIA',
      status,
      assinatura: '',
      periodos: [
        foundPeriods[0]
          ? { inicio: normalizeString(foundPeriods[0].inicio), fim: normalizeString(foundPeriods[0].fim) }
          : null,
        foundPeriods[1]
          ? { inicio: normalizeString(foundPeriods[1].inicio), fim: normalizeString(foundPeriods[1].fim) }
          : null,
        foundPeriods[2]
          ? { inicio: normalizeString(foundPeriods[2].inicio), fim: normalizeString(foundPeriods[2].fim) }
          : null,
      ],
    };

    const sectionName = filters.categoria === 'TODOS' ? row.categoria : filters.categoria;
    const sectionRows = grouped.get(sectionName) ?? [];
    sectionRows.push(row);
    grouped.set(sectionName, sectionRows);
  }

  for (const [key, foundPeriods] of periodMap.entries()) {
    if (processedKeys.has(key)) continue;

    const first = foundPeriods[0];
    const fallbackCategoria = 'SEM CATEGORIA';

    const row: AggregatedRow = {
      nome: normalizeString(first.servidorNome),
      matricula: normalizeString(first.matricula),
      exercicio: String(filters.ano),
      setor: normalizeString(first.setor),
      categoria: fallbackCategoria,
      status: 'NÃO INFORMADO',
      assinatura: '',
      periodos: [
        foundPeriods[0]
          ? { inicio: normalizeString(foundPeriods[0].inicio), fim: normalizeString(foundPeriods[0].fim) }
          : null,
        foundPeriods[1]
          ? { inicio: normalizeString(foundPeriods[1].inicio), fim: normalizeString(foundPeriods[1].fim) }
          : null,
        foundPeriods[2]
          ? { inicio: normalizeString(foundPeriods[2].inicio), fim: normalizeString(foundPeriods[2].fim) }
          : null,
      ],
    };

    if (filters.categoria !== 'TODOS' && fallbackCategoria !== filters.categoria) {
      continue;
    }

    if (filters.setor && row.setor !== filters.setor) {
      continue;
    }

    const sectionName = filters.categoria === 'TODOS' ? fallbackCategoria : filters.categoria;
    const sectionRows = grouped.get(sectionName) ?? [];
    sectionRows.push(row);
    grouped.set(sectionName, sectionRows);
  }

  const orderedSections: ExportSection[] = [];

  for (const categoria of CATEGORIAS_CANONICAS) {
    if (categoria === 'TODOS') continue;
    const rows = grouped.get(categoria);
    if (rows?.length) {
      orderedSections.push({
        categoria,
        rows: sortRows(rows),
      });
    }
  }

  const extraSections = Array.from(grouped.entries())
    .filter(([categoria]) => !orderedSections.some((item) => item.categoria === categoria))
    .map(([categoria, rows]) => ({
      categoria,
      rows: sortRows(rows),
    }))
    .sort((a, b) => a.categoria.localeCompare(b.categoria, 'pt-BR'));

  const sections = [...orderedSections, ...extraSections];
  const totalLinhas = sections.reduce((acc, item) => acc + item.rows.length, 0);

  return {
    sections,
    totalLinhas,
    totalSecoes: sections.length,
    filtersLabel: buildFiltersLabel(filters),
  };
};

const buildSectionHtml = (section: ExportSection, filters: FeriasExportFilters) => {
  const setorLabel = filters.setor || 'TODOS OS SETORES';

  const rowsHtml = section.rows
    .map((row, index) => {
      const p1 = row.periodos[0];
      const p2 = row.periodos[1];
      const p3 = row.periodos[2];

      return `
        <tr>
          <td class="cell center">${index + 1}</td>
          <td class="cell left">${escapeHtml(row.nome)}</td>
          <td class="cell center">${escapeHtml(row.matricula)}</td>
          <td class="cell center">${escapeHtml(row.exercicio)}</td>
          <td class="cell center">${escapeHtml(formatDatePtBr(p1?.inicio))}</td>
          <td class="cell center">${escapeHtml(formatDatePtBr(p1?.fim))}</td>
          <td class="cell center">${escapeHtml(formatDatePtBr(p2?.inicio))}</td>
          <td class="cell center">${escapeHtml(formatDatePtBr(p2?.fim))}</td>
          <td class="cell center">${escapeHtml(formatDatePtBr(p3?.inicio))}</td>
          <td class="cell center">${escapeHtml(formatDatePtBr(p3?.fim))}</td>
          <td class="cell signature">&nbsp;</td>
        </tr>
      `;
    })
    .join('');

  return `
    <section class="sheet">
      <div class="header">
        <div class="gov">GOVERNO DO ESTADO DE RORAIMA</div>
        <div class="org">SECRETARIA DE ESTADO DO TRABALHO E BEM-ESTAR SOCIAL</div>
        <div class="org">CENTRO INTEGRADO DE ATENÇÃO À PESSOA IDOSA - CIAPI</div>
        <div class="title">PROGRAMAÇÃO ANUAL DE FÉRIAS - EXERCÍCIO/${filters.ano}</div>
      </div>

      <div class="meta">
        <div><strong>GRUPO/CATEGORIA:</strong> ${escapeHtml(section.categoria)}</div>
        <div><strong>SETOR:</strong> ${escapeHtml(setorLabel)}</div>
      </div>

      <table class="ferias-table">
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

const buildDocumentHtml = (
  prepared: ExportPreparedData,
  filters: FeriasExportFilters,
) => {
  const sectionsHtml = prepared.sections.map((section) => buildSectionHtml(section, filters)).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="ProgId" content="Word.Document" />
  <meta name="Generator" content="CIAPI RH" />
  <title>Programação Anual de Férias ${filters.ano}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 1.2cm;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
    }

    .sheet {
      page-break-after: always;
      width: 100%;
    }

    .sheet:last-child {
      page-break-after: auto;
    }

    .header {
      text-align: center;
      margin-bottom: 12px;
    }

    .gov {
      font-size: 11pt;
      font-weight: 700;
    }

    .org {
      font-size: 9.5pt;
      font-weight: 700;
    }

    .title {
      margin-top: 8px;
      font-size: 12pt;
      font-weight: 700;
      text-transform: uppercase;
    }

    .meta {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin: 8px 0 10px 0;
      font-size: 9.5pt;
      font-weight: 700;
    }

    .ferias-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .ferias-table th,
    .ferias-table td {
      border: 1px solid #000;
      padding: 4px 5px;
      vertical-align: middle;
    }

    .ferias-table th {
      text-align: center;
      background: #f0f0f0;
      font-size: 9pt;
    }

    .cell {
      font-size: 9pt;
      min-height: 22px;
    }

    .left {
      text-align: left;
    }

    .center {
      text-align: center;
    }

    .ncol {
      width: 28px;
    }

    .acol {
      width: 110px;
    }

    .signature {
      height: 24px;
    }

    .summary {
      margin-bottom: 12px;
      padding: 8px 10px;
      border: 1px solid #000;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <div class="summary">
    <strong>Filtros aplicados:</strong> ${escapeHtml(prepared.filtersLabel)}<br />
    <strong>Total de seções:</strong> ${prepared.totalSecoes} &nbsp;&nbsp; 
    <strong>Total de linhas exportadas:</strong> ${prepared.totalLinhas}
  </div>
  ${sectionsHtml}
</body>
</html>
  `;
};

const buildFilename = (filters: FeriasExportFilters) => {
  const categoria = filters.categoria === 'TODOS'
    ? 'todas_categorias'
    : filters.categoria.toLowerCase().replace(/\s+/g, '_');

  const setor = (filters.setor || 'todos_setores')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const status = filters.status.toLowerCase();
  const mes = filters.mes === 0 ? 'todos_os_meses' : MONTHS[filters.mes].toLowerCase().replace(/\s+/g, '_');

  return `programacao_anual_ferias_${filters.ano}_${categoria}_${setor}_${status}_${mes}.doc`;
};

export const previewFeriasExport = (
  filters: FeriasExportFilters,
  periods: FeriasExportPeriodoInput[],
  servidores: FeriasExportServidorInput[],
) => prepareExportData(periods, servidores, filters);

export const downloadFeriasDoc = (
  filters: FeriasExportFilters,
  periods: FeriasExportPeriodoInput[],
  servidores: FeriasExportServidorInput[],
) => {
  const prepared = prepareExportData(periods, servidores, filters);

  if (!prepared.totalLinhas) {
    throw new Error('Nenhum registro de férias encontrado com os filtros selecionados para exportação.');
  }

  const html = buildDocumentHtml(prepared, filters);
  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = buildFilename(filters);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  return prepared;
};

export default {
  previewFeriasExport,
  downloadFeriasDoc,
};
