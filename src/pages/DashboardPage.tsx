import './dashboard-home-ciapi.css';
import AgendaLembretesCIAPI from '../components/dashboard/AgendaLembretesCIAPI';
import './dashboard-rh-restaurado.css';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserCheck,
  Calendar,
  AlertCircle,
  Map,
  Clock,
  ChevronRight,
  CalendarDays,
  Clock3,
} from 'lucide-react';
import { servidoresService } from '../services/servidoresService';
import type { Servidor } from '../types';
import BirthdayPanel from '../components/dashboard/BirthdayPanel';
import AniversariantesDoDia from '../components/AniversariantesDoDia';
import { useAuth } from '../contexts/AuthContext';

type DashboardPageProps = {
  onNavigate: (tab: string, action?: string) => void;
};

type DashboardStats = {
  total: number;
  ativos: number;
  ferias: number;
  faltas: number;
};

const safeString = (value: unknown) => String(value ?? '').trim();

const normalizeStatus = (value: unknown) => safeString(value).toUpperCase();

const normalizeServidoresArray = (raw: unknown): Servidor[] => {
  if (Array.isArray(raw)) return raw as Servidor[];

  if (raw && typeof raw === 'object') {
    const possibleData = (raw as any).data;
    if (Array.isArray(possibleData)) return possibleData as Servidor[];

    const possibleItems = (raw as any).items;
    if (Array.isArray(possibleItems)) return possibleItems as Servidor[];
  }

  return [];
};

const normalizeServidor = (
  servidor: Partial<Servidor> | null | undefined,
): Servidor => {
  const nomeCompleto = safeString(
    servidor?.nomeCompleto ||
      (servidor as any)?.nome_completo ||
      servidor?.nome ||
      (servidor as any)?.servidor_nome,
  );

  const nome = safeString(
    servidor?.nome || nomeCompleto || 'Servidor sem nome',
  );

  return {
    ...(servidor as Servidor),
    id: safeString(
      servidor?.id ||
        (servidor as any)?.servidor ||
        (servidor as any)?.uuid ||
        (servidor as any)?.cpf ||
        nome,
    ),
    nome,
    nomeCompleto,
    status: (safeString(servidor?.status) || 'ATIVO') as Servidor['status'],
    setor: safeString(
      servidor?.setor ||
        (servidor as any)?.lotacao ||
        'Setor não informado',
    ),
    categoria: safeString(
      servidor?.categoria ||
        (servidor as any)?.categoria_canonica ||
        'Categoria não informada',
    ) as Servidor['categoria'],
    dataNascimento:
      safeString(
        servidor?.dataNascimento ||
          (servidor as any)?.data_nascimento ||
          servidor?.aniversario ||
          (servidor as any)?.nascimento,
      ) || null,
    aniversario:
      safeString(
        servidor?.aniversario ||
          servidor?.dataNascimento ||
          (servidor as any)?.data_nascimento,
      ) || null,
  };
};

