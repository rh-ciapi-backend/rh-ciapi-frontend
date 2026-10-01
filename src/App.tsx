/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

import { DashboardPage } from './pages/DashboardPage';
import { ServidoresPage } from './pages/ServidoresPage';
import FeriasPage from './pages/FeriasPage';
import FrequenciaPage from './pages/FrequenciaPage';
import MapasPage from './pages/MapasPage';
import AdminPage from './pages/AdminPage';
import AdminUsuariosPage from './pages/AdminUsuariosPage';
import AdminCategoriasPage from './pages/AdminCategoriasPage';
import AdminSetoresPage from './pages/AdminSetoresPage';
import AdminLogsPage from './pages/AdminLogsPage';
import AtestadosPage from './pages/AtestadosPage';
import { DiagnosticoPage } from './pages/DiagnosticoPage';
import RequerimentosPage from './pages/RequerimentosPage';
import ServidorRequerimentoPortal from './pages/ServidorRequerimentoPortal';
import SaeApp from './sae/SaeApp';

type AppTab =
  | 'dashboard'
  | 'servidores'
  | 'atestados'
  | 'ferias'
  | 'frequencia'
  | 'mapas'
  | 'requerimentos'
  | 'admin'
  | 'admin-usuarios'
  | 'admin-categorias'
  | 'admin-setores'
  | 'admin-logs'
  | 'diagnostico';

const VALID_TABS: AppTab[] = [
  'dashboard','servidores','atestados','ferias','frequencia','mapas','requerimentos','admin',
  'admin-usuarios','admin-categorias','admin-setores','admin-logs','diagnostico',
];

function isValidTab(tab: string): tab is AppTab {
  return VALID_TABS.includes(tab as AppTab);
}

export default function App() {
  const { signOut, ambiente, setAmbiente, session, isLoading, acesso, isAccessLoading, accessError } = useAuth();
  const acessoAtual = acesso && session && acesso.auth_uid === session.user.id ? { uid: acesso.auth_uid, perfil: acesso.perfil,
    isMaster: acesso.is_master || acesso.perfil === 'MASTER' } : null;
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [initialAction, setInitialAction] = useState<string | null>(null);

  const handleLogout = useCallback(async () => {
    try { await signOut(); } catch (error) { console.error('Erro ao sair da sessão:', error); }
  }, [signOut]);

  const navigateWithAction = useCallback((tab: string, action?: string) => {
    const safeTab: AppTab = isValidTab(tab) ? tab : 'dashboard';
    setActiveTab(safeTab);
    setInitialAction(action ?? null);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage onNavigate={navigateWithAction} />;
      case 'servidores': return <ServidoresPage initialAction={initialAction} onActionHandled={() => setInitialAction(null)} />;
      case 'atestados': return <AtestadosPage />;
      case 'ferias': return <FeriasPage />;
      case 'frequencia': return <FrequenciaPage />;
      case 'mapas': return <MapasPage />;
      case 'requerimentos': return <RequerimentosPage podeArquivar={Boolean(acessoAtual?.isMaster || ['ADMINISTRADOR', 'RH'].includes(acessoAtual?.perfil || ''))} />;
      case 'admin': return <AdminPage onNavigate={navigateWithAction} />;
      case 'admin-usuarios': return <AdminUsuariosPage />;
      case 'admin-categorias': return <AdminCategoriasPage />;
      case 'admin-setores': return <AdminSetoresPage />;
      case 'admin-logs': return <AdminLogsPage />;
      case 'diagnostico': return <DiagnosticoPage />;
      default: return <DashboardPage onNavigate={navigateWithAction} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'servidores': return 'Gestão de Servidores';
      case 'atestados': return 'Gestão de Atestados';
      case 'ferias': return 'Controle de Férias';
      case 'frequencia': return 'Frequência Mensal';
      case 'mapas': return 'Mapas Institucionais';
      case 'requerimentos': return 'Requerimentos';
      case 'admin': return 'Administração do Sistema';
      case 'admin-usuarios': return 'Usuários do Sistema';
      case 'admin-categorias': return 'Gestão de Categorias';
      case 'admin-setores': return 'Gestão de Setores';
      case 'admin-logs': return 'Logs de Atividade';
      case 'diagnostico': return 'Diagnóstico de Conexão';
      default: return 'CIAPI RH';
    }
  };

  if (isLoading || (session && (isAccessLoading || (!accessError && acessoAtual?.uid !== session.user.id)))) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0b1220] text-white">Carregando acesso...</div>;
  }
  if (session && accessError) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0b1220] p-4 text-white"><div>{accessError} <button className="text-blue-300" onClick={handleLogout}>Sair</button></div></div>;
  }
  if (acessoAtual?.perfil === 'SERVIDOR_LIMITADO' || window.location.hash.startsWith('#/requerimento')) {
    return <ServidorRequerimentoPortal perfil={acessoAtual?.perfil || null} />;
  }

  if (session && (!acesso || acesso.status !== 'ATIVO' ||
      !acesso.ambientes_permitidos.includes(ambiente === 'sae' ? 'SAE' : 'RH'))) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0b1220] p-4 text-white">
      <div className="max-w-md rounded-2xl border border-[#26344a] bg-[#172033] p-6 text-center">
        <h2 className="text-xl font-bold">Ambiente não autorizado</h2>
        <p className="mt-3 text-sm text-slate-400">Sua conta pode acessar apenas os ambientes liberados pela administração.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {acesso?.ambientes_permitidos.map((item) => <button key={item} className="rounded-xl bg-blue-600 px-4 py-2" onClick={() => setAmbiente(item === 'SAE' ? 'sae' : 'rh')}>Abrir {item === 'RH' ? 'CIAPI RH' : 'SAE'}</button>)}
          <button className="rounded-xl border border-[#26344a] px-4 py-2" onClick={handleLogout}>Sair</button>
        </div>
      </div>
    </div>;
  }

  return (
    <ProtectedRoute>
      {ambiente === 'sae' ? (
        <SaeApp />
      ) : (
        <div className="app-shell flex min-h-screen min-w-0 bg-bg-dark">
          <Sidebar activeTab={activeTab} setActiveTab={(tab: string) => navigateWithAction(tab)} onLogout={handleLogout} />
          <div className="app-content-column flex min-w-0 flex-1 flex-col">
            <Topbar title={getPageTitle()} />
            {acesso?.is_master && (
              <div className="flex justify-end border-b border-[#26344a] px-3 py-2 sm:px-6">
                <button
                  type="button"
                  onClick={() => setAmbiente('sae')}
                  className="min-h-10 rounded-lg border border-[#26344a] bg-[#172033] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-blue-500 hover:text-white"
                >
                  Abrir ambiente SAE
                </button>
              </div>
            )}
            <main className="app-main flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7">
              <div className="app-page app-main-inner">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
