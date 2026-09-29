import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminUsuariosPage from '../pages/AdminUsuariosPage';

import SaeSidebar, { SaeTab } from './components/SaeSidebar';
import SaeTopbar from './components/SaeTopbar';
import SaeDashboardPage from './pages/SaeDashboardPage';
import SaeUsuariosPage from './pages/SaeUsuariosPage';
import SaeUsuarioPerfilPage from './pages/SaeUsuarioPerfilPage';
import SaeTriagemPage from './pages/SaeTriagemPage';
import SaeAgendamentosPage from './pages/SaeAgendamentosPage';

export default function SaeApp() {
  const { signOut, acesso, session, accessError, isAccessLoading, setAmbiente } = useAuth();
  const [administrandoUsuarios, setAdministrandoUsuarios] = useState(false);

  const [activeTab, setActiveTab] = useState<SaeTab>('dashboard');
  const [usuarioSelecionadoId, setUsuarioSelecionadoId] =
    useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao sair do SAE:', error);
    }
  };

  const handleChangeTab = (tab: SaeTab) => {
    setAdministrandoUsuarios(false);
    setActiveTab(tab);

    if (tab !== 'usuarios') {
      setUsuarioSelecionadoId(null);
    }
  };

  const abrirUsuario = (usuarioId: string) => {
    setActiveTab('usuarios');
    setUsuarioSelecionadoId(usuarioId);
  };

  const voltarParaUsuarios = () => {
    setUsuarioSelecionadoId(null);
  };

  const renderContent = () => {
    if (administrandoUsuarios) return <AdminUsuariosPage />;
    switch (activeTab) {
      case 'dashboard':
        return <SaeDashboardPage />;

      case 'usuarios':
        if (usuarioSelecionadoId) {
          return (
            <SaeUsuarioPerfilPage
              usuarioId={usuarioSelecionadoId}
              onVoltar={voltarParaUsuarios}
            />
          );
        }

        return (
          <SaeUsuariosPage
            onAbrirUsuario={abrirUsuario}
          />
        );

      case 'triagem':
        return (
          <SaeTriagemPage
            onIrAgendamentos={() =>
              setActiveTab('agendamentos')
            }
          />
        );

      case 'agendamentos':
        return <SaeAgendamentosPage />;

      case 'atendimentos':
        return (
          <PlaceholderPage
            title="Atendimentos"
            description="Registro dos atendimentos realizados pelos profissionais."
          />
        );

      case 'sinais-vitais':
        return (
          <PlaceholderPage
            title="Sinais Vitais"
            description="Monitoramento e histórico dos sinais vitais dos usuários."
          />
        );

      case 'mapas':
        return (
          <PlaceholderPage
            title="Mapas"
            description="Mapas e relatórios operacionais do SAE."
          />
        );

      case 'relatorios':
        return (
          <PlaceholderPage
            title="Relatórios"
            description="Indicadores, consolidados e exportações do SAE."
          />
        );

      default:
        return <SaeDashboardPage />;
    }
  };

  if (isAccessLoading || (session && !acesso && !accessError)) {
    return <div className="min-h-screen bg-[#0b1220] p-8 text-white">Carregando acesso...</div>;
  }
  if (!session || !acesso || acesso.auth_uid !== session.user.id || acesso.status !== 'ATIVO' || !acesso.ambientes_permitidos.includes('SAE')) {
    return <div className="min-h-screen bg-[#0b1220] p-8 text-white">Acesso não autorizado ao SAE.</div>;
  }

  return (
    <div className="flex min-h-screen bg-bg-dark text-white">
      <SaeSidebar
        activeTab={activeTab}
        onChange={handleChangeTab}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <SaeTopbar activeTab={activeTab} />
          <div className="flex flex-wrap justify-end gap-2 border-b border-[#26344a] px-4 py-2 sm:px-6">
            {(acesso.is_master || ['MASTER', 'ADMINISTRADOR'].includes(acesso.perfil)) && <button onClick={() => setAdministrandoUsuarios((value) => !value)} className="rounded-lg border border-[#26344a] bg-[#172033] px-3 py-2 text-xs text-slate-200">{administrandoUsuarios ? 'Voltar ao SAE' : 'Usuários do sistema'}</button>}
            {acesso.is_master && <button onClick={() => setAmbiente('rh')} className="rounded-lg border border-[#26344a] bg-[#172033] px-3 py-2 text-xs text-slate-200">Abrir CIAPI RH</button>}
          </div>

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto w-full max-w-[1600px]">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

interface PlaceholderPageProps {
  title: string;
  description: string;
}

function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          SAE
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
          {title}
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          {description}
        </p>
      </div>

      <div className="rounded-[20px] border border-border-dark bg-card-dark p-8">
        <p className="text-sm text-slate-400">
          Esta área já está integrada à navegação do SAE e será construída na próxima etapa.
        </p>
      </div>
    </section>
  );
}
