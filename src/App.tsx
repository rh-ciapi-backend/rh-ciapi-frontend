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
  const { signOut, ambiente, perfil, statusAcesso, erroPerfil, isLoading } = useAuth();
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
      case 'requerimentos': return <RequerimentosPage />;
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

  return (
    <ProtectedRoute>
      {isLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-[#0b1220] text-sm text-slate-300">
          Verificando acesso...
        </div>
      ) : erroPerfil || !perfil || statusAcesso !== 'ATIVO' ? (
        <div className="flex min-h-screen items-center justify-center bg-[#0b1220] px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#26344a] bg-[#172033] p-6 text-center">
            <h1 className="text-lg font-semibold text-white">Acesso indisponível</h1>
            <p className="mt-2 text-sm text-slate-400">
              {erroPerfil || (statusAcesso !== 'ATIVO' ? 'Seu usuário não está ativo.' : 'Não foi possível identificar seu perfil.')}
            </p>
            <button type="button" onClick={handleLogout} className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Sair</button>
          </div>
        </div>
      ) : perfil === 'SERVIDOR_LIMITADO' ? (
        <div className="min-h-screen bg-[#0b1220] text-slate-200">
          <header className="flex items-center justify-between border-b border-[#26344a] bg-[#172033] px-4 py-4 sm:px-8">
            <span className="text-lg font-bold text-white">CIAPI · Requerimentos</span>
            <button type="button" onClick={handleLogout} className="rounded-xl border border-[#26344a] px-4 py-2 text-sm hover:bg-slate-800">Sair</button>
          </header>
          <main className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
            <section className="rounded-2xl border border-[#26344a] bg-[#172033] p-6">
              <h1 className="text-2xl font-bold text-white">Meus requerimentos</h1>
              <p className="mt-3 text-sm text-slate-400">
                Seu acesso está reservado para requerimentos. O formulário será liberado após o vínculo seguro com seu cadastro de servidor.
              </p>
            </section>
          </main>
        </div>
      ) : ambiente === 'sae' ? (
        <SaeApp />
      ) : (
        <div className="flex min-h-screen bg-bg-dark">
          <Sidebar activeTab={activeTab} setActiveTab={(tab: string) => navigateWithAction(tab)} onLogout={handleLogout} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar title={getPageTitle()} />
            <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
              <div className="app-page">
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
