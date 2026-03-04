import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  Archive,
  FileDown,
  ChevronDown,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mapasService } from '../services/mapasService';
import { CATEGORIAS, SETORES } from '../data/servidores';
import { LinhaMapa } from '../types';

export const MapasPage = () => {
  const [mapLines, setMapLines] = useState<LinhaMapa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAno, setFilterAno] = useState<number>(new Date().getFullYear());
  const [filterMes, setFilterMes] = useState<number>(new Date().getMonth() + 1);
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  const [filterSetor, setFilterSetor] = useState<string>('');

  const fetchMap = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await mapasService.listar({ 
        mes: filterMes, 
        ano: filterAno,
        categoria: filterCategoria as any,
        setor: filterSetor
      });
      setMapLines(data);
    } catch (err: any) {
      setError('Erro ao gerar mapa de frequência. Verifique a conexão com o servidor.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMap();
  }, [filterAno, filterMes, filterCategoria, filterSetor]);
  return (
    <div className="space-y-8">
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
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-xl border border-blue-400/20">
          <p className="text-blue-100 text-sm font-medium mb-1">Status do Mês</p>
          <h3 className="text-2xl font-bold text-white mb-4">Fevereiro 2024</h3>
          <div className="flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1 rounded-full text-white">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            EM ABERTO
          </div>
        </div>
        <div className="bg-card-dark p-6 rounded-2xl border border-border-dark shadow-xl">
          <p className="text-slate-400 text-sm font-medium mb-1">Mapas Gerados</p>
          <h3 className="text-2xl font-bold text-white mb-4">24 / 32</h3>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[75%]"></div>
          </div>
        </div>
        <div className="bg-card-dark p-6 rounded-2xl border border-border-dark shadow-xl">
          <p className="text-slate-400 text-sm font-medium mb-1">Pendências</p>
          <h3 className="text-2xl font-bold text-white mb-4">08</h3>
          <p className="text-xs text-rose-400 font-bold">Aguardando fechamento de setor</p>
        </div>
      </div>

      <div className="bg-card-dark p-6 rounded-2xl border border-border-dark shadow-xl space-y-6 relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 bg-card-dark/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={`${filterMes}-${filterAno}`}
              onChange={(e) => {
                const [m, a] = e.target.value.split('-').map(Number);
                setFilterMes(m);
                setFilterAno(a);
              }}
              className="bg-slate-800 border border-border-dark rounded-xl py-2.5 px-4 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="2-2024">Fevereiro 2024</option>
              <option value="1-2024">Janeiro 2024</option>
              <option value="3-2024">Março 2024</option>
              <option value="4-2024">Abril 2024</option>
            </select>
            <select 
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="bg-slate-800 border border-border-dark rounded-xl py-2.5 px-4 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todas Categorias</option>
              {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select 
              value={filterSetor}
              onChange={(e) => setFilterSetor(e.target.value)}
              className="bg-slate-800 border border-border-dark rounded-xl py-2.5 px-4 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos Setores</option>
              {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              onClick={fetchMap}
              className="flex-1 md:flex-none bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all"
            >
              <FileText size={18} />
              Gerar Mapa
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-border-dark">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ordem</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nome do Servidor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Matrícula</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Frequência</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Faltas</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {mapLines.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhum dado encontrado para gerar o mapa com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                mapLines.map((linha, i) => (
                  <tr key={`${linha.matricula}-${i}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">{String(i + 1).padStart(2, '0')}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-white">{linha.nomeCompleto}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">{linha.categoria}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-mono">{linha.matricula}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-emerald-400">{linha.frequencia}%</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-slate-500">{linha.faltas}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">{linha.observacao}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pt-6 border-t border-border-dark flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-card-dark bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                  AD
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-card-dark bg-primary flex items-center justify-center text-[10px] font-bold text-white">
                +5
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Responsáveis pelo fechamento</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-3 bg-slate-800 text-slate-300 rounded-xl hover:text-white hover:bg-slate-700 transition-all flex items-center gap-2 text-xs font-bold">
              <FileDown size={16} />
              PDF
            </button>
            <button className="p-3 bg-slate-800 text-slate-300 rounded-xl hover:text-white hover:bg-slate-700 transition-all flex items-center gap-2 text-xs font-bold">
              <Download size={16} />
              DOCX
            </button>
            <button className="p-3 bg-slate-800 text-slate-300 rounded-xl hover:text-white hover:bg-slate-700 transition-all flex items-center gap-2 text-xs font-bold">
              <Archive size={16} />
              ZIP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
