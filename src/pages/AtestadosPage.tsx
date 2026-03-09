import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  FilePlus2,
  Download,
  RefreshCw,
  FileText,
  Users,
  CalendarDays,
  Clock3,
  AlertCircle,
  Filter,
  BriefcaseMedical,
  ShieldCheck,
  Edit2,
  X,
  Paperclip,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type StatusAtestado = 'PENDENTE' | 'VALIDADO' | 'REJEITADO';
type TipoAtestado = 'MÉDICO' | 'ODONTOLÓGICO' | 'PSICOLÓGICO' | 'ACOMPANHAMENTO';

interface Atestado {
  id: string;
  nomeServidor: string;
  cpf: string;
  matricula: string;
  setor: string;
  categoria: string;
  tipo: TipoAtestado;
  status: StatusAtestado;
  cid?: string;
  dataEmissao?: string;
  dataInicio: string;
  dataFim: string;
  diasAfastado: number;
  criadoEm: string;
  observacao?: string;
  arquivoNome?: string;
  lancarNaFrequencia?: boolean;
  somenteDiasUteis?: boolean;
}

interface AtestadoFormData {
  id?: string;
  nomeServidor: string;
  cpf: string;
  matricula: string;
  setor: string;
  categoria: string;
  tipo: '' | TipoAtestado;
  status: '' | StatusAtestado;
  cid: string;
  dataEmissao: string;
  dataInicio: string;
  dataFim: string;
  diasAfastado: string;
  observacao: string;
  arquivo: File | null;
  arquivoNome: string;
  lancarNaFrequencia: boolean;
  somenteDiasUteis: boolean;
}

type FormErrors = Partial<Record<keyof AtestadoFormData, string>>;

const MOCK_ATESTADOS: Atestado[] = [
  {
    id: 'ATE-0001',
    nomeServidor: 'ANA PAULA SILVA',
    cpf: '123.456.789-00',
    matricula: '2023/001',
    setor: 'ADMINISTRAÇÃO',
    categoria: 'EFETIVO SESAU',
    tipo: 'MÉDICO',
    status: 'VALIDADO',
    cid: 'J11',
    dataEmissao: '2026-03-01',
    dataInicio: '2026-03-01',
    dataFim: '2026-03-03',
    diasAfastado: 3,
    criadoEm: '2026-03-01',
    observacao: 'Atestado médico apresentado dentro do prazo.',
    arquivoNome: 'atestado_ana_paula.pdf',
    lancarNaFrequencia: true,
    somenteDiasUteis: false,
  },
  {
    id: 'ATE-0002',
    nomeServidor: 'BRUNO RIBEIRO COSTA',
    cpf: '234.567.890-11',
    matricula: '2021/017',
    setor: 'ENFERMAGEM',
    categoria: 'SELETIVO SESAU',
    tipo: 'MÉDICO',
    status: 'PENDENTE',
    cid: 'M54',
    dataEmissao: '2026-03-05',
    dataInicio: '2026-03-05',
    dataFim: '2026-03-07',
    diasAfastado: 3,
    criadoEm: '2026-03-05',
    observacao: 'Aguardando validação do setor responsável.',
    lancarNaFrequencia: true,
    somenteDiasUteis: false,
  },
  {
    id: 'ATE-0003',
    nomeServidor: 'CARLOS EDUARDO LIMA',
    cpf: '345.678.901-22',
    matricula: '2019/044',
    setor: 'FISIOTERAPIA',
    categoria: 'COMISSIONADOS',
    tipo: 'ODONTOLÓGICO',
    status: 'VALIDADO',
    cid: 'K08',
    dataEmissao: '2026-02-20',
    dataInicio: '2026-02-20',
    dataFim: '2026-02-20',
    diasAfastado: 1,
    criadoEm: '2026-02-20',
    observacao: 'Comparecimento confirmado.',
    lancarNaFrequencia: false,
    somenteDiasUteis: false,
  },
  {
    id: 'ATE-0004',
    nomeServidor: 'DANIELA SOUZA FERREIRA',
    cpf: '456.789.012-33',
    matricula: '2020/099',
    setor: 'PSICOLOGIA',
    categoria: 'EFETIVO SETRABES',
    tipo: 'PSICOLÓGICO',
    status: 'PENDENTE',
    cid: 'F41',
    dataEmissao: '2026-03-06',
    dataInicio: '2026-03-06',
    dataFim: '2026-03-10',
    diasAfastado: 5,
    criadoEm: '2026-03-06',
    observacao: 'Documento em análise.',
    lancarNaFrequencia: true,
    somenteDiasUteis: true,
  },
  {
    id: 'ATE-0005',
    nomeServidor: 'ELIANE MOURA BARBOSA',
    cpf: '567.890.123-44',
    matricula: '2018/130',
    setor: 'SERVIÇO SOCIAL',
    categoria: 'FEDERAIS SETRABES',
    tipo: 'ACOMPANHAMENTO',
    status: 'VALIDADO',
    dataEmissao: '2026-01-14',
    dataInicio: '2026-01-14',
    dataFim: '2026-01-14',
    diasAfastado: 1,
    criadoEm: '2026-01-14',
    observacao: 'Acompanhamento familiar autorizado.',
    lancarNaFrequencia: false,
    somenteDiasUteis: false,
  },
  {
    id: 'ATE-0006',
    nomeServidor: 'FABIO HENRIQUE OLIVEIRA',
    cpf: '678.901.234-55',
    matricula: '2022/071',
    setor: 'RECEPÇÃO',
    categoria: 'SELETIVO SETRABES',
    tipo: 'MÉDICO',
    status: 'REJEITADO',
    cid: 'R51',
    dataEmissao: '2026-02-11',
    dataInicio: '2026-02-11',
    dataFim: '2026-02-12',
    diasAfastado: 2,
    criadoEm: '2026-02-11',
    observacao: 'Documento inconsistente para validação.',
    lancarNaFrequencia: false,
    somenteDiasUteis: false,
  },
];

