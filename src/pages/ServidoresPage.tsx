import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { servidoresService } from '../services/servidoresService';
import { API_BASE_URL } from '../config/api';
import { CATEGORIAS, SETORES, ESCOLARIDADE, VINCULOS } from '../data/servidores';
import { Servidor, Categoria, StatusServidor, Sexo } from '../types';

const FALLBACK_SEXO = 'NÃO INFORMADO';
const FALLBACK_SETOR = 'NÃO INFORMADO';
const FALLBACK_CATEGORIA = 'NÃO INFORMADO';
const FALLBACK_STATUS = 'ATIVO';

const asString = (value: unknown, fallback = ''): string => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const normalizeText = (value: unknown): string =>
  asString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const getEmployeeName = (emp: Partial<Servidor>) =>
  asString(emp.nomeCompleto || emp.nome, 'NOME NÃO INFORMADO');

const getEmployeeMatricula = (emp: Partial<Servidor>) =>
  asString(emp.matricula);

const getEmployeeCategoria = (emp: Partial<Servidor>) =>
  asString(emp.categoria, FALLBACK_CATEGORIA);

const getEmployeeSetor = (emp: Partial<Servidor>) =>
  asString(emp.setor, FALLBACK_SETOR);

const getEmployeeStatus = (emp: Partial<Servidor>) =>
  asString(emp.status, FALLBACK_STATUS);

const getEmployeeSexo = (emp: Partial<Servidor>) =>
  asString(emp.sexo, FALLBACK_SEXO);

