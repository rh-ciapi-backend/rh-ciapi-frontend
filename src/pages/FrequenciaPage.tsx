import React, { useCallback, useEffect, useMemo, useState } from 'react';
import FrequenciaHero from '../components/frequencia/FrequenciaHero';
import FrequenciaFilters from '../components/frequencia/FrequenciaFilters';
import FrequenciaKpis from '../components/frequencia/FrequenciaKpis';
import FrequenciaServerList from '../components/frequencia/FrequenciaServerList';
import FrequenciaMonthGrid from '../components/frequencia/FrequenciaMonthGrid';
import FrequenciaDayDrawer from '../components/frequencia/FrequenciaDayDrawer';
import FrequenciaLegend from '../components/frequencia/FrequenciaLegend';
import FrequenciaActionBar from '../components/frequencia/FrequenciaActionBar';
import FrequenciaEmptyState from '../components/frequencia/FrequenciaEmptyState';
import frequenciaService from '../services/frequenciaService';
import type {
  FrequenciaDayItem,
  FrequenciaDayStatus,
  FrequenciaFiltersState,
  FrequenciaKpiItem,
  FrequenciaLegendItem,
  FrequenciaMonthData,
  FrequenciaOption,
  FrequenciaServerSummary,
  FrequenciaServiceListResult,
} from '../types/frequencia';

