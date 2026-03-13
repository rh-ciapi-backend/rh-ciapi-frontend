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
  baixarCsvLocalFrequencia,
  baixarFrequenciaArquivo,
  getFrequenciaServiceErrorMessage,
} from '../services/frequenciaService';

import type {
  FrequenciaActionKey,
  FrequenciaDayItem,
  FrequenciaDayStatus,
  FrequenciaFiltersState,
  FrequenciaKpisData,
  FrequenciaServidorItem,
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
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  return '';
}

function safeFind<T>(value: unknown, predicate: (item: T) => boolean): T | undefined {
  return asArray<T>(value).find(predicate);
}

function pickString(source: unknown, paths: string[], fallback = ''): string {
  const record = asRecord(source);

  for (const path of paths) {
    const keys = path.split('.');
    let current: unknown = record;

    for (const key of keys) {
      if (!current || typeof current !== 'object') {
        current = undefined;
        break;
      }
      current = (current as Record<string, unknown>)[key];
    }

    const text = asString(current);
    if (text) return text;
  }

  return fallback;
}

function pickNumber(source: unknown, paths: string[], fallback = 0): number {
  const record = asRecord(source);

  for (const path of paths) {
    const keys = path.split('.');
    let current: unknown = record;

    for (const key of keys) {
      if (!current || typeof current !== 'object') {
        current = undefined;
        break;
      }
      current = (current as Record<string, unknown>)[key];
    }

    const num = Number(current);
    if (Number.isFinite(num)) return num;
  }

  return fallback;
}

function pickArray(source: unknown, paths: string[]): unknown[] {
  const record = asRecord(source);

  for (const path of paths) {
    const keys = path.split('.');
    let current: unknown = record;

    for (const key of keys) {
      if (!current || typeof current !== 'object') {
        current = undefined;
        break;
      }
      current = (current as Record<string, unknown>)[key];
    }

    if (Array.isArray(current)) return current;
  }

  return [];
}

function normalizeCpf(value: string): string {
  return value.replace(/\D+/g, '');
}

function normalizeServerStatus(value: string): string {
  const text = value.trim().toUpperCase();
  return text || 'ATIVO';
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getWeekdayLabel(year: number, month: number, day: number): string {
  return new Date(year, month - 1, day)
    .toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '')
    .toUpperCase();
}

function createFallbackDay(year: number, month: number, day: number): FrequenciaDayItem {
  const date = new Date(year, month - 1, day);
  const weekDay = date.getDay();
  const isWeekend = weekDay === 0 || weekDay === 6;
  const rubrica = weekDay === 0 ? 'DOMINGO' : weekDay === 6 ? 'SÁBADO' : '';

  return {
    dia: day,
    dataIso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    weekdayLabel: getWeekdayLabel(year, month, day),
    isWeekend,
    status: isWeekend ? 'fim_de_semana' : 'sem_registro',
    rubrica,
    referencia: '',
    ocorrenciaManha: '',
    ocorrenciaTarde: '',
    titulo: isWeekend ? rubrica : 'Sem registro',
    descricao: isWeekend ? `Dia ${rubrica.toLowerCase()}.` : 'Nenhum lançamento informado para este dia.',
    badges: rubrica ? [rubrica] : [],
    avisos: [],
    raw: null,
  };
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
  const haystack = normalizeSearchText(
    [rubrica, ocorrenciaManha, ocorrenciaTarde, titulo, descricao].join(' '),
  );

  if (haystack.includes('férias') || haystack.includes('ferias')) return 'ferias';
  if (haystack.includes('atestado')) return 'atestado';
  if (haystack.includes('falta')) return 'falta';
  if (haystack.includes('feriado')) return 'feriado';
  if (haystack.includes('ponto facultativo')) return 'ponto_facultativo';
  if (haystack.includes('anivers')) return 'aniversario';
  if (haystack.includes('evento')) return 'evento';
  if (isWeekend) return 'fim_de_semana';
  if (
    haystack.includes('presente') ||
    haystack.includes('expediente') ||
    haystack.includes('normal')
  ) {
    return 'presente';
  }
  if (haystack) return 'pendente';

  return 'sem_registro';
}

