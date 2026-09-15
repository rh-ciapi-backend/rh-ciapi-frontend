import React from 'react';
import { Bell, Search, User } from 'lucide-react';

interface TopbarProps {
  title: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-border-dark/70 bg-bg-dark/80 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            CIAPI RH
          </p>

          <h1 className="truncate text-xl font-bold tracking-tight text-white sm:text-2xl">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden lg:block">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              size={17}
            />

            <input
              type="text"
              placeholder="Pesquisar..."
              className="h-10 w-56 rounded-2xl border border-border-dark bg-card-dark/70 pl-10 pr-4 text-sm text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 xl:w-64"
            />
          </div>

          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-border-dark bg-card-dark/70 text-slate-400 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            title="Notificações"
          >
            <Bell size={19} />

            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-border-dark bg-card-dark/70 px-2 py-1.5 sm:px-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold leading-tight text-white">
                Admin CIAPI
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Administrador
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <User size={18} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
