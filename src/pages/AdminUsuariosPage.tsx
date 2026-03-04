import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UsuarioAdmin } from '../types';
import { Shield, Mail, Calendar, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

export const AdminUsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        // Nota: Supabase Auth users list requires admin privileges or a custom RPC
        // For now, we'll list users from a hypothetical 'profiles' or 'user_roles' table
        // or just show the current user as a placeholder if table doesn't exist
        const { data, error } = await supabase.from('user_roles').select('*');
        
        if (error) {
          // Fallback: show current user
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setUsuarios([{
              id: user.id,
              email: user.email || '',
              role: 'admin',
              created_at: user.created_at
            }]);
          }
        } else {
          setUsuarios(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Usuários do Sistema</h2>
      </div>

      <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-border-dark">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Permissão</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Criado em</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {usuarios.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Mail size={16} />
                      </div>
                      <span className="text-sm font-medium text-white">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-amber-500" />
                      <span className="text-xs font-bold text-slate-400 uppercase">{user.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ATIVO
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
