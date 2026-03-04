import React from 'react';
import { Bell, Search, User } from 'lucide-react';

interface TopbarProps {
  title: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title }) => {
  return (
    <header className="h-20 bg-card-dark/50 backdrop-blur-md border-bottom border-border-dark px-8 flex items-center justify-between sticky top-0 z-40">
      <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            className="bg-slate-800 border-none rounded-full py-2 pl-10 pr-4 text-sm text-slate-200 focus:ring-2 focus:ring-primary w-64 transition-all"
          />
        </div>
        
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell size={22} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-card-dark"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-border-dark">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">Admin CIAPI</p>
            <p className="text-xs text-slate-500">Administrador</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-primary/20">
            <User size={20} className="text-primary" />
          </div>
        </div>
      </div>
    </header>
  );
};
