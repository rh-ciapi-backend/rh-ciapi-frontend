import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

import SaeSidebar, { SaeTab } from './components/SaeSidebar';
import SaeTopbar from './components/SaeTopbar';
import SaeDashboardPage from './pages/SaeDashboardPage';
import SaeUsuariosPage from './pages/SaeUsuariosPage';
import SaeUsuarioPerfilPage from './pages/SaeUsuarioPerfilPage';
import SaeTriagemPage from './pages/SaeTriagemPage';
import SaeAgendamentosPage from './pages/SaeAgendamentosPage';
import type { SaeAgendamentoFoco } from './types/saeNavegacao';

export default function SaeApp() {
  const { signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<SaeTab>('dashboard');
  const [usuarioSelecionadoId, setUsuarioSelecionadoId] =
    useState<string | null>(null);
  const [agendamentoFoco, setAgendamentoFoco] =
    useState<SaeAgendamentoFoco | null>(null);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao sair do SAE:', error);
    }
  };

  const handleChangeTab = (tab: SaeTab) => {
    setActiveTab(tab);

    if (tab !== 'usuarios') {
      setUsuarioSelecionadoId(null);
    }

    // Ao entrar em Agendamentos pela sidebar, mostramos a listagem normal.
    // O foco específico é usado somente quando a navegação parte da Triagem.
    if (tab === 'agendamentos') {
      setAgendamentoFoco(null);
    }
  };

  const abrirUsuario = (usuarioId: string) => {
    setActiveTab('usuarios');
    setUsuarioSelecionadoId(usuarioId);
  };

  const voltarParaUsuarios = () => {
    setUsuarioSelecionadoId(null);
  };

  const abrirAgendamentos = (foco?: SaeAgendamentoFoco) => {
    setUsuarioSelecionadoId(null);
    setAgendamentoFoco(foco || null);
    setActiveTab('agendamentos');
  };

  const renderContent = () => {
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
            onIrAgendamentos={abrirAgendamentos}
            onAbrirUsuario={abrirUsuario}
          />
        );

      case 'agendamentos':
        return (
          <SaeAgendamentosPage
            focoInicial={agendamentoFoco}
            onLimparFoco={() => setAgendamentoFoco(null)}
          />
        );

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

  return (
    <div className="app-shell flex min-h-screen min-w-0 bg-bg-dark text-white">
      <SaeSidebar
        activeTab={activeTab}
        onChange={handleChangeTab}
        onLogout={handleLogout}
      />

      <div className="app-content-column flex min-w-0 flex-1 flex-col">
        <SaeTopbar activeTab={activeTab} />

        <main className="app-main flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7">
          <div className="app-main-inner mx-auto w-full max-w-[1600px]">
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

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          {description}
        </p>
      </div>

      <div className="rounded-[18px] border border-border-dark bg-card-dark p-5 sm:rounded-[20px] sm:p-8">
        <p className="text-sm text-slate-400">
          Esta área já está integrada à navegação do SAE e será construída na próxima etapa.
        </p>
      </div>
    </section>
  );
}