function normalizeDayItem(
  raw: unknown,
  year: number,
  month: number,
  fallbackDay: number,
): FrequenciaDayItem {
  const dayNumber = pickNumber(raw, ['dia', 'day', 'numero', 'date', 'data_numero'], fallbackDay);
  const total = getDaysInMonth(year, month);
  const safeDay = Math.min(Math.max(dayNumber, 1), total);

  const base = createFallbackDay(year, month, safeDay);

  const rubrica = pickString(
    raw,
    ['rubrica', 'statusLabel', 'observacao', 'observação', 'descricaoRubrica', 'rubrica_servidor'],
    base.rubrica,
  );
  const referencia = pickString(raw, ['referencia', 'referência', 'codigo', 'code'], '');
  const ocorrenciaManha = pickString(raw, ['ocorrenciaManha', 'manha', 'o1', 'o1Label', 'turno1'], '');
  const ocorrenciaTarde = pickString(raw, ['ocorrenciaTarde', 'tarde', 'o2', 'o2Label', 'turno2'], '');
  const titulo = pickString(raw, ['titulo', 'title', 'finalStatus', 'status', 'label'], '');
  const descricao = pickString(raw, ['descricao', 'description', 'detalhes', 'observacao', 'observação'], '');

  const badges = asArray<string>(asRecord(raw).badges).map(asString).filter(Boolean);
  const avisos = asArray<string>(asRecord(raw).avisos).map(asString).filter(Boolean);

  const explicitStatus = pickString(raw, ['status', 'statusKey', 'tipo'], '').toLowerCase();
  const allowedStatuses: FrequenciaDayStatus[] = [
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
  ];

  const status = allowedStatuses.includes(explicitStatus as FrequenciaDayStatus)
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
    badges: badges.length ? badges : base.badges,
    avisos,
    raw,
  };
}

function fillMissingDays(days: FrequenciaDayItem[], year: number, month: number): FrequenciaDayItem[] {
  const total = getDaysInMonth(year, month);
  const map = new Map<number, FrequenciaDayItem>();

  for (const item of asArray<FrequenciaDayItem>(days)) {
    if (!map.has(item.dia)) map.set(item.dia, item);
  }

  const result: FrequenciaDayItem[] = [];
  for (let day = 1; day <= total; day += 1) {
    result.push(map.get(day) || createFallbackDay(year, month, day));
  }

  return result;
}

function calculateResumo(days: FrequenciaDayItem[]) {
  return asArray<FrequenciaDayItem>(days).reduce(
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

  const nome = pickString(
    raw,
    ['nome', 'servidor.nome', 'employee.nome', 'nomeCompleto', 'servidorNome'],
    'Servidor sem nome',
  );
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
    asArray(rawDays).map((day, idx) => normalizeDayItem(day, year, month, idx + 1)),
    year,
    month,
  );

  const warnings = asArray<string>(asRecord(raw).warnings).map(asString).filter(Boolean);

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
    dias: asArray<FrequenciaDayItem>(normalizedDays),
    warnings,
    raw,
  };
}

