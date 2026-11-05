import React from 'react';
import DashboardIcon from './dashboard/DashboardIcon';
import { visualFor } from './workspace/visuals';
import { HeartPulse, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
export const Topbar: React.FC<{title:string; moduleKey?:string; onOpenSae?: () => void}> = ({title, moduleKey, onOpenSae}) => {
 const {user,acesso} = useAuth();
 return <header className="institutional-pagebar"><div className="ciapi-module-title">{moduleKey && moduleKey !== 'dashboard' && <DashboardIcon name={visualFor(moduleKey).icon} size={40}/>}<div><span>CIAPI RH / Sistema de Gestão</span><h1>{title}</h1></div></div><div className="ciapi-pagebar-actions">{onOpenSae && <button type="button" className="ciapi-pagebar-sae" onClick={onOpenSae} aria-label="Abrir ambiente SAE"><HeartPulse size={16} aria-hidden="true"/><span>SAE</span></button>}<div className="institutional-pagebar__user"><UserRound size={20}/><div><strong>{user?.email ?? 'Usuário autenticado'}</strong><small>{acesso?.perfil ?? 'Servidor'}</small></div></div></div></header>;
};
