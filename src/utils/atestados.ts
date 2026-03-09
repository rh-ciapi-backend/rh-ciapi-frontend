import { Atestado, AtestadoFormData, FrequenciaConflict } from '../types/atestados';

export const MAX_ATESTADO_FILE_SIZE_MB = 3;
export const MAX_ATESTADO_FILE_SIZE_BYTES = MAX_ATESTADO_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_ATESTADO_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const;

export const ALLOWED_ATESTADO_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

export const STATUS_OPTIONS = ['TODOS', 'PENDENTE', 'VALIDADO', 'REJEITADO'] as const;
export const TIPO_OPTIONS = ['TODOS', 'MÉDICO', 'ODONTOLÓGICO', 'PSICOLÓGICO', 'ACOMPANHAMENTO'] as const;

export const MONTH_OPTIONS = [
  { value: 'TODOS', label: 'Todos os meses' },
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export const normalizeCpf = (value: string) => value.replace(/\D/g, '');

export const formatCpf = (value: string) => {
  const digits = normalizeCpf(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
};

export const slugifyFileName = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
};

export const formatDate = (value: string) => {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

export const getMonthFromDate = (value: string) => {
  if (!value) return '';
  const parts = value.split('-');
  return parts.length >= 2 ? String(Number(parts[1])) : '';
};

export const getYearFromDate = (value: string) => {
  if (!value) return '';
  const parts = value.split('-');
  return parts[0] || '';
};

export const getUniqueSorted = (values: string[]) =>
  ['TODOS', ...Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR'))];

export const calculateCalendarDays = (start: string, end: string) => {
  if (!start || !end) return 0;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  if (endDate < startDate) return 0;
  const diff = endDate.getTime() - startDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

export const calculateBusinessDays = (start: string, end: string) => {
  if (!start || !end) return 0;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  if (endDate < startDate) return 0;

  let count = 0;
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
};

export const enumerateDates = (start: string, end: string, onlyBusinessDays: boolean) => {
  if (!start || !end) return [] as string[];
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return [];
  if (endDate < startDate) return [];

  const result: string[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const day = cursor.getDay();
    if (!onlyBusinessDays || (day !== 0 && day !== 6)) {
      result.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
};

export const formatFileSize = (bytes: number) => {
  if (!bytes || bytes <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};

export const validateAtestadoFile = (file: File | null) => {
  if (!file) return { valid: true as const };

  const mimeValid = ALLOWED_ATESTADO_FILE_TYPES.includes(file.type as (typeof ALLOWED_ATESTADO_FILE_TYPES)[number]);
  const lowerName = file.name.toLowerCase();
  const extensionValid = ALLOWED_ATESTADO_FILE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

  if (!mimeValid && !extensionValid) {
    return {
      valid: false as const,
      error: 'Formato inválido. Envie apenas PDF, JPG, JPEG ou PNG.',
    };
  }

  if (file.size > MAX_ATESTADO_FILE_SIZE_BYTES) {
    return {
      valid: false as const,
      error: `O arquivo excede o limite de ${MAX_ATESTADO_FILE_SIZE_MB} MB.`,
    };
  }

  return { valid: true as const };
};

export const buildAtestadoStoragePath = (cpf: string, fileName: string, dateBase?: string) => {
  const baseDate = dateBase ? new Date(`${dateBase}T00:00:00`) : new Date();
  const year = String(baseDate.getFullYear());
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const cpfDigits = normalizeCpf(cpf);
  const safeFileName = slugifyFileName(fileName);
  const stamp = Date.now();
  return `${year}/${month}/${cpfDigits}/${stamp}-${safeFileName}`;
};

export const createEmptyAtestadoForm = (): AtestadoFormData => ({
  cpf: '',
  servidorNome: '',
  matricula: '',
  setor: '',
  categoria: '',
  tipo: '',
  dataEmissao: '',
  dataInicio: '',
  dataFim: '',
  dias: '',
  cid: '',
  observacao: '',
  status: 'PENDENTE',
  arquivo: null,
  arquivoNome: '',
  arquivoUrl: '',
  arquivoPath: '',
  arquivoTipo: '',
  arquivoTamanho: 0,
  lancarNaFrequencia: true,
  considerarDiasUteis: false,
});

export const mapAtestadoToForm = (item: Atestado): AtestadoFormData => ({
  id: item.id,
  cpf: item.cpf ?? '',
  servidorNome: item.servidorNome ?? '',
  matricula: item.matricula ?? '',
  setor: item.setor ?? '',
  categoria: item.categoria ?? '',
  tipo: item.tipo ?? '',
  dataEmissao: item.dataEmissao ?? '',
  dataInicio: item.dataInicio ?? '',
  dataFim: item.dataFim ?? '',
  dias: String(item.dias ?? ''),
  cid: item.cid ?? '',
  observacao: item.observacao ?? '',
  status: item.status ?? 'PENDENTE',
  arquivo: null,
  arquivoNome: item.arquivoNome ?? '',
  arquivoUrl: item.arquivoUrl ?? '',
  arquivoPath: item.arquivoPath ?? '',
  arquivoTipo: item.arquivoTipo ?? '',
  arquivoTamanho: item.arquivoTamanho ?? 0,
  lancarNaFrequencia: Boolean(item.lancarNaFrequencia),
  considerarDiasUteis: Boolean(item.considerarDiasUteis),
});

export const getStatusBadgeClass = (status: string) => {
  if (status === 'VALIDADO') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  if (status === 'PENDENTE') return 'bg-amber-500/10 text-amber-300 border border-amber-500/20';
  return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
};

export const getTypeBadgeClass = (tipo: string) => {
  switch (tipo) {
    case 'MÉDICO':
      return 'bg-sky-500/10 text-sky-300 border border-sky-500/20';
    case 'ODONTOLÓGICO':
      return 'bg-violet-500/10 text-violet-300 border border-violet-500/20';
    case 'PSICOLÓGICO':
      return 'bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20';
    case 'ACOMPANHAMENTO':
      return 'bg-orange-500/10 text-orange-300 border border-orange-500/20';
    default:
      return 'bg-zinc-500/10 text-zinc-300 border border-zinc-500/20';
  }
};

export const exportAtestadosToCsv = (rows: Atestado[]) => {
  const headers = [
    'ID',
    'CPF',
    'SERVIDOR',
    'MATRICULA',
    'SETOR',
    'CATEGORIA',
    'TIPO',
    'DATA EMISSAO',
    'DATA INICIO',
    'DATA FIM',
    'DIAS',
    'CID',
    'OBSERVACAO',
    'STATUS',
    'ARQUIVO NOME',
    'ARQUIVO TIPO',
    'ARQUIVO TAMANHO',
    'LANCAR NA FREQUENCIA',
    'CONSIDERAR DIAS UTEIS',
    'CRIADO EM',
    'ATUALIZADO EM',
  ];

  const escapeValue = (value: unknown) => {
    const stringValue = value == null ? '' : String(value);
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const content = [
    headers.join(';'),
    ...rows.map((item) =>
      [
        item.id,
        item.cpf,
        item.servidorNome,
        item.matricula,
        item.setor,
        item.categoria,
        item.tipo,
        item.dataEmissao,
        item.dataInicio,
        item.dataFim,
        item.dias,
        item.cid,
        item.observacao,
        item.status,
        item.arquivoNome,
        item.arquivoTipo,
        item.arquivoTamanho,
        item.lancarNaFrequencia ? 'SIM' : 'NAO',
        item.considerarDiasUteis ? 'SIM' : 'NAO',
        item.criadoEm,
        item.atualizadoEm,
      ]
        .map(escapeValue)
        .join(';'),
    ),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `atestados_${today}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const formatConflictMessage = (conflicts: FrequenciaConflict[]) => {
  if (!conflicts.length) return '';
  return conflicts
    .map((item) => `${formatDate(item.data)} — ${item.origem}: ${item.descricao}`)
    .join('\n');
};
