import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  Cake,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Flag,
  Info,
  Loader2,
  MapPinned,
  PartyPopper,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  SunMoon,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { eventosService } from '../services/eventosService';
import { frequenciaService } from '../services/frequenciaService';
import { servidoresService } from '../services/servidoresService';
import { fetchJson } from '../config/api';
import { EventoCalendario, OcorrenciaFrequencia, Servidor } from '../types';

type FeriasRegistro = {
  id?: string;
  servidorId?: string;
  servidorCpf?: string;
  dataInicio: string;
  dataFim: string;
  tipo?: string;
  descricao?: string;
  periodo?: number;
};

type BirthdayItem = {
  data: string;
  titulo: string;
  tipo: 'ANIVERSARIO';
  servidorId: string;
  dia: number;
};

type DayOccurrenceType =
  | 'SABADO'
  | 'DOMINGO'
  | 'FERIADO'
  | 'PONTO'
  | 'FERIAS'
  | 'ATESTADO'
  | 'FALTA'
  | 'ANIVERSARIO'
  | 'MANUAL'
  | 'EVENTO';

type DayOccurrence = {
  key: string;
  kind: DayOccurrenceType;
  title: string;
  subtitle?: string;
  source: 'AUTO' | 'MANUAL';
  priority: number;
  colorClass: string;
  icon: React.ReactNode;
  data?: string;
  recordId?: string;
};

type QuickFilterKey = 'FALTAS' | 'ATESTADOS' | 'FERIAS' | 'FERIADOS' | 'ANIVERSARIOS' | 'OCORRENCIAS';

type ToggleState = {
  showBirthdays: boolean;
  includePonto: boolean;
  highlightWeekends: boolean;
  onlyImpactDays: boolean;
};

const MONTH_NAMES = [
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

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const formatDateISO = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildDateFromDay = (baseDate: Date, day: number) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), day);

const isSameMonthDay = (date: Date, baseDate: Date, day: number) =>
  date.getFullYear() === baseDate.getFullYear() &&
  date.getMonth() === baseDate.getMonth() &&
  date.getDate() === day;

const dateIsBetween = (dateIso: string, startIso?: string | null, endIso?: string | null) => {
  if (!startIso || !endIso) return false;
  return dateIso >= startIso.slice(0, 10) && dateIso <= endIso.slice(0, 10);
};

const normalizeText = (value?: string | null) => (value || '').trim();

const getOccurrenceMeta = (kind: DayOccurrenceType) => {
  switch (kind) {
    case 'FERIADO':
      return {
        label: 'Feriado',
        colorClass: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
        icon: <Flag size={12} />,
      };
    case 'PONTO':
      return {
        label: 'Ponto facultativo',
        colorClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
        icon: <Sparkles size={12} />,
      };
    case 'FERIAS':
      return {
        label: 'Férias',
        colorClass: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
        icon: <SunMoon size={12} />,
      };
    case 'ATESTADO':
      return {
        label: 'Atestado',
        colorClass: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
        icon: <Stethoscope size={12} />,
      };
    case 'FALTA':
      return {
        label: 'Falta',
        colorClass: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
        icon: <AlertCircle size={12} />,
      };
    case 'ANIVERSARIO':
      return {
        label: 'Aniversário',
        colorClass: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
        icon: <Cake size={12} />,
      };
    case 'SABADO':
      return {
        label: 'Sábado',
        colorClass: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
        icon: <CalendarIcon size={12} />,
      };
    case 'DOMINGO':
      return {
        label: 'Domingo',
        colorClass: 'bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20',
        icon: <CalendarIcon size={12} />,
      };
    case 'EVENTO':
      return {
        label: 'Evento',
        colorClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
        icon: <MapPinned size={12} />,
      };
    case 'MANUAL':
    default:
      return {
        label: 'Ocorrência manual',
        colorClass: 'bg-slate-700/70 text-slate-200 border border-slate-600',
        icon: <Info size={12} />,
      };
  }
};

const Toggle = ({
  checked,
  onChange,
  label,
  accentClass = 'bg-primary',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  accentClass?: string;
}) => (
  <label className="inline-flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 cursor-pointer hover:border-slate-600 transition-colors">
    <span
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? accentClass : 'bg-slate-700'}`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </span>
    <span className="text-xs font-medium text-slate-200">{label}</span>
  </label>
);

const SummaryCard = ({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-black/10">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`rounded-xl p-2 ${accent}`}>{icon}</div>
        <span className="text-sm text-slate-300 truncate">{label}</span>
      </div>
      <span className="text-xl font-bold text-white">{String(value).padStart(2, '0')}</span>
    </div>
  </div>
);

const Badge = ({ occurrence }: { occurrence: DayOccurrence }) => (
  <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${occurrence.colorClass}`}>
    {occurrence.icon}
    <span className="truncate max-w-[140px]">{occurrence.title}</span>
  </div>
);

