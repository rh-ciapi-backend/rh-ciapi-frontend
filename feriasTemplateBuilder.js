const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const os = require('os');
const { promisify } = require('util');
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require('docx');

const execFileAsync = promisify(execFile);

const safe = (value) => String(value ?? '').trim();
const parseDate = (value) => {
  const text = safe(value);
  if (!text) return null;
  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = parseDate(value);
  if (!date) return '';
  return date.toLocaleDateString('pt-BR');
};

const cell = (text, options = {}) =>
  new TableCell({
    width: options.width ? { size: options.width, type: WidthType.DXA } : undefined,
    verticalAlign: 'center',
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    },
    children: [
      new Paragraph({
        alignment: options.align || AlignmentType.CENTER,
        children: [
          new TextRun({
            text: safe(text),
            bold: !!options.bold,
            size: options.size || 18,
          }),
        ],
      }),
    ],
  });

const buildHeaderParagraph = (text, size = 20, bold = true) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [
      new TextRun({
        text,
        bold,
        size,
      }),
    ],
  });

const buildInfoParagraph = (label, value) =>
  new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 18 }),
      new TextRun({ text: safe(value), size: 18 }),
    ],
  });

const buildTable = (rows) => {
  const headerRow1 = new TableRow({
    children: [
      cell('Nº', { bold: true, width: 500 }),
      cell('NOME DO SERVIDOR', { bold: true, width: 3500 }),
      cell('MATRÍCULA', { bold: true, width: 1500 }),
      cell('EXERCÍCIO', { bold: true, width: 1200 }),
      cell('1º PERÍODO', { bold: true, width: 1600 }),
      cell('', { bold: true, width: 1600 }),
      cell('2º PERÍODO', { bold: true, width: 1600 }),
      cell('', { bold: true, width: 1600 }),
      cell('3º PERÍODO', { bold: true, width: 1600 }),
      cell('', { bold: true, width: 1600 }),
      cell('ASSINATURA', { bold: true, width: 1900 }),
    ],
  });

  const headerRow2 = new TableRow({
    children: [
      cell('', { bold: true, width: 500 }),
      cell('', { bold: true, width: 3500 }),
      cell('', { bold: true, width: 1500 }),
      cell('', { bold: true, width: 1200 }),
      cell('INÍCIO', { bold: true, width: 1600 }),
      cell('TÉRMINO', { bold: true, width: 1600 }),
      cell('INÍCIO', { bold: true, width: 1600 }),
      cell('TÉRMINO', { bold: true, width: 1600 }),
      cell('INÍCIO', { bold: true, width: 1600 }),
      cell('TÉRMINO', { bold: true, width: 1600 }),
      cell('', { bold: true, width: 1900 }),
    ],
  });

  const dataRows = rows.map((row, index) =>
    new TableRow({
      children: [
        cell(String(index + 1), { width: 500 }),
        cell(row.nome, { align: AlignmentType.LEFT, width: 3500 }),
        cell(row.matricula, { width: 1500 }),
        cell(row.exercicio, { width: 1200 }),
        cell(formatDate(row.periodo1?.inicio), { width: 1600 }),
        cell(formatDate(row.periodo1?.fim), { width: 1600 }),
        cell(formatDate(row.periodo2?.inicio), { width: 1600 }),
        cell(formatDate(row.periodo2?.fim), { width: 1600 }),
        cell(formatDate(row.periodo3?.inicio), { width: 1600 }),
        cell(formatDate(row.periodo3?.fim), { width: 1600 }),
        cell('', { width: 1900 }),
      ],
    }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow1, headerRow2, ...dataRows],
  });
};

const resolveTemplateFile = () => {
  const candidatePaths = [
    path.resolve(process.cwd(), 'backend/templates/modelo_programacao_anual_ferias.docx'),
    path.resolve(process.cwd(), 'backend/templates/modelo_programacao_anual_ferias.doc'),
    path.resolve(process.cwd(), 'templates/modelo_programacao_anual_ferias.docx'),
    path.resolve(process.cwd(), 'templates/modelo_programacao_anual_ferias.doc'),
  ];

  return candidatePaths.find((item) => fs.existsSync(item)) || '';
};

const ensureDocxTemplate = async () => {
  const templatePath = resolveTemplateFile();
  if (!templatePath) return '';

  if (templatePath.toLowerCase().endsWith('.docx')) {
    return templatePath;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ciapi-ferias-template-'));
  await execFileAsync('soffice', [
    '--headless',
    '--convert-to',
    'docx',
    '--outdir',
    tempDir,
    templatePath,
  ]);

  const generated = path.join(
    tempDir,
    `${path.basename(templatePath, path.extname(templatePath))}.docx`,
  );

  if (!fs.existsSync(generated)) {
    throw new Error('Falha ao converter o modelo .doc para .docx.');
  }

  return generated;
};

const buildSections = (preparedData, filters) => {
  return preparedData.sections.map((section) => ({
    properties: {
      page: {
        size: {
          orientation: PageOrientation.LANDSCAPE,
        },
        margin: {
          top: 720,
          right: 720,
          bottom: 720,
          left: 720,
        },
      },
    },
    headers: {
      default: new Header({
        children: [
          buildHeaderParagraph('GOVERNO DO ESTADO DE RORAIMA', 20, true),
          buildHeaderParagraph('SECRETARIA DE ESTADO DO TRABALHO E BEM-ESTAR SOCIAL', 18, true),
          buildHeaderParagraph('CENTRO INTEGRADO DE ATENÇÃO À PESSOA IDOSA - CIAPI', 18, true),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '', size: 16 })],
          }),
        ],
      }),
    },
    children: [
      buildHeaderParagraph(`PROGRAMAÇÃO ANUAL DE FÉRIAS - EXERCÍCIO/${filters.ano}`, 22, true),
      buildHeaderParagraph(section.subtitle, 18, true),
      buildInfoParagraph('GRUPO/CATEGORIA', section.categoria || 'SERVIDORES'),
      buildInfoParagraph('SETOR', section.setorDocumento || 'TODOS OS SETORES'),
      buildTable(section.rows),
    ],
  }));
};

async function buildDocxBuffer(preparedData, filters) {
  await ensureDocxTemplate();

  const doc = new Document({
    sections: buildSections(preparedData, filters),
  });

  return Packer.toBuffer(doc);
}

async function convertDocxBufferToPdfBuffer(docxBuffer) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ciapi-ferias-export-'));
  const docxPath = path.join(tempDir, 'ferias_export.docx');

  fs.writeFileSync(docxPath, docxBuffer);

  await execFileAsync('soffice', [
    '--headless',
    '--convert-to',
    'pdf',
    '--outdir',
    tempDir,
    docxPath,
  ]);

  const pdfPath = path.join(tempDir, 'ferias_export.pdf');

  if (!fs.existsSync(pdfPath)) {
    throw new Error('Falha ao converter DOCX para PDF.');
  }

  return fs.readFileSync(pdfPath);
}

module.exports = {
  buildDocxBuffer,
  convertDocxBufferToPdfBuffer,
};
