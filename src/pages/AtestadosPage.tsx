import React, { useMemo, useState } from 'react';
import {
  Search,
  FilePlus2,
  Download,
  RefreshCw,
  FileText,
  Users,
  CalendarDays,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Filter,
  BriefcaseMedical,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';

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
  dataInicio: string;
  dataFim: string;
  diasAfastado: number;
  criadoEm: string;
  observacao?: string;
}

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
    dataInicio: '2026-03-01',
    dataFim: '2026-03-03',
    diasAfastado: 3,
    criadoEm: '2026-03-01',
    observacao: 'Atestado médico apresentado dentro do prazo.',
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
    dataInicio: '2026-03-05',
    dataFim: '2026-03-07',
    diasAfastado: 3,
    criadoEm: '2026-03-05',
    observacao: 'Aguardando validação do setor responsável.',
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
    dataInicio: '2026-02-20',
    dataFim: '2026-02-20',
    diasAfastado: 1,
    criadoEm: '2026-02-20',
    observacao: 'Comparecimento confirmado.',
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
    dataInicio: '2026-03-06',
    dataFim: '2026-03-10',
    diasAfastado: 5,
    criadoEm: '2026-03-06',
    observacao: 'Documento em análise.',
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
    dataInicio: '2026-01-14',
    dataFim: '2026-01-14',
    diasAfastado: 1,
    criadoEm: '2026-01-14',
    observacao: 'Acompanhamento familiar autorizado.',
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
    dataInicio: '2026-02-11',
    dataFim: '2026-02-12',
    diasAfastado: 2,
    criadoEm: '2026-02-11',
    observacao: 'Documento inconsistente para validação.',
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
    'DATA INICIO',
    'DATA FIM',
    'DIAS AFASTADO',
    'CRIADO EM',
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
        item.dataInicio,
        item.dataFim,
        item.diasAfastado,
        item.criadoEm,
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

const AtestadosPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('TODOS');
  const [selectedYear, setSelectedYear] = useState<string>('TODOS');
  const [selectedSetor, setSelectedSetor] = useState<string>('TODOS');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<'TODOS' | StatusAtestado>('TODOS');
  const [selectedTipo, setSelectedTipo] = useState<'TODOS' | TipoAtestado>('TODOS');
  const [refreshKey, setRefreshKey] = useState(0);

  const data = useMemo(() => {
    return [...MOCK_ATESTADOS].sort((a, b) => a.nomeServidor.localeCompare(b.nomeServidor, 'pt-BR'));
  }, [refreshKey]);

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
    const servidoresAfastados = new Set(filteredData.map((item) => item.cpf)).size;
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

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleNewAtestado = () => {
    window.alert('Estrutura base criada. O modal/formulário de cadastro será implementado na próxima parte.');
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
              onClick={handleNewAtestado}
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
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Busca
            </span>
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
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Mês
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Ano
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
            >
              {yearOptions.map((option) => (
                <option key={option} value={option} className="bg-slate-900 text-white">
                  {option === 'TODOS' ? 'Todos os anos' : option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Setor
            </span>
            <select
              value={selectedSetor}
              onChange={(e) => setSelectedSetor(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
            >
              {setorOptions.map((option) => (
                <option key={option} value={option} className="bg-slate-900 text-white">
                  {option === 'TODOS' ? 'Todos os setores' : option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Categoria
            </span>
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
            >
              {categoriaOptions.map((option) => (
                <option key={option} value={option} className="bg-slate-900 text-white">
                  {option === 'TODOS' ? 'Todas as categorias' : option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Status
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'TODOS' | StatusAtestado)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-slate-900 text-white">
                  {option === 'TODOS' ? 'Todos os status' : option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Tipo
            </span>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value as 'TODOS' | TipoAtestado)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
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
            Base mockada segura
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
                  <td colSpan={9} className="px-5 py-14 text-center text-sm text-zinc-400">
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
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default AtestadosPage;
