import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Layers, 
  MapPin, 
  Calendar, 
  Shield, 
  Activity,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { eventosService } from '../services/eventosService';
import { CATEGORIAS, SETORES } from '../data/servidores';
import { EventoCalendario } from '../types';

const AdminCard = ({ title, description, icon: Icon, count, onClick }: any) => (
  <button 
    onClick={onClick}
    className="bg-card-dark p-6 rounded-2xl border border-border-dark hover:border-primary/50 hover:bg-slate-800 transition-all text-left group flex items-center justify-between"
  >
    <div className="flex items-center gap-4">
      <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
        <Icon size={24} />
      </div>
      <div>
        <h3 className="text-white font-bold">{title}</h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-slate-400">{count}</span>
      <ChevronRight size={18} className="text-slate-600 group-hover:text-primary transition-colors" />
    </div>
  </button>
);

export const AdminPage = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchEventos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await eventosService.listar();
      setEventos(data);
    } catch (err: any) {
      setError('Erro ao carregar eventos. Verifique a conexão com o servidor.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSaveEvento = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dados = {
      data: formData.get('data') as string,
      tipo: formData.get('tipo') as any,
      titulo: formData.get('titulo') as string,
      descricao: formData.get('descricao') as string,
    };

    try {
      setIsLoading(true);
      await eventosService.adicionar(dados);
      setSuccessMessage('Evento salvo com sucesso!');
      setIsModalOpen(false);
      fetchEventos();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar evento.');
    } finally {
      setIsLoading(false);
    }
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminCard 
          title="Usuários do Sistema" 
          description="Gerenciar acessos e permissões" 
          icon={Shield} 
          count="05" 
          onClick={() => onNavigate('admin-usuarios')}
        />
        <AdminCard 
          title="Categorias" 
          description="Configurar tipos de contratação" 
          icon={Layers} 
          count={CATEGORIAS.length} 
          onClick={() => onNavigate('admin-categorias')}
        />
        <AdminCard 
          title="Setores" 
          description="Gerenciar lotações e departamentos" 
          icon={MapPin} 
          count={SETORES.length} 
          onClick={() => onNavigate('admin-setores')}
        />
        <AdminCard 
          title="Logs de Atividade" 
          description="Histórico de ações no sistema" 
          icon={Activity} 
          count="1.2k" 
          onClick={() => onNavigate('admin-logs')}
        />
      </div>

      <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-xl relative min-h-[200px]">
        {isLoading && (
          <div className="absolute inset-0 bg-card-dark/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <div className="p-6 border-b border-border-dark flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Calendar className="text-primary" size={24} />
            <h2 className="text-lg font-bold text-white">Eventos e Feriados</h2>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
          >
            <Plus size={18} />
            Adicionar Evento
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-border-dark">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Título</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {eventos.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhum evento ou feriado cadastrado.
                  </td>
                </tr>
              ) : (
                eventos.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      {new Date(event.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                        event.tipo === 'FERIADO' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                        event.tipo === 'PONTO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {event.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-200">{event.titulo}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{event.descricao}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
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
              className="relative bg-card-dark border border-border-dark rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-border-dark flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Novo Evento / Feriado</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <form id="evento-form" onSubmit={handleSaveEvento} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Data</label>
                    <input name="data" type="date" required className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Tipo</label>
                    <select name="tipo" className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary">
                      <option value="FERIADO">FERIADO</option>
                      <option value="PONTO">PONTO</option>
                      <option value="EVENTO">EVENTO</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Título</label>
                    <input name="titulo" type="text" required className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary" placeholder="Ex: Dia do Servidor" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Descrição</label>
                    <textarea name="descricao" className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary h-24 resize-none" placeholder="Detalhes adicionais..." />
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
                  form="evento-form"
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all"
                >
                  Salvar Evento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
