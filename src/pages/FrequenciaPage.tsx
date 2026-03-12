import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import FrequenciaActionBar from '../components/frequencia/FrequenciaActionBar';
import FrequenciaDayDrawer from '../components/frequencia/FrequenciaDayDrawer';
import FrequenciaEmptyState from '../components/frequencia/FrequenciaEmptyState';
import FrequenciaFilters from '../components/frequencia/FrequenciaFilters';
import FrequenciaHero from '../components/frequencia/FrequenciaHero';
import FrequenciaKpis from '../components/frequencia/FrequenciaKpis';
import FrequenciaLegend from '../components/frequencia/FrequenciaLegend';
import FrequenciaMonthGrid from '../components/frequencia/FrequenciaMonthGrid';
import FrequenciaServerList from '../components/frequencia/FrequenciaServerList';

import frequenciaService, {
  baixarFrequenciaArquivo,
  getFrequenciaServiceErrorMessage,
} from '../services/frequenciaService';

import type {
  FrequenciaDayItem,
  FrequenciaDayStatus,
  FrequenciaFiltersState,
  FrequenciaKpisData,
  FrequenciaServidorItem,
  FrequenciaExportFormat,
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

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  return '';
}

function asNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function readPath(source: unknown, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = source;

  for (const key of keys) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

function pickString(source: unknown, paths: string[], fallback = ''): string {
  for (const path of paths) {
    const value = readPath(source, path);
    const text = asString(value);
    if (text) return text;
  }
  return fallback;
}

function pickNumber(source: unknown, paths: string[], fallback = 0): number {
  for (const path of paths) {
    const value = readPath(source, path);
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return fallback;
}

function pickArray(source: unknown, paths: string[]): unknown[] {
  for (const path of paths) {
    const value = readPath(source, path);
    if (Array.isArray(value)) return value;
  }
  return [];
}

function normalizeCpf(value: string): string {
  return value.replace(/\D+/g, '');
}

function normalizeServerStatus(value: string): string {
  const text = value.trim().toUpperCase();
  if (!text) return 'ATIVO';
  return text;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function inferStatus({
  rubrica,
  ocorrenciaManha,
  ocorrenciaTarde,
  titulo,
  descricao,
  isWeekend,
}: {
  rubrica: string;
  ocorrenciaManha: string;
  ocorrenciaTarde: string;
  titulo: string;
  descricao: string;
  isWeekend: boolean;
}): FrequenciaDayStatus {
  const haystack = normalizeSearchText([rubrica, ocorrenciaManha, ocorrenciaTarde, titulo, descricao].join(' '));

  if (haystack.includes('férias') || haystack.includes('ferias')) return 'ferias';
  if (haystack.includes('atestado')) return 'atestado';
  if (haystack.includes('falta')) return 'falta';
  if (haystack.includes('feriado')) return 'feriado';
  if (haystack.includes('ponto facultativo')) return 'ponto_facultativo';
  if (haystack.includes('anivers')) return 'aniversario';
  if (haystack.includes('evento')) return 'evento';
  if (isWeekend) return 'fim_de_semana';
  if (haystack.includes('presente') || haystack.includes('normal') || haystack.includes('expediente')) return 'presente';
  if (haystack) return 'pendente';

  return 'sem_registro';
}

function getWeekdayLabel(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function createFallbackDay(year: number, month: number, day: number): FrequenciaDayItem {
  const date = new Date(year, month - 1, day);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const defaultRubrica = date.getDay() === 0 ? 'DOMINGO' : date.getDay() === 6 ? 'SÁBADO' : '';

  return {
    dia: day,
    dataIso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    weekdayLabel: getWeekdayLabel(year, month, day),
    isWeekend,
    status: isWeekend ? 'fim_de_semana' : 'sem_registro',
    rubrica: defaultRubrica,
    referencia: '',
    ocorrenciaManha: '',
    ocorrenciaTarde: '',
    titulo: isWeekend ? defaultRubrica : 'Sem registro',
    descricao: isWeekend ? `Dia ${defaultRubrica.toLowerCase()}.` : 'Nenhuma ocorrência informada para este dia.',
    badges: isWeekend ? [defaultRubrica] : [],
    avisos: [],
    raw: null,
  };
}

function normalizeDayItem(raw: unknown, year: number, month: number, fallbackDay?: number): FrequenciaDayItem {
  const dayNumber = pickNumber(raw, ['dia', 'day', 'numero', 'date', 'data_numero'], fallbackDay || 1);
  const safeDay = Math.min(Math.max(dayNumber, 1), getDaysInMonth(year, month));
  const base = createFallbackDay(year, month, safeDay);

  const rubrica = pickString(raw, ['rubrica', 'statusLabel', 'observacao', 'observação', 'descricaoRubrica'], base.rubrica);
  const referencia = pickString(raw, ['referencia', 'referência', 'turnoLabel', 'codigo', 'code'], '');
  const ocorrenciaManha = pickString(raw, ['ocorrenciaManha', 'manha', 'manhaLabel', 'o1', 'o1Label', 'turno1'], '');
  const ocorrenciaTarde = pickString(raw, ['ocorrenciaTarde', 'tarde', 'tardeLabel', 'o2', 'o2Label', 'turno2'], '');
  const titulo = pickString(raw, ['titulo', 'title', 'finalStatus', 'status', 'label'], '');
  const descricao = pickString(raw, ['descricao', 'description', 'detalhes', 'observacao', 'observação'], '');
  const badges = asArray<string>(readPath(raw, 'badges'))
    .map(asString)
    .filter(Boolean);
  const avisos = asArray<string>(readPath(raw, 'avisos'))
    .map(asString)
    .filter(Boolean);

  const explicitStatus = pickString(raw, ['status', 'statusKey', 'tipo'], '').toLowerCase();
  const status =
    explicitStatus &&
    [
      'presente',
      'falta',
      'atestado',
      'ferias',
      'feriado',
      'ponto_facultativo',
      'fim_de_semana',
      'aniversario',
      'evento',
      'pendente',
      'sem_registro',
    ].includes(explicitStatus)
      ? (explicitStatus as FrequenciaDayStatus)
      : inferStatus({
          rubrica,
          ocorrenciaManha,
          ocorrenciaTarde,
          titulo,
          descricao,
          isWeekend: base.isWeekend,
        });

  return {
    ...base,
    status,
    rubrica,
    referencia,
    ocorrenciaManha,
    ocorrenciaTarde,
    titulo: titulo || rubrica || base.titulo,
    descricao: descricao || rubrica || base.descricao,
    badges: badges.length > 0 ? badges : base.badges,
    avisos,
    raw,
  };
}

function fillMissingDays(days: FrequenciaDayItem[], year: number, month: number): FrequenciaDayItem[] {
  const total = getDaysInMonth(year, month);
  const byDay = new Map<number, FrequenciaDayItem>();

  for (const day of days) {
    if (!byDay.has(day.dia)) {
      byDay.set(day.dia, day);
    }
  }

  const result: FrequenciaDayItem[] = [];

  for (let day = 1; day <= total; day += 1) {
    result.push(byDay.get(day) || createFallbackDay(year, month, day));
  }

  return result;
}

function calculateResumo(days: FrequenciaDayItem[]) {
  return days.reduce(
    (acc, day) => {
      acc.totalDiasMes += 1;
      if (day.status === 'presente') acc.presentes += 1;
      if (day.status === 'falta') acc.faltas += 1;
      if (day.status === 'atestado') acc.atestados += 1;
      if (day.status === 'ferias') acc.ferias += 1;
      if (day.status === 'feriado') acc.feriados += 1;
      if (day.status === 'ponto_facultativo') acc.pontosFacultativos += 1;
      if (day.status === 'fim_de_semana') acc.finsDeSemana += 1;
      if (day.status === 'sem_registro') acc.semRegistro += 1;
      return acc;
    },
    {
      totalDiasMes: 0,
      presentes: 0,
      faltas: 0,
      atestados: 0,
      ferias: 0,
      feriados: 0,
      pontosFacultativos: 0,
      finsDeSemana: 0,
      semRegistro: 0,
    },
  );
}

function normalizeServidor(raw: unknown, year: number, month: number, index: number): FrequenciaServidorItem {
  const cpf = normalizeCpf(
    pickString(raw, ['cpf', 'servidor.cpf', 'employee.cpf', 'servidorCpf', 'documento'], `tmp-${index}`),
  );

  const nome = pickString(raw, ['nome', 'servidor.nome', 'employee.nome', 'nomeCompleto', 'servidorNome'], 'Servidor sem nome');
  const matricula = pickString(raw, ['matricula', 'servidor.matricula', 'employee.matricula', 'registro'], '');
  const cargo = pickString(raw, ['cargo', 'servidor.cargo', 'employee.cargo', 'funcao', 'função'], '');
  const categoria = pickString(raw, ['categoria', 'servidor.categoria', 'categoriaCanonica', 'categoria_canonica'], '');
  const setor = pickString(raw, ['setor', 'servidor.setor', 'lotacao', 'lotacaoInterna', 'lotacao_interna'], '');
  const statusServidor = normalizeServerStatus(
    pickString(raw, ['status', 'statusServidor', 'servidor.status', 'employee.status'], 'ATIVO'),
  );
  const fotoUrl = pickString(raw, ['fotoUrl', 'foto_url', 'avatar', 'servidor.fotoUrl'], '');
  const servidorId = pickString(raw, ['servidorId', 'servidor_id', 'servidor.id', 'id'], '');

  const rawDays = pickArray(raw, [
    'dias',
    'dayItems',
    'items',
    'registros',
    'frequencia',
    'frequenciaDias',
    'preview.dayItems',
    'days',
  ]);

  const normalizedDays = fillMissingDays(
    rawDays.map((day, idx) => normalizeDayItem(day, year, month, idx + 1)),
    year,
    month,
  );

  const warnings = asArray<string>(readPath(raw, 'warnings'))
    .map(asString)
    .filter(Boolean);

  return {
    id: servidorId || cpf || `tmp-${index}`,
    servidorId: servidorId || undefined,
    cpf,
    nome,
    matricula,
    cargo,
    categoria,
    setor,
    statusServidor,
    fotoUrl: fotoUrl || undefined,
    resumo: calculateResumo(normalizedDays),
    dias: normalizedDays,
    warnings,
    raw,
  };
}

function calculateKpis(servidores: FrequenciaServidorItem[]): FrequenciaKpisData {
  return servidores.reduce(
    (acc, servidor) => {
      acc.totalServidores += 1;
      if (servidor.statusServidor === 'ATIVO') acc.servidoresAtivos += 1;
      acc.totalFaltas += servidor.resumo.faltas;
      acc.totalAtestados += servidor.resumo.atestados;
      acc.totalFerias += servidor.resumo.ferias;
      acc.totalFeriados += servidor.resumo.feriados;
      acc.totalSemRegistro += servidor.resumo.semRegistro;
      return acc;
    },
    {
      totalServidores: 0,
      servidoresAtivos: 0,
      totalFaltas: 0,
      totalAtestados: 0,
      totalFerias: 0,
      totalFeriados: 0,
      totalSemRegistro: 0,
    },
  );
}

function getInitialFilters(): FrequenciaFiltersState {
  const now = new Date();
  return {
    mes: now.getMonth() + 1,
    ano: now.getFullYear(),
    busca: '',
    categoria: '',
    setor: '',
    statusServidor: '',
  };
}

export default function FrequenciaPage() {
  const [filters, setFilters] = useState<FrequenciaFiltersState>(getInitialFilters);
  const [rawItems, setRawItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedCpf, setSelectedCpf] = useState<string>('');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const mesLabel = `${MONTH_LABELS[filters.mes - 1] || 'Mês'} de ${filters.ano}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const payload = await frequenciaService.listarPorMes(filters.ano, filters.mes);
      setRawItems(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setRawItems([]);
      setError(getFrequenciaServiceErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters.ano, filters.mes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const normalizedServidores = useMemo(() => {
    const items = Array.isArray(rawItems) ? rawItems : [];
    return items.map((item, index) => normalizeServidor(item, filters.ano, filters.mes, index));
  }, [rawItems, filters.ano, filters.mes]);

  const categorias = useMemo(() => {
    return Array.from(
      new Set(
        normalizedServidores
          .map((item) => item.categoria)
          .filter((value) => asString(value).trim().length > 0),
      ),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [normalizedServidores]);

  const setores = useMemo(() => {
    return Array.from(
      new Set(
        normalizedServidores
          .map((item) => item.setor)
          .filter((value) => asString(value).trim().length > 0),
      ),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [normalizedServidores]);

  const filteredServidores = useMemo(() => {
    const search = normalizeSearchText(filters.busca);

    return normalizedServidores.filter((item) => {
      const matchesSearch =
        !search ||
        [
          item.nome,
          item.cpf,
          item.matricula,
          item.cargo,
          item.categoria,
          item.setor,
        ]
          .map(normalizeSearchText)
          .some((value) => value.includes(search));

      const matchesCategoria = !filters.categoria || item.categoria === filters.categoria;
      const matchesSetor = !filters.setor || item.setor === filters.setor;
      const matchesStatus = !filters.statusServidor || item.statusServidor === filters.statusServidor;

      return matchesSearch && matchesCategoria && matchesSetor && matchesStatus;
    });
  }, [normalizedServidores, filters]);

  useEffect(() => {
    if (!filteredServidores.length) {
      setSelectedCpf('');
      setSelectedDayNumber(null);
      setDrawerOpen(false);
      return;
    }

    const exists = filteredServidores.some((item) => item.cpf === selectedCpf);

    if (!exists) {
      const preferred =
        filteredServidores.find((item) => item.statusServidor === 'ATIVO') || filteredServidores[0];
      setSelectedCpf(preferred?.cpf || '');
      setSelectedDayNumber(1);
    }
  }, [filteredServidores, selectedCpf]);

  const selectedServidor = useMemo(() => {
    if (!filteredServidores.length) return null;
    return filteredServidores.find((item) => item.cpf === selectedCpf) || filteredServidores[0] || null;
  }, [filteredServidores, selectedCpf]);

  const selectedDay = useMemo(() => {
    if (!selectedServidor || selectedDayNumber == null) return null;
    return selectedServidor.dias.find((item) => item.dia === selectedDayNumber) || null;
  }, [selectedServidor, selectedDayNumber]);

  const kpis = useMemo(() => calculateKpis(filteredServidores), [filteredServidores]);

  const handleFilterChange = useCallback(
    <K extends keyof FrequenciaFiltersState>(key: K, value: FrequenciaFiltersState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleResetFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      busca: '',
      categoria: '',
      setor: '',
      statusServidor: '',
    }));
  }, []);

  const handleSelectServidor = useCallback((cpf: string) => {
    setSelectedCpf(cpf);
    setSelectedDayNumber(1);
    setDrawerOpen(false);
  }, []);

  const handleSelectDay = useCallback((day: FrequenciaDayItem) => {
    setSelectedDayNumber(day.dia);
    setDrawerOpen(true);
  }, []);

  const handleExport = useCallback(
    async (formato: FrequenciaExportFormat) => {
      if (!selectedServidor) {
        setError('Selecione um servidor válido antes de exportar.');
        return;
      }

      setExporting(true);
      setError('');

      try {
        await baixarFrequenciaArquivo({
          ano: filters.ano,
          mes: filters.mes,
          formato,
          servidorCpf: selectedServidor.cpf,
          servidorId: selectedServidor.servidorId,
          categoria: selectedServidor.categoria,
          setor: selectedServidor.setor,
        });
      } catch (err) {
        setError(getFrequenciaServiceErrorMessage(err));
      } finally {
        setExporting(false);
      }
    },
    [filters.ano, filters.mes, selectedServidor],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.08),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_28%),#020617]">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-6 px-4 py-6 sm:px-6 xl:px-8">
        <FrequenciaHero mesLabel={mesLabel} totalServidores={filteredServidores.length} />

        <FrequenciaFilters
          filters={filters}
          categorias={categorias}
          setores={setores}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        <FrequenciaKpis data={kpis} />

        <FrequenciaActionBar
          disabled={loading || !selectedServidor}
          exporting={exporting}
          onRefresh={loadData}
          onExport={handleExport}
        />

        {error && (
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
              <div>
                <div className="font-semibold">Falha ao carregar ou processar a frequência</div>
                <div className="mt-1 text-rose-100/90">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <FrequenciaServerList
            servidores={filteredServidores}
            selectedCpf={selectedCpf}
            onSelect={handleSelectServidor}
            loading={loading}
          />

          <div className="space-y-6">
            {!loading && filteredServidores.length === 0 ? (
              <FrequenciaEmptyState />
            ) : (
              <>
                <FrequenciaMonthGrid
                  servidor={selectedServidor}
                  selectedDay={selectedDayNumber}
                  onSelectDay={handleSelectDay}
                  loading={loading}
                />
                <FrequenciaLegend />
              </>
            )}
          </div>
        </div>
      </div>

      <FrequenciaDayDrawer
        open={drawerOpen}
        servidor={selectedServidor}
        day={selectedDay}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