const MONTH_LABELS = [
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

function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function getMonthOptions(): FrequenciaOption[] {
  return MONTH_LABELS.map((label, index) => ({
    label,
    value: String(index + 1),
  }));
}

function getYearOptions(range = 4): FrequenciaOption[] {
  const current = getCurrentYear();
  const years: FrequenciaOption[] = [];
  for (let year = current - range; year <= current + 1; year += 1) {
    years.push({ label: String(year), value: String(year) });
  }
  return years;
}

function normalizeString(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeStatusText(value: any): string {
  const text = normalizeString(value).toLowerCase();
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getWeekdayLabel(date: Date): string {
  return date.toLocaleDateString('pt-BR', { weekday: 'long' });
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function inferDayStatus(day: Partial<FrequenciaDayItem>): FrequenciaDayStatus {
  if (day.isFerias) return 'ferias';
  if (day.isAtestado) return 'atestado';
  if (day.isFalta) return 'falta';
  if (day.isHoliday) return 'feriado';
  if (day.isPontoFacultativo) return 'ponto_facultativo';
  if (day.isPending) return 'pendencia';
  if (day.hasOcorrencia) return 'ocorrencia';
  if (day.isSunday) return 'domingo';
  if (day.isSaturday) return 'sabado';
  return 'dia_util';
}

function inferChannel(rubrica?: string, ocorrencia?: string) {
  const hasRubrica = !!normalizeString(rubrica);
  const hasOcorrencia = !!normalizeString(ocorrencia);

  if (hasRubrica && hasOcorrencia) return 'ambos' as const;
  if (hasRubrica) return 'rubrica' as const;
  if (hasOcorrencia) return 'ocorrencia' as const;
  return 'nenhum' as const;
}

function buildGeneratedMonth(
  server: FrequenciaServerSummary,
  month: number,
  year: number
): FrequenciaMonthData {
  const totalDays = getLastDayOfMonth(year, month);

  const dayItems: FrequenciaDayItem[] = Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const date = new Date(year, month - 1, day);
    const weekday = date.getDay();
    const isSaturday = weekday === 6;
    const isSunday = weekday === 0;

    const rubrica = isSaturday
      ? 'SÁBADO'
      : isSunday
      ? 'DOMINGO'
      : '';

    const item: FrequenciaDayItem = {
      id: `${server.id}-${year}-${month}-${day}`,
      dia: day,
      dataIso: date.toISOString().slice(0, 10),
      weekday,
      weekdayLabel: getWeekdayLabel(date),
      isToday:
        new Date().toISOString().slice(0, 10) === date.toISOString().slice(0, 10),
      isWeekend: isSaturday || isSunday,
      isSaturday,
      isSunday,
      turno1: '',
      turno2: '',
      rubrica,
      ocorrencia: '',
      observacoes: '',
      statusFinal: inferDayStatus({
        isSaturday,
        isSunday,
      }),
      channel: inferChannel(rubrica, ''),
      chips: isSaturday ? ['Rubrica'] : isSunday ? ['Rubrica'] : ['Dia útil'],
      raw: null,
    };

    return item;
  });

  return {
    servidor: server,
    mes: month,
    ano: year,
    totalDiasMes: totalDays,
    hiddenRowsFrom: totalDays + 1,
    hiddenRowsTo: 31,
    warnings: [],
    dayItems,
    raw: null,
  };
}

function normalizeServer(raw: any, index: number): FrequenciaServerSummary {
  const id =
    normalizeString(raw?.id) ||
    normalizeString(raw?.servidor) ||
    normalizeString(raw?.servidor_id) ||
    normalizeString(raw?.uuid) ||
    normalizeString(raw?.cpf) ||
    `servidor-${index + 1}`;

  const nome =
    normalizeString(raw?.nomeCompleto) ||
    normalizeString(raw?.nome_completo) ||
    normalizeString(raw?.nome) ||
    normalizeString(raw?.servidor_nome) ||
    `Servidor ${index + 1}`;

  return {
    id,
    nome,
    cpf: normalizeString(raw?.cpf),
    matricula: normalizeString(raw?.matricula),
    categoria:
      normalizeString(raw?.categoriaCanonica) ||
      normalizeString(raw?.categoria_canonica) ||
      normalizeString(raw?.categoria),
    setor: normalizeString(raw?.setor),
    status: normalizeString(raw?.status) || 'ATIVO',
    cargo: normalizeString(raw?.cargo),
    avatar: raw?.fotoUrl || raw?.foto_url || raw?.avatar || null,
    resumo: normalizeString(raw?.resumo),
    totalDias:
      Number(raw?.totalDias || raw?.total_dias || raw?.diasMes || raw?.dias_mes) ||
      undefined,
    diasLancados:
      Number(
        raw?.diasLancados ||
          raw?.dias_lancados ||
          raw?.lancados ||
          raw?.frequenciaLancada
      ) || 0,
    pendencias: Number(raw?.pendencias || raw?.pendente || raw?.pendencias_mes) || 0,
    faltas: Number(raw?.faltas || raw?.totalFaltas) || 0,
    atestados: Number(raw?.atestados || raw?.totalAtestados) || 0,
    ferias: Number(raw?.ferias || raw?.totalFerias) || 0,
    raw,
  };
}

function normalizeIncomingDay(
  raw: any,
  server: FrequenciaServerSummary,
  year: number,
  month: number,
  dayNumber: number
): FrequenciaDayItem {
  const date = new Date(year, month - 1, dayNumber);
  const weekday = date.getDay();
  const isSaturday = weekday === 6;
  const isSunday = weekday === 0;

  const turno1 =
    normalizeString(raw?.turno1) ||
    normalizeString(raw?.o1) ||
    normalizeString(raw?.turno_1) ||
    normalizeString(raw?.manha);

  const turno2 =
    normalizeString(raw?.turno2) ||
    normalizeString(raw?.o2) ||
    normalizeString(raw?.turno_2) ||
    normalizeString(raw?.tarde);

  let rubrica =
    normalizeString(raw?.rubrica) ||
    normalizeString(raw?.servidorRubrica) ||
    normalizeString(raw?.rubrica_servidor);

  const ocorrencia =
    normalizeString(raw?.ocorrencia) ||
    normalizeString(raw?.descricao) ||
    normalizeString(raw?.evento) ||
    normalizeString(raw?.observacao);

  const observacoes =
    normalizeString(raw?.observacoes) ||
    normalizeString(raw?.obs) ||
    normalizeString(raw?.nota);

  const tagsText = [
    normalizeStatusText(raw?.tipo),
    normalizeStatusText(raw?.status),
    normalizeStatusText(raw?.finalStatus),
    normalizeStatusText(raw?.rotulo),
    normalizeStatusText(raw?.rubrica),
    normalizeStatusText(raw?.ocorrencia),
    normalizeStatusText(raw?.observacao),
  ].join(' ');

  const isHoliday =
    !!raw?.isHoliday ||
    !!raw?.feriado ||
    tagsText.includes('feriado');

  const isPontoFacultativo =
    !!raw?.isPontoFacultativo ||
    !!raw?.ponto_facultativo ||
    tagsText.includes('ponto facultativo');

  const isFerias =
    !!raw?.isFerias ||
    !!raw?.ferias ||
    tagsText.includes('ferias') ||
    tagsText.includes('férias');

  const isAtestado =
    !!raw?.isAtestado ||
    !!raw?.atestado ||
    tagsText.includes('atestado');

  const isFalta =
    !!raw?.isFalta ||
    !!raw?.falta ||
    tagsText.includes('falta');

  const isPending =
    !!raw?.isPending ||
    !!raw?.pendencia ||
    tagsText.includes('pendencia') ||
    tagsText.includes('pendência');

  const hasOcorrencia = !!ocorrencia || !!turno1 || !!turno2;

  if (!rubrica) {
    if (isSaturday) rubrica = 'SÁBADO';
    if (isSunday) rubrica = 'DOMINGO';
    if (isHoliday) rubrica = 'FERIADO';
    if (isPontoFacultativo) rubrica = 'PONTO FACULTATIVO';
    if (isFerias) rubrica = 'FÉRIAS';
    if (isAtestado) rubrica = 'ATESTADO';
  }

  const chips = [
    isSaturday ? 'Sábado' : '',
    isSunday ? 'Domingo' : '',
    isHoliday ? 'Feriado' : '',
    isPontoFacultativo ? 'Ponto facultativo' : '',
    isFerias ? 'Férias' : '',
    isAtestado ? 'Atestado' : '',
    isFalta ? 'Falta' : '',
    isPending ? 'Pendência' : '',
    hasOcorrencia ? 'Ocorrência' : '',
    rubrica ? 'Rubrica' : '',
  ].filter(Boolean);

  const partial: Partial<FrequenciaDayItem> = {
    isSaturday,
    isSunday,
    isHoliday,
    isPontoFacultativo,
    isFerias,
    isAtestado,
    isFalta,
    isPending,
    hasOcorrencia,
  };

  return {
    id: `${server.id}-${year}-${month}-${dayNumber}`,
    dia: dayNumber,
    dataIso: date.toISOString().slice(0, 10),
    weekday,
    weekdayLabel: getWeekdayLabel(date),
    isToday:
      new Date().toISOString().slice(0, 10) === date.toISOString().slice(0, 10),
    isWeekend: isSaturday || isSunday,
    isSaturday,
    isSunday,
    isHoliday,
    isPontoFacultativo,
    isFerias,
    isAtestado,
    isFalta,
    isPending,
    hasOcorrencia,
    turno1,
    turno2,
    rubrica,
    ocorrencia,
    observacoes,
    statusFinal: inferDayStatus(partial),
    channel: inferChannel(rubrica, ocorrencia),
    chips,
    raw,
  };
}

function normalizeServerMonth(
  raw: any,
  server: FrequenciaServerSummary,
  month: number,
  year: number
): FrequenciaMonthData {
  const totalDays =
    Number(raw?.totalDiasMes || raw?.total_dias_mes || raw?.diasMes) ||
    getLastDayOfMonth(year, month);

  const rawDays =
    (Array.isArray(raw?.dayItems) && raw.dayItems) ||
    (Array.isArray(raw?.dias) && raw.dias) ||
    (Array.isArray(raw?.items) && raw.items) ||
    [];

  let dayItems: FrequenciaDayItem[];

  if (rawDays.length > 0) {
    dayItems = Array.from({ length: totalDays }, (_, index) => {
      const dayNumber = index + 1;
      const matched =
        rawDays.find((item: any) => Number(item?.dia || item?.day) === dayNumber) || {};
      return normalizeIncomingDay(matched, server, year, month, dayNumber);
    });
  } else {
    dayItems = buildGeneratedMonth(server, month, year).dayItems;
  }

  return {
    servidor: server,
    mes: month,
    ano: year,
    totalDiasMes: totalDays,
    hiddenRowsFrom: totalDays + 1,
    hiddenRowsTo: 31,
    warnings:
      (Array.isArray(raw?.warnings) ? raw.warnings : []).map((item: any) =>
        normalizeString(item)
      ),
    dayItems,
    raw,
  };
}

function normalizeServiceListPayload(payload: FrequenciaServiceListResult | any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.servidores)) return payload.servidores;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function getCategoryOptions(servers: FrequenciaServerSummary[]): FrequenciaOption[] {
  const values = Array.from(
    new Set(servers.map((item) => normalizeString(item.categoria)).filter(Boolean))
  );
  return [{ label: 'Todas', value: '' }].concat(
    values.map((value) => ({ label: value, value }))
  );
}

function getSectorOptions(servers: FrequenciaServerSummary[]): FrequenciaOption[] {
  const values = Array.from(
    new Set(servers.map((item) => normalizeString(item.setor)).filter(Boolean))
  );
  return [{ label: 'Todos', value: '' }].concat(
    values.map((value) => ({ label: value, value }))
  );
}

function getStatusOptions(servers: FrequenciaServerSummary[]): FrequenciaOption[] {
  const values = Array.from(
    new Set(servers.map((item) => normalizeString(item.status)).filter(Boolean))
  );
  return [{ label: 'Todos', value: '' }].concat(
    values.map((value) => ({ label: value, value }))
  );
}

function exportCsvFromMonth(monthData?: FrequenciaMonthData | null) {
  if (!monthData) return;

  const rows = [
    [
      'Dia',
      'Data',
      'Semana',
      'Status',
      'Rubrica',
      'Ocorrência',
      'Turno 1',
      'Turno 2',
      'Observações',
    ],
    ...monthData.dayItems.map((day) => [
      String(day.dia),
      day.dataIso,
      day.weekdayLabel,
      day.statusFinal,
      day.rubrica || '',
      day.ocorrencia || '',
      day.turno1 || '',
      day.turno2 || '',
      day.observacoes || '',
    ]),
  ];

  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(';')
    )
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `frequencia_${monthData.servidor.nome
    .replace(/\s+/g, '_')
    .toLowerCase()}_${monthData.ano}-${String(monthData.mes).padStart(2, '0')}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function FrequenciaPage() {
  const [filters, setFilters] = useState<FrequenciaFiltersState>({
    mes: getCurrentMonth(),
    ano: getCurrentYear(),
    servidor: '',
    categoria: '',
    setor: '',
    status: '',
    busca: '',
    viewMode: 'geral',
  });

  const [loading, setLoading] = useState(false);
  const [servers, setServers] = useState<FrequenciaServerSummary[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [serverMonthMap, setServerMonthMap] = useState<Record<string, FrequenciaMonthData>>(
    {}
  );
  const [error, setError] = useState<string>('');

  const monthOptions = useMemo(() => getMonthOptions(), []);
  const yearOptions = useMemo(() => getYearOptions(), []);

  const selectedServer = useMemo(
    () => servers.find((item) => item.id === selectedServerId) || null,
    [servers, selectedServerId]
  );

  const selectedMonthData = useMemo(
    () => (selectedServerId ? serverMonthMap[selectedServerId] || null : null),
    [selectedServerId, serverMonthMap]
  );

  const selectedDay = useMemo(
    () =>
      selectedMonthData?.dayItems.find((day) => day.id === selectedDayId) || null,
    [selectedMonthData, selectedDayId]
  );

  const filteredServers = useMemo(() => {
    const searchTerm = normalizeStatusText(filters.busca);
    const serverTerm = normalizeStatusText(filters.servidor);

    return servers.filter((server) => {
      const categoryOk = !filters.categoria || server.categoria === filters.categoria;
      const sectorOk = !filters.setor || server.setor === filters.setor;
      const statusOk =
        !filters.status ||
        normalizeString(server.status).toLowerCase() ===
          normalizeString(filters.status).toLowerCase();

      const haystack = normalizeStatusText(
        [
          server.nome,
          server.cpf,
          server.matricula,
          server.categoria,
          server.setor,
          server.status,
          server.cargo,
        ]
          .filter(Boolean)
          .join(' ')
      );

      const textOk = !searchTerm || haystack.includes(searchTerm);
      const serverOk = !serverTerm || haystack.includes(serverTerm);

      return categoryOk && sectorOk && statusOk && textOk && serverOk;
    });
  }, [filters, servers]);

  const categoryOptions = useMemo(() => getCategoryOptions(servers), [servers]);
  const sectorOptions = useMemo(() => getSectorOptions(servers), [servers]);
  const statusOptions = useMemo(() => getStatusOptions(servers), [servers]);

  const kpis = useMemo<FrequenciaKpiItem[]>(() => {
    const monthDataList = filteredServers
      .map((server) => serverMonthMap[server.id])
      .filter(Boolean) as FrequenciaMonthData[];

    const totalServidores = filteredServers.length;
    const totalLancada = monthDataList.reduce((acc, monthData) => {
      return (
        acc +
        monthData.dayItems.filter(
          (day) =>
            !!day.rubrica ||
            !!day.ocorrencia ||
            !!day.turno1 ||
            !!day.turno2
        ).length
      );
    }, 0);

    const pendencias = monthDataList.reduce(
      (acc, monthData) =>
        acc + monthData.dayItems.filter((day) => day.isPending).length,
      0
    );

    const faltas = monthDataList.reduce(
      (acc, monthData) =>
        acc + monthData.dayItems.filter((day) => day.isFalta).length,
      0
    );

    const atestados = monthDataList.reduce(
      (acc, monthData) =>
        acc + monthData.dayItems.filter((day) => day.isAtestado).length,
      0
    );

    const ferias = monthDataList.reduce(
      (acc, monthData) =>
        acc + monthData.dayItems.filter((day) => day.isFerias).length,
      0
    );

    const feriadosPontos = monthDataList.reduce(
      (acc, monthData) =>
        acc +
        monthData.dayItems.filter(
          (day) => day.isHoliday || day.isPontoFacultativo
        ).length,
      0
    );

    return [
      {
        id: 'total-servidores',
        label: 'Total de servidores',
        value: totalServidores,
        hint: 'Servidores visíveis na leitura atual',
        tone: 'primary',
      },
      {
        id: 'frequencia-lancada',
        label: 'Frequência lançada',
        value: totalLancada,
        hint: 'Dias com informação operacional',
        tone: 'success',
      },
      {
        id: 'pendencias',
        label: 'Pendências',
        value: pendencias,
        hint: 'Dias aguardando revisão',
        tone: 'warning',
      },
      {
        id: 'faltas',
        label: 'Faltas',
        value: faltas,
        hint: 'Ocorrências do mês',
        tone: 'danger',
      },
      {
        id: 'atestados',
        label: 'Atestados',
        value: atestados,
        hint: 'Registros com atestado',
        tone: 'info',
      },
      {
        id: 'ferias',
        label: 'Férias no mês',
        value: ferias,
        hint: 'Dias vinculados a férias',
        tone: 'violet',
      },
      {
        id: 'feriados-pontos',
        label: 'Feriados / pontos',
        value: feriadosPontos,
        hint: 'Dias especiais previstos',
        tone: 'neutral',
      },
    ];
  }, [filteredServers, serverMonthMap]);

  const legendItems = useMemo<FrequenciaLegendItem[]>(
    () => [
      {
        key: 'dia_util',
        label: 'Dia útil',
        description: 'Dia normal sem vínculo especial e sem pendência.',
      },
      {
        key: 'sabado',
        label: 'Sábado',
        description: 'Reconhecido dinamicamente conforme mês e ano.',
      },
      {
        key: 'domingo',
        label: 'Domingo',
        description: 'Reconhecido dinamicamente conforme mês e ano.',
      },
      {
        key: 'feriado',
        label: 'Feriado',
        description: 'Dia especial previsto para ir à rubrica.',
      },
      {
        key: 'ponto_facultativo',
        label: 'Ponto facultativo',
        description: 'Dia especial previsto visualmente na competência.',
      },
      {
        key: 'ferias',
        label: 'Férias',
        description: 'Registros de férias destacados na leitura do mês.',
      },
      {
        key: 'atestado',
        label: 'Atestado',
        description: 'Ocorrência de saúde prevista no fluxo mensal.',
      },
      {
        key: 'falta',
        label: 'Falta',
        description: 'Dia com falta lançada e destaque de atenção.',
      },
      {
        key: 'pendencia',
        label: 'Pendência',
        description: 'Dia com necessidade de revisão ou complemento.',
      },
      {
        key: 'ocorrencia',
        label: 'Ocorrência',
        description: 'Dia com observação operacional ou marcação específica.',
      },
    ],
    []
  );

  const selectedMonthLabel = MONTH_LABELS[filters.mes - 1] || 'Mês';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const listMethod =
        (frequenciaService as any)?.listarPorMes ||
        (frequenciaService as any)?.listar ||
        (frequenciaService as any)?.getByMonth ||
        (frequenciaService as any)?.listByMonth;

      let payload: any = [];

      if (typeof listMethod === 'function') {
        payload = await listMethod({
          ano: filters.ano,
          mes: filters.mes,
        });
      }

      const rawItems = normalizeServiceListPayload(payload);

      const normalizedServers = rawItems.map((item, index) => normalizeServer(item, index));

      const map: Record<string, FrequenciaMonthData> = {};

      normalizedServers.forEach((server, index) => {
        const raw = rawItems[index];
        map[server.id] = normalizeServerMonth(raw, server, filters.mes, filters.ano);
      });

      if (normalizedServers.length === 0) {
        setServers([]);
        setServerMonthMap({});
        setSelectedServerId(null);
        setSelectedDayId(null);
        return;
      }

      setServers(normalizedServers);
      setServerMonthMap(map);

      setSelectedServerId((current) => {
        if (current && normalizedServers.some((item) => item.id === current)) return current;
        return normalizedServers[0]?.id || null;
      });

      setSelectedDayId((current) => {
        const initialServer = normalizedServers[0];
        const initialMonth = initialServer ? map[initialServer.id] : null;
        if (!initialMonth) return null;
        if (current && initialMonth.dayItems.some((item) => item.id === current)) return current;
        return initialMonth.dayItems[0]?.id || null;
      });
    } catch (err: any) {
      console.error('Erro ao carregar frequência:', err);
      setError(
        err?.message ||
          'Não foi possível carregar os dados de frequência.'
      );
      setServers([]);
      setServerMonthMap({});
      setSelectedServerId(null);
      setSelectedDayId(null);
    } finally {
      setLoading(false);
    }
  }, [filters.ano, filters.mes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedServerId) return;
    const monthData = serverMonthMap[selectedServerId];
    if (!monthData?.dayItems?.length) return;
    setSelectedDayId((current) => {
      if (current && monthData.dayItems.some((item) => item.id === current)) return current;
      return monthData.dayItems[0]?.id || null;
    });
  }, [selectedServerId, serverMonthMap]);

  useEffect(() => {
    if (!selectedServerId) return;
    if (!filteredServers.some((item) => item.id === selectedServerId)) {
      const first = filteredServers[0];
      setSelectedServerId(first?.id || null);
      setSelectedDayId(first ? serverMonthMap[first.id]?.dayItems?.[0]?.id || null : null);
    }
  }, [filteredServers, selectedServerId, serverMonthMap]);

  const handleFilterChange = <K extends keyof FrequenciaFiltersState>(
    field: K,
    value: FrequenciaFiltersState[K]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      mes: getCurrentMonth(),
      ano: getCurrentYear(),
      servidor: '',
      categoria: '',
      setor: '',
      status: '',
      busca: '',
      viewMode: 'geral',
    });
  };

  const handleApplyFilters = () => {
    const first = filteredServers[0];
    if (first) {
      setSelectedServerId(first.id);
      const month = serverMonthMap[first.id];
      setSelectedDayId(month?.dayItems?.[0]?.id || null);
    }
  };

  const handleSelectServer = (server: FrequenciaServerSummary) => {
    setSelectedServerId(server.id);
    const monthData = serverMonthMap[server.id] || buildGeneratedMonth(server, filters.mes, filters.ano);
    if (!serverMonthMap[server.id]) {
      setServerMonthMap((prev) => ({ ...prev, [server.id]: monthData }));
    }
    setSelectedDayId(monthData.dayItems[0]?.id || null);
  };

  const handleSelectDay = (day: FrequenciaDayItem) => {
    setSelectedDayId(day.id);
  };

  const toastFallback = (message: string) => {
    window.alert(message);
  };

  const handlePreview = () => {
    if (!selectedMonthData) {
      toastFallback('Selecione um servidor para visualizar a prévia.');
      return;
    }
    toastFallback(
      `Prévia pronta para ${selectedMonthData.servidor.nome} em ${selectedMonthLabel}/${filters.ano}.`
    );
  };

  const handleExportDocx = async () => {
    if (!selectedServer) {
      toastFallback('Selecione um servidor para exportar DOCX.');
      return;
    }

    const method =
      (frequenciaService as any)?.exportarDocx ||
      (frequenciaService as any)?.baixarFrequenciaArquivo;

    if (typeof method !== 'function') {
      toastFallback('A exportação DOCX ainda não está disponível no service atual.');
      return;
    }

    try {
      await method({
        ano: filters.ano,
        mes: filters.mes,
        servidorId: selectedServer.id,
        formato: 'docx',
      });
    } catch (err: any) {
      console.error(err);
      toastFallback(err?.message || 'Falha ao exportar DOCX.');
    }
  };

  const handleExportPdf = async () => {
    if (!selectedServer) {
      toastFallback('Selecione um servidor para exportar PDF.');
      return;
    }

    const method =
      (frequenciaService as any)?.exportarPdf ||
      (frequenciaService as any)?.baixarFrequenciaArquivo;

    if (typeof method !== 'function') {
      toastFallback('A exportação PDF ainda não está disponível no service atual.');
      return;
    }

    try {
      await method({
        ano: filters.ano,
        mes: filters.mes,
        servidorId: selectedServer.id,
        formato: 'pdf',
      });
    } catch (err: any) {
      console.error(err);
      toastFallback(err?.message || 'Falha ao exportar PDF.');
    }
  };

  const handleExportCsv = () => {
    if (!selectedMonthData) {
      toastFallback('Selecione um servidor para exportar CSV.');
      return;
    }
    exportCsvFromMonth(selectedMonthData);
  };

  const handleLaunch = () => {
    toastFallback('Fluxo de lançamento pronto para conexão com modal/formulário do projeto.');
  };

  const handleEditDay = () => {
    if (!selectedDay) {
      toastFallback('Selecione um dia para editar.');
      return;
    }
    toastFallback(`Abrir edição do dia ${selectedDay.dia} para ${selectedServer?.nome}.`);
  };

  const handleReplicate = () => {
    if (!selectedDay) {
      toastFallback('Selecione um dia para replicar.');
      return;
    }
    toastFallback(`Replicação preparada a partir do dia ${selectedDay.dia}.`);
  };

  const handleClearDay = () => {
    if (!selectedDay || !selectedServerId || !selectedMonthData) {
      toastFallback('Selecione um dia para limpar.');
      return;
    }

    const updatedItems = selectedMonthData.dayItems.map((day) => {
      if (day.id !== selectedDay.id) return day;

      const reset = normalizeIncomingDay({}, selectedMonthData.servidor, filters.ano, filters.mes, day.dia);
      return reset;
    });

    setServerMonthMap((prev) => ({
      ...prev,
      [selectedServerId]: {
        ...selectedMonthData,
        dayItems: updatedItems,
      },
    }));
  };

  const handleImportMonthData = () => {
    toastFallback('Importação mensal prevista para conexão futura com backend e ocorrências.');
  };

  const displayedMonthData =
    selectedServerId && serverMonthMap[selectedServerId]
      ? serverMonthMap[selectedServerId]
      : selectedServer
      ? buildGeneratedMonth(selectedServer, filters.mes, filters.ano)
      : null;

  const displayedDayItems = displayedMonthData?.dayItems || [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.10),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_18%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)] px-4 py-6 md:px-6 xl:px-8">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-6">
        <FrequenciaHero
          mesLabel={selectedMonthLabel}
          ano={filters.ano}
          onPreview={handlePreview}
          onExportDocx={handleExportDocx}
          onExportPdf={handleExportPdf}
          onExportCsv={handleExportCsv}
        />

        <FrequenciaFilters
          filters={filters}
          meses={monthOptions}
          anos={yearOptions}
          categorias={categoryOptions}
          setores={sectorOptions}
          statuses={statusOptions}
          onChange={handleFilterChange}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />

        <FrequenciaKpis items={kpis} />

        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
            Carregando dados da frequência...
          </div>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)_360px]">
          <FrequenciaServerList
            servers={filteredServers}
            selectedServerId={selectedServerId}
            onSelect={handleSelectServer}
          />

          {selectedServer ? (
            <FrequenciaMonthGrid
              dayItems={displayedDayItems}
              selectedDayId={selectedDayId}
              onSelectDay={handleSelectDay}
            />
          ) : (
            <FrequenciaEmptyState />
          )}

          <FrequenciaDayDrawer
            day={selectedDay}
            onEdit={handleEditDay}
            onReplicate={handleReplicate}
            onClear={handleClearDay}
            onLaunch={handleLaunch}
          />
        </section>

        <FrequenciaActionBar
          disabled={!selectedServer}
          onLaunch={handleLaunch}
          onEdit={handleEditDay}
          onReplicate={handleReplicate}
          onClear={handleClearDay}
          onImport={handleImportMonthData}
          onPreview={handlePreview}
          onExportDocx={handleExportDocx}
          onExportPdf={handleExportPdf}
          onExportCsv={handleExportCsv}
        />

        <FrequenciaLegend items={legendItems} />
      </div>
    </div>
  );
}
