/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardPage } from './pages/DashboardPage';
import { ServidoresPage } from './pages/ServidoresPage';
import { FeriasPage } from './pages/FeriasPage';
import { FrequenciaPage } from './pages/FrequenciaPage';
import { MapasPage } from './pages/MapasPage';
import { AdminPage } from './pages/AdminPage';
import { AdminUsuariosPage } from './pages/AdminUsuariosPage';
import { AdminCategoriasPage } from './pages/AdminCategoriasPage';
import { AdminSetoresPage } from './pages/AdminSetoresPage';
import { AdminLogsPage } from './pages/AdminLogsPage';
import { LoginPage } from './pages/LoginPage';
import AtestadosPage from './pages/AtestadosPage';
import { DiagnosticoPage } from './pages/DiagnosticoPage';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [initialAction, setInitialAction] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOut();
  };

  const navigateWithAction = (tab: string, action?: string) => {
    setActiveTab(tab);
    if (action) {
      setInitialAction(action);
    } else {
      setInitialAction(null);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={navigateWithAction} />;
      case 'servidores':
        return (
          <ServidoresPage
            initialAction={initialAction}
            onActionHandled={() => setInitialAction(null)}
          />
        );
      case 'atestados':
        return <AtestadosPage />;
      case 'ferias':
        return <FeriasPage />;
      case 'frequencia':
        return <FrequenciaPage />;
      case 'mapas':
        return <MapasPage />;
      case 'admin':
        return <AdminPage onNavigate={navigateWithAction} />;
      case 'admin-usuarios':
        return <AdminUsuariosPage />;
      case 'admin-categorias':
        return <AdminCategoriasPage />;
      case 'admin-setores':
        return <AdminSetoresPage />;
      case 'admin-logs':
        return <AdminLogsPage />;
      case 'diagnostico':
        return <DiagnosticoPage />;
      default:
        return <DashboardPage onNavigate={navigateWithAction} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'servidores':
        return 'Gestão de Servidores';
      case 'atestados':
        return 'Gestão de Atestados';
      case 'ferias':
        return 'Controle de Férias';
      case 'frequencia':
        return 'Frequência Mensal';
      case 'mapas':
        return 'Mapas Institucionais';
      case 'admin':
        return 'Administração do Sistema';
      case 'admin-usuarios':
        return 'Usuários do Sistema';
      case 'admin-categorias':
        return 'Gestão de Categorias';
      case 'admin-setores':
        return 'Gestão de Setores';
      case 'admin-logs':
        return 'Logs de Atividade';
      case 'diagnostico':
        return 'Diagnóstico de Conexão';
      default:
        return 'CIAPI RH';
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-bg-dark">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => navigateWithAction(tab)}
          onLogout={handleLogout}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title={getPageTitle()} />

          <main className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
