import React from 'react';
import { HeartPulse, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
export const Topbar: React.FC<{title:string; onOpenSae?: () => void}> = ({title, onOpenSae}) => {
 const {user,acesso} = useAuth();
 return <header className="institutional-pagebar"><div><span>CIAPI RH / Sistema de Gestão</span><h1>{title}</h1></div><div className="ciapi-pagebar-actions">{onOpenSae && <button type="button" className="ciapi-pagebar-sae" onClick={onOpenSae} aria-label="Abrir ambiente SAE"><HeartPulse size={16} aria-hidden="true"/><span>SAE</span></button>}<div className="institutional-pagebar__user"><UserRound size={20}/><div><strong>{user?.email ?? 'Usuário autenticado'}</strong><small>{acesso?.perfil ?? 'Servidor'}</small></div></div></div></header>;
};
