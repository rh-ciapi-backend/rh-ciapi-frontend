import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Edit2, 
  FileText,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { feriasService } from '../services/feriasService';
import { servidoresService } from '../services/servidoresService';
import { CATEGORIAS } from '../data/servidores';
import { Ferias, Servidor } from '../types';

export const FeriasPage = () => {
  const [vacations, setVacations] = useState<Ferias[]>([]);
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const currentYear = new Date().getFullYear();
  const [filterAno, setFilterAno] = useState<number>(currentYear);
  const [filterMes, setFilterMes] = useState<number | ''>('');
  
  const anos = Array.from({ length: 16 }, (_, i) => currentYear - 5 + i);
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  const [filterServidorId, setFilterServidorId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [vData, sData] = await Promise.all([
        feriasService.listar({ 
          ano: filterAno, 
          mes: filterMes === '' ? undefined : filterMes,
          servidorId: filterServidorId || undefined
        }),
        servidoresService.listar()
      ]);
      
      let filteredVacations = vData;
      if (filterCategoria) {
        filteredVacations = vData.filter(v => {
          const s = sData.find(serv => serv.id === v.servidorId);
          return s?.categoria === filterCategoria;
        });
      }

      setVacations(filteredVacations);
      setServidores(sData);
    } catch (err: any) {
      setError('Erro ao carregar dados de férias. Verifique a conexão com o servidor.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterAno, filterMes, filterCategoria, filterServidorId]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dados = {
      servidorId: formData.get('servidorId') as string,
      ano: parseInt(formData.get('ano') as string),
      periodo1Inicio: formData.get('p1Inicio') as string,
      periodo1Fim: formData.get('p1Fim') as string,
      periodo2Inicio: formData.get('p2Inicio') as string || undefined,
      periodo2Fim: formData.get('p2Fim') as string || undefined,
      periodo3Inicio: formData.get('p3Inicio') as string || undefined,
      periodo3Fim: formData.get('p3Fim') as string || undefined,
      observacao: formData.get('observacao') as string,
    };

    try {
      setIsLoading(true);
      await feriasService.adicionar(dados);
      setSuccessMessage('Férias lançadas com sucesso!');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Erro ao lançar férias.');
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeName = (id: string) => {
    const emp = servidores.find(e => e.id === id);
    return emp ? emp.nomeCompleto : 'Desconhecido';
  };

  const getEmployeeCategory = (id: string) => {
    const emp = servidores.find(e => e.id === id);
    return emp ? emp.categoria : '-';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select 
            value={filterAno}
            onChange={(e) => setFilterAno(parseInt(e.target.value))}
            className="bg-card-dark border border-border-dark rounded-xl py-2.5 px-4 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary"
          >
            {anos.map(ano => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
          <select 
            value={filterMes}
            onChange={(e) => setFilterMes(e.target.value === '' ? '' : parseInt(e.target.value))}
            className="bg-card-dark border border-border-dark rounded-xl py-2.5 px-4 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos os Meses</option>
            <option value={1}>Janeiro</option>
            <option value={2}>Fevereiro</option>
            <option value={3}>Março</option>
            <option value={4}>Abril</option>
            <option value={5}>Maio</option>
            <option value={6}>Junho</option>
            <option value={7}>Julho</option>
            <option value={8}>Agosto</option>
            <option value={9}>Setembro</option>
            <option value={10}>Outubro</option>
            <option value={11}>Novembro</option>
            <option value={12}>Dezembro</option>
          </select>
          <select 
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="bg-card-dark border border-border-dark rounded-xl py-2.5 px-4 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary hidden lg:block"
          >
            <option value="">Todas Categorias</option>
            {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select 
            value={filterServidorId}
            onChange={(e) => setFilterServidorId(e.target.value)}
            className="bg-card-dark border border-border-dark rounded-xl py-2.5 px-4 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary hidden xl:block max-w-[200px]"
          >
            <option value="">Todos Servidores</option>
            {servidores.map(s => <option key={s.id} value={s.id}>{s.nomeCompleto}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all">
            <Download size={18} />
            Exportar
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all"
          >
            <Plus size={18} />
            Adicionar Férias
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 text-rose-400 text-sm"
          >
            <X size={18} className="cursor-pointer" onClick={() => setError(null)} />
            {error}
          </motion.div>
        )}
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3 text-emerald-400 text-sm"
          >
            <Calendar size={18} />
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
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Servidor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Período 1</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Período 2</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Período 3</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {vacations.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhum registro de férias encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                vacations.map((vac) => (
                  <tr key={vac.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-white">{getEmployeeName(vac.servidorId)}</p>
                      <p className="text-xs text-slate-500">Ano Ref: {vac.ano}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400">{getEmployeeCategory(vac.servidorId)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-emerald-400 font-medium">{formatDate(vac.periodo1Inicio)}</span>
                        <span className="text-xs text-rose-400 font-medium">{formatDate(vac.periodo1Fim)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {vac.periodo2Inicio ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-emerald-400 font-medium">{formatDate(vac.periodo2Inicio)}</span>
                          <span className="text-xs text-rose-400 font-medium">{formatDate(vac.periodo2Fim || '')}</span>
                        </div>
                      ) : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      {vac.periodo3Inicio ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-emerald-400 font-medium">{formatDate(vac.periodo3Inicio)}</span>
                          <span className="text-xs text-rose-400 font-medium">{formatDate(vac.periodo3Fim || '')}</span>
                        </div>
                      ) : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
              className="relative bg-card-dark border border-border-dark rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="p-6 border-b border-border-dark flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Lançar Férias</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <form id="ferias-form" onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Servidor</label>
                    <select name="servidorId" required className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Selecione o servidor...</option>
                      {servidores.map(emp => <option key={emp.id} value={emp.id}>{emp.nomeCompleto}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Ano de Referência</label>
                      <input name="ano" type="number" defaultValue={currentYear} required className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white border-b border-border-dark pb-2">Período 1</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Início</label>
                        <input name="p1Inicio" type="date" required className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Fim</label>
                        <input name="p1Fim" type="date" required className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white border-b border-border-dark pb-2">Período 2 (Opcional)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Início</label>
                        <input name="p2Inicio" type="date" className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Fim</label>
                        <input name="p2Fim" type="date" className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white border-b border-border-dark pb-2">Período 3 (Opcional)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Início</label>
                        <input name="p3Inicio" type="date" className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Fim</label>
                        <input name="p3Fim" type="date" className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Observação</label>
                    <textarea name="observacao" className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary h-20 resize-none" />
                  </div>
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
                  form="ferias-form"
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
