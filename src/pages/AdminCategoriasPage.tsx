import React, { useEffect, useState } from 'react';
import { categoriasService } from '../services/categoriasService';
import { CategoriaAdmin } from '../types';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AdminCategoriasPage = () => {
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CategoriaAdmin | null>(null);
  const [nome, setNome] = useState('');

  const fetchCategorias = async () => {
    try {
      setIsLoading(true);
      const data = await categoriasService.listar();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setCategorias([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingItem) {
        await categoriasService.editar(editingItem.id, { nome });
      } else {
        await categoriasService.adicionar(nome);
      }

      setIsModalOpen(false);
      setNome('');
      setEditingItem(null);
      await fetchCategorias();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;
    await categoriasService.excluir(id);
    await fetchCategorias();
  };

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-white">Gestão de Categorias</h2>

        <button
          onClick={() => {
            setEditingItem(null);
            setNome('');
            setIsModalOpen(true);
          }}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover sm:w-auto"
        >
          <Plus size={18} />
          Nova Categoria
        </button>
      </div>

      <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-xl relative min-h-[200px]">
        {isLoading && (
          <div className="absolute inset-0 bg-card-dark/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div className="responsive-scroll">
          <table className="min-w-[560px] w-full border-collapse text-left sm:min-w-0">
            <thead>
              <tr className="bg-slate-800/50 border-b border-border-dark">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-dark">
              {categorias.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma categoria cadastrada.
                  </td>
                </tr>
              ) : (
                categorias.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-white">{cat.nome}</span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                          cat.ativo
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}
                      >
                        {cat.ativo ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(cat);
                            setNome(cat.nome);
                            setIsModalOpen(true);
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-rose-400/10 hover:text-rose-400"
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
          <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
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
              className="relative flex max-h-[100dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border-dark bg-card-dark shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-border-dark p-4 sm:p-6">
                <h2 className="text-xl font-bold text-white">
                  {editingItem ? 'Editar Categoria' : 'Nova Categoria'}
                </h2>

                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Nome da Categoria</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-border-dark rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 pt-4 sm:flex sm:justify-end sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="min-h-11 w-full rounded-xl px-4 py-2 text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-white sm:w-auto"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="min-h-11 w-full rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover sm:w-auto"
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

export default AdminCategoriasPage;
