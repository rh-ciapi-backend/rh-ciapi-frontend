import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BriefcaseMedical,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FilePlus2,
  FileText,
  Filter,
  Paperclip,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
  Edit2,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import atestadosService from '../services/atestadosService';
import servidoresService from '../services/servidoresService';
import type {
  Atestado,
  AtestadoFormData,
  Servidor,
  StatusAtestado,
  TipoAtestado,
} from '../types';

type FormErrors = Partial<Record<keyof AtestadoFormData, string>>;

const STATUS_OPTIONS: Array<'TODOS' | StatusAtestado> = ['TODOS', 'PENDENTE', 'VALIDADO', 'REJEITADO'];
const TIPO_OPTIONS: Array<'TODOS' | TipoAtestado> = ['TODOS', 'MÉDICO', 'ODONTOLÓGICO', 'PSICOLÓGICO', 'ACOMPANHAMENTO'];

const MONTH_OPTIONS = [
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

const InputBaseClass =
  'h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-cyan-400/30 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(34,211,238,0.06)]';
const TextAreaBaseClass =
  'min-h-[110px] w-full resize-y rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-cyan-400/30 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(34,211,238,0.06)]';

const normalizeCpf = (value: string) => String(value || '').replace(/\D/g, '');

const formatCpf = (value: string) => {
  const digits = normalizeCpf(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
};

const safeText = (value: unknown) => String(value ?? '');
const safeLower = (value: unknown) => safeText(value).toLowerCase();

const formatDate = (value: string) => {
  if (!value) return '-';
  const normalized = String(value).slice(0, 10);
  const parts = normalized.split('-');
  if (parts.length !== 3) return String(value);
  const [year, month, day] = parts;
  if (!year || !month || !day) return String(value);
  return `${day}/${month}/${year}`;
};

const formatTechnicalError = (message: string) => {
  if (!message) return '';
  if (message.toLowerCase().includes("could not find the table 'public.atestados'")) {
    return 'Tabela "atestados" ainda não configurada no banco.';
  }
  return message;
};

const formatFileSize = (bytes: number) => {
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

const getMonthFromDate = (value: string) => {
  if (!value) return '';
  const parts = String(value).slice(0, 10).split('-');
  return parts.length >= 2 ? String(Number(parts[1])) : '';
};

const getYearFromDate = (value: string) => {
  if (!value) return '';
  const parts = String(value).slice(0, 10).split('-');
  return parts[0] || '';
};

const getUniqueSorted = (values: string[]) =>
  ['TODOS', ...Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR'))];

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
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
};

const createEmptyAtestadoForm = (): AtestadoFormData => ({
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

const mapAtestadoToForm = (item: Atestado): AtestadoFormData => ({
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

const getStatusBadgeClass = (status: string) => {
  if (status === 'VALIDADO') return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20';
  if (status === 'PENDENTE') return 'bg-amber-500/10 text-amber-300 border border-amber-500/20';
  return 'bg-rose-500/10 text-rose-300 border border-rose-500/20';
};

const getTypeBadgeClass = (tipo: string) => {
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

const validateSelectedFile = (file: File | null) => {
  if (!file) return { valid: true as const };

  const maxSizeBytes = 3 * 1024 * 1024;
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const lowerName = file.name.toLowerCase();
  const validExtension =
    lowerName.endsWith('.pdf') ||
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.png');

  if (!allowedTypes.includes(file.type) && !validExtension) {
    return {
      valid: false as const,
      error: 'Formato inválido. Envie apenas PDF, JPG, JPEG ou PNG.',
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false as const,
      error: 'O arquivo excede o limite de 3 MB.',
    };
  }

  return { valid: true as const };
};

const exportAtestadosToCsv = (rows: Atestado[]) => {
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

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
    {children}
  </span>
);

const SectionCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <section
    className={`rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(9,15,31,0.88))] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-sm ${className}`}
  >
    {children}
  </section>
);

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
      className="group rounded-[24px] border border-white/10 bg-[#10192d]/88 p-4 shadow-[0_14px_34px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{title}</p>
          <h3 className="mt-2 text-[30px] font-black leading-none text-white">{value}</h3>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br ${accent} text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-zinc-500 transition-colors group-hover:text-zinc-400">
        Indicador resumido da gestão de atestados
      </p>
    </motion.div>
  );
};

const ActionButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
}> = ({ children, onClick, primary = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={
      primary
        ? 'inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/15 px-4 text-sm font-semibold text-cyan-100 shadow-[0_10px_30px_rgba(6,182,212,0.08)] transition-all hover:-translate-y-[1px] hover:border-cyan-300/30 hover:bg-cyan-500/20'
        : 'inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-zinc-200 transition-all hover:-translate-y-[1px] hover:bg-white/[0.08]'
    }
  >
    {children}
  </button>
);

const FeedbackBanner: React.FC<{
  type: 'success' | 'error' | 'warning';
  message: string;
  onClose: () => void;
}> = ({ type, message, onClose }) => {
  const mainMessage = type === 'error' ? formatTechnicalError(message) : message;
  const showDetail = type === 'error' && mainMessage !== message;

  const palette =
    type === 'success'
      ? {
          wrap: 'border-emerald-500/20 bg-emerald-500/[0.08]',
          icon: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          title: 'text-emerald-200',
          text: 'text-emerald-100/85',
          detail: 'text-emerald-200/50',
        }
      : type === 'warning'
      ? {
          wrap: 'border-amber-500/20 bg-amber-500/[0.08]',
          icon: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          title: 'text-amber-100',
          text: 'text-amber-100/85',
          detail: 'text-amber-200/60',
        }
      : {
          wrap: 'border-rose-500/20 bg-rose-500/[0.08]',
          icon: 'bg-rose-500/10 text-rose-200 border-rose-500/20',
          title: 'text-rose-100',
          text: 'text-rose-100/85',
          detail: 'text-rose-200/60',
        };

  const title =
    type === 'success'
      ? 'Operação concluída'
      : type === 'warning'
      ? 'Atenção'
      : 'Configuração pendente';

  return (
    <section className={`rounded-[22px] border px-4 py-3 ${palette.wrap}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${palette.icon}`}>
          {type === 'success' ? <CheckCircle2 size={16} /> : type === 'warning' ? <Info size={16} /> : <AlertCircle size={16} />}
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${palette.title}`}>{title}</p>
          <p className={`mt-1 text-sm leading-6 whitespace-pre-line ${palette.text}`}>{mainMessage}</p>
          {showDetail && <p className={`mt-2 text-xs ${palette.detail}`}>Detalhe técnico: {message}</p>}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </section>
  );
};

const AtestadosPage: React.FC = () => {
  const pageTopRef = useRef<HTMLDivElement | null>(null);
  const serverAutocompleteRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<Atestado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [isSearchingServidor, setIsSearchingServidor] = useState(false);
  const [serverSuggestions, setServerSuggestions] = useState<Servidor[]>([]);
  const [showServerSuggestions, setShowServerSuggestions] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('TODOS');
  const [selectedYear, setSelectedYear] = useState<string>('TODOS');
  const [selectedSetor, setSelectedSetor] = useState<string>('TODOS');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<'TODOS' | StatusAtestado>('TODOS');
  const [selectedTipo, setSelectedTipo] = useState<'TODOS' | TipoAtestado>('TODOS');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AtestadoFormData>(createEmptyAtestadoForm());
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [detailsItem, setDetailsItem] = useState<Atestado | null>(null);
  const [deleteItem, setDeleteItem] = useState<Atestado | null>(null);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning' | null;
    message: string;
  }>({ type: null, message: '' });
  const [formFeedback, setFormFeedback] = useState<{
    type: 'success' | 'error' | 'warning' | null;
    message: string;
  }>({ type: null, message: '' });

  const isEditing = Boolean(editingId);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!serverAutocompleteRef.current) return;
      if (!serverAutocompleteRef.current.contains(event.target as Node)) {
        setShowServerSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const term = formData.servidorNome.trim();

    if (!isFormOpen || term.length < 3) {
      setServerSuggestions([]);
      setShowServerSuggestions(false);
      setIsSearchingServidor(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setIsSearchingServidor(true);
        const suggestions = await servidoresService.buscarSugestoes(term, 8);
        setServerSuggestions(Array.isArray(suggestions) ? suggestions : []);
        setShowServerSuggestions(true);
      } catch {
        setServerSuggestions([]);
        setShowServerSuggestions(false);
      } finally {
        setIsSearchingServidor(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [formData.servidorNome, isFormOpen, isEditing]);

  const applyServidorSuggestion = (servidor: Servidor) => {
    setFormData((prev) => ({
      ...prev,
      servidorNome: servidor.nomeCompleto || servidor.nome || prev.servidorNome,
      cpf: servidor.cpf || prev.cpf,
      matricula: servidor.matricula || prev.matricula,
      setor: servidor.setor || prev.setor,
      categoria: servidor.categoria || prev.categoria,
    }));
    setFormErrors((prev) => ({
      ...prev,
      servidorNome: undefined,
      cpf: undefined,
    }));
    setServerSuggestions([]);
    setShowServerSuggestions(false);
  };

  const loadAtestados = async () => {
    try {
      setIsLoading(true);
      const data = await atestadosService.listar();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      showGlobalFeedback('error', error instanceof Error ? error.message : 'Falha ao carregar os atestados.');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAtestados();
  }, []);

  useEffect(() => {
    if (!formData.dataInicio || !formData.dataFim) return;

    const start = new Date(`${formData.dataInicio}T00:00:00`);
    const end = new Date(`${formData.dataFim}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return;

    const calculated = formData.considerarDiasUteis
      ? calculateBusinessDays(formData.dataInicio, formData.dataFim)
      : calculateCalendarDays(formData.dataInicio, formData.dataFim);

    setFormData((prev) => ({
      ...prev,
      dias: calculated > 0 ? String(calculated) : '',
    }));
  }, [formData.dataInicio, formData.dataFim, formData.considerarDiasUteis]);

  const setorOptions = useMemo(() => getUniqueSorted(items.map((item) => safeText(item.setor))), [items]);
  const categoriaOptions = useMemo(
    () => getUniqueSorted(items.map((item) => safeText(item.categoria))),
    [items],
  );
  const yearOptions = useMemo(
    () => getUniqueSorted(items.map((item) => getYearFromDate(safeText(item.dataInicio)))),
    [items],
  );

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items
      .filter((item) => {
        const matchesSearch =
          !term ||
          safeLower(item.servidorNome).includes(term) ||
          safeLower(item.cpf).includes(term) ||
          safeLower(item.matricula).includes(term);

        const matchesMonth = selectedMonth === 'TODOS' || getMonthFromDate(safeText(item.dataInicio)) === selectedMonth;
        const matchesYear = selectedYear === 'TODOS' || getYearFromDate(safeText(item.dataInicio)) === selectedYear;
        const matchesSetor = selectedSetor === 'TODOS' || safeText(item.setor) === selectedSetor;
        const matchesCategoria = selectedCategoria === 'TODOS' || safeText(item.categoria) === selectedCategoria;
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
      })
      .sort((a, b) => safeText(a.servidorNome).localeCompare(safeText(b.servidorNome), 'pt-BR'));
  }, [
    items,
    search,
    selectedMonth,
    selectedYear,
    selectedSetor,
    selectedCategoria,
    selectedStatus,
    selectedTipo,
  ]);

  const kpis = useMemo(() => {
    return {
      totalAtestados: filteredData.length,
      servidoresAfastados: new Set(filteredData.map((item) => normalizeCpf(safeText(item.cpf)))).size,
      diasAfastados: filteredData.reduce((acc, item) => acc + (Number(item.dias) || 0), 0),
      pendentes: filteredData.filter((item) => item.status === 'PENDENTE').length,
      validados: filteredData.filter((item) => item.status === 'VALIDADO').length,
    };
  }, [filteredData]);

  const showGlobalFeedback = (type: 'success' | 'error' | 'warning', message: string) => {
    setFeedback({ type, message });
    window.setTimeout(() => {
      pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 30);
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

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(createEmptyAtestadoForm());
    setFormErrors({});
    setFormFeedback({ type: null, message: '' });
    setServerSuggestions([]);
    setShowServerSuggestions(false);
    setIsFormOpen(true);
  };

  const openEditModal = (item: Atestado) => {
    setEditingId(item.id);
    setFormData(mapAtestadoToForm(item));
    setFormErrors({});
    setFormFeedback({ type: null, message: '' });
    setServerSuggestions([]);
    setShowServerSuggestions(false);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(createEmptyAtestadoForm());
    setFormErrors({});
    setFormFeedback({ type: null, message: '' });
    setServerSuggestions([]);
    setShowServerSuggestions(false);
  };

  const handleInputChange = <K extends keyof AtestadoFormData>(field: K, value: AtestadoFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};

    if (!formData.servidorNome.trim()) errors.servidorNome = 'Informe o nome do servidor.';
    if (!formData.cpf.trim()) {
      errors.cpf = 'Informe o CPF.';
    } else if (normalizeCpf(formData.cpf).length !== 11) {
      errors.cpf = 'CPF inválido.';
    }

    if (!formData.tipo) errors.tipo = 'Selecione o tipo.';
    if (!formData.dataInicio) errors.dataInicio = 'Informe a data inicial.';
    if (!formData.dataFim) errors.dataFim = 'Informe a data final.';
    if (!formData.status) errors.status = 'Selecione o status.';

    if (formData.dataInicio && formData.dataFim) {
      const start = new Date(`${formData.dataInicio}T00:00:00`);
      const end = new Date(`${formData.dataFim}T00:00:00`);
      if (end < start) {
        errors.dataFim = 'A data final não pode ser menor que a data inicial.';
      }
    }

    const calculatedDays =
      formData.dataInicio && formData.dataFim
        ? formData.considerarDiasUteis
          ? calculateBusinessDays(formData.dataInicio, formData.dataFim)
          : calculateCalendarDays(formData.dataInicio, formData.dataFim)
        : 0;

    if (!formData.dias || Number(formData.dias) <= 0) {
      errors.dias = 'Quantidade de dias inválida.';
    } else if (calculatedDays > 0 && Number(formData.dias) !== calculatedDays) {
      errors.dias = `A quantidade de dias deve ser ${calculatedDays}.`;
    }

    const fileValidation = validateSelectedFile(formData.arquivo);
    if (!fileValidation.valid) {
      errors.arquivo = fileValidation.error;
    }

    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormFeedback({
        type: 'error',
        message: 'Corrija os campos destacados antes de salvar.',
      });
      return;
    }

    try {
      setLoadingAction(true);
      setFeedback({ type: null, message: '' });
      setFormFeedback({ type: null, message: '' });

      const payload = {
        cpf: formatCpf(formData.cpf),
        servidorNome: formData.servidorNome.trim().toUpperCase(),
        matricula: formData.matricula.trim(),
        setor: formData.setor.trim().toUpperCase(),
        categoria: formData.categoria,
        tipo: formData.tipo as TipoAtestado,
        dataEmissao: formData.dataEmissao,
        dataInicio: formData.dataInicio,
        dataFim: formData.dataFim,
        dias: Number(formData.dias),
        cid: formData.cid.trim().toUpperCase(),
        observacao: formData.observacao.trim(),
        status: formData.status as StatusAtestado,
        arquivo: formData.arquivo,
        arquivoAtualNome: formData.arquivoNome,
        arquivoAtualUrl: formData.arquivoUrl,
        arquivoAtualPath: formData.arquivoPath,
        arquivoAtualTipo: formData.arquivoTipo,
        arquivoAtualTamanho: formData.arquivoTamanho,
        lancarNaFrequencia: formData.lancarNaFrequencia,
        considerarDiasUteis: formData.considerarDiasUteis,
      };

      const result =
        isEditing && editingId
          ? await atestadosService.editar(editingId, payload)
          : await atestadosService.adicionar(payload);

      await loadAtestados();

      if (result.warning) {
        const warningMessage = `${result.message || 'Atestado salvo com sucesso.'}
${result.warning}`;
        showGlobalFeedback('warning', warningMessage);
        closeFormModal();
        return;
      }

      showGlobalFeedback('success', result.message || 'Atestado salvo com sucesso.');
      closeFormModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar atestado.';
      setFormFeedback({
        type: 'error',
        message,
      });
      showGlobalFeedback('error', message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      setLoadingAction(true);
      await atestadosService.excluir(deleteItem.id);
      setDeleteItem(null);
      await loadAtestados();
      showGlobalFeedback('success', 'Atestado excluído com sucesso.');
    } catch (error) {
      showGlobalFeedback('error', error instanceof Error ? error.message : 'Falha ao excluir atestado.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleOpenDetails = async (item: Atestado) => {
    try {
      setLoadingAction(true);
      const full = await atestadosService.obterPorId(item.id);
      setDetailsItem(full || item);
    } catch {
      setDetailsItem(item);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDownload = async (item: Atestado) => {
    try {
      if (!item.arquivoPath) {
        showGlobalFeedback('warning', 'Este atestado não possui arquivo vinculado.');
        return;
      }

      await atestadosService.baixarArquivo(item.arquivoPath);
    } catch (error) {
      showGlobalFeedback('error', error instanceof Error ? error.message : 'Falha ao baixar arquivo.');
    }
  };

  return (
    <div ref={pageTopRef} className="min-h-full space-y-5 xl:space-y-6">
      <SectionCard className="px-5 py-5 md:px-6 md:py-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
              <BriefcaseMedical size={13} />
              Gestão de Saúde Ocupacional
            </div>

            <h1 className="text-[34px] font-black leading-tight tracking-tight text-white md:text-[42px]">
              Gestão de Atestados
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 md:text-[15px]">
              Cadastre, acompanhe e consulte afastamentos médicos dos servidores.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <ActionButton primary onClick={openCreateModal}>
              <FilePlus2 size={16} />
              Novo Atestado
            </ActionButton>

            <ActionButton onClick={() => exportAtestadosToCsv(filteredData)}>
              <Download size={16} />
              Exportar CSV
            </ActionButton>

            <ActionButton onClick={() => void loadAtestados()}>
              <RefreshCw size={16} />
              Atualizar
            </ActionButton>
          </div>
        </div>
      </SectionCard>

      {feedback.type && (
        <FeedbackBanner
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback({ type: null, message: '' })}
        />
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Total de Atestados" value={kpis.totalAtestados} icon={<FileText size={19} />} />
        <KpiCard
          title="Servidores Afastados"
          value={kpis.servidoresAfastados}
          icon={<Users size={19} />}
          accent="from-indigo-500/20 to-sky-500/10"
        />
        <KpiCard
          title="Dias Afastados"
          value={kpis.diasAfastados}
          icon={<CalendarDays size={19} />}
          accent="from-violet-500/20 to-fuchsia-500/10"
        />
        <KpiCard
          title="Pendentes"
          value={kpis.pendentes}
          icon={<AlertCircle size={19} />}
          accent="from-amber-500/20 to-orange-500/10"
        />
        <KpiCard
          title="Validados"
          value={kpis.validados}
          icon={<ShieldCheck size={19} />}
          accent="from-emerald-500/20 to-green-500/10"
        />
      </section>

      <SectionCard className="p-5 md:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <Filter size={18} />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-white">Filtros</h2>
              <p className="mt-0.5 text-sm text-zinc-400">
                Refine a consulta por servidor, período e classificação.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
            <label className="block 2xl:col-span-1">
              <FieldLabel>Busca</FieldLabel>
              <div className="flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 transition-all duration-200 focus-within:border-cyan-400/30 focus-within:bg-white/[0.07] focus-within:shadow-[0_0_0_4px_rgba(34,211,238,0.06)]">
                <Search size={16} className="shrink-0 text-zinc-400" />
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
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className={InputBaseClass}>
                {MONTH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <FieldLabel>Ano</FieldLabel>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={InputBaseClass}>
                {yearOptions.map((option) => (
                  <option key={option} value={option} className="bg-slate-900 text-white">
                    {option === 'TODOS' ? 'Todos os anos' : option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <FieldLabel>Setor</FieldLabel>
              <select value={selectedSetor} onChange={(e) => setSelectedSetor(e.target.value)} className={InputBaseClass}>
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

          <div className="flex flex-col gap-3 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-zinc-400">
              {filteredData.length === 0 ? (
                <>Nenhum registro encontrado no momento.</>
              ) : (
                <>
                  Exibindo <span className="font-semibold text-zinc-200">{filteredData.length}</span> registro(s).
                </>
              )}
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-zinc-200 transition-all hover:bg-white/[0.08]"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <h2 className="text-[20px] font-bold text-white">Lista de Atestados</h2>
            <p className="mt-0.5 text-sm text-zinc-400">
              Conectado ao Supabase com upload real e integração com frequência.
            </p>
          </div>

          <div className="inline-flex h-10 items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.05] px-3.5 text-xs font-semibold text-zinc-300">
            <Clock3 size={14} />
            {isLoading ? 'Carregando...' : `${filteredData.length} registro(s)`}
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full">
            <thead className="bg-white/[0.03]">
              <tr className="text-left">
                {['Servidor', 'CPF / Matrícula', 'Setor / Categoria', 'Tipo', 'Período', 'Dias', 'Status', 'Arquivo', 'Ações'].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-sm text-zinc-400">
                    Carregando atestados...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-sm text-zinc-400">
                    Nenhum atestado encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="border-t border-white/5 transition hover:bg-white/[0.025]">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{safeText(item.servidorNome) || '-'}</span>
                        <span className="mt-1 text-xs text-zinc-500">{safeText(item.id)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-zinc-200">{safeText(item.cpf) || '-'}</span>
                        <span className="mt-1 text-xs text-zinc-500">{safeText(item.matricula) || '-'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-zinc-200">{safeText(item.setor) || '-'}</span>
                        <span className="mt-1 text-xs text-zinc-500">{safeText(item.categoria) || '-'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getTypeBadgeClass(safeText(item.tipo))}`}>
                        {safeText(item.tipo) || '-'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-zinc-200">{formatDate(safeText(item.dataInicio))}</span>
                        <span className="mt-1 text-xs text-zinc-500">até {formatDate(safeText(item.dataFim))}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-white">{Number(item.dias) || 0}</td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(safeText(item.status))}`}>
                        {safeText(item.status) || '-'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {item.arquivoNome ? (
                        <button
                          type="button"
                          onClick={() => void handleDownload(item)}
                          className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
                        >
                          <Paperclip size={14} />
                          {safeText(item.arquivoNome)}
                        </button>
                      ) : (
                        <span className="text-sm text-zinc-500">Sem arquivo</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleOpenDetails(item)}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs font-semibold text-zinc-200 transition hover:bg-white/[0.08]"
                        >
                          <Eye size={14} />
                          Detalhes
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs font-semibold text-zinc-200 transition hover:bg-white/[0.08]"
                        >
                          <Edit2 size={14} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteItem(item)}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
                        >
                          <Trash2 size={14} />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 lg:hidden">
          {!isLoading && filteredData.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-10 text-center text-sm text-zinc-400">
              Nenhum atestado encontrado com os filtros atuais.
            </div>
          )}

          {filteredData.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{safeText(item.servidorNome) || '-'}</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {safeText(item.cpf) || '-'} • {safeText(item.matricula) || '-'}
                  </p>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${getStatusBadgeClass(safeText(item.status))}`}>
                  {safeText(item.status) || '-'}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Setor</p>
                  <p className="mt-1 text-zinc-200">{safeText(item.setor) || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Categoria</p>
                  <p className="mt-1 text-zinc-200">{safeText(item.categoria) || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Tipo</p>
                  <p className="mt-1 text-zinc-200">{safeText(item.tipo) || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Dias</p>
                  <p className="mt-1 text-zinc-200">{Number(item.dias) || 0}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => void handleOpenDetails(item)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.08]"
                >
                  <Eye size={16} />
                  Detalhes
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.08]"
                >
                  <Edit2 size={16} />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteItem(item)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20"
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            key="atestado-form-modal"
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
                    Upload real no Supabase, com limite controlado e integração com frequência.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadingAction ? undefined : closeFormModal}
                  disabled={loadingAction}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
                <div className="space-y-6">
                  {formFeedback.type && (
                    <FeedbackBanner
                      type={formFeedback.type}
                      message={formFeedback.message}
                      onClose={() => setFormFeedback({ type: null, message: '' })}
                    />
                  )}
                  <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-200">
                        <Users size={18} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">Dados do Servidor</h4>
                        <p className="text-sm text-zinc-400">CPF segue como identificador principal do módulo.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <label className="xl:col-span-2">
                        <FieldLabel>Nome do Servidor *</FieldLabel>
                        <div ref={serverAutocompleteRef} className="relative">
                          <input
                            value={formData.servidorNome}
                            onChange={(e) => {
                              handleInputChange('servidorNome', e.target.value);
                              setShowServerSuggestions(e.target.value.trim().length >= 3);
                            }}
                            onFocus={() => {
                              if (formData.servidorNome.trim().length >= 3 && serverSuggestions.length) {
                                setShowServerSuggestions(true);
                              }
                            }}
                            className={InputBaseClass}
                            placeholder="Digite pelo menos 3 letras do nome"
                            autoComplete="off"
                          />

                          {showServerSuggestions && (
                            <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#0f172a] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                              {isSearchingServidor ? (
                                <div className="px-3 py-3 text-sm text-zinc-400">Buscando servidores...</div>
                              ) : serverSuggestions.length > 0 ? (
                                serverSuggestions.map((servidor) => (
                                  <button
                                    key={[servidor.id, servidor.cpf, servidor.matricula].join('-')}
                                    type="button"
                                    onClick={() => applyServidorSuggestion(servidor)}
                                    className="flex w-full flex-col rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.06]"
                                  >
                                    <span className="text-sm font-semibold text-white">
                                      {servidor.nomeCompleto || servidor.nome || '-'}
                                    </span>
                                    <span className="mt-1 text-xs text-zinc-400">
                                      {servidor.cpf || '-'} • {servidor.matricula || '-'}
                                    </span>
                                    <span className="mt-1 text-[11px] text-zinc-500">
                                      {servidor.setor || '-'} • {servidor.categoria || '-'}
                                    </span>
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-3 text-sm text-zinc-400">Nenhum servidor encontrado.</div>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-[11px] text-zinc-500">Ao digitar 3 ou mais caracteres, o sistema sugere servidores e preenche CPF, matrícula, setor e categoria.</p>
                        {formErrors.servidorNome && <p className="mt-2 text-xs text-rose-400">{formErrors.servidorNome}</p>}
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
                          placeholder="Setor"
                        />
                      </label>

                      <label className="md:col-span-2 xl:col-span-2">
                        <FieldLabel>Categoria</FieldLabel>
                        <input
                          value={String(formData.categoria || '')}
                          onChange={(e) => handleInputChange('categoria', e.target.value)}
                          className={InputBaseClass}
                          placeholder="Categoria"
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
                        <p className="text-sm text-zinc-400">Informações do período, CID e validação do lançamento.</p>
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
                          <option value="" className="bg-slate-900 text-white">Selecione</option>
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
                        {formErrors.dataInicio && <p className="mt-2 text-xs text-rose-400">{formErrors.dataInicio}</p>}
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
                          value={formData.dias}
                          onChange={(e) => handleInputChange('dias', e.target.value)}
                          className={InputBaseClass}
                        />
                        {formErrors.dias && <p className="mt-2 text-xs text-rose-400">{formErrors.dias}</p>}
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
                          <option value="" className="bg-slate-900 text-white">Selecione</option>
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
                          <span className="text-sm font-semibold">{formData.dias || '0'} dia(s)</span>
                        </div>
                        <p className="mt-1 text-xs text-cyan-100/80">
                          {formData.considerarDiasUteis ? 'Somente dias úteis.' : 'Dias corridos.'}
                        </p>
                      </div>

                      <label className="md:col-span-2 xl:col-span-4">
                        <FieldLabel>Observação</FieldLabel>
                        <textarea
                          value={formData.observacao}
                          onChange={(e) => handleInputChange('observacao', e.target.value)}
                          className={TextAreaBaseClass}
                          placeholder="Observações internas"
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
                        <p className="text-sm text-zinc-400">Upload real com limite baixo para economizar Storage.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                      <div>
                        <FieldLabel>Upload de Arquivo</FieldLabel>
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center transition hover:bg-white/[0.07]">
                          <Paperclip size={18} className="mb-2 text-zinc-300" />
                          <span className="text-sm font-semibold text-white">Selecionar arquivo</span>
                          <span className="mt-1 text-xs text-zinc-400">
                            PDF, JPG, JPEG ou PNG
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              handleInputChange('arquivo', file);

                              if (file) {
                                handleInputChange('arquivoNome', file.name);
                                handleInputChange('arquivoTipo', file.type);
                                handleInputChange('arquivoTamanho', file.size);
                                handleInputChange('arquivoUrl', '');
                                handleInputChange('arquivoPath', '');
                              } else {
                                handleInputChange('arquivoNome', '');
                                handleInputChange('arquivoTipo', '');
                                handleInputChange('arquivoTamanho', 0);
                                handleInputChange('arquivoUrl', '');
                                handleInputChange('arquivoPath', '');
                              }
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
                          {formData.arquivo
                            ? `${formData.arquivo.type || 'tipo não identificado'} • ${formatFileSize(formData.arquivo.size)}`
                            : formData.arquivoNome
                            ? `${formData.arquivoTipo || 'tipo não informado'} • ${formatFileSize(formData.arquivoTamanho)}`
                            : 'O envio é opcional.'}
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
                        <h4 className="text-lg font-bold text-white">Integração com Frequência</h4>
                        <p className="text-sm text-zinc-400">O serviço lança o período como ATESTADO quando habilitado.</p>
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
                            Registra automaticamente a ocorrência ATESTADO no período informado.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <input
                          type="checkbox"
                          checked={formData.considerarDiasUteis}
                          onChange={(e) => handleInputChange('considerarDiasUteis', e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
                        />
                        <div>
                          <p className="text-sm font-semibold text-white">Considerar somente dias úteis</p>
                          <p className="mt-1 text-xs text-zinc-400">
                            Ignora sábados e domingos no lançamento do período.
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
                    onClick={loadingAction ? undefined : closeFormModal}
                    disabled={loadingAction}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
                  >
                    <X size={16} />
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={loadingAction}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/15 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/30 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={16} />
                    {loadingAction ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Atestado'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailsItem && (
          <motion.div
            key="details-modal"
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
              className="w-full max-w-3xl overflow-hidden rounded-t-3xl border border-white/10 bg-[#0B1220] shadow-[0_30px_90px_rgba(0,0,0,0.45)] md:rounded-3xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-6">
                <div>
                  <h3 className="text-2xl font-black text-white">Detalhes do Atestado</h3>
                  <p className="mt-1 text-sm text-zinc-400">{safeText(detailsItem.servidorNome) || '-'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsItem(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2 md:px-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <FieldLabel>Servidor</FieldLabel>
                  <p className="text-white">{safeText(detailsItem.servidorNome) || '-'}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {safeText(detailsItem.cpf) || '-'} • {safeText(detailsItem.matricula) || '-'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <FieldLabel>Status</FieldLabel>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(safeText(detailsItem.status))}`}>
                    {safeText(detailsItem.status) || '-'}
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <FieldLabel>Período</FieldLabel>
                  <p className="text-white">
                    {formatDate(safeText(detailsItem.dataInicio))} até {formatDate(safeText(detailsItem.dataFim))}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">{Number(detailsItem.dias) || 0} dia(s)</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <FieldLabel>Tipo / CID</FieldLabel>
                  <p className="text-white">{safeText(detailsItem.tipo) || '-'}</p>
                  <p className="mt-1 text-sm text-zinc-400">CID: {safeText(detailsItem.cid) || '-'}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                  <FieldLabel>Arquivo</FieldLabel>
                  {detailsItem.arquivoNome ? (
                    <>
                      <p className="text-white">{safeText(detailsItem.arquivoNome)}</p>
                      <p className="mt-1 text-sm text-zinc-400">
                        {safeText(detailsItem.arquivoTipo) || 'tipo não informado'} • {formatFileSize(Number(detailsItem.arquivoTamanho) || 0)}
                      </p>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => void handleDownload(detailsItem)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
                        >
                          <Download size={16} />
                          Baixar arquivo
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-zinc-400">Nenhum arquivo vinculado.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                  <FieldLabel>Observação</FieldLabel>
                  <p className="whitespace-pre-line text-sm text-zinc-200">{safeText(detailsItem.observacao) || '-'}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <FieldLabel>Integração</FieldLabel>
                  <p className="text-sm text-zinc-200">
                    Frequência: {detailsItem.lancarNaFrequencia ? 'Sim' : 'Não'}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Dias úteis: {detailsItem.considerarDiasUteis ? 'Sim' : 'Não'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <FieldLabel>Auditoria</FieldLabel>
                  <p className="text-sm text-zinc-200">Criado em: {formatDate(safeText(detailsItem.criadoEm))}</p>
                  <p className="mt-1 text-sm text-zinc-400">Atualizado em: {formatDate(safeText(detailsItem.atualizadoEm))}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteItem && (
          <motion.div
            key="delete-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0B1220] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
            >
              <h3 className="text-2xl font-black text-white">Excluir atestado</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Tem certeza que deseja excluir o atestado de <span className="font-semibold text-zinc-200">{safeText(deleteItem.servidorNome) || '-'}</span>?
                O registro será removido do banco, o arquivo associado será apagado do Storage e a integração com frequência também será limpa.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteItem(null)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={loadingAction}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  {loadingAction ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AtestadosPage;