export const FrequenciaPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [frequencias, setFrequencias] = useState<OcorrenciaFrequencia[]>([]);
  const [ferias, setFerias] = useState<FeriasRegistro[]>([]);
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [aniversariosDoMes, setAniversariosDoMes] = useState<BirthdayItem[]>([]);
  const [selectedServidorId, setSelectedServidorId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [registroTipo, setRegistroTipo] = useState('FALTA');
  const [registroTurno, setRegistroTurno] = useState('INTEGRAL');
  const [showFilters, setShowFilters] = useState(false);
  const [quickFilters, setQuickFilters] = useState<Record<QuickFilterKey, boolean>>({
    FALTAS: false,
    ATESTADOS: false,
    FERIAS: false,
    FERIADOS: false,
    ANIVERSARIOS: false,
    OCORRENCIAS: false,
  });
  const [toggles, setToggles] = useState<ToggleState>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('ciapi_frequencia_ui') : null;
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    return {
      showBirthdays: true,
      includePonto: true,
      highlightWeekends: true,
      onlyImpactDays: false,
    };
  });

  const mes = currentMonth.getMonth() + 1;
  const ano = currentMonth.getFullYear();
  const daysInMonth = new Date(ano, mes, 0).getDate();
  const firstDayOfMonth = new Date(ano, currentMonth.getMonth(), 1).getDay();

  const selectedServidor = useMemo(
    () => servidores.find((s) => s.id === selectedServidorId) || null,
    [servidores, selectedServidorId],
  );

  const loadFerias = useCallback(async (servers: Servidor[]) => {
    try {
      const raw = await fetchJson<any>(`/api/ferias?ano=${ano}&mes=${mes}`, { timeout: 12000, retry: false });
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      const normalized: FeriasRegistro[] = [];

      list.forEach((item: any) => {
        const periods = [
          { inicio: item.periodo1_inicio, fim: item.periodo1_fim, periodo: 1 },
          { inicio: item.periodo2_inicio, fim: item.periodo2_fim, periodo: 2 },
          { inicio: item.periodo3_inicio, fim: item.periodo3_fim, periodo: 3 },
        ];

        periods.forEach((period) => {
          if (period.inicio && period.fim) {
            normalized.push({
              id: `${item.id || item.servidor_cpf || item.servidor_id || Math.random()}-${period.periodo}`,
              servidorId: item.servidor_id || item.servidorId,
              servidorCpf: item.servidor_cpf || item.servidorCpf || item.cpf,
              dataInicio: String(period.inicio).slice(0, 10),
              dataFim: String(period.fim).slice(0, 10),
              descricao: item.observacao || item.descricao || '',
              tipo: 'FERIAS',
              periodo: period.periodo,
            });
          }
        });
      });

      const serverMapByCpf = new Map(
        servers
          .filter((s) => s.cpf)
          .map((s) => [String(s.cpf).replace(/\D/g, ''), s.id]),
      );

      const resolved = normalized.map((item) => {
        if (item.servidorId) return item;
        const cleanCpf = String(item.servidorCpf || '').replace(/\D/g, '');
        if (cleanCpf && serverMapByCpf.has(cleanCpf)) {
          return { ...item, servidorId: serverMapByCpf.get(cleanCpf) };
        }
        return item;
      });

      setFerias(resolved);
    } catch {
      setFerias([]);
    }
  }, [ano, mes]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadTimeout(false);
    setError(null);

    const timeoutId = window.setTimeout(() => {
      setLoadTimeout(true);
    }, 12000);

    try {
      const [serverList, eventosList, freqList] = await Promise.all([
        servidoresService.listar?.({ status: 'ATIVO', limit: 1000 }) ||
          Promise.resolve([]),
        eventosService.listarPorMes
          ? eventosService.listarPorMes(ano, mes)
          : Promise.resolve([]),
        frequenciaService.listarPorMes
          ? frequenciaService.listarPorMes(ano, mes)
          : Promise.resolve([]),
      ]);

      const servidoresNorm = Array.isArray((serverList as any)?.data)
        ? (serverList as any).data
        : Array.isArray(serverList)
          ? serverList
          : [];

      const eventosNorm = Array.isArray((eventosList as any)?.data)
        ? (eventosList as any).data
        : Array.isArray(eventosList)
          ? eventosList
          : [];

      const freqNorm = Array.isArray((freqList as any)?.data)
        ? (freqList as any).data
        : Array.isArray(freqList)
          ? freqList
          : [];

      setServidores(servidoresNorm);
      setEventos(eventosNorm);
      setFrequencias(freqNorm);

      if (!selectedServidorId && servidoresNorm.length > 0) {
        setSelectedServidorId(servidoresNorm[0].id);
      }

      await loadFerias(servidoresNorm);

      const birthdays: BirthdayItem[] = servidoresNorm
        .filter((s: any) => {
          const value = s?.dataNascimento || s?.data_nascimento;
          if (!value) return false;
          const d = new Date(value);
          return d.getMonth() + 1 === mes;
        })
        .map((s: any) => {
          const value = s?.dataNascimento || s?.data_nascimento;
          const d = new Date(value);
          const day = d.getDate();
          return {
            data: formatDateISO(new Date(ano, mes - 1, day)),
            titulo: `Aniversário de ${s.nomeCompleto || s.nome || 'Servidor'}`,
            tipo: 'ANIVERSARIO' as const,
            servidorId: s.id,
            dia: day,
          };
        });

      setAniversariosDoMes(birthdays);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar os dados da frequência.');
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [ano, mes, selectedServidorId, loadFerias]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ciapi_frequencia_ui', JSON.stringify(toggles));
    }
  }, [toggles]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const calendarDays = useMemo(() => {
    const days = [];
    const previousMonthDays = new Date(ano, currentMonth.getMonth(), 0).getDate();

    for (let i = firstDayOfMonth - 1; i >= 0; i -= 1) {
      days.push({
        day: previousMonthDays - i,
        currentMonth: false,
        date: new Date(ano, currentMonth.getMonth() - 1, previousMonthDays - i),
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push({
        day,
        currentMonth: true,
        date: buildDateFromDay(currentMonth, day),
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i += 1) {
      days.push({
        day: i,
        currentMonth: false,
        date: new Date(ano, currentMonth.getMonth() + 1, i),
      });
    }

    return days;
  }, [ano, currentMonth, daysInMonth, firstDayOfMonth]);

  const dayOccurrencesMap = useMemo(() => {
    const map = new Map<number, DayOccurrence[]>();

    const pushOccurrence = (day: number, occurrence: DayOccurrence) => {
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(occurrence);
    };

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = buildDateFromDay(currentMonth, day);
      const iso = formatDateISO(date);
      const weekday = date.getDay();

      if (weekday === 6) {
        const meta = getOccurrenceMeta('SABADO');
        pushOccurrence(day, {
          key: `${iso}-sabado`,
          kind: 'SABADO',
          title: meta.label,
          source: 'AUTO',
          priority: 1,
          colorClass: meta.colorClass,
          icon: meta.icon,
          data: iso,
        });
      }

      if (weekday === 0) {
        const meta = getOccurrenceMeta('DOMINGO');
        pushOccurrence(day, {
          key: `${iso}-domingo`,
          kind: 'DOMINGO',
          title: meta.label,
          source: 'AUTO',
          priority: 1,
          colorClass: meta.colorClass,
          icon: meta.icon,
          data: iso,
        });
      }
    }

    eventos.forEach((evento: any) => {
      const data = String(evento.data || evento.date || '').slice(0, 10);
      if (!data) return;
      const date = new Date(`${data}T12:00:00`);
      if (!isSameMonthDay(date, currentMonth, date.getDate())) return;

      const day = date.getDate();
      const tipo = String(evento.tipo || '').toUpperCase();

      let kind: DayOccurrenceType = 'EVENTO';
      let priority = 3;

      if (tipo === 'FERIADO') {
        kind = 'FERIADO';
        priority = 5;
      } else if (tipo === 'PONTO') {
        kind = 'PONTO';
        priority = 4;
        if (!toggles.includePonto) return;
      }

      const meta = getOccurrenceMeta(kind);
      pushOccurrence(day, {
        key: `${data}-${tipo}-${evento.id || evento.titulo || evento.nome || Math.random()}`,
        kind,
        title: evento.titulo || evento.nome || meta.label,
        subtitle: evento.descricao || undefined,
        source: 'AUTO',
        priority,
        colorClass: meta.colorClass,
        icon: meta.icon,
        data,
        recordId: evento.id,
      });
    });

    ferias.forEach((item) => {
      if (!selectedServidorId || item.servidorId !== selectedServidorId) return;

      for (let day = 1; day <= daysInMonth; day += 1) {
        const iso = formatDateISO(buildDateFromDay(currentMonth, day));
        if (dateIsBetween(iso, item.dataInicio, item.dataFim)) {
          const meta = getOccurrenceMeta('FERIAS');
          pushOccurrence(day, {
            key: `${item.id}-ferias-${day}`,
            kind: 'FERIAS',
            title: item.periodo ? `Férias • ${item.periodo}º período` : meta.label,
            subtitle: item.descricao || `${item.dataInicio} até ${item.dataFim}`,
            source: 'AUTO',
            priority: 6,
            colorClass: meta.colorClass,
            icon: meta.icon,
            data: iso,
            recordId: item.id,
          });
        }
      }
    });

    frequencias.forEach((registro: any) => {
      const data = String(registro.data || '').slice(0, 10);
      if (!data) return;

      const date = new Date(`${data}T12:00:00`);
      if (!isSameMonthDay(date, currentMonth, date.getDate())) return;

      const matchesServidor =
        !selectedServidorId ||
        registro.servidorId === selectedServidorId ||
        registro.servidor_id === selectedServidorId ||
        registro.servidor === selectedServidorId;

      if (!matchesServidor) return;

      const day = date.getDate();
      const rawTipo = String(registro.tipo || registro.ocorrencia || '').toUpperCase();

      let kind: DayOccurrenceType = 'MANUAL';
      let priority = 2;

      if (rawTipo.includes('ATEST')) {
        kind = 'ATESTADO';
        priority = 7;
      } else if (rawTipo.includes('FALTA')) {
        kind = 'FALTA';
        priority = 8;
      } else if (rawTipo.includes('EVENT')) {
        kind = 'EVENTO';
        priority = 3;
      }

      const meta = getOccurrenceMeta(kind);
      pushOccurrence(day, {
        key: `${registro.id || Math.random()}-${day}-${rawTipo}`,
        kind,
        title: registro.titulo || rawTipo || meta.label,
        subtitle: [
          normalizeText(registro.turno),
          normalizeText(registro.descricao),
          normalizeText(registro.observacao),
        ]
          .filter(Boolean)
          .join(' • '),
        source: 'MANUAL',
        priority,
        colorClass: meta.colorClass,
        icon: meta.icon,
        data,
        recordId: registro.id,
      });
    });

    if (toggles.showBirthdays) {
      aniversariosDoMes.forEach((birthday) => {
        const meta = getOccurrenceMeta('ANIVERSARIO');
        pushOccurrence(birthday.dia, {
          key: `${birthday.data}-birthday-${birthday.servidorId}`,
          kind: 'ANIVERSARIO',
          title: 'Aniversário',
          subtitle: birthday.titulo,
          source: 'AUTO',
          priority: 4,
          colorClass: meta.colorClass,
          icon: meta.icon,
          data: birthday.data,
          recordId: birthday.servidorId,
        });
      });
    }

    map.forEach((items, key) => {
      items.sort((a, b) => b.priority - a.priority);
      map.set(key, items);
    });

    return map;
  }, [
    aniversariosDoMes,
    currentMonth,
    daysInMonth,
    eventos,
    ferias,
    frequencias,
    selectedServidorId,
    toggles.includePonto,
    toggles.showBirthdays,
  ]);

  const summary = useMemo(() => {
    const values = {
      aniversarios: 0,
      faltas: 0,
      atestados: 0,
      feriados: 0,
      pontos: 0,
      ferias: 0,
      ocorrencias: 0,
    };

    for (let day = 1; day <= daysInMonth; day += 1) {
      const occurrences = dayOccurrencesMap.get(day) || [];
      const kinds = new Set(occurrences.map((o) => o.kind));

      if (kinds.has('ANIVERSARIO')) values.aniversarios += 1;
      if (kinds.has('FALTA')) values.faltas += 1;
      if (kinds.has('ATESTADO')) values.atestados += 1;
      if (kinds.has('FERIADO')) values.feriados += 1;
      if (kinds.has('PONTO')) values.pontos += 1;
      if (kinds.has('FERIAS')) values.ferias += 1;
      if (occurrences.length > 0) values.ocorrencias += 1;
    }

    return values;
  }, [dayOccurrencesMap, daysInMonth]);

  const selectedDayOccurrences = useMemo(() => {
    if (!selectedDay) return [];
    return dayOccurrencesMap.get(selectedDay) || [];
  }, [dayOccurrencesMap, selectedDay]);

  const automaticOccurrences = useMemo(
    () => selectedDayOccurrences.filter((item) => item.source === 'AUTO'),
    [selectedDayOccurrences],
  );

  const manualOccurrences = useMemo(
    () => selectedDayOccurrences.filter((item) => item.source === 'MANUAL'),
    [selectedDayOccurrences],
  );

  const selectedDateLabel = useMemo(() => {
    if (!selectedDay) return '';
    const date = buildDateFromDay(currentMonth, selectedDay);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }, [currentMonth, selectedDay]);

  const hasActiveQuickFilters = useMemo(
    () => Object.values(quickFilters).some(Boolean),
    [quickFilters],
  );

  const matchesQuickFilter = useCallback(
    (occurrences: DayOccurrence[]) => {
      if (!hasActiveQuickFilters) return true;
      const kinds = new Set(occurrences.map((o) => o.kind));

      if (quickFilters.FALTAS && kinds.has('FALTA')) return true;
      if (quickFilters.ATESTADOS && kinds.has('ATESTADO')) return true;
      if (quickFilters.FERIAS && kinds.has('FERIAS')) return true;
      if (quickFilters.FERIADOS && (kinds.has('FERIADO') || kinds.has('PONTO'))) return true;
      if (quickFilters.ANIVERSARIOS && kinds.has('ANIVERSARIO')) return true;
      if (quickFilters.OCORRENCIAS && occurrences.length > 0) return true;

      return false;
    },
    [hasActiveQuickFilters, quickFilters],
  );

  const exportPreview = useMemo(() => {
    const automaticMarkings = Array.from(dayOccurrencesMap.values()).reduce(
      (acc, items) => acc + items.filter((i) => i.source === 'AUTO').length,
      0,
    );

    const hasPendencias = !selectedServidorId;

    return {
      servidor: selectedServidor?.nomeCompleto || selectedServidor?.nome || 'Nenhum selecionado',
      mesAno: `${MONTH_NAMES[currentMonth.getMonth()]} / ${ano}`,
      totalLinhas: daysInMonth,
      automaticMarkings,
      status: hasPendencias ? 'Pendências' : 'Pronto para exportar',
      hasPendencias,
    };
  }, [ano, currentMonth, dayOccurrencesMap, daysInMonth, selectedServidor, selectedServidorId]);

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleQuickFilterToggle = (key: QuickFilterKey) => {
    setQuickFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDayClick = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    setSelectedDay(day);
    setIsModalOpen(true);
  };

  const handleSaveRegistro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedServidorId || !selectedDay) {
      setError('Selecione um servidor e um dia antes de registrar a ocorrência.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const descricao = String(formData.get('descricao') || '').trim();
    const data = formatDateISO(buildDateFromDay(currentMonth, selectedDay));

    try {
      setError(null);

      if (!frequenciaService.registrarOcorrencia) {
        throw new Error('O serviço de frequência não possui registrarOcorrencia configurado.');
      }

      await frequenciaService.registrarOcorrencia({
        servidorId: selectedServidorId,
        data,
        tipo: registroTipo,
        turno: registroTurno,
        descricao,
      });

      setSuccessMessage('Ocorrência salva com sucesso.');
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível salvar a ocorrência.');
    }
  };

  const handleExport = async (mode: 'docx' | 'pdf' | 'csv') => {
    if (!selectedServidorId) {
      setError('Selecione um servidor para exportar a frequência.');
      return;
    }

    try {
      setError(null);
      setIsGenerating(true);

      if (mode === 'docx' && frequenciaService.exportarDocx) {
        await frequenciaService.exportarDocx({
          servidorId: selectedServidorId,
          mes,
          ano,
          incluirPonto: toggles.includePonto,
        });
      } else if (mode === 'pdf' && frequenciaService.exportarPdf) {
        await frequenciaService.exportarPdf({
          servidorId: selectedServidorId,
          mes,
          ano,
          incluirPonto: toggles.includePonto,
        });
      } else if (mode === 'csv' && frequenciaService.exportarCsv) {
        await frequenciaService.exportarCsv({
          servidorId: selectedServidorId,
          mes,
          ano,
          incluirPonto: toggles.includePonto,
        });
      } else {
        throw new Error(`Exportação ${mode.toUpperCase()} não disponível no service atual.`);
      }

      setSuccessMessage(`Exportação ${mode.toUpperCase()} iniciada com sucesso.`);
    } catch (err: any) {
      setError(err?.message || `Não foi possível exportar em ${mode.toUpperCase()}.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const visibleCalendarDays = useMemo(() => {
    return calendarDays.filter((item) => {
      if (!item.currentMonth) return true;

      const occurrences = dayOccurrencesMap.get(item.day) || [];
      const impactKinds = new Set(['FERIADO', 'PONTO', 'FERIAS', 'ATESTADO', 'FALTA', 'MANUAL', 'EVENTO']);

      if (toggles.onlyImpactDays) {
        return occurrences.some((item) => impactKinds.has(item.kind));
      }

      return matchesQuickFilter(occurrences);
    });
  }, [calendarDays, dayOccurrencesMap, matchesQuickFilter, toggles.onlyImpactDays]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-6 p-6 md:p-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    <Archive size={14} />
                    Gestão de Frequência
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      Frequência mensal inteligente
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
                      Visualize, confira e registre ocorrências do mês com destaque para férias, faltas,
                      atestados, eventos, feriados, aniversários e impacto direto na folha.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => handleExport('docx')}
                    disabled={isGenerating || !selectedServidorId}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    Exportar DOCX
                  </button>

                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={isGenerating || !selectedServidorId}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FileText size={16} />
                    Exportar PDF
                  </button>

                  <button
                    onClick={() => handleExport('csv')}
                    disabled={isGenerating || !selectedServidorId}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Archive size={16} />
                    Exportar CSV
                  </button>

                  <button
                    onClick={loadData}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    Atualizar dados
                  </button>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Servidor
                  </label>
                  <div className="relative">
                    <User size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select
                      value={selectedServidorId}
                      onChange={(e) => setSelectedServidorId(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-slate-800 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-primary"
                    >
                      <option value="">Selecione um servidor</option>
                      {servidores.map((servidor) => (
                        <option key={servidor.id} value={servidor.id}>
                          {servidor.nomeCompleto || servidor.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Mês de referência
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={goToPreviousMonth}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-slate-600 hover:text-white"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-center">
                      <div className="text-sm font-semibold text-white">
                        {MONTH_NAMES[currentMonth.getMonth()]} de {ano}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {daysInMonth} linhas na folha deste mês
                      </div>
                    </div>
                    <button
                      onClick={goToNextMonth}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-slate-600 hover:text-white"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 xl:justify-end">
                  <Toggle
                    checked={toggles.includePonto}
                    onChange={(checked) => setToggles((prev) => ({ ...prev, includePonto: checked }))}
                    label="Incluir ponto facultativo"
                    accentClass="bg-amber-500"
                  />
                  <Toggle
                    checked={toggles.highlightWeekends}
                    onChange={(checked) => setToggles((prev) => ({ ...prev, highlightWeekends: checked }))}
                    label="Destacar sábados e domingos"
                    accentClass="bg-sky-500"
                  />
                  <Toggle
                    checked={toggles.onlyImpactDays}
                    onChange={(checked) => setToggles((prev) => ({ ...prev, onlyImpactDays: checked }))}
                    label="Exibir só dias com impacto"
                    accentClass="bg-emerald-500"
                  />
                  <Toggle
                    checked={toggles.showBirthdays}
                    onChange={(checked) => setToggles((prev) => ({ ...prev, showBirthdays: checked }))}
                    label="Exibir aniversários"
                    accentClass="bg-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-black/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  <CheckCircle2 size={13} />
                  Prévia da Exportação
                </div>
                <h2 className="mt-3 text-lg font-bold text-white">Validação rápida da folha</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Confira os dados principais antes de gerar o documento oficial.
                </p>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  exportPreview.hasPendencias
                    ? 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                }`}
              >
                {exportPreview.status}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <span className="block text-xs uppercase tracking-wide text-slate-500">Servidor</span>
                <strong className="mt-1 block text-sm text-white">{exportPreview.servidor}</strong>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <span className="block text-xs uppercase tracking-wide text-slate-500">Mês / Ano</span>
                <strong className="mt-1 block text-sm text-white">{exportPreview.mesAno}</strong>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <span className="block text-xs uppercase tracking-wide text-slate-500">Linhas</span>
                  <strong className="mt-1 block text-xl text-white">{exportPreview.totalLinhas}</strong>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <span className="block text-xs uppercase tracking-wide text-slate-500">Marcações automáticas</span>
                  <strong className="mt-1 block text-xl text-white">{exportPreview.automaticMarkings}</strong>
                </div>
              </div>

              <div
                className={`rounded-2xl border p-4 text-sm ${
                  exportPreview.hasPendencias
                    ? 'border-amber-500/20 bg-amber-500/10 text-amber-200'
                    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                }`}
              >
                {exportPreview.hasPendencias
                  ? 'Selecione um servidor para liberar a exportação da frequência.'
                  : 'Tudo certo. A folha já possui base suficiente para exportação.'}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        )}

        {loadTimeout && !isLoading && (
          <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            O carregamento demorou mais do que o esperado. Revise a conexão da API ou tente atualizar.
          </div>
        )}

        <div className="mb-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Resumo do mês</h2>
                <p className="text-sm text-slate-400">Indicadores rápidos para conferência da folha.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white"
              >
                <Filter size={16} />
                {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon={<PartyPopper size={18} className="text-purple-300" />}
                label="Aniversariantes"
                value={summary.aniversarios}
                accent="bg-purple-500/15"
              />
              <SummaryCard
                icon={<AlertCircle size={18} className="text-orange-300" />}
                label="Faltas"
                value={summary.faltas}
                accent="bg-orange-500/15"
              />
              <SummaryCard
                icon={<Stethoscope size={18} className="text-blue-300" />}
                label="Atestados"
                value={summary.atestados}
                accent="bg-blue-500/15"
              />
              <SummaryCard
                icon={<Flag size={18} className="text-rose-300" />}
                label="Feriados"
                value={summary.feriados}
                accent="bg-rose-500/15"
              />
              <SummaryCard
                icon={<Sparkles size={18} className="text-amber-300" />}
                label="Pontos facultativos"
                value={summary.pontos}
                accent="bg-amber-500/15"
              />
              <SummaryCard
                icon={<SunMoon size={18} className="text-cyan-300" />}
                label="Dias em férias"
                value={summary.ferias}
                accent="bg-cyan-500/15"
              />
              <SummaryCard
                icon={<Clock3 size={18} className="text-emerald-300" />}
                label="Dias com ocorrência"
                value={summary.ocorrencias}
                accent="bg-emerald-500/15"
              />
              <SummaryCard
                icon={<CalendarIcon size={18} className="text-sky-300" />}
                label="Total de linhas"
                value={daysInMonth}
                accent="bg-sky-500/15"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
            <h2 className="text-lg font-bold text-white">Legenda visual</h2>
            <p className="mt-1 text-sm text-slate-400">
              Hierarquia de leitura da folha com múltiplas marcações por dia.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                'FERIADO',
                'PONTO',
                'FERIAS',
                'ATESTADO',
                'FALTA',
                'ANIVERSARIO',
                'SABADO',
                'DOMINGO',
                'EVENTO',
                'MANUAL',
              ].map((kind) => {
                const meta = getOccurrenceMeta(kind as DayOccurrenceType);
                return (
                  <div
                    key={kind}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${meta.colorClass}`}
                  >
                    {meta.icon}
                    {meta.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Filtros rápidos</h3>
                <p className="text-sm text-slate-400">Refine a visualização do calendário por tipo de ocorrência.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  ['FALTAS', 'Faltas', 'bg-orange-500/10 text-orange-300 border-orange-500/30'],
                  ['ATESTADOS', 'Atestados', 'bg-blue-500/10 text-blue-300 border-blue-500/30'],
                  ['FERIAS', 'Férias', 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'],
                  ['FERIADOS', 'Feriados / ponto', 'bg-rose-500/10 text-rose-300 border-rose-500/30'],
                  ['ANIVERSARIOS', 'Aniversários', 'bg-purple-500/10 text-purple-300 border-purple-500/30'],
                  ['OCORRENCIAS', 'Dias com ocorrência', 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'],
                ].map(([key, label, color]) => {
                  const active = quickFilters[key as QuickFilterKey];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleQuickFilterToggle(key as QuickFilterKey)}
                      className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                        active
                          ? color
                          : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() =>
                    setQuickFilters({
                      FALTAS: false,
                      ATESTADOS: false,
                      FERIAS: false,
                      FERIADOS: false,
                      ANIVERSARIOS: false,
                      OCORRENCIAS: false,
                    })
                  }
                  className="rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-slate-600 hover:text-white"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/10">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-white">Calendário operacional</h2>
              <p className="text-sm text-slate-400">
                Clique em um dia para ver detalhes, registrar ocorrências e revisar impactos na folha.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              {toggles.onlyImpactDays ? <EyeOff size={14} /> : <Eye size={14} />}
              {toggles.onlyImpactDays ? 'Somente impacto' : 'Visualização completa'}
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Loader2 className="animate-spin" size={28} />
                <span className="text-sm">Carregando frequência...</span>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="mb-4 grid grid-cols-7 gap-3">
                {WEEKDAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-slate-400"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
                {visibleCalendarDays.map((item, index) => {
                  const occurrences = item.currentMonth ? dayOccurrencesMap.get(item.day) || [] : [];
                  const mainOccurrence = occurrences[0];
                  const extraCount = occurrences.length > 3 ? occurrences.length - 3 : 0;

                  const isWeekend =
                    item.date.getDay() === 0 || item.date.getDay() === 6;

                  const baseCardClass = item.currentMonth
                    ? 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                    : 'border-slate-900 bg-slate-950/30 opacity-40';

                  const weekendGlow =
                    toggles.highlightWeekends && isWeekend && item.currentMonth
                      ? item.date.getDay() === 0
                        ? 'ring-1 ring-fuchsia-500/20'
                        : 'ring-1 ring-sky-500/20'
                      : '';

                  const priorityAccent = mainOccurrence
                    ? mainOccurrence.kind === 'FALTA'
                      ? 'shadow-orange-500/10'
                      : mainOccurrence.kind === 'ATESTADO'
                        ? 'shadow-blue-500/10'
                        : mainOccurrence.kind === 'FERIAS'
                          ? 'shadow-cyan-500/10'
                          : mainOccurrence.kind === 'FERIADO'
                            ? 'shadow-rose-500/10'
                            : 'shadow-black/10'
                    : 'shadow-black/10';

                  return (
                    <button
                      key={`${item.day}-${index}-${item.currentMonth ? 'current' : 'out'}`}
                      type="button"
                      disabled={!item.currentMonth}
                      onClick={() => handleDayClick(item.day, item.currentMonth)}
                      className={`group min-h-[170px] rounded-3xl border p-4 text-left transition duration-200 ${baseCardClass} ${weekendGlow} shadow-xl ${priorityAccent}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col">
                          <span
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-base font-bold ${
                              item.currentMonth
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-900/50 text-slate-500'
                            }`}
                          >
                            {item.day}
                          </span>
                          {item.currentMonth && (
                            <span className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">
                              {WEEKDAY_LABELS[item.date.getDay()]}
                            </span>
                          )}
                        </div>

                        {occurrences.length > 0 && item.currentMonth && (
                          <div className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-300">
                            {occurrences.length} marcação{occurrences.length > 1 ? 'ões' : ''}
                          </div>
                        )}
                      </div>

                      {item.currentMonth ? (
                        <div className="mt-4 flex flex-col gap-2">
                          {occurrences.slice(0, 3).map((occurrence) => (
                            <Badge key={occurrence.key} occurrence={occurrence} />
                          ))}

                          {extraCount > 0 && (
                            <div className="inline-flex items-center gap-1 self-start rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-slate-300">
                              <Sparkles size={11} />
                              +{extraCount} adicional
                            </div>
                          )}

                          {occurrences.length === 0 && (
                            <div className="mt-2 rounded-2xl border border-dashed border-slate-800 bg-slate-950/70 px-3 py-3 text-xs text-slate-500">
                              Dia sem ocorrência registrada
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 text-xs text-slate-600">Fora do mês</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && selectedDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 24 }}
              className="relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/30"
            >
              <div className="border-b border-slate-800 bg-slate-900/80 px-6 py-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-primary/15 text-primary">
                      <span className="text-xs font-bold uppercase">{MONTH_NAMES[currentMonth.getMonth()].slice(0, 3)}</span>
                      <span className="text-2xl font-bold">{selectedDay}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Detalhes do dia</h2>
                      <p className="text-sm capitalize text-slate-400">{selectedDateLabel}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Servidor: {selectedServidor?.nomeCompleto || 'Nenhum servidor selecionado'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="self-start rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-400 hover:border-slate-600 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="grid max-h-[calc(92vh-92px)] grid-cols-1 overflow-y-auto lg:grid-cols-[1.2fr_0.9fr]">
                <div className="space-y-5 p-6">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Marcações automáticas do sistema</h3>
                    {automaticOccurrences.length > 0 ? (
                      <div className="space-y-3">
                        {automaticOccurrences.map((item) => (
                          <div key={item.key} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${item.colorClass}`}>
                                  {item.icon}
                                  {item.title}
                                </div>
                                {item.subtitle && <p className="mt-2 text-sm text-slate-300">{item.subtitle}</p>}
                              </div>
                              <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-slate-300">
                                Prioridade {item.priority}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-500">
                        Nenhuma marcação automática encontrada para este dia.
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Ocorrências manuais</h3>
                    {manualOccurrences.length > 0 ? (
                      <div className="space-y-3">
                        {manualOccurrences.map((item) => (
                          <div key={item.key} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${item.colorClass}`}>
                                  {item.icon}
                                  {item.title}
                                </div>
                                {item.subtitle && <p className="mt-2 text-sm text-slate-300">{item.subtitle}</p>}
                              </div>
                              <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-slate-300">
                                Manual
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-500">
                        Nenhuma ocorrência manual cadastrada para este dia.
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-800 bg-slate-900/40 p-6 lg:border-l lg:border-t-0">
                  <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Leitura rápida do dia</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedDayOccurrences.length > 0 ? (
                        selectedDayOccurrences.map((item) => <Badge key={`quick-${item.key}`} occurrence={item} />)
                      ) : (
                        <span className="text-sm text-slate-500">Sem ocorrências neste dia.</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">Nova ocorrência manual</h3>
                    <form id="frequencia-form" onSubmit={handleSaveRegistro} className="space-y-4">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</label>
                        <select
                          value={registroTipo}
                          onChange={(e) => setRegistroTipo(e.target.value)}
                          className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-primary"
                        >
                          <option value="FALTA">FALTA</option>
                          <option value="ATESTADO">ATESTADO</option>
                          <option value="LEMBRETE">LEMBRETE</option>
                          <option value="EVENTO">EVENTO</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Turno</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['MANHA', 'TARDE', 'INTEGRAL'].map((turno) => (
                            <button
                              key={turno}
                              type="button"
                              onClick={() => setRegistroTurno(turno)}
                              className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                                registroTurno === turno
                                  ? 'border-primary bg-primary text-white'
                                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              {turno}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Descrição / motivo</label>
                        <textarea
                          name="descricao"
                          rows={5}
                          className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-primary"
                          placeholder="Descreva a ocorrência deste dia..."
                        />
                      </div>
                    </form>
                  </div>

                  <div className="mt-5 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-300 hover:border-slate-600 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      form="frequencia-form"
                      type="submit"
                      className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover"
                    >
                      Salvar ocorrência
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FrequenciaPage;
