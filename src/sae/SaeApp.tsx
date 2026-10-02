import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

import SaeSidebar, { SaeTab } from './components/SaeSidebar';
import SaeTopbar from './components/SaeTopbar';
import SaeDashboardPage from './pages/SaeDashboardPage';
import SaeUsuariosPage from './pages/SaeUsuariosPage';
import SaeUsuarioPerfilPage from './pages/SaeUsuarioPerfilPage';
import SaeTriagemPage from './pages/SaeTriagemPage';
import SaeAgendamentosPage from './pages/SaeAgendamentosPage';
import SaeRelatoriosPage from './pages/SaeRelatoriosPage';
import type { SaeAgendamentoFoco } from './types/saeNavegacao';
import { saeDocumentosService } from './services/saeDocumentosService';
import SaeMapaProfissionalPage from './pages/SaeMapaProfissionalPage';
import SaeMapasAdminPage from './pages/SaeMapasAdminPage';
import SaeAtendimentosPage from './pages/SaeAtendimentosPage';
import SaeProfissionaisPage from './pages/SaeProfissionaisPage';
import SaeRelatoriosAdminPage from './pages/SaeRelatoriosAdminPage';

export default function SaeApp() {
  const { signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<SaeTab>('dashboard');
  const [restrictedProfessional, setRestrictedProfessional] = useState(false);
  const [accessResolved, setAccessResolved] = useState(false);
  const [usuarioSelecionadoId, setUsuarioSelecionadoId] =
    useState<string | null>(null);
  const [agendamentoFoco, setAgendamentoFoco] =
    useState<SaeAgendamentoFoco | null>(null);

  useEffect(() => {
    let mounted = true;

    saeDocumentosService.contexto()
      .then((contexto) => {
        if (!mounted) return;

        const restricted = Boolean(
          contexto.profissional?.ativo &&
          !contexto.podeAdministrar,
        );

        setRestrictedProfessional(restricted);

        if (restricted) {
          setActiveTab('relatorios');
          setUsuarioSelecionadoId(null);
          setAgendamentoFoco(null);
        } else {
          setActiveTab('usuarios');
        }
      })
      .catch(() => {
        // Falha no contexto não amplia permissões.
        if (mounted) setRestrictedProfessional(false);
      })
      .finally(() => {
        if (mounted) setAccessResolved(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao sair do SAE:', error);
    }
  };

  const handleChangeTab = (tab: SaeTab) => {
    if (restrictedProfessional && tab !== 'relatorios' && tab !== 'mapas') {
      setActiveTab('relatorios');
      return;
    }

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
        return <SaeAtendimentosPage />;

      case 'sinais-vitais':
        return <SaeAtendimentosPage />;

      case 'mapas':
        return restrictedProfessional
          ? <SaeMapaProfissionalPage />
          : <SaeMapasAdminPage />;

      case 'profissionais':
        return restrictedProfessional
          ? <SaeRelatoriosPage />
          : <SaeProfissionaisPage />;

      case 'relatorios':
        return restrictedProfessional
          ? <SaeRelatoriosPage />
          : <SaeRelatoriosAdminPage />;

      default:
        return restrictedProfessional ? <SaeRelatoriosPage /> : <SaeUsuariosPage onAbrirUsuario={abrirUsuario} />;
    }
  };

  if (!accessResolved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-dark text-slate-400">
        Carregando SAE...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg-dark text-white">
      <SaeSidebar
        activeTab={activeTab}
        onChange={handleChangeTab}
        onLogout={handleLogout}
        restrictedProfessional={restrictedProfessional}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <SaeTopbar
          activeTab={activeTab}
          restrictedProfessional={restrictedProfessional}
        />

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