function calculateKpis(servidores: FrequenciaServidorItem[]): FrequenciaKpisData {
  return asArray<FrequenciaServidorItem>(servidores).reduce(
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
  const [infoMessage, setInfoMessage] = useState<string>('');
  const [selectedCpf, setSelectedCpf] = useState<string>('');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const mesLabel = `${MONTH_LABELS[filters.mes - 1] || 'Mês'} de ${filters.ano}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const payload = await frequenciaService.listarPorMes(filters.ano, filters.mes);
      setRawItems(asArray(payload));
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
    return asArray(rawItems).map((item, index) => normalizeServidor(item, filters.ano, filters.mes, index));
  }, [rawItems, filters.ano, filters.mes]);

  const categorias = useMemo(() => {
    return Array.from(
      new Set(asArray(normalizedServidores).map((item) => item.categoria).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [normalizedServidores]);

  const setores = useMemo(() => {
    return Array.from(
      new Set(asArray(normalizedServidores).map((item) => item.setor).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [normalizedServidores]);

  const filteredServidores = useMemo(() => {
    const search = normalizeSearchText(filters.busca);

    return asArray(normalizedServidores).filter((item) => {
      const matchesSearch =
        !search ||
        [item.nome, item.cpf, item.matricula, item.cargo, item.categoria, item.setor]
          .map(normalizeSearchText)
          .some((value) => value.includes(search));

      const matchesCategoria = !filters.categoria || item.categoria === filters.categoria;
      const matchesSetor = !filters.setor || item.setor === filters.setor;
      const matchesStatus = !filters.statusServidor || item.statusServidor === filters.statusServidor;

      return matchesSearch && matchesCategoria && matchesSetor && matchesStatus;
    });
  }, [normalizedServidores, filters]);

  useEffect(() => {
    const servidores = asArray<FrequenciaServidorItem>(filteredServidores);

    if (!servidores.length) {
      setSelectedCpf('');
      setSelectedDayNumber(null);
      setDrawerOpen(false);
      return;
    }

    const exists = servidores.some((item) => item.cpf === selectedCpf);

    if (!exists) {
      const preferred =
        safeFind<FrequenciaServidorItem>(servidores, (item) => item.statusServidor === 'ATIVO') ||
        servidores[0] ||
        null;

      const preferredDias = asArray<FrequenciaDayItem>(preferred?.dias);

      const firstUsefulDay =
        preferredDias.find((day) => !day.isWeekend && day.status !== 'sem_registro') ||
        preferredDias.find((day) => !day.isWeekend) ||
        preferredDias[0] ||
        null;

      setSelectedCpf(preferred?.cpf || '');
      setSelectedDayNumber(firstUsefulDay?.dia ?? 1);
    }
  }, [filteredServidores, selectedCpf]);

  const selectedServidor = useMemo(() => {
    const servidores = asArray<FrequenciaServidorItem>(filteredServidores);
    if (!servidores.length) return null;
    return safeFind<FrequenciaServidorItem>(servidores, (item) => item.cpf === selectedCpf) || servidores[0] || null;
  }, [filteredServidores, selectedCpf]);

  const selectedDay = useMemo(() => {
    if (!selectedServidor || selectedDayNumber == null) return null;
    const dias = asArray<FrequenciaDayItem>(selectedServidor.dias);
    return dias.find((item) => item.dia === selectedDayNumber) || null;
  }, [selectedServidor, selectedDayNumber]);

  const kpis = useMemo(() => calculateKpis(asArray(filteredServidores)), [filteredServidores]);

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

  const handleSelectServidor = useCallback(
    (cpf: string) => {
      setSelectedCpf(cpf);

      const servidor =
        safeFind<FrequenciaServidorItem>(filteredServidores, (item) => item.cpf === cpf) || null;

      const dias = asArray<FrequenciaDayItem>(servidor?.dias);

      const firstUsefulDay =
        dias.find((day) => !day.isWeekend && day.status !== 'sem_registro') ||
        dias.find((day) => !day.isWeekend) ||
        dias[0] ||
        null;

      setSelectedDayNumber(firstUsefulDay?.dia ?? 1);
      setDrawerOpen(false);
    },
    [filteredServidores],
  );

  const handleSelectDay = useCallback((day: FrequenciaDayItem) => {
    setSelectedDayNumber(day.dia);
    setDrawerOpen(true);
  }, []);

  const handleAction = useCallback(
    async (action: FrequenciaActionKey) => {
      setError('');
      setInfoMessage('');

      if (!selectedServidor && action !== 'importar') {
        setError('Selecione um servidor válido para continuar.');
        return;
      }

      try {
        switch (action) {
          case 'export-csv':
            if (selectedServidor) {
              baixarCsvLocalFrequencia(selectedServidor, filters.ano, filters.mes);
              setInfoMessage('CSV gerado localmente com sucesso.');
            }
            break;

          case 'export-docx':
            if (selectedServidor) {
              setExporting(true);
              await baixarFrequenciaArquivo({
                ano: filters.ano,
                mes: filters.mes,
                formato: 'docx',
                servidorCpf: selectedServidor.cpf,
                servidorId: selectedServidor.servidorId,
                categoria: selectedServidor.categoria,
                setor: selectedServidor.setor,
              });
              setInfoMessage('Solicitação de exportação DOCX enviada com sucesso.');
            }
            break;

          case 'export-pdf':
            if (selectedServidor) {
              setExporting(true);
              await baixarFrequenciaArquivo({
                ano: filters.ano,
                mes: filters.mes,
                formato: 'pdf',
                servidorCpf: selectedServidor.cpf,
                servidorId: selectedServidor.servidorId,
                categoria: selectedServidor.categoria,
                setor: selectedServidor.setor,
              });
              setInfoMessage('Solicitação de exportação PDF enviada com sucesso.');
            }
            break;

          case 'previa':
            if (selectedDay) {
              setDrawerOpen(true);
              setInfoMessage('Prévia do dia selecionado aberta no painel lateral.');
            } else {
              setInfoMessage('Nenhum dia disponível para pré-visualização.');
            }
            break;

          case 'importar':
            await loadData();
            setInfoMessage('Dados do mês recarregados com sucesso.');
            break;

          case 'lancar':
          case 'editar':
          case 'replicar':
          case 'limpar':
            setInfoMessage(
              'Ação preparada na interface. A integração operacional será ligada no próximo passo sem quebrar a página.',
            );
            break;

          default:
            break;
        }
      } catch (err) {
        setError(getFrequenciaServiceErrorMessage(err));
      } finally {
        setExporting(false);
      }
    },
    [selectedServidor, selectedDay, filters.ano, filters.mes, loadData],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.08),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_28%),#020617]">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-6 px-4 py-6 sm:px-6 xl:px-8">
        <FrequenciaHero mesLabel={mesLabel} totalServidores={asArray(filteredServidores).length} />

        <FrequenciaFilters
          filters={filters}
          categorias={asArray(categorias)}
          setores={asArray(setores)}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        <FrequenciaKpis data={kpis} />

        <FrequenciaActionBar
          disabled={loading || (!selectedServidor && asArray(filteredServidores).length === 0)}
          exporting={exporting}
          onRefresh={loadData}
          onAction={handleAction}
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

        {infoMessage && !error && (
          <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-4 text-sm text-cyan-100">
            {infoMessage}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <FrequenciaServerList
            servidores={asArray(filteredServidores)}
            selectedCpf={selectedCpf}
            onSelect={handleSelectServidor}
            loading={loading}
          />

          <div className="space-y-6">
            {!loading && asArray(filteredServidores).length === 0 ? (
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
