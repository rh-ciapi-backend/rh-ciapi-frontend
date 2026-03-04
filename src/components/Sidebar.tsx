import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Clock, 
  Map, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileHeart,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'servidores', label: 'Servidores', icon: Users },
  { id: 'atestados', label: 'Atestados', icon: FileHeart },
  { id: 'ferias', label: 'Férias', icon: Calendar },
  { id: 'frequencia', label: 'Frequência', icon: Clock },
  { id: 'mapas', label: 'Mapas', icon: Map },
  { id: 'admin', label: 'Administração', icon: Settings },
  { id: 'diagnostico', label: 'Diagnóstico', icon: Activity },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      className="h-screen bg-card-dark border-r border-border-dark flex flex-col sticky top-0 z-50"
    >
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-primary/20">
              C
            </div>
            <span className="font-bold text-xl tracking-tight text-white">CIAPI RH</span>
          </motion.div>
        )}
        {isCollapsed && (
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-white text-xl mx-auto">
            C
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <Icon size={22} className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
              {!isCollapsed && (
                <span className="font-medium whitespace-nowrap">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border-dark space-y-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all"
        >
          {isCollapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
          {!isCollapsed && <span className="font-medium">Recolher</span>}
        </button>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <LogOut size={22} />
          {!isCollapsed && <span className="font-medium">Sair</span>}
        </button>
      </div>
    </motion.aside>
  );
};
