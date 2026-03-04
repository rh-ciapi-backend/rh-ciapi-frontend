import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Clock } from 'lucide-react';

export const AtestadosPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500"
      >
        <Clock size={48} />
      </motion.div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Gestão de Atestados</h2>
        <p className="text-slate-400 max-w-md">
          Esta funcionalidade está em desenvolvimento e estará disponível em breve para controle total de afastamentos médicos.
        </p>
      </div>

      <div className="bg-card-dark p-6 rounded-2xl border border-border-dark flex items-center gap-4 max-w-lg text-left">
        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Aviso</h4>
          <p className="text-xs text-slate-500 mt-1">
            Por enquanto, utilize a aba de <strong>Frequência</strong> para registrar faltas justificadas por atestado.
          </p>
        </div>
      </div>
    </div>
  );
};