type StatCardProps = {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconClass: string;
  onClick?: () => void;
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  onClick,
}: StatCardProps) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className={`ciapi-stat ${iconClass}`}>
      <span className="ciapi-stat__heading"><span className="ciapi-stat__icon"><Icon size={18} /></span><span>{title}</span><ChevronRight size={14} aria-hidden="true" /></span>
      <strong className="ciapi-stat__value">{value}</strong>
      <span className="ciapi-stat__caption">{subtitle}</span>
    </button>
  );
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    ativos: 0,
    ferias: 0,
    faltas: 0,
  });

  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const raw = await servidoresService.listar();
        const servidoresList =
          normalizeServidoresArray(raw).map(normalizeServidor);

        if (!isMounted) return;

        const ativos = servidoresList.filter(
          (servidor) => normalizeStatus(servidor.status) === 'ATIVO',
        ).length;

        setServidores(servidoresList);
        setStats((prev) => ({
          ...prev,
          total: servidoresList.length,
          ativos,
        }));
      } catch (err) {
        console.error('Erro ao buscar dados do dashboard:', err);

        if (!isMounted) return;

        setError(
          'Erro ao carregar dados do dashboard. Verifique a conexão com o servidor.',
        );
        setServidores([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const updateClock = () => setCurrentDateTime(new Date());

    updateClock();

    const interval = window.setInterval(updateClock, 60000);

    return () => window.clearInterval(interval);
  }, []);

  const hasData = useMemo(() => servidores.length > 0, [servidores]);

  const primeiroNome = useMemo(() => {
    const nomeCompleto = String(user?.user_metadata?.nome_completo || '').trim();

    if (nomeCompleto) {
      return nomeCompleto.split(/\s+/)[0];
    }

    const emailName = String(user?.email || '')
      .split('@')[0]
      .trim();

    if (emailName) {
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }

    return 'Usuário';
  }, [user]);

  const greeting = useMemo(() => {
    const hour = currentDateTime.getHours();

    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, [currentDateTime]);

  const formattedDate = useMemo(() => {
    const formatted = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(currentDateTime);

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [currentDateTime]);

  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(currentDateTime),
    [currentDateTime],
  );

  if (isLoading && !hasData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="ciapi-home-v2">
      {error && <div className="ciapi-home-error" role="alert">{error}</div>}
      <section className="ciapi-home-welcome" aria-label="Visão geral do CIAPI">
        <div><span className="ciapi-home-welcome__label">PAINEL DE PESSOAL</span><h2>{greeting}, {primeiroNome}!</h2><p>Seu dia de trabalho, organizado em um só lugar.</p></div>
        <div className="ciapi-home-welcome__date"><span><CalendarDays size={15} aria-hidden="true"/>{formattedDate}</span><span><Clock3 size={15} aria-hidden="true"/>{formattedTime}</span></div>
      </section>

      <section className="ciapi-home-stats" aria-label="Indicadores de servidores">
        <StatCard title="Servidores" value={stats.total} subtitle="Total de cadastros" icon={Users} iconClass="ciapi-stat--blue" onClick={() => onNavigate('servidores', 'pesquisar')}/>
        <StatCard title="Ativos" value={stats.ativos} subtitle="Em atividade" icon={UserCheck} iconClass="ciapi-stat--green" onClick={() => onNavigate('servidores', 'ativos')}/>
      </section>

      <section className="ciapi-home-shortcuts" aria-label="Acesso rápido">
        <h2>Acesso rápido</h2>
        <div className="ciapi-home-shortcuts__grid">
          <button type="button" onClick={() => onNavigate('frequencia', 'open')}><Clock size={20} aria-hidden="true"/><span>Frequência</span><ChevronRight size={15} aria-hidden="true"/></button>
          <button type="button" onClick={() => onNavigate('ferias', 'open')}><Calendar size={20} aria-hidden="true"/><span>Férias</span><ChevronRight size={15} aria-hidden="true"/></button>
          <button type="button" onClick={() => onNavigate('atestados', 'open')}><AlertCircle size={20} aria-hidden="true"/><span>Atestados</span><ChevronRight size={15} aria-hidden="true"/></button>
          <button type="button" onClick={() => onNavigate('mapas', 'mapa-comissionados-setrabes')}><Map size={20} aria-hidden="true"/><span>Mapas</span><ChevronRight size={15} aria-hidden="true"/></button>
        </div>
      </section>

      <section className="ciapi-home-bottom">
        <div className="ciapi-home-panel ciapi-home-birthdays">
          <AniversariantesDoDia servidores={servidores as any[]} isLoading={isLoading}/>
          <details className="ciapi-home-more-birthdays"><summary>Ver calendário e próximos aniversários</summary><BirthdayPanel servidores={servidores} isLoading={isLoading}/></details>
        </div>
        <AgendaLembretesCIAPI userId={user?.id || 'local'}/>
      </section>
    </div>
  );
};

export default DashboardPage;
