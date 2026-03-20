import React, { useEffect, useState } from 'react';
import { setoresService } from '../services/setoresService';
import { SetorAdmin } from '../types';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AdminSetoresPage = () => {
  const [setores, setSetores] = useState<SetorAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SetorAdmin | null>(null);
  const [nome, setNome] = useState('');

  const fetchSetores = async () => {
    try {
      setIsLoading(true);
      const data = await setoresService.listar();
      setSetores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setSetores([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSetores();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingItem) {
        await setoresService.editar(editingItem.id, { nome });
      } else {
        await setoresService.adicionar(nome);
      }

      setIsModalOpen(false);
      setNome('');
      setEditingItem(null);
      await fetchSetores();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este setor?')) return;
    await setoresService.excluir(id);
    await fetchSetores();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Gestão de Setores</h2>

        <button
          onClick={() => {
            setEditingItem(null);
            setNome('');
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
        >
          <Plus size={18} />
          Novo Setor
        </button>
      </div>

      <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-xl relative min-h-[200px]">
        {isLoading && (
          <div className="absolute inset-0 bg-card-dark/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-border-dark">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-dark">
              {setores.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    Nenhum setor cadastrado.
                  </td>
                </tr>
              ) : (
                setores.map((setor) => (
                  <tr key={setor.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-white">{setor.nome}</span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                          setor.ativo
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}
                      >
                        {setor.ativo ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(setor);
                            setNome(setor.nome);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(setor.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
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
                <h2 className="text-xl font-bold text-white">
                  {editingItem ? 'Editar Setor' : 'Novo Setor'}
                </h2>

                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Nome do Setor</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSetoresPage;