const STATUS_OPTIONS: Array<'TODOS' | StatusAtestado> = ['TODOS', 'PENDENTE', 'VALIDADO', 'REJEITADO'];
const TIPO_OPTIONS: Array<'TODOS' | TipoAtestado> = ['TODOS', 'MÉDICO', 'ODONTOLÓGICO', 'PSICOLÓGICO', 'ACOMPANHAMENTO'];

const monthOptions = [
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

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const getUniqueSorted = (values: string[]) =>
  ['TODOS', ...Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR'))];

const formatDate = (value: string) => {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const getMonthFromDate = (value: string) => {
  if (!value) return '';
  const parts = value.split('-');
  return parts.length >= 2 ? String(Number(parts[1])) : '';
};

const getYearFromDate = (value: string) => {
  if (!value) return '';
  const parts = value.split('-');
  return parts.length >= 1 ? parts[0] : '';
};

const normalizeCpf = (value: string) => value.replace(/\D/g, '');

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
};

const calculateCalendarDays = (start: string, end: string) => {
  if (!start || !end) return 0;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  if (endDate < startDate) return 0;
  const diff = endDate.getTime() - startDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

const calculateBusinessDays = (start: string, end: string) => {
  if (!start || !end) return 0;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  if (endDate < startDate) return 0;

  let count = 0;
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
};

const getStatusBadge = (status: StatusAtestado) => {
  if (status === 'VALIDADO') {
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  }
  if (status === 'PENDENTE') {
    return 'bg-amber-500/10 text-amber-300 border border-amber-500/20';
  }
  return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
};

const getTypeBadge = (tipo: TipoAtestado) => {
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

const exportToCsv = (rows: Atestado[]) => {
  const headers = [
    'ID',
    'NOME SERVIDOR',
    'CPF',
    'MATRICULA',
    'SETOR',
    'CATEGORIA',
    'TIPO',
    'STATUS',
    'CID',
    'DATA EMISSAO',
    'DATA INICIO',
    'DATA FIM',
    'DIAS AFASTADO',
    'CRIADO EM',
    'ARQUIVO',
    'LANCAR NA FREQUENCIA',
    'SOMENTE DIAS UTEIS',
    'OBSERVACAO',
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
        item.nomeServidor,
        item.cpf,
        item.matricula,
        item.setor,
        item.categoria,
        item.tipo,
        item.status,
        item.cid ?? '',
        item.dataEmissao ?? '',
        item.dataInicio,
        item.dataFim,
        item.diasAfastado,
        item.criadoEm,
        item.arquivoNome ?? '',
        item.lancarNaFrequencia ? 'SIM' : 'NAO',
        item.somenteDiasUteis ? 'SIM' : 'NAO',
        item.observacao ?? '',
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

const createEmptyForm = (): AtestadoFormData => ({
  nomeServidor: '',
  cpf: '',
  matricula: '',
  setor: '',
  categoria: '',
  tipo: '',
  status: 'PENDENTE',
  cid: '',
  dataEmissao: '',
  dataInicio: '',
  dataFim: '',
  diasAfastado: '',
  observacao: '',
  arquivo: null,
  arquivoNome: '',
  lancarNaFrequencia: true,
  somenteDiasUteis: false,
});

const mapAtestadoToForm = (item: Atestado): AtestadoFormData => ({
  id: item.id,
  nomeServidor: item.nomeServidor ?? '',
  cpf: item.cpf ?? '',
  matricula: item.matricula ?? '',
  setor: item.setor ?? '',
  categoria: item.categoria ?? '',
  tipo: item.tipo ?? '',
  status: item.status ?? 'PENDENTE',
  cid: item.cid ?? '',
  dataEmissao: item.dataEmissao ?? '',
  dataInicio: item.dataInicio ?? '',
  dataFim: item.dataFim ?? '',
  diasAfastado: String(item.diasAfastado ?? ''),
  observacao: item.observacao ?? '',
  arquivo: null,
  arquivoNome: item.arquivoNome ?? '',
  lancarNaFrequencia: Boolean(item.lancarNaFrequencia),
  somenteDiasUteis: Boolean(item.somenteDiasUteis),
});

const buildAtestadoFromForm = (form: AtestadoFormData, existingCreatedAt?: string): Atestado => ({
  id: form.id ?? `ATE-${Date.now()}`,
  nomeServidor: form.nomeServidor.trim().toUpperCase(),
  cpf: formatCpf(form.cpf),
  matricula: form.matricula.trim(),
  setor: form.setor.trim().toUpperCase(),
  categoria: form.categoria.trim().toUpperCase(),
  tipo: (form.tipo || 'MÉDICO') as TipoAtestado,
  status: (form.status || 'PENDENTE') as StatusAtestado,
  cid: form.cid.trim(),
  dataEmissao: form.dataEmissao || '',
  dataInicio: form.dataInicio,
  dataFim: form.dataFim,
  diasAfastado: Math.max(1, Number(form.diasAfastado) || 1),
  criadoEm: existingCreatedAt || new Date().toISOString().slice(0, 10),
  observacao: form.observacao.trim(),
  arquivoNome: form.arquivo?.name || form.arquivoNome || '',
  lancarNaFrequencia: form.lancarNaFrequencia,
  somenteDiasUteis: form.somenteDiasUteis,
});

const KpiCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
}> = ({ title, value, icon, accent = 'from-cyan-500/20 to-blue-500/10' }) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="group rounded-2xl border border-white/10 bg-[#111827]/80 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{value}</h3>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br ${accent} text-white/90`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <p className="mt-3 text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
        Indicador resumido da gestão de atestados
      </p>
    </motion.div>
  );
};

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">{children}</span>
);

const InputBaseClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400/30 focus:bg-white/[0.07]';
const TextAreaBaseClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400/30 focus:bg-white/[0.07] min-h-[110px] resize-y';

const AtestadosPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('TODOS');
  const [selectedYear, setSelectedYear] = useState<string>('TODOS');
  const [selectedSetor, setSelectedSetor] = useState<string>('TODOS');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<'TODOS' | StatusAtestado>('TODOS');
  const [selectedTipo, setSelectedTipo] = useState<'TODOS' | TipoAtestado>('TODOS');
  const [refreshKey, setRefreshKey] = useState(0);

  const [atestados, setAtestados] = useState<Atestado[]>(() =>
    [...MOCK_ATESTADOS].sort((a, b) => a.nomeServidor.localeCompare(b.nomeServidor, 'pt-BR')),
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAtestadoId, setEditingAtestadoId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AtestadoFormData>(createEmptyForm());
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const isEditing = Boolean(editingAtestadoId);

  const data = useMemo(() => {
    return [...atestados].sort((a, b) => a.nomeServidor.localeCompare(b.nomeServidor, 'pt-BR'));
  }, [atestados, refreshKey]);

  const setorOptions = useMemo(() => getUniqueSorted(data.map((item) => item.setor)), [data]);
  const categoriaOptions = useMemo(() => getUniqueSorted(data.map((item) => item.categoria)), [data]);
  const yearOptions = useMemo(() => getUniqueSorted(data.map((item) => getYearFromDate(item.dataInicio))), [data]);

  const filteredData = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return data.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.nomeServidor.toLowerCase().includes(normalizedSearch) ||
        item.cpf.toLowerCase().includes(normalizedSearch) ||
        item.matricula.toLowerCase().includes(normalizedSearch);

      const matchesMonth = selectedMonth === 'TODOS' || getMonthFromDate(item.dataInicio) === selectedMonth;
      const matchesYear = selectedYear === 'TODOS' || getYearFromDate(item.dataInicio) === selectedYear;
      const matchesSetor = selectedSetor === 'TODOS' || item.setor === selectedSetor;
      const matchesCategoria = selectedCategoria === 'TODOS' || item.categoria === selectedCategoria;
      const matchesStatus = selectedStatus === 'TODOS' || item.status === selectedStatus;
      const matchesTipo = selectedTipo === 'TODOS' || item.tipo === selectedTipo;

      return (
        matchesSearch &&
        matchesMonth &&
        matchesYear &&
        matchesSetor &&
        matchesCategoria &&
        matchesStatus &&
        matchesTipo
      );
    });
  }, [
    data,
    search,
    selectedMonth,
    selectedYear,
    selectedSetor,
    selectedCategoria,
    selectedStatus,
    selectedTipo,
  ]);

  const kpis = useMemo(() => {
    const totalAtestados = filteredData.length;
    const servidoresAfastados = new Set(filteredData.map((item) => normalizeCpf(item.cpf))).size;
    const diasAfastados = filteredData.reduce((acc, item) => acc + (item.diasAfastado || 0), 0);
    const pendentes = filteredData.filter((item) => item.status === 'PENDENTE').length;
    const validados = filteredData.filter((item) => item.status === 'VALIDADO').length;

    return {
      totalAtestados,
      servidoresAfastados,
      diasAfastados,
      pendentes,
      validados,
    };
  }, [filteredData]);

  useEffect(() => {
    if (!formData.dataInicio || !formData.dataFim) return;
    if (new Date(`${formData.dataFim}T00:00:00`) < new Date(`${formData.dataInicio}T00:00:00`)) return;

    const days = formData.somenteDiasUteis
      ? calculateBusinessDays(formData.dataInicio, formData.dataFim)
      : calculateCalendarDays(formData.dataInicio, formData.dataFim);

    setFormData((prev) => ({
      ...prev,
      diasAfastado: days > 0 ? String(days) : '',
    }));
  }, [formData.dataInicio, formData.dataFim, formData.somenteDiasUteis]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const openNewModal = () => {
    setEditingAtestadoId(null);
    setFormData(createEmptyForm());
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: Atestado) => {
    setEditingAtestadoId(item.id);
    setFormData(mapAtestadoToForm(item));
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAtestadoId(null);
    setFormData(createEmptyForm());
    setFormErrors({});
  };

  const handleExportCsv = () => {
    exportToCsv(filteredData);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedMonth('TODOS');
    setSelectedYear('TODOS');
    setSelectedSetor('TODOS');
    setSelectedCategoria('TODOS');
    setSelectedStatus('TODOS');
    setSelectedTipo('TODOS');
  };

  const handleInputChange = <K extends keyof AtestadoFormData>(field: K, value: AtestadoFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};

    if (!formData.nomeServidor.trim()) {
      errors.nomeServidor = 'Informe o nome do servidor.';
    }

    if (!formData.cpf.trim()) {
      errors.cpf = 'Informe o CPF.';
    } else if (normalizeCpf(formData.cpf).length !== 11) {
      errors.cpf = 'CPF inválido.';
    }

    if (!formData.tipo) {
      errors.tipo = 'Selecione o tipo.';
    }

    if (!formData.dataInicio) {
      errors.dataInicio = 'Informe a data inicial.';
    }

    if (!formData.dataFim) {
      errors.dataFim = 'Informe a data final.';
    }

    if (!formData.status) {
      errors.status = 'Selecione o status.';
    }

    if (formData.dataInicio && formData.dataFim) {
      const start = new Date(`${formData.dataInicio}T00:00:00`);
      const end = new Date(`${formData.dataFim}T00:00:00`);
      if (end < start) {
        errors.dataFim = 'A data final não pode ser menor que a data inicial.';
      }
    }

    const calculatedDays =
      formData.dataInicio && formData.dataFim
        ? formData.somenteDiasUteis
          ? calculateBusinessDays(formData.dataInicio, formData.dataFim)
          : calculateCalendarDays(formData.dataInicio, formData.dataFim)
        : 0;

    if (!formData.diasAfastado || Number(formData.diasAfastado) <= 0) {
      errors.diasAfastado = 'Quantidade de dias inválida.';
    } else if (calculatedDays > 0 && Number(formData.diasAfastado) !== calculatedDays) {
      errors.diasAfastado = `A quantidade de dias deve ser ${calculatedDays}.`;
    }

    if (formData.arquivo && formData.arquivo.size > MAX_FILE_SIZE_BYTES) {
      errors.arquivo = `O arquivo excede ${MAX_FILE_SIZE_MB} MB.`;
    }

    return errors;
  };

  const handleSave = () => {
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const existingItem = editingAtestadoId ? atestados.find((item) => item.id === editingAtestadoId) : undefined;
    const payload = buildAtestadoFromForm(formData, existingItem?.criadoEm);

    setAtestados((prev) => {
      if (editingAtestadoId) {
        return prev.map((item) => (item.id === editingAtestadoId ? payload : item));
      }
      return [payload, ...prev];
    });

    closeModal();
  };

  return (
    <div className="min-h-full space-y-6">
      <section className="rounded-3xl border border-white/10 bg-[#0B1220]/85 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
              <BriefcaseMedical size={14} />
              Gestão de Saúde Ocupacional
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Gestão de Atestados
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
              Cadastre, acompanhe e consulte afastamentos médicos dos servidores.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openNewModal}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/15 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300/30 hover:bg-cyan-500/20"
            >
              <FilePlus2 size={18} />
              Novo Atestado
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
            >
              <Download size={18} />
              Exportar CSV
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
            >
              <RefreshCw size={18} />
              Atualizar
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          title="Total de Atestados"
          value={kpis.totalAtestados}
          icon={<FileText size={20} />}
          accent="from-cyan-500/20 to-blue-500/10"
        />
        <KpiCard
          title="Servidores Afastados"
          value={kpis.servidoresAfastados}
          icon={<Users size={20} />}
          accent="from-indigo-500/20 to-sky-500/10"
        />
        <KpiCard
          title="Dias Afastados"
          value={kpis.diasAfastados}
          icon={<CalendarDays size={20} />}
          accent="from-violet-500/20 to-fuchsia-500/10"
        />
        <KpiCard
          title="Pendentes"
          value={kpis.pendentes}
          icon={<AlertCircle size={20} />}
          accent="from-amber-500/20 to-orange-500/10"
        />
        <KpiCard
          title="Validados"
          value={kpis.validados}
          icon={<ShieldCheck size={20} />}
          accent="from-emerald-500/20 to-green-500/10"
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0F172A]/80 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300">
            <Filter size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Filtros</h2>
            <p className="text-sm text-zinc-400">Refine a consulta por servidor, período e classificação.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          <label className="block">
            <FieldLabel>Busca</FieldLabel>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
              <Search size={16} className="text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, CPF ou matrícula"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>
          </label>

          <label className="block">
            <FieldLabel>Mês</FieldLabel>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={InputBaseClass}
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <FieldLabel>Ano</FieldLabel>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={InputBaseClass}
            >
              {yearOptions.map((option) => (
                <option key={option} value={option} className="bg-slate-900 text-white">
                  {option === 'TODOS' ? 'Todos os anos' : option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <FieldLabel>Setor</FieldLabel>
            <select
              value={selectedSetor}
              onChange={(e) => setSelectedSetor(e.target.value)}
              className={InputBaseClass}
            >
              {setorOptions.map((option) => (
                <option key={option} value={option} className="bg-slate-900 text-white">
                  {option === 'TODOS' ? 'Todos os setores' : option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <FieldLabel>Categoria</FieldLabel>
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className={InputBaseClass}
            >
              {categoriaOptions.map((option) => (
                <option key={option} value={option} className="bg-slate-900 text-white">
                  {option === 'TODOS' ? 'Todas as categorias' : option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <FieldLabel>Status</FieldLabel>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'TODOS' | StatusAtestado)}
              className={InputBaseClass}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-slate-900 text-white">
                  {option === 'TODOS' ? 'Todos os status' : option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <FieldLabel>Tipo</FieldLabel>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value as 'TODOS' | TipoAtestado)}
              className={InputBaseClass}
            >
              {TIPO_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-slate-900 text-white">
                  {option === 'TODOS' ? 'Todos os tipos' : option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">
            Exibindo <span className="font-semibold text-zinc-200">{filteredData.length}</span> registro(s).
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
          >
            Limpar filtros
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0F172A]/80 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">Lista de Atestados</h2>
            <p className="text-sm text-zinc-400">Estrutura inicial pronta para futura integração com backend real.</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300">
            <Clock3 size={14} />
            Base local segura
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full">
            <thead className="bg-white/[0.03]">
              <tr className="text-left">
                {[
                  'Servidor',
                  'CPF / Matrícula',
                  'Setor / Categoria',
                  'Tipo',
                  'Período',
                  'Dias',
                  'Status',
                  'CID',
                  'Cadastro',
                  'Ações',
                ].map((header) => (
                  <th
                    key={header}
                    className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-14 text-center text-sm text-zinc-400">
                    Nenhum atestado encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-white/5 transition hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{item.nomeServidor}</span>
                        <span className="text-xs text-zinc-500">{item.id}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-zinc-200">{item.cpf}</span>
                        <span className="text-xs text-zinc-500">{item.matricula}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-zinc-200">{item.setor}</span>
                        <span className="text-xs text-zinc-500">{item.categoria}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getTypeBadge(item.tipo)}`}>
                        {item.tipo}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-zinc-200">{formatDate(item.dataInicio)}</span>
                        <span className="text-xs text-zinc-500">até {formatDate(item.dataFim)}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-white">{item.diasAfastado}</td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-zinc-300">{item.cid || '-'}</td>

                    <td className="px-5 py-4 text-sm text-zinc-300">{formatDate(item.criadoEm)}</td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                      >
                        <Edit2 size={14} />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 lg:hidden">
          {filteredData.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-zinc-400">
              Nenhum atestado encontrado com os filtros atuais.
            </div>
          ) : (
            filteredData.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{item.nomeServidor}</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.cpf} • {item.matricula}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Setor</p>
                    <p className="mt-1 text-zinc-200">{item.setor}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Categoria</p>
                    <p className="mt-1 text-zinc-200">{item.categoria}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Tipo</p>
                    <p className="mt-1 text-zinc-200">{item.tipo}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Dias</p>
                    <p className="mt-1 text-zinc-200">{item.diasAfastado}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Início</p>
                    <p className="mt-1 text-zinc-200">{formatDate(item.dataInicio)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Fim</p>
                    <p className="mt-1 text-zinc-200">{formatDate(item.dataFim)}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
                  >
                    <Edit2 size={16} />
                    Editar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="atestado-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0B1220] shadow-[0_30px_90px_rgba(0,0,0,0.45)] md:rounded-3xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                    <BriefcaseMedical size={13} />
                    {isEditing ? 'Editar Atestado' : 'Novo Atestado'}
                  </div>
                  <h3 className="mt-3 text-2xl font-black text-white">
                    {isEditing ? 'Editar registro de atestado' : 'Cadastrar novo atestado'}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    Preencha os dados do servidor, do atestado e do arquivo, sem quebrar a integração futura com o backend.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
                  aria-label="Fechar modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
                <div className="space-y-6">
                  <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-200">
                        <Users size={18} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">Dados do Servidor</h4>
                        <p className="text-sm text-zinc-400">Identificação principal do servidor vinculado ao atestado.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <label className="xl:col-span-2">
                        <FieldLabel>Nome do Servidor *</FieldLabel>
                        <input
                          value={formData.nomeServidor}
                          onChange={(e) => handleInputChange('nomeServidor', e.target.value)}
                          className={InputBaseClass}
                          placeholder="Digite o nome completo"
                        />
                        {formErrors.nomeServidor && (
                          <p className="mt-2 text-xs text-rose-400">{formErrors.nomeServidor}</p>
                        )}
                      </label>

                      <label>
                        <FieldLabel>CPF *</FieldLabel>
                        <input
                          value={formData.cpf}
                          onChange={(e) => handleInputChange('cpf', formatCpf(e.target.value))}
                          className={InputBaseClass}
                          placeholder="000.000.000-00"
                        />
                        {formErrors.cpf && <p className="mt-2 text-xs text-rose-400">{formErrors.cpf}</p>}
                      </label>

                      <label>
                        <FieldLabel>Matrícula</FieldLabel>
                        <input
                          value={formData.matricula}
                          onChange={(e) => handleInputChange('matricula', e.target.value)}
                          className={InputBaseClass}
                          placeholder="Ex.: 2023/001"
                        />
                      </label>

                      <label>
                        <FieldLabel>Setor</FieldLabel>
                        <input
                          value={formData.setor}
                          onChange={(e) => handleInputChange('setor', e.target.value)}
                          className={InputBaseClass}
                          placeholder="Setor do servidor"
                        />
                      </label>

                      <label className="md:col-span-2 xl:col-span-2">
                        <FieldLabel>Categoria</FieldLabel>
                        <input
                          value={formData.categoria}
                          onChange={(e) => handleInputChange('categoria', e.target.value)}
                          className={InputBaseClass}
                          placeholder="Categoria funcional"
                        />
                      </label>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-200">
                        <FileText size={18} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">Dados do Atestado</h4>
                        <p className="text-sm text-zinc-400">Informações essenciais para análise e lançamento.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <label>
                        <FieldLabel>Tipo *</FieldLabel>
                        <select
                          value={formData.tipo}
                          onChange={(e) => handleInputChange('tipo', e.target.value as AtestadoFormData['tipo'])}
                          className={InputBaseClass}
                        >
                          <option value="" className="bg-slate-900 text-white">
                            Selecione
                          </option>
                          {TIPO_OPTIONS.filter((item) => item !== 'TODOS').map((option) => (
                            <option key={option} value={option} className="bg-slate-900 text-white">
                              {option}
                            </option>
                          ))}
                        </select>
                        {formErrors.tipo && <p className="mt-2 text-xs text-rose-400">{formErrors.tipo}</p>}
                      </label>

                      <label>
                        <FieldLabel>Data de Emissão</FieldLabel>
                        <input
                          type="date"
                          value={formData.dataEmissao}
                          onChange={(e) => handleInputChange('dataEmissao', e.target.value)}
                          className={InputBaseClass}
                        />
                      </label>

                      <label>
                        <FieldLabel>Data Inicial *</FieldLabel>
                        <input
                          type="date"
                          value={formData.dataInicio}
                          onChange={(e) => handleInputChange('dataInicio', e.target.value)}
                          className={InputBaseClass}
                        />
                        {formErrors.dataInicio && (
                          <p className="mt-2 text-xs text-rose-400">{formErrors.dataInicio}</p>
                        )}
                      </label>

                      <label>
                        <FieldLabel>Data Final *</FieldLabel>
                        <input
                          type="date"
                          value={formData.dataFim}
                          onChange={(e) => handleInputChange('dataFim', e.target.value)}
                          className={InputBaseClass}
                        />
                        {formErrors.dataFim && <p className="mt-2 text-xs text-rose-400">{formErrors.dataFim}</p>}
                      </label>

                      <label>
                        <FieldLabel>Quantidade de Dias</FieldLabel>
                        <input
                          type="number"
                          min={1}
                          value={formData.diasAfastado}
                          onChange={(e) => handleInputChange('diasAfastado', e.target.value)}
                          className={InputBaseClass}
                          placeholder="0"
                        />
                        {formErrors.diasAfastado && (
                          <p className="mt-2 text-xs text-rose-400">{formErrors.diasAfastado}</p>
                        )}
                      </label>

                      <label>
                        <FieldLabel>CID</FieldLabel>
                        <input
                          value={formData.cid}
                          onChange={(e) => handleInputChange('cid', e.target.value.toUpperCase())}
                          className={InputBaseClass}
                          placeholder="Opcional"
                        />
                      </label>

                      <label>
                        <FieldLabel>Status *</FieldLabel>
                        <select
                          value={formData.status}
                          onChange={(e) => handleInputChange('status', e.target.value as AtestadoFormData['status'])}
                          className={InputBaseClass}
                        >
                          <option value="" className="bg-slate-900 text-white">
                            Selecione
                          </option>
                          {STATUS_OPTIONS.filter((item) => item !== 'TODOS').map((option) => (
                            <option key={option} value={option} className="bg-slate-900 text-white">
                              {option}
                            </option>
                          ))}
                        </select>
                        {formErrors.status && <p className="mt-2 text-xs text-rose-400">{formErrors.status}</p>}
                      </label>

                      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                          Cálculo Atual
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-white">
                          <CheckCircle2 size={16} className="text-cyan-300" />
                          <span className="text-sm font-semibold">
                            {formData.diasAfastado || '0'} dia(s)
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-cyan-100/80">
                          {formData.somenteDiasUteis ? 'Considerando somente dias úteis.' : 'Considerando dias corridos.'}
                        </p>
                      </div>

                      <label className="md:col-span-2 xl:col-span-4">
                        <FieldLabel>Observação</FieldLabel>
                        <textarea
                          value={formData.observacao}
                          onChange={(e) => handleInputChange('observacao', e.target.value)}
                          className={TextAreaBaseClass}
                          placeholder="Observações internas, justificativas ou detalhes complementares"
                        />
                      </label>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-200">
                        <Paperclip size={18} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">Arquivo</h4>
                        <p className="text-sm text-zinc-400">Envio opcional do atestado digitalizado ou documento equivalente.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                      <div>
                        <FieldLabel>Upload de Arquivo</FieldLabel>
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center transition hover:bg-white/[0.07]">
                          <Paperclip size={18} className="mb-2 text-zinc-300" />
                          <span className="text-sm font-semibold text-white">Selecionar arquivo</span>
                          <span className="mt-1 text-xs text-zinc-400">
                            PDF, imagem ou documento compatível até {MAX_FILE_SIZE_MB} MB
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              handleInputChange('arquivo', file);
                              handleInputChange('arquivoNome', file?.name ?? formData.arquivoNome ?? '');
                            }}
                          />
                        </label>
                        {formErrors.arquivo && <p className="mt-2 text-xs text-rose-400">{formErrors.arquivo}</p>}
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <FieldLabel>Arquivo Selecionado</FieldLabel>
                        <p className="text-sm font-medium text-white">
                          {formData.arquivo?.name || formData.arquivoNome || 'Nenhum arquivo enviado'}
                        </p>
                        <p className="mt-2 text-xs text-zinc-400">
                          O envio é opcional e o formulário continua funcional mesmo sem arquivo.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-200">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">Integração</h4>
                        <p className="text-sm text-zinc-400">Configurações para o comportamento do lançamento no fluxo do RH.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <input
                          type="checkbox"
                          checked={formData.lancarNaFrequencia}
                          onChange={(e) => handleInputChange('lancarNaFrequencia', e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
                        />
                        <div>
                          <p className="text-sm font-semibold text-white">Lançar na frequência</p>
                          <p className="mt-1 text-xs text-zinc-400">
                            Mantém o registro preparado para futura integração com o módulo de frequência.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <input
                          type="checkbox"
                          checked={formData.somenteDiasUteis}
                          onChange={(e) => handleInputChange('somenteDiasUteis', e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
                        />
                        <div>
                          <p className="text-sm font-semibold text-white">Considerar somente dias úteis</p>
                          <p className="mt-1 text-xs text-zinc-400">
                            Recalcula a quantidade de dias ignorando sábados e domingos.
                          </p>
                        </div>
                      </label>
                    </div>
                  </section>
                </div>
              </div>

              <div className="border-t border-white/10 px-5 py-4 md:px-6">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
                  >
                    <X size={16} />
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/15 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/30 hover:bg-cyan-500/20"
                  >
                    <Save size={16} />
                    {isEditing ? 'Salvar Alterações' : 'Salvar Atestado'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AtestadosPage;
