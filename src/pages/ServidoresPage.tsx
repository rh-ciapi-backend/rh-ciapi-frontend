import './painel-pessoal-restaurado.css';
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
  Download,
  Link2, Camera, ImagePlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { servidoresService, type ServidorComVinculo } from '../services/servidoresService';
import { API_BASE_URL } from '../config/api';
import { HistoricoOcorrenciasServidor } from '../components/HistoricoOcorrenciasServidor';
import { CATEGORIAS, SETORES, ESCOLARIDADE, VINCULOS } from '../data/servidores';
import { Categoria, StatusServidor, Sexo } from '../types';
import './servidores-page-light.css';

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

const getEmployeeName = (emp: Partial<ServidorComVinculo>) =>
  asString(emp.nomeCompleto || emp.nome, 'NOME NÃO INFORMADO');

const getEmployeeMatricula = (emp: Partial<ServidorComVinculo>) =>
  asString(emp.matricula);

const getEmployeeCategoria = (emp: Partial<ServidorComVinculo>) =>
  asString(emp.categoria, FALLBACK_CATEGORIA);

const getEmployeeSetor = (emp: Partial<ServidorComVinculo>) =>
  asString(emp.setor, FALLBACK_SETOR);

const getEmployeeStatus = (emp: Partial<ServidorComVinculo>) =>
  asString(emp.status, FALLBACK_STATUS);