const uniqueSorted = (values: string[]) =>
  [...new Set(values.map(v => asString(v)).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  );

const formatDate = (value: string | null | undefined, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString(
    'pt-BR',
    options || {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
  );
};

const displayValue = (value: unknown, fallback = '-') => {
  const safe = asString(value);
  return safe || fallback;
};

const formatCsvDate = (value: string | null | undefined) => {
  if (!value) return '';

  const trimmed = asString(value);
  if (!trimmed) return '';

  const isoDateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;

  return parsed.toLocaleDateString('pt-BR');
};

const escapeCsvValue = (value: unknown) => {
  const safe = value === null || value === undefined ? '' : String(value);
  return `"${safe.replace(/"/g, '""')}"`;
};

const downloadCsvFile = (filename: string, content: string) => {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || '?';

const formatSexoLabel = (sexo: string) => {
  if (sexo === 'M') return 'MASCULINO';
  if (sexo === 'F') return 'FEMININO';
  if (sexo === 'OUTRO') return 'OUTRO';
  return sexo || '-';
};

const getStatusBadge = (status: StatusServidor | string) => {
  const safeStatus = asString(status, FALLBACK_STATUS) as StatusServidor;
  const colors =
    safeStatus === 'ATIVO'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${colors}`}>
      {safeStatus}
    </span>
  );
};

const DetailItem = ({
  label,
  value,
  mono = false,
  children
}: {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
  children?: React.ReactNode;
}) => (
  <div className="rounded-xl border border-border-dark bg-slate-800/40 p-4">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
      {label}
    </p>
    <div className={mono ? 'text-sm text-white font-mono break-words' : 'text-sm text-white break-words'}>
      {children || value || '-'}
    </div>
  </div>
);

type PendingEmployeePayload = {
  nome: string;
  nomeCompleto: string;
  matricula: string;
  cpf: string;
  dataNascimento: string | null;
  sexo: Sexo | '';
  rgNumero: string;
  rgOrgaoEmissor: string;
  rgUf: string;
  email: string;
  escolaridade: string;
  profissao: string;
  vinculo: string;
  funcao: string;
  cargaHoraria: string;
  inicioExercicio: string | null;
  categoria: Categoria | '';
  setor: string;
  cargo: string;
  telefone: string;
  lotacaoInterna: string;
  turno: string;
  status: StatusServidor;
  observacao: string;
  aniversario: string | null;
};

export const ServidoresPage = ({
  initialAction,
  onActionHandled
}: {
  initialAction?: string | null;
  onActionHandled?: () => void;
}) => {
  const [employees, setEmployees] = useState<Servidor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSetor, setFilterSetor] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSexo, setFilterSexo] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Servidor | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Servidor | null>(null);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [pendingEmployeeData, setPendingEmployeeData] = useState<PendingEmployeePayload | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadTimeout, setLoadTimeout] = useState(false);

  useEffect(() => {
    if (initialAction === 'add') {
      handleAddEmployee();
      if (onActionHandled) onActionHandled();
    }
  }, [initialAction, onActionHandled]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setLoadTimeout(false);

      console.log(`[Servidores] Fetching /api/servidores using BASE_URL: ${API_BASE_URL}`);

      const resp = await servidoresService.listar();

      const lista = Array.isArray(resp)
        ? resp
        : Array.isArray((resp as any)?.data)
          ? (resp as any).data
          : [];

      console.log(`[Servidores] Sucesso: ${lista.length} registros carregados.`);
      setEmployees(Array.isArray(lista) ? lista : []);
    } catch (err: any) {
      const isTimeout = err?.message?.includes('Tempo limite') || err?.name === 'AbortError';
      console.error('[Servidores] Erro no carregamento:', err?.message || err);

      if (isTimeout) {
        setLoadTimeout(true);
        setError('Tempo limite de carregamento excedido. Verifique sua conexão.');
      } else {
        setError('Falha ao carregar servidores. Verifique a conexão com o servidor.');
      }

      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const filterOptions = useMemo(() => {
    const categorias = uniqueSorted(employees.map(emp => getEmployeeCategoria(emp)));
    const setores = uniqueSorted(employees.map(emp => getEmployeeSetor(emp)));
    const status = uniqueSorted(employees.map(emp => getEmployeeStatus(emp)));
    const sexo = uniqueSorted(employees.map(emp => getEmployeeSexo(emp)));

    return {
      categorias,
      setores,
      status,
      sexo
    };
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const search = normalizeText(debouncedSearchTerm);

    return employees.filter((emp) => {
      const nome = normalizeText(getEmployeeName(emp));
      const matricula = normalizeText(getEmployeeMatricula(emp));
      const categoria = getEmployeeCategoria(emp);
      const setor = getEmployeeSetor(emp);
      const status = getEmployeeStatus(emp);
      const sexo = getEmployeeSexo(emp);

      const matchesSearch =
        !search ||
        nome.includes(search) ||
        matricula.includes(search);

      const matchesCategory =
        !filterCategory || categoria === filterCategory;

      const matchesSetor =
        !filterSetor || setor === filterSetor;

      const matchesStatus =
        !filterStatus || status === filterStatus;

      const matchesSexo =
        !filterSexo || sexo === filterSexo;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSetor &&
        matchesStatus &&
        matchesSexo
      );
    });
  }, [
    employees,
    debouncedSearchTerm,
    filterCategory,
    filterSetor,
    filterStatus,
    filterSexo
  ]);

  const handleExportCsv = useCallback(() => {
    const rows = Array.isArray(filteredEmployees) ? filteredEmployees : [];

    const headers = [
      'Nome Completo',
      'Matrícula',
      'Data de Nascimento',
      'Sexo',
      'CPF',
      'RG Número',
      'RG Órgão Emissor',
      'RG UF',
      'Email',
      'Escolaridade',
      'Profissão',
      'Vínculo',
      'Função',
      'Carga Horária',
      'Início Exercício',
      'Categoria',
      'Setor',
      'Cargo',
      'Telefone',
      'Lotação Interna',
      'Turno',
      'Status',
      'Observação'
    ];

    const csvRows = rows.map((emp) => [
      asString(emp.nomeCompleto || emp.nome),
      asString(emp.matricula),
      formatCsvDate(emp.dataNascimento),
      asString(emp.sexo),
      asString(emp.cpf),
      asString(emp.rgNumero),
      asString(emp.rgOrgaoEmissor),
      asString(emp.rgUf),
      asString(emp.email),
      asString(emp.escolaridade),
      asString(emp.profissao),
      asString(emp.vinculo),
      asString(emp.funcao),
      asString(emp.cargaHoraria),
      formatCsvDate(emp.inicioExercicio),
      asString(emp.categoria),
      asString(emp.setor),
      asString(emp.cargo),
      asString(emp.telefone),
      asString(emp.lotacaoInterna),
      asString(emp.turno),
      asString(emp.status),
      asString(emp.observacao)
    ]);

    const csvContent = [headers, ...csvRows]
      .map((row) => row.map(escapeCsvValue).join(';'))
      .join('\r\n');

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    downloadCsvFile(`servidores_${yyyy}-${mm}-${dd}.csv`, csvContent);
  }, [filteredEmployees]);

  const resetConfirmSaveState = () => {
    setIsConfirmSaveOpen(false);
    setPendingEmployeeData(null);
    setIsSaving(false);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedEmployee(null);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    resetConfirmSaveState();
  };

  const closeConfirmSaveModal = () => {
    if (isSaving) return;
    setIsConfirmSaveOpen(false);
    setPendingEmployeeData(null);
  };

  const resetAllModalStates = () => {
    closeDetailsModal();
    closeEditModal();
  };

  const handleOpenDetails = (emp: Servidor) => {
    setSelectedEmployee(emp);
    setIsDetailsModalOpen(true);
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
    resetConfirmSaveState();
  };

  const handleEditEmployee = (emp: Servidor) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
    resetConfirmSaveState();
  };

  const handleEditFromDetails = () => {
    if (!selectedEmployee) return;
    setEditingEmployee(selectedEmployee);
    setIsDetailsModalOpen(false);
    setIsModalOpen(true);
    resetConfirmSaveState();
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este servidor?')) return;
    try {
      setIsLoading(true);
      await servidoresService.excluir(id);
      setSuccessMessage('Servidor excluído com sucesso!');
      if (selectedEmployee?.id === id) {
        closeDetailsModal();
      }
      await fetchEmployees();
    } catch (err: any) {
      setError(err?.message || 'Erro ao excluir servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFromDetails = async () => {
    if (!selectedEmployee) return;
    await handleDeleteEmployee(selectedEmployee.id);
  };

  const buildPayloadFromForm = (formData: FormData): PendingEmployeePayload => ({
    nome: asString(formData.get('nomeCompleto')),
    nomeCompleto: asString(formData.get('nomeCompleto')),
    matricula: asString(formData.get('matricula')),
    cpf: asString(formData.get('cpf')),
    dataNascimento: asString(formData.get('dataNascimento')) || null,
    sexo: (asString(formData.get('sexo')) as Sexo | '') || '',
    rgNumero: asString(formData.get('rgNumero')),
    rgOrgaoEmissor: asString(formData.get('rgOrgaoEmissor')),
    rgUf: asString(formData.get('rgUf')),
    email: asString(formData.get('email')),
    escolaridade: asString(formData.get('escolaridade')),
    profissao: asString(formData.get('profissao')),
    vinculo: asString(formData.get('vinculo')),
    funcao: asString(formData.get('funcao')),
    cargaHoraria: asString(formData.get('cargaHoraria')),
    inicioExercicio: asString(formData.get('inicioExercicio')) || null,
    categoria: (asString(formData.get('categoria')) as Categoria | '') || '',
    setor: asString(formData.get('setor')),
    cargo: asString(formData.get('cargo')),
    telefone: asString(formData.get('telefone')),
    lotacaoInterna: asString(formData.get('lotacaoInterna')),
    turno: asString(formData.get('turno')),
    status: (asString(formData.get('status'), 'ATIVO') as StatusServidor) || 'ATIVO',
    observacao: asString(formData.get('observacao')),
    aniversario: asString(formData.get('aniversario')) || null,
  });

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const dados = buildPayloadFromForm(formData);

    if (!dados.matricula) {
      setError('A matrícula é obrigatória.');
      return;
    }

    if (!dados.cpf) {
      setError('O CPF é obrigatório.');
      return;
    }

    setError(null);
    setPendingEmployeeData(dados);
    setIsConfirmSaveOpen(true);
  };

  const confirmSaveEmployee = async () => {
    if (!pendingEmployeeData || isSaving) return;

    try {
      setIsSaving(true);
      setIsLoading(true);

      if (editingEmployee) {
        await servidoresService.editar(editingEmployee.id, pendingEmployeeData);
        setSuccessMessage('Servidor atualizado com sucesso!');
      } else {
        await servidoresService.adicionar(pendingEmployeeData);
        setSuccessMessage('Servidor cadastrado com sucesso!');
      }

      resetConfirmSaveState();
      setIsModalOpen(false);
      setEditingEmployee(null);
      await fetchEmployees();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar servidor.');
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  };

  const detailEmployee = selectedEmployee
    ? {
        ...selectedEmployee,
        nomeCompleto: getEmployeeName(selectedEmployee),
        matricula: getEmployeeMatricula(selectedEmployee),
        categoria: getEmployeeCategoria(selectedEmployee),
        setor: getEmployeeSetor(selectedEmployee),
        status: getEmployeeStatus(selectedEmployee),
        sexo: getEmployeeSexo(selectedEmployee)
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap">
          <button
            onClick={() => fetchEmployees()}
            className="p-2.5 bg-slate-800 border border-border-dark rounded-xl text-slate-400 hover:text-white transition-all"
            title="Recarregar lista"
          >
            <motion.div
              animate={isLoading ? { rotate: 360 } : {}}
              transition={isLoading ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
            >
              <MoreHorizontal size={18} />
            </motion.div>
          </button>

          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Nome ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card-dark border border-border-dark rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-card-dark border border-border-dark rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:ring-2 focus:ring-primary outline-none hidden lg:block"
          >
            <option value="">Todas Categorias</option>
            {filterOptions.categorias.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filterSetor}
            onChange={(e) => setFilterSetor(e.target.value)}
            className="bg-card-dark border border-border-dark rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:ring-2 focus:ring-primary outline-none hidden xl:block"
          >
            <option value="">Todos Setores</option>
            {filterOptions.setores.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-card-dark border border-border-dark rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:ring-2 focus:ring-primary outline-none hidden xl:block"
          >
            <option value="">Todos Status</option>
            {filterOptions.status.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={filterSexo}
            onChange={(e) => setFilterSexo(e.target.value)}
            className="bg-card-dark border border-border-dark rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:ring-2 focus:ring-primary outline-none hidden xl:block"
          >
            <option value="">Todos Sexos</option>
            {filterOptions.sexo.map((s) => (
              <option key={s} value={s}>
                {s === 'M' ? 'MASCULINO' : s === 'F' ? 'FEMININO' : s === 'OUTRO' ? 'OUTRO' : s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="bg-slate-800 hover:bg-slate-700 border border-border-dark text-slate-100 px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg transition-all w-full sm:w-auto justify-center"
            title="Exportar os servidores filtrados para CSV"
          >
            <Download size={18} />
            Exportar CSV
          </button>

          <button
            onClick={handleAddEmployee}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all w-full sm:w-auto justify-center"
          >
            <Plus size={18} />
            Novo Servidor
          </button>
        </div>
      </div>

      <AnimatePresence>
        {(error || loadTimeout) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-rose-400 text-sm"
          >
            <div className="flex items-center gap-3">
              <X size={18} className="cursor-pointer" onClick={() => { setError(null); setLoadTimeout(false); }} />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchEmployees()}
              className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs transition-all"
            >
              Tentar Novamente
            </button>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3 text-emerald-400 text-sm"
          >
            <UserPlus size={18} />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-xl relative min-h-[200px]">
        {isLoading && (
          <div className="absolute inset-0 bg-card-dark/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/40 border-b border-border-dark">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider min-w-[320px]">
                  Servidor
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-[120px]">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-dark">
              {filteredEmployees.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-slate-500">
                    Nenhum servidor encontrado com os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const safeName = getEmployeeName(emp);
                  const safeInitials = getInitials(safeName);
                  const safeMatricula = getEmployeeMatricula(emp);

                  return (
                    <tr
                      key={emp.id}
                      className="group transition-colors hover:bg-slate-800/25"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-700/80 flex items-center justify-center font-bold text-primary border border-primary/20 text-xs shrink-0 shadow-inner">
                            {safeInitials}
                          </div>

                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(emp)}
                              className="max-w-full text-left group/name rounded-lg outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary/60"
                              title={`Abrir detalhes de ${safeName}`}
                            >
                              <span className="block text-sm font-semibold text-white truncate transition-colors group-hover/name:text-primary">
                                {safeName}
                              </span>
                              <span className="mt-1 block text-[11px] text-slate-500 font-mono truncate">
                                {safeMatricula ? `Matrícula: ${safeMatricula}` : 'Matrícula não informada'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditEmployee(emp)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-800/30 border-t border-border-dark flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Mostrando {filteredEmployees.length} servidor(es)
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-500 hover:text-white disabled:opacity-50" disabled>
              <ChevronLeft size={20} />
            </button>
            <button className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg">1</button>
            <button className="p-2 text-slate-500 hover:text-white" disabled>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isDetailsModalOpen && detailEmployee && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDetailsModal}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 20 }}
              className="relative z-[61] w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl border border-border-dark bg-card-dark shadow-2xl"
            >
              <div className="border-b border-border-dark bg-slate-900/60 px-6 py-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shadow-inner shrink-0">
                      {getInitials(detailEmployee.nomeCompleto)}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">
                        Ficha do Servidor
                      </p>
                      <h2 className="text-2xl font-bold text-white truncate">
                        {detailEmployee.nomeCompleto}
                      </h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono border border-border-dark bg-slate-800 text-slate-300">
                          Matrícula: {displayValue(detailEmployee.matricula)}
                        </span>
                        {getStatusBadge(detailEmployee.status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-start">
                    <button
                      type="button"
                      onClick={handleEditFromDetails}
                      className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold transition-all shadow-lg shadow-primary/20"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteFromDetails}
                      className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-sm font-bold transition-all"
                    >
                      Excluir
                    </button>
                    <button
                      type="button"
                      onClick={closeDetailsModal}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                      title="Fechar"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="max-h-[calc(90vh-110px)] overflow-y-auto px-6 py-6 space-y-8">
                <section className="space-y-4">
                  <div className="border-b border-border-dark pb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                      Dados Pessoais
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <DetailItem label="Nome Completo" value={displayValue(detailEmployee.nomeCompleto)} />
                    <DetailItem label="Matrícula" value={displayValue(detailEmployee.matricula)} mono />
                    <DetailItem label="Sexo" value={formatSexoLabel(detailEmployee.sexo)} />
                    <DetailItem label="Data de Nascimento" value={formatDate(detailEmployee.dataNascimento)} />
                    <DetailItem
                      label="Aniversário"
                      value={formatDate(detailEmployee.aniversario, { day: '2-digit', month: '2-digit' })}
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="border-b border-border-dark pb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                      Documentação
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <DetailItem label="CPF" value={displayValue(detailEmployee.cpf)} mono />
                    <DetailItem label="RG Número" value={displayValue(detailEmployee.rgNumero)} />
                    <DetailItem label="Órgão Emissor" value={displayValue(detailEmployee.rgOrgaoEmissor)} />
                    <DetailItem label="UF do RG" value={displayValue(detailEmployee.rgUf)} />
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="border-b border-border-dark pb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                      Contato
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Telefone" value={displayValue(detailEmployee.telefone)} />
                    <DetailItem label="Email" value={displayValue(detailEmployee.email)} />
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="border-b border-border-dark pb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                      Dados Funcionais
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <DetailItem label="Categoria" value={displayValue(detailEmployee.categoria)} />
                    <DetailItem label="Setor" value={displayValue(detailEmployee.setor)} />
                    <DetailItem label="Cargo" value={displayValue(detailEmployee.cargo)} />
                    <DetailItem label="Função" value={displayValue(detailEmployee.funcao)} />
                    <DetailItem label="Vínculo" value={displayValue(detailEmployee.vinculo)} />
                    <DetailItem label="Profissão" value={displayValue(detailEmployee.profissao)} />
                    <DetailItem label="Escolaridade" value={displayValue(detailEmployee.escolaridade)} />
                    <DetailItem label="Carga Horária" value={displayValue(detailEmployee.cargaHoraria)} />
                    <DetailItem label="Início de Exercício" value={formatDate(detailEmployee.inicioExercicio)} />
                    <DetailItem label="Lotação Interna" value={displayValue(detailEmployee.lotacaoInterna)} />
                    <DetailItem label="Turno" value={displayValue(detailEmployee.turno)} />
                    <DetailItem label="Status">
                      {getStatusBadge(detailEmployee.status)}
                    </DetailItem>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="border-b border-border-dark pb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                      Observações
                    </h3>
                  </div>
                  <DetailItem label="Observação" value={displayValue(detailEmployee.observacao)} />
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isConfirmSaveOpen) closeEditModal();
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-[71] bg-card-dark border border-border-dark rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-dark flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  {editingEmployee ? 'Editar Servidor' : 'Novo Servidor'}
                </h2>
                <button
                  onClick={() => closeEditModal()}
                  className="text-slate-500 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 max-h-[75vh] overflow-y-auto scrollbar-hide">
                <form id="servidor-form" onSubmit={handleSave} className="space-y-8">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border-dark pb-2">
                      <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Dados Pessoais</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nome Completo</label>
                        <input
                          name="nomeCompleto"
                          type="text"
                          defaultValue={editingEmployee?.nomeCompleto || ''}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Data de Nascimento</label>
                        <input
                          name="dataNascimento"
                          type="date"
                          defaultValue={editingEmployee?.dataNascimento || ''}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Sexo</label>
                        <select
                          name="sexo"
                          defaultValue={editingEmployee?.sexo || 'M'}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="M">MASCULINO</option>
                          <option value="F">FEMININO</option>
                          <option value="OUTRO">OUTRO</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Aniversário</label>
                        <input
                          name="aniversario"
                          type="date"
                          defaultValue={editingEmployee?.aniversario || ''}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border-dark pb-2">
                      <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Documentação</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">CPF *</label>
                        <input
                          name="cpf"
                          type="text"
                          defaultValue={editingEmployee?.cpf || ''}
                          required
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">RG Número</label>
                        <input
                          name="rgNumero"
                          type="text"
                          defaultValue={editingEmployee?.rgNumero || ''}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Órgão Emissor</label>
                        <input
                          name="rgOrgaoEmissor"
                          type="text"
                          defaultValue={editingEmployee?.rgOrgaoEmissor || ''}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">UF RG</label>
                        <input
                          name="rgUf"
                          type="text"
                          defaultValue={editingEmployee?.rgUf || ''}
                          maxLength={2}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border-dark pb-2">
                      <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Contato</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Telefone</label>
                        <input
                          name="telefone"
                          type="text"
                          defaultValue={editingEmployee?.telefone || ''}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Email</label>
                        <input
                          name="email"
                          type="email"
                          defaultValue={editingEmployee?.email || ''}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border-dark pb-2">
                      <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Dados Funcionais</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Matrícula *</label>
                        <input
                          name="matricula"
                          type="text"
                          defaultValue={editingEmployee?.matricula || ''}
                          required
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Categoria</label>
                        <select
                          name="categoria"
                          defaultValue={editingEmployee?.categoria || CATEGORIAS[0]}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        >
                          {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Setor</label>
                        <select
                          name="setor"
                          defaultValue={editingEmployee?.setor || SETORES[0]}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        >
                          {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Cargo</label>
                        <input
                          name="cargo"
                          type="text"
                          defaultValue={editingEmployee?.cargo || ''}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Função</label>
                        <input
                          name="funcao"
                          type="text"
                          defaultValue={editingEmployee?.funcao || ''}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Vínculo</label>
                        <select
                          name="vinculo"
                          defaultValue={editingEmployee?.vinculo || ''}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Selecione</option>
                          {VINCULOS.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Profissão</label>
                        <input
                          name="profissao"
                          type="text"
                          defaultValue={editingEmployee?.profissao || ''}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Escolaridade</label>
                        <select
                          name="escolaridade"
                          defaultValue={editingEmployee?.escolaridade || ''}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Selecione</option>
                          {ESCOLARIDADE.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Lotação Interna</label>
                        <input
                          name="lotacaoInterna"
                          type="text"
                          defaultValue={editingEmployee?.lotacaoInterna || ''}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Carga Horária</label>
                        <input
                          name="cargaHoraria"
                          type="text"
                          defaultValue={editingEmployee?.cargaHoraria || ''}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Turno</label>
                        <input
                          name="turno"
                          type="text"
                          defaultValue={editingEmployee?.turno || ''}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Início Exercício</label>
                        <input
                          name="inicioExercicio"
                          type="date"
                          defaultValue={editingEmployee?.inicioExercicio || ''}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                        <select
                          name="status"
                          defaultValue={editingEmployee?.status || 'ATIVO'}
                          className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="ATIVO">ATIVO</option>
                          <option value="INATIVO">INATIVO</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border-dark pb-2">
                      <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Observações</h3>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Observação</label>
                      <textarea
                        name="observacao"
                        defaultValue={editingEmployee?.observacao || ''}
                        className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                      />
                    </div>
                  </section>
                </form>
              </div>

              <div className="p-6 border-t border-border-dark flex justify-end gap-3 bg-slate-800/20">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  form="servidor-form"
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all"
                >
                  {editingEmployee ? 'Salvar Alterações' : 'Cadastrar Servidor'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isConfirmSaveOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeConfirmSaveModal}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-[91] w-full max-w-md rounded-3xl border border-border-dark bg-card-dark shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-dark">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle size={22} className="text-amber-400" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white">
                      Confirmar alteração
                    </h3>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                      Deseja mesmo fazer essa alteração?
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 flex items-center justify-end gap-3 bg-slate-900/20">
                <button
                  type="button"
                  onClick={closeConfirmSaveModal}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  Não, cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmSaveEmployee}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Sim, salvar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
