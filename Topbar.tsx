import React from 'react';
import { UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
export const Topbar: React.FC<{title:string}> = ({title}) => {
 const {user,acesso} = useAuth();
 return <header className="institutional-pagebar"><div><span>CIAPI RH / Sistema de Gestão</span><h1>{title}</h1></div><div className="institutional-pagebar__user"><UserRound size={20}/><div><strong>{user?.email ?? 'Usuário autenticado'}</strong><small>{acesso?.perfil ?? 'Servidor'}</small></div></div></header>;
};