const getEmployeeSexo = (emp: Partial<ServidorComVinculo>) =>
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
  matriculaSegunda: string;
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
  const [employees, setEmployees] = useState<ServidorComVinculo[]>([]);
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [modoPainelPessoal, setModoPainelPessoal] = useState(initialAction === 'painel-pessoal');
  const [consultaSituacao, setConsultaSituacao] = useState<'TODOS' | 'ATIVO' | 'INATIVO'>(initialAction === 'inativos' ? 'INATIVO' : initialAction === 'ativos' ? 'ATIVO' : 'TODOS');
  const [searchResults, setSearchResults] = useState<ServidorComVinculo[]>([]);
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);
  const [photoNotice, setPhotoNotice] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState<string | null>(null);
  const [formPhotoNotice, setFormPhotoNotice] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSetor, setFilterSetor] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ATIVO');
  const [filterSexo, setFilterSexo] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<ServidorComVinculo | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<ServidorComVinculo | null>(null);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [pendingEmployeeData, setPendingEmployeeData] = useState<PendingEmployeePayload | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadTimeout, setLoadTimeout] = useState(false);

  useEffect(() => {
    if (!initialAction) return;
    if (initialAction === 'add') {
      handleAddEmployee();
      onActionHandled?.();
      return;
    }
    if (initialAction === 'painel-pessoal') {
      setModoPainelPessoal(true);
      setConsultaSituacao('TODOS');
      setSelectedEmployee(null);
      setHasSearched(false);
      setShowAll(true);
      setQuery('');
      return;
    }
    if (['ativos', 'inativos', 'pesquisar'].includes(initialAction)) {
      setModoPainelPessoal(false);
      setConsultaSituacao(initialAction === 'inativos' ? 'INATIVO' : initialAction === 'ativos' ? 'ATIVO' : 'TODOS');
      setSelectedEmployee(null);
      setQuery('');
      setSearchResults([]);
      setHasSearched(false);
      setShowAll(false);
      setLocalPhotoUrl(null);
    }
  }, [initialAction]);

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
      const matricula = normalizeText(`${getEmployeeMatricula(emp)} ${emp.matriculaSegunda || ''}`);
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

  const displayedEmployees = useMemo(() => {
    return [...filteredEmployees].sort((a, b) =>
      getEmployeeName(a).localeCompare(getEmployeeName(b), 'pt-BR', {
        sensitivity: 'base'
      })
    );
  }, [filteredEmployees]);

  const handleExportCsv = useCallback(() => {
    const rows = Array.isArray(displayedEmployees) ? displayedEmployees : [];

    const headers = [
      'Nome Completo',
      'Matrícula',
      'Segunda matrícula',
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
      asString(emp.matriculaSegunda),
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
  }, [displayedEmployees]);

  const resetConfirmSaveState = () => {
    setIsConfirmSaveOpen(false);
    setPendingEmployeeData(null);
    setIsSaving(false);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedEmployee(null);
    setLocalPhotoUrl(null);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    if (formPhotoUrl) URL.revokeObjectURL(formPhotoUrl);
    setFormPhotoUrl(null);
    setFormPhotoNotice('');
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

  const handleOpenDetails = (emp: ServidorComVinculo) => {
    setSelectedEmployee(emp);
    setIsDetailsModalOpen(false);
    setLocalPhotoUrl(null);
    setPhotoNotice('');
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setFormPhotoUrl(null);
    setFormPhotoNotice('');
    setIsModalOpen(true);
    resetConfirmSaveState();
  };

  const handleEditEmployee = (emp: ServidorComVinculo) => {
    setEditingEmployee(emp);
    setFormPhotoUrl(null);
    setFormPhotoNotice('');
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
    matriculaSegunda: asString(formData.get('matriculaSegunda')),
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

    if (dados.matriculaSegunda && dados.matriculaSegunda === dados.matricula) {
      setError('A segunda matrícula deve ser diferente da primeira.');
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
      if (formPhotoUrl) URL.revokeObjectURL(formPhotoUrl);
      setFormPhotoUrl(null);
      await fetchEmployees();
      setSelectedEmployee(null);
      setHasSearched(false);
      setSearchResults([]);
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar servidor.');
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  };

  const summary = useMemo(() => {
    const total = employees.length;
    const ativos = employees.filter(
      (emp) => getEmployeeStatus(emp).toUpperCase() === 'ATIVO'
    ).length;
    const inativos = employees.filter(
      (emp) => getEmployeeStatus(emp).toUpperCase() === 'INATIVO'
    ).length;
    const filtrados = displayedEmployees.length;

    return { total, ativos, inativos, filtrados };
  }, [employees, displayedEmployees]);

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

  void debouncedSearchTerm; void setDebouncedSearchTerm; void filterOptions; void setFilterCategory; void setFilterSetor; void setFilterStatus; void setFilterSexo; void summary; void handleExportCsv; void handleOpenDetails; void resetAllModalStates; void handleEditFromDetails; void handleDeleteFromDetails; void detailEmployee; void isDetailsModalOpen; void setIsDetailsModalOpen; void filteredEmployees; void ChevronRight; void MoreHorizontal; void Download; void Link2;

  const filtrarSituacao = useCallback((emp: ServidorComVinculo) =>
    consultaSituacao === 'TODOS' || getEmployeeStatus(emp).toUpperCase() === consultaSituacao,
  [consultaSituacao]);

  const visibleResults = useMemo(() => {
    const base = showAll ? employees.filter(filtrarSituacao) : searchResults.filter(filtrarSituacao);
    return [...base].sort((a, b) => getEmployeeName(a).localeCompare(getEmployeeName(b), 'pt-BR', { sensitivity: 'base' }));
  }, [showAll, employees, searchResults, filtrarSituacao]);

  const runSearch = (event?: React.FormEvent) => {
    event?.preventDefault();
    const term = normalizeText(query);
    setSelectedEmployee(null);
    setLocalPhotoUrl(null);
    setShowAll(false);
    if (!term) { setHasSearched(false); setSearchResults([]); return; }
    const matches = employees.filter((emp) => {
      const value = normalizeText(`${getEmployeeName(emp)} ${getEmployeeMatricula(emp)} ${emp.matriculaSegunda || ''} ${emp.cpf || ''}`);
      return filtrarSituacao(emp) && value.includes(term);
    });
    setSearchResults(matches);
    setHasSearched(true);
    if (matches.length === 1) handleOpenDetails(matches[0]);
  };

  const mostrarTodos = () => {
    setSelectedEmployee(null);
    setQuery('');
    setHasSearched(false);
    setSearchResults([]);
    setShowAll(true);
    setLocalPhotoUrl(null);
  };

  const profileValue = (emp: ServidorComVinculo | null, ...keys: string[]) => {
    if (!emp) return '';
    const data = emp as unknown as Record<string, unknown>;
    for (const key of keys) if (data[key]) return String(data[key]);
    return '';
  };

  const photoSrc = localPhotoUrl || profileValue(selectedEmployee, 'fotoUrl', 'foto_url', 'foto', 'avatarUrl', 'fotoPerfil');
  const field = (title: string, value: unknown) => (
    <div className="ciapi-servidores-field" key={title}>
      <span>{title}</span><strong>{displayValue(value)}</strong>
    </div>
  );
  const group = (title: string, content: React.ReactNode) => (
    <section className="ciapi-servidores-section" key={title}>
      <h3>{title}</h3><div className="ciapi-servidores-fields">{content}</div>
    </section>
  );

  return (
    <div className="ciapi-servidores-page">
      {!isModalOpen && modoPainelPessoal && <section className="ciapi-pessoal-summary" aria-label="Painel de Pessoal">
        <div className="ciapi-pessoal-heading"><div><span>CIAPI RH / GESTÃO DE PESSOAS</span><h2>Painel de Pessoal</h2><p>Visão consolidada dos servidores cadastrados.</p></div><button type="button" onClick={() => { setModoPainelPessoal(false); setShowAll(false); setHasSearched(false); }}>Voltar à consulta</button></div>
        <div className="ciapi-pessoal-stats">
          <div><small>Total de servidores</small><strong>{summary.total}</strong></div>
          <div><small>Servidores ativos</small><strong>{summary.ativos}</strong></div>
          <div><small>Servidores inativos</small><strong>{summary.inativos}</strong></div>
        </div>
      </section>}
      {!isModalOpen && !modoPainelPessoal && <section className="ciapi-servidores-search">
        <header><strong>{consultaSituacao === 'INATIVO' ? 'Consultar servidores inativos' : consultaSituacao === 'ATIVO' ? 'Consultar servidores ativos' : 'Consultar servidores'}</strong><span>{new Date().toLocaleDateString('pt-BR')}</span></header>
        <form onSubmit={runSearch}>
          <label htmlFor="ciapi-search-servidor">Buscar por nome, CPF ou matrícula</label>
          <div className="ciapi-servidores-search-row">
            <Search size={20} aria-hidden="true" />
            <input id="ciapi-search-servidor" value={query} onChange={event => setQuery(event.target.value)} placeholder="Digite nome, CPF, matrícula ou segundo vínculo" />
          </div>
          <p className="ciapi-servidores-hint">Escolha uma consulta individual ou mostre todos os servidores da situação selecionada.</p>
          <div className="ciapi-servidores-actions">
            <button className="ciapi-btn ciapi-btn-search" type="submit"><Search size={17}/> Consultar servidor individual</button>
            <button className="ciapi-btn ciapi-btn-muted" type="button" onClick={mostrarTodos}>Mostrar todos</button>
            <button className="ciapi-btn ciapi-btn-muted" type="button" onClick={() => {setQuery('');setHasSearched(false);setShowAll(false);setSearchResults([]);closeDetailsModal();}}>Limpar</button>
            <button className="ciapi-btn ciapi-btn-muted" type="button" onClick={handleAddEmployee}><Plus size={17}/> Novo servidor</button>
          </div>
        </form>
      </section>}

      {(error || successMessage) && <div className="ciapi-servidores-alert" role="status">{error || successMessage}{error && <button onClick={fetchEmployees}>Tentar novamente</button>}</div>}
      {isLoading && <p className="ciapi-servidores-loading">Carregando informações...</p>}

      {!isModalOpen && (hasSearched || showAll) && !selectedEmployee && !isLoading && (
        <section className="ciapi-servidores-results">
          <header><strong>{showAll ? 'Todos os servidores da situação selecionada' : 'Resultado da pesquisa'}</strong><span>{visibleResults.length} registro(s)</span></header>
          {!visibleResults.length ? <p className="ciapi-servidores-empty">Nenhum servidor encontrado. Confira os dados e tente novamente.</p> : (
            <div className="ciapi-servidores-matches">
              {visibleResults.map(emp => <button key={emp.id} type="button" onClick={() => handleOpenDetails(emp)}>
                <span className="ciapi-servidores-avatar-small">{getInitials(getEmployeeName(emp))}</span>
                <span><strong>{getEmployeeName(emp)}</strong><small>Matrícula {getEmployeeMatricula(emp)} · {getEmployeeCategoria(emp)}</small></span>
                <ChevronRight size={19}/>
              </button>)}
            </div>
          )}
        </section>
      )}

      {!isModalOpen && selectedEmployee && (
        <article className="ciapi-servidores-profile">
          <header className="ciapi-servidores-profile-top">
            <strong>Ficha do servidor</strong>
            <button className="ciapi-btn ciapi-btn-muted" type="button" onClick={() => {setSelectedEmployee(null);setLocalPhotoUrl(null);}}><ChevronLeft size={16}/> Voltar aos resultados</button>
          </header>
          <div className="ciapi-servidores-profile-body">
            <div className="ciapi-servidores-identity">
              <div className="ciapi-servidores-photo-wrap">
                {photoSrc ? <img className="ciapi-servidores-photo" src={photoSrc} alt={`Foto de ${getEmployeeName(selectedEmployee)}`} /> : <div className="ciapi-servidores-photo-placeholder"><Camera size={37}/><span>Sem fotografia</span></div>}
                <label className="ciapi-servidores-photo-picker"><ImagePlus size={17}/> Escolher foto
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => {
                    const file=event.target.files?.[0];
                    if (!file) return;
                    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>3*1024*1024) {setPhotoNotice('Use JPG, PNG ou WebP de até 3 MB.');return;}
                    if (localPhotoUrl) URL.revokeObjectURL(localPhotoUrl);
                    setLocalPhotoUrl(URL.createObjectURL(file));
                    setPhotoNotice('Pré-visualização local: esta foto ainda não foi gravada. A integração com o armazenamento precisa ser configurada.');
                  }}/>
                </label>
                {photoNotice && <p className="ciapi-servidores-photo-notice">{photoNotice}</p>}
              </div>
              <div className="ciapi-servidores-identity-details">
                <span className="ciapi-servidores-eyebrow">Cadastro institucional</span>
                <h2>{getEmployeeName(selectedEmployee)}</h2>
                <div className="ciapi-servidores-pills"><span>Matrícula: {getEmployeeMatricula(selectedEmployee)}</span>{selectedEmployee.matriculaSegunda && <span>2º vínculo: {selectedEmployee.matriculaSegunda}</span>}{getStatusBadge(getEmployeeStatus(selectedEmployee))}</div>
                <div className="ciapi-servidores-identity-buttons">
                  <button className="ciapi-btn ciapi-btn-primary" type="button" onClick={() => handleEditEmployee(selectedEmployee)}><Edit2 size={16}/> Editar cadastro</button>
                  <button className="ciapi-btn ciapi-btn-danger" type="button" onClick={() => handleDeleteEmployee(selectedEmployee.id)}><Trash2 size={16}/> Excluir</button>
                </div>
              </div>
            </div>
            <div className="ciapi-servidores-grid">
              {group('Dados pessoais', <>{field('Nome completo', getEmployeeName(selectedEmployee))}{field('Matrícula', selectedEmployee.matricula)}{field('Sexo',formatSexoLabel(getEmployeeSexo(selectedEmployee)))}{field('Nascimento',formatDate(selectedEmployee.dataNascimento))}{field('Aniversário',formatDate(selectedEmployee.aniversario,{day:'2-digit',month:'2-digit'}))}</>)}
              {group('Documentação', <>{field('CPF',selectedEmployee.cpf)}{field('RG',selectedEmployee.rgNumero)}{field('Órgão emissor',selectedEmployee.rgOrgaoEmissor)}{field('UF do RG',selectedEmployee.rgUf)}</>)}
              {group('Contato', <>{field('Telefone',selectedEmployee.telefone)}{field('E-mail',selectedEmployee.email)}</>)}
              {group('Dados funcionais', <>{field('Categoria',selectedEmployee.categoria)}{field('Setor',selectedEmployee.setor)}{field('Cargo',selectedEmployee.cargo)}{field('Função',selectedEmployee.funcao)}{field('Vínculo',selectedEmployee.vinculo)}{field('Carga horária',selectedEmployee.cargaHoraria)}{field('Lotação interna',selectedEmployee.lotacaoInterna)}{field('Turno',selectedEmployee.turno)}{field('Início do exercício',formatDate(selectedEmployee.inicioExercicio))}</>)}
              {group('Outras informações', <>{field('Profissão',selectedEmployee.profissao)}{field('Escolaridade',selectedEmployee.escolaridade)}{field('Observação',selectedEmployee.observacao)}</>)}
            </div>
            <section className="ciapi-servidores-historico" aria-label="Histórico de ocorrências do servidor">
              <HistoricoOcorrenciasServidor matricula={String(selectedEmployee.matricula || '')} />
            </section>
          </div>
        </article>
      )}

      {isModalOpen && (
        <section className="ciapi-servidores-editor" aria-label={editingEmployee ? 'Editar servidor' : 'Novo servidor'}>
          <header className="ciapi-servidores-editor-header">
            <div><span>Gestão de pessoas / Cadastro</span><h2>{editingEmployee ? 'Editar servidor' : 'Novo servidor'}</h2><p>Preencha os dados e confira as informações antes de salvar.</p></div>
            <button className="ciapi-btn ciapi-btn-muted" type="button" onClick={closeEditModal}><ChevronLeft size={16}/> Voltar à pesquisa</button>
          </header>
          <div className="ciapi-servidores-editor-content">
                <form id="servidor-form" onSubmit={handleSave} className="space-y-8">
<section className="ciapi-servidores-edit-photo">
  <div className="ciapi-servidores-edit-photo-image">
    {(formPhotoUrl || (editingEmployee && profileValue(editingEmployee,'fotoUrl','foto_url','foto','avatarUrl','fotoPerfil'))) ?
      <img src={formPhotoUrl || profileValue(editingEmployee,'fotoUrl','foto_url','foto','avatarUrl','fotoPerfil')} alt="Fotografia do servidor" /> :
      <div><Camera size={32}/><span>Sem fotografia</span></div>}
  </div>
  <div><h3>Fotografia do servidor</h3><p>JPG, PNG ou WebP, até 3 MB.</p>
    <label className="ciapi-btn ciapi-btn-muted ciapi-servidores-photo-picker"><ImagePlus size={16}/> Selecionar fotografia
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
        const file = event.target.files?.[0]; if (!file) return;
        if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>3*1024*1024) {setFormPhotoNotice('Selecione uma imagem JPG, PNG ou WebP de até 3 MB.');return;}
        if (formPhotoUrl) URL.revokeObjectURL(formPhotoUrl);
        setFormPhotoUrl(URL.createObjectURL(file));
        setFormPhotoNotice('Pré-visualização apenas. O armazenamento de fotos ainda precisa de integração com o backend.');
      }}/>
    </label>{formPhotoUrl && <button type="button" className="ciapi-servidores-remove-photo" onClick={() => { URL.revokeObjectURL(formPhotoUrl); setFormPhotoUrl(null); setFormPhotoNotice('');}}>Remover pré-visualização</button>}
    {formPhotoNotice && <p role="status" className="ciapi-servidores-photo-notice">{formPhotoNotice}</p>}
  </div>
</section>
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
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Segunda matrícula (outro vínculo)</label>
                        <input
                          name="matriculaSegunda"
                          type="text"
                          defaultValue={editingEmployee?.matriculaSegunda || ''}
                          placeholder="Preencha apenas se houver outro vínculo"
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

              <div className="grid grid-cols-1 gap-2 border-t border-border-dark bg-slate-800/20 p-4 sm:flex sm:justify-end sm:gap-3 sm:p-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="min-h-11 w-full rounded-xl px-6 py-2.5 text-sm font-bold text-slate-400 transition-colors hover:text-white sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  form="servidor-form"
                  type="submit"
                  className="min-h-11 w-full rounded-xl bg-primary px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover sm:w-auto"
                >
                  {editingEmployee ? 'Salvar Alterações' : 'Cadastrar Servidor'}
                </button>
              </div>
          </div>
        </section>
      )}

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
              className="relative z-[91] w-full max-w-md overflow-hidden rounded-2xl border border-border-dark bg-card-dark shadow-2xl sm:rounded-3xl"
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

              <div className="grid grid-cols-1 gap-2 bg-slate-900/20 p-4 sm:flex sm:items-center sm:justify-end sm:gap-3 sm:p-6">
                <button
                  type="button"
                  onClick={closeConfirmSaveModal}
                  disabled={isSaving}
                  className="min-h-11 w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-white disabled:opacity-50 sm:w-auto"
                >
                  Não, cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmSaveEmployee}
                  disabled={isSaving}
                  className="min-h-11 w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:opacity-50 sm:w-auto"
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
