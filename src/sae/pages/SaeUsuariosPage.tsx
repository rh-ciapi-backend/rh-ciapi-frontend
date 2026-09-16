import React, { useMemo, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  UserPlus,
  Users,
  UserCheck,
  UserX,
  Clock3,
  MoreHorizontal,
  Eye,
  Pencil,
  Phone,
  MapPin,
  IdCard,
} from 'lucide-react';
import { motion } from 'motion/react';

type SituacaoUsuario = 'ATIVO' | 'INATIVO' | 'TRIAGEM';

interface UsuarioResumo {
  id: string;
  prontuario?: string | null;
  nome: string;
  sexo?: string | null;
  dataNascimento?: string | null;
  idade?: number | null;
  turno?: string | null;
  situacao: SituacaoUsuario;
  telefone?: string | null;
  bairro?: string | null;
}

const usuarios: UsuarioResumo[] = [];

const statusStyles: Record<SituacaoUsuario, string> = {
  ATIVO: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  INATIVO: 'border-slate-500/20 bg-slate-500/10 text-slate-400',
  TRIAGEM: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
};

export default function SaeUsuariosPage() {
  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState<'TODOS' | SituacaoUsuario>('TODOS');
  const [turno, setTurno] = useState<'TODOS' | 'MANHÃ' | 'TARDE'>('TODOS');

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const atendeBusca =
        !termo ||
        usuario.nome.toLowerCase().includes(termo) ||
        (usuario.prontuario ?? '').toLowerCase().includes(termo);

      const atendeSituacao =
        situacao === 'TODOS' || usuario.situacao === situacao;

      const atendeTurno =
        turno === 'TODOS' || usuario.turno === turno;

      return atendeBusca && atendeSituacao && atendeTurno;
    });
  }, [busca, situacao, turno]);

  const totalAtivos = usuarios.filter((u) => u.situacao === 'ATIVO').length;
  const totalInativos = usuarios.filter((u) => u.situacao === 'INATIVO').length;
  const totalTriagem = usuarios.filter((u) => u.situacao === 'TRIAGEM').length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-6"
    >
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Gestão de Usuários
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
            Usuários
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Consulte e acompanhe os usuários atendidos pelo CIAPI de forma simples e organizada.
          </p>
        </div>

        <button
          type="button"
          disabled
          title="Será habilitado quando o cadastro estiver integrado ao banco do SAE."
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white opacity-50 shadow-lg shadow-primary/10 cursor-not-allowed"
        >
          <UserPlus size={18} />
          Novo Usuário
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total de Usuários"
          value={usuarios.length}
          helper="Cadastros disponíveis"
          icon={Users}
          iconClass="text-blue-400 bg-blue-500/10 border-blue-500/20"
        />

        <KpiCard
          label="Usuários Ativos"
          value={totalAtivos}
          helper="Em acompanhamento"
          icon={UserCheck}
          iconClass="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        />

        <KpiCard
          label="Em Triagem"
          value={totalTriagem}
          helper="Aguardando definição"
          icon={Clock3}
          iconClass="text-amber-400 bg-amber-500/10 border-amber-500/20"
        />

        <KpiCard
          label="Usuários Inativos"
          value={totalInativos}
          helper="Cadastros inativos"
          icon={UserX}
          iconClass="text-rose-400 bg-rose-500/10 border-rose-500/20"
        />
      </div>

      <section className="rounded-[20px] border border-border-dark bg-card-dark p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_220px_220px]">
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Buscar
            </label>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome ou número do prontuário..."
                className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 pl-10 pr-4 text-sm text-white outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20 placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Situação
            </label>

            <select
              value={situacao}
              onChange={(e) =>
                setSituacao(e.target.value as 'TODOS' | SituacaoUsuario)
              }
              className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-slate-200 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">Todos</option>
              <option value="ATIVO">Ativos</option>
              <option value="TRIAGEM">Em triagem</option>
              <option value="INATIVO">Inativos</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Turno
            </label>

            <select
              value={turno}
              onChange={(e) =>
                setTurno(e.target.value as 'TODOS' | 'MANHÃ' | 'TARDE')
              }
              className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-slate-200 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">Todos</option>
              <option value="MANHÃ">Manhã</option>
              <option value="TARDE">Tarde</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-dark pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <SlidersHorizontal size={14} />
            Filtros rápidos
          </div>

          <button
            type="button"
            onClick={() => setSituacao('ATIVO')}
            className="rounded-full border border-border-dark bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-primary/30 hover:text-white"
          >
            Somente ativos
          </button>

          <button
            type="button"
            onClick={() => {
              setBusca('');
              setSituacao('TODOS');
              setTurno('TODOS');
            }}
            className="rounded-full border border-border-dark bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:text-white"
          >
            Limpar filtros
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[20px] border border-border-dark bg-card-dark">
        <div className="flex items-center justify-between gap-3 border-b border-border-dark px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-white">
              Lista de usuários
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {usuariosFiltrados.length} registro(s) encontrado(s)
            </p>
          </div>
        </div>

        {usuariosFiltrados.length > 0 ? (
          <>
            <div className="hidden lg:block">
              <div className="grid grid-cols-[110px_1.4fr_110px_110px_140px_140px_56px] gap-3 border-b border-border-dark bg-slate-800/30 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <span>Prontuário</span>
                <span>Usuário</span>
                <span>Sexo</span>
                <span>Turno</span>
                <span>Situação</span>
                <span>Contato</span>
                <span />
              </div>

              {usuariosFiltrados.map((usuario) => (
                <UsuarioRow key={usuario.id} usuario={usuario} />
              ))}
            </div>

            <div className="divide-y divide-border-dark lg:hidden">
              {usuariosFiltrados.map((usuario) => (
                <UsuarioCard key={usuario.id} usuario={usuario} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </section>
    </motion.section>
  );
}

function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: number;
  helper: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <article className="rounded-[20px] border border-border-dark bg-card-dark p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {helper}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${iconClass}`}
        >
          <Icon size={18} />
        </div>
      </div>
    </article>
  );
}

function UsuarioRow({ usuario }: { usuario: UsuarioResumo }) {
  return (
    <div className="grid grid-cols-[110px_1.4fr_110px_110px_140px_140px_56px] items-center gap-3 border-b border-border-dark px-5 py-4 text-sm last:border-b-0 hover:bg-slate-800/20">
      <span className="font-semibold text-slate-300">
        {usuario.prontuario || '—'}
      </span>

      <div className="min-w-0">
        <p className="truncate font-semibold text-white">
          {usuario.nome}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          {usuario.idade != null && <span>{usuario.idade} anos</span>}
          {usuario.bairro && (
            <>
              <span>•</span>
              <span>{usuario.bairro}</span>
            </>
          )}
        </div>
      </div>

      <span className="text-slate-400">
        {usuario.sexo || '—'}
      </span>

      <span className="text-slate-400">
        {usuario.turno || '—'}
      </span>

      <div>
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyles[usuario.situacao]}`}
        >
          {usuario.situacao}
        </span>
      </div>

      <span className="text-slate-400">
        {usuario.telefone || '—'}
      </span>

      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white"
        aria-label={`Ações de ${usuario.nome}`}
      >
        <MoreHorizontal size={18} />
      </button>
    </div>
  );
}

function UsuarioCard({ usuario }: { usuario: UsuarioResumo }) {
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">
            {usuario.nome}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Prontuário {usuario.prontuario || '—'}
          </p>
        </div>

        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyles[usuario.situacao]}`}
        >
          {usuario.situacao}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <IdCard size={14} className="text-slate-600" />
          {usuario.turno || 'Turno não informado'}
        </div>

        <div className="flex items-center gap-2">
          <Phone size={14} className="text-slate-600" />
          {usuario.telefone || 'Sem telefone'}
        </div>

        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-slate-600" />
          {usuario.bairro || 'Bairro não informado'}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border-dark bg-slate-800/50 px-3 py-2.5 text-xs font-semibold text-slate-300"
        >
          <Eye size={15} />
          Abrir
        </button>

        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border-dark bg-slate-800/50 px-3 py-2.5 text-xs font-semibold text-slate-300"
        >
          <Pencil size={15} />
          Editar
        </button>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center px-6 py-12 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
          <Users size={22} />
        </div>

        <h3 className="mt-4 text-base font-bold text-white">
          Nenhum usuário carregado
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          A estrutura visual do módulo está pronta. Os registros aparecerão aqui
          quando o banco de usuários do SAE for conectado.
        </p>
      </div>
    </div>
  );
}
