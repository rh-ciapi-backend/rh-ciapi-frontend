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
  X
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

const getCategoryBadge = (cat: Categoria | string) => {
  const safeCat = asString(cat, FALLBACK_CATEGORIA);
  return (
    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
      {safeCat}
    </span>
  );
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

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (emp: Servidor) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este servidor?')) return;
    try {
      setIsLoading(true);
      await servidoresService.excluir(id);
      setSuccessMessage('Servidor excluído com sucesso!');
      await fetchEmployees();
    } catch (err: any) {
      setError(err?.message || 'Erro ao excluir servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const dados = {
      nome: formData.get('nomeCompleto') as string,
      nomeCompleto: formData.get('nomeCompleto') as string,
      matricula: formData.get('matricula') as string,
      cpf: formData.get('cpf') as string,
      dataNascimento: formData.get('dataNascimento') as string,
      sexo: formData.get('sexo') as Sexo,
      rgNumero: formData.get('rgNumero') as string,
      rgOrgaoEmissor: formData.get('rgOrgaoEmissor') as string,
      rgUf: formData.get('rgUf') as string,
      email: formData.get('email') as string,
      escolaridade: formData.get('escolaridade') as string,
      profissao: formData.get('profissao') as string,
      vinculo: formData.get('vinculo') as string,
      funcao: formData.get('funcao') as string,
      cargaHoraria: formData.get('cargaHoraria') as string,
      inicioExercicio: formData.get('inicioExercicio') as string,
      categoria: formData.get('categoria') as Categoria,
      setor: formData.get('setor') as string,
      cargo: formData.get('cargo') as string,
      telefone: formData.get('telefone') as string,
      lotacaoInterna: formData.get('lotacaoInterna') as string,
      turno: formData.get('turno') as string,
      status: formData.get('status') as StatusServidor,
      observacao: formData.get('observacao') as string,
      aniversario: (formData.get('aniversario') as string) || null,
    };

    try {
      setIsLoading(true);

      if (editingEmployee) {
        await servidoresService.editar(editingEmployee.id, dados);
        setSuccessMessage('Servidor atualizado com sucesso!');
      } else {
        await servidoresService.adicionar(dados);
        setSuccessMessage('Servidor cadastrado com sucesso!');
      }

      setIsModalOpen(false);
      await fetchEmployees();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar servidor.');
    } finally {
      setIsLoading(false);
    }
  };

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

        <button
          onClick={handleAddEmployee}
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          Novo Servidor
        </button>
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
              <tr className="bg-slate-800/50 border-b border-border-dark">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider min-w-[220px]">Servidor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">CPF</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Sexo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Aniversário</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider min-w-[180px]">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Setor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Função</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Carga</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-dark">
              {filteredEmployees.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-500">
                    Nenhum servidor encontrado com os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const safeName = getEmployeeName(emp);
                  const safeInitial = safeName.charAt(0).toUpperCase() || '?';
                  const safeSexo = getEmployeeSexo(emp);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-primary border border-primary/20 text-xs shrink-0">
                            {safeInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate" title={safeName}>
                              {safeName}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {getEmployeeMatricula(emp) || '-'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-300 font-mono whitespace-nowrap">
                        {asString(emp.cpf, '-')}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-400">
                        {safeSexo === 'M' ? 'M' : safeSexo === 'F' ? 'F' : safeSexo === 'OUTRO' ? 'O' : safeSexo}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                        {emp.aniversario
                          ? new Date(emp.aniversario).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit'
                            })
                          : '-'}
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-400 truncate max-w-[180px]" title={asString(emp.email)}>
                          {asString(emp.email, '-')}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {getCategoryBadge(getEmployeeCategoria(emp))}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {getEmployeeSetor(emp)}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {asString(emp.funcao, '-')}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {asString(emp.cargaHoraria, '-')}
                      </td>

                      <td className="px-6 py-4">
                        {getStatusBadge(getEmployeeStatus(emp))}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditEmployee(emp)}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
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
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-card-dark border border-border-dark rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-dark flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  {editingEmployee ? 'Editar Servidor' : 'Novo Servidor'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
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
                        <input name="nomeCompleto" type="text" defaultValue={editingEmployee?.nomeCompleto} required className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Data de Nascimento</label>
                        <input name="dataNascimento" type="date" defaultValue={editingEmployee?.dataNascimento || ''} required className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Sexo</label>
                        <select name="sexo" defaultValue={editingEmployee?.sexo || 'M'} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary">
                          <option value="M">MASCULINO</option>
                          <option value="F">FEMININO</option>
                          <option value="OUTRO">OUTRO</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Aniversário</label>
                        <input name="aniversario" type="date" defaultValue={editingEmployee?.aniversario || ''} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border-dark pb-2">
                      <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Documentação</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">CPF</label>
                        <input name="cpf" type="text" defaultValue={editingEmployee?.cpf} required className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">RG Número</label>
                        <input name="rgNumero" type="text" defaultValue={editingEmployee?.rgNumero} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Órgão Emissor</label>
                        <input name="rgOrgaoEmissor" type="text" defaultValue={editingEmployee?.rgOrgaoEmissor} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">UF RG</label>
                        <input name="rgUf" type="text" defaultValue={editingEmployee?.rgUf} maxLength={2} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
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
                        <input name="telefone" type="text" defaultValue={editingEmployee?.telefone} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Email</label>
                        <input name="email" type="email" defaultValue={editingEmployee?.email} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border-dark pb-2">
                      <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Dados Funcionais</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Matrícula</label>
                        <input name="matricula" type="text" defaultValue={editingEmployee?.matricula} required className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Categoria</label>
                        <select name="categoria" defaultValue={editingEmployee?.categoria || CATEGORIAS[0]} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary">
                          {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Setor</label>
                        <select name="setor" defaultValue={editingEmployee?.setor || SETORES[0]} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary">
                          {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Cargo</label>
                        <input name="cargo" type="text" defaultValue={editingEmployee?.cargo} required className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Função</label>
                        <input name="funcao" type="text" defaultValue={editingEmployee?.funcao} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Vínculo</label>
                        <select name="vinculo" defaultValue={editingEmployee?.vinculo} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary">
                          {VINCULOS.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Profissão</label>
                        <input name="profissao" type="text" defaultValue={editingEmployee?.profissao} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Escolaridade</label>
                        <select name="escolaridade" defaultValue={editingEmployee?.escolaridade} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary">
                          {ESCOLARIDADE.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Lotação Interna</label>
                        <input name="lotacaoInterna" type="text" defaultValue={editingEmployee?.lotacaoInterna} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Carga Horária</label>
                        <input name="cargaHoraria" type="text" defaultValue={editingEmployee?.cargaHoraria} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Turno</label>
                        <input name="turno" type="text" defaultValue={editingEmployee?.turno} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Início Exercício</label>
                        <input name="inicioExercicio" type="date" defaultValue={editingEmployee?.inicioExercicio || ''} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                        <select name="status" defaultValue={editingEmployee?.status || 'ATIVO'} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary">
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
                      <textarea name="observacao" defaultValue={editingEmployee?.observacao} className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary h-24 resize-none" />
                    </div>
                  </section>
                </form>
              </div>

              <div className="p-6 border-t border-border-dark flex justify-end gap-3 bg-slate-800/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
    </div>
  );
};
