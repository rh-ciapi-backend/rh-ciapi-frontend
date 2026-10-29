/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { InstitutionalHeader } from './components/InstitutionalHeader';
import { InstitutionalNav } from './components/InstitutionalNav';
import { ContextualModuleMenu } from './components/ContextualModuleMenu';
import './ciapi-contextual-layout.css';
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
  const [selectedModule, setSelectedModule] = useState('dashboard');
  const [showModulePage, setShowModulePage] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [servidoresNavigationId, setServidoresNavigationId] = useState(0);

  const handleLogout = useCallback(async () => {
    try { await signOut(); } catch (error) { console.error('Erro ao sair da sessão:', error); }
  }, [signOut]);

  const navigateWithAction = useCallback((tab: string, action?: string) => {
    const safeTab: AppTab = isValidTab(tab) ? tab : 'dashboard';
    setActiveTab(safeTab);
    setSelectedModule(safeTab === 'dashboard' ? 'dashboard' : (['admin','admin-usuarios','admin-categorias','admin-setores','admin-logs'].includes(safeTab) ? 'admin' : safeTab));
    setInitialAction(action || (safeTab === 'servidores' ? 'pesquisar' : null));
    setShowModulePage(safeTab === 'servidores' || Boolean(action));
    if (safeTab === 'servidores') setServidoresNavigationId(v => v + 1);
  }, []);

  const moduleByTab: Record<string,string> = { dashboard:'dashboard', servidores:'servidores', frequencia:'frequencia', ferias:'ferias', mapas:'mapas', atestados:'atestados', requerimentos:'requerimentos', admin:'admin', 'admin-usuarios':'admin', 'admin-categorias':'admin', 'admin-setores':'admin', 'admin-logs':'admin', diagnostico:'diagnostico' };
  const openModule = (module: string, tab: string) => {
    setSelectedModule(module);
    setActiveTab(isValidTab(tab) ? tab : 'dashboard');
    setInitialAction(module === 'servidores' ? 'pesquisar' : module === 'mapas' ? 'mapa-comissionados-setrabes' : module === 'requerimentos' ? 'estadual' : null);
    setShowModulePage(module === 'servidores' || module === 'mapas' || module === 'requerimentos');
    if (module === 'servidores') setServidoresNavigationId(v => v + 1);
    setSidebarCollapsed(false);
  };
  const openFromSide = (tab:string, action?:string) => {
    navigateWithAction(tab, action);
  };
  const moduleHeading: Record<string,string> = { servidores:'Consulta de servidores', frequencia:'Frequência mensal', ferias:'Consulta e plano de férias', mapas:'Mapas institucionais', atestados:'Consulta de atestados', requerimentos:'Consulta de requerimentos', admin:'Administração', diagnostico:'Diagnóstico' };
  const displayedModule = selectedModule === 'dashboard' ? moduleByTab[activeTab] : selectedModule;
  const guardedModule = displayedModule !== 'dashboard';
  // Restrição visual temporária: só a conta autorizada visualiza os módulos.
  // Para proteger dados, replicar a regra também nas APIs e nas políticas de acesso.
  const emailAutenticado = String(session?.user?.email || '').trim().toLowerCase();
  const manutencaoPermitida = Boolean(session && acessoAtual && emailAutenticado === 'joabbys@hotmail.com' && String(acesso?.email || '').trim().toLowerCase() === emailAutenticado);
  const moduloEmManutencao = (activeTab === 'ferias' || activeTab === 'atestados') && !manutencaoPermitida;
  const requerimentoEmManutencao = activeTab === 'requerimentos' &&
    (initialAction === 'federal' || initialAction === 'insalubridade');
  const renderSelectedContent = () => {
    if (requerimentoEmManutencao) {
      return (
        <section role="status" className="mx-auto w-full max-w-3xl rounded-2xl border border-[#d8e5f5] bg-white px-6 py-12 text-center shadow-sm sm:px-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf3ff] text-3xl" aria-hidden="true">🛠️</div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2563eb]">CIAPI RH · Requerimentos</p>
          <h2 className="text-2xl font-extrabold text-[#082c50]">Módulo em manutenção</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-600">
            {initialAction === 'federal' ? 'Servidor Federal' : 'Insalubridade'} está em preparação. O acesso estará disponível em breve.
          </p>
          <button type="button" className="mt-7 rounded-lg bg-[#1566bf] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0d519b]" onClick={() => navigateWithAction('requerimentos', 'estadual')}>
            Abrir Servidor Estadual
          </button>
        </section>
      );
    }

    if (moduloEmManutencao) {
      return (
        <section className="mx-auto w-full max-w-3xl rounded-2xl border border-[#d8e5f5] bg-white px-6 py-12 text-center shadow-sm sm:px-10" role="status" aria-live="polite">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf3ff] text-3xl" aria-hidden="true">🛠️</div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2563eb]">Portal Intranet CIAPI</p>
          <h2 className="text-2xl font-extrabold text-[#082c50]">Módulo em manutenção</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-600">
            Estamos realizando melhorias no módulo de {activeTab === 'ferias' ? 'Férias' : 'Atestados'}.
            O acesso estará disponível em breve.
          </p>
          <button type="button" className="mt-7 rounded-lg bg-[#1566bf] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0d519b]" onClick={() => navigateWithAction('dashboard')}>
            Voltar ao início
          </button>
        </section>
      );
    }
    if (guardedModule && !showModulePage && displayedModule !== 'servidores') {
      return <section className="ciapi-entry" aria-label="Abertura do módulo">
        <div className="ciapi-entry__icon" aria-hidden="true">⌕</div>
        <p className="ciapi-entry__eyebrow">CIAPI RH · {displayedModule.toUpperCase()}</p>
        <h2>{moduleHeading[displayedModule] || 'Consulta institucional'}</h2>
        <p>Selecione uma opção no menu lateral ou abra a consulta para visualizar os registros. As tabelas não são carregadas nesta tela inicial.</p>
        <button type="button" onClick={() => setShowModulePage(true)}>Abrir consulta / gerenciamento →</button>
      </section>;
    }
    return <div className={guardedModule ? 'ciapi-existing-module' : ''}>{renderContent()}</div>;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage onNavigate={navigateWithAction} />;
      case 'servidores': return <ServidoresPage key={servidoresNavigationId} initialAction={initialAction || 'pesquisar'} onActionHandled={() => setInitialAction(null)} />;
      case 'atestados': return <AtestadosPage />;
      case 'ferias': return <FeriasPage />;
      case 'frequencia': return <FrequenciaPage initialAction={initialAction} />;
      case 'mapas': return <MapasPage initialAction={initialAction} />;
      case 'requerimentos': return <RequerimentosPage key={initialAction === 'estadual' ? 'estadual' : 'lista'} initialView={initialAction === 'estadual' ? 'novo' : 'lista'} podeArquivar={Boolean(acessoAtual?.isMaster || ['ADMINISTRADOR', 'RH'].includes(acessoAtual?.perfil || ''))} />;
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
        <div className="ciapi-horizontal-layout ciapi-contextual-app app-shell institutional-app min-h-screen min-w-0">
          <InstitutionalHeader compact subtitle="Sistema Integrado de Gestão de Recursos Humanos" />
          <InstitutionalNav activeTab={activeTab} selectedModule={displayedModule} onOpenModule={openModule} onNavigate={navigateWithAction} onLogout={handleLogout} />
          <div className="app-content-column flex min-w-0 flex-1 flex-col">
            <Topbar title={getPageTitle()} />
            {acesso?.is_master && (
              <div className="ciapi-secondary-actions flex justify-end px-3 py-2 sm:px-6">
                <button
                  type="button"
                  onClick={() => setAmbiente('sae')}
                  className="min-h-10 rounded-lg border border-[#26344a] bg-[#172033] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-blue-500 hover:text-white"
                >
                  Abrir ambiente SAE
                </button>
              </div>
            )}
            <div className="ciapi-contextual-workspace">
              {guardedModule && <ContextualModuleMenu module={displayedModule} activeTab={activeTab} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} onSelect={openFromSide} isAdmin={Boolean(acessoAtual?.isMaster || acessoAtual?.perfil === 'ADMINISTRADOR')} />}
              <main className="app-main ciapi-contextual-main flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7">
                <div className="app-page app-main-inner">
                  <AnimatePresence mode="wait">
                    <motion.div key={`${activeTab}-${showModulePage}-${activeTab === 'mapas' || activeTab === 'requerimentos' ? (initialAction || '') : ''}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                      {renderSelectedContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </main>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
