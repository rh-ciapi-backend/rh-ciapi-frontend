import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  UserPlus,
  Users,
  UserCheck,
  UserX,
  Sun,
  Sunset,
  MoreHorizontal,
  Eye,
  Pencil,
  Phone,
  MapPin,
  IdCard,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';

import { saeUsuariosService } from '../services/saeUsuariosService';
import NovoUsuarioModal from '../components/usuarios/NovoUsuarioModal';

import type {
  SaeUsuarioResumo,
  SituacaoUsuario,
} from '../types/saeUsuario';

const statusStyles: Record<SituacaoUsuario, string> = {
  ATIVO:
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  INATIVO:
    'border-slate-500/20 bg-slate-500/10 text-slate-400',
};

export default function SaeUsuariosPage() {
  const [usuarios, setUsuarios] = useState<SaeUsuarioResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [novoUsuarioAberto, setNovoUsuarioAberto] = useState(false);

  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] =
    useState<'TODOS' | SituacaoUsuario>('TODOS');
  const [turno, setTurno] =
    useState<'TODOS' | 'MANHÃ' | 'TARDE'>('TODOS');

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await saeUsuariosService.listar();

      setUsuarios(dados);
    } catch (error) {
      console.error('Erro ao carregar usuários do SAE:', error);

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os usuários.',
      );
    } finally {
      setCarregando(false);
    }
  };

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const atendeBusca =
        !termo ||
        usuario.nome.toLowerCase().includes(termo) ||
        usuario.prontuario.toLowerCase().includes(termo);

      const atendeSituacao =
        situacao === 'TODOS' ||
        usuario.situacao === situacao;

      const atendeTurno =
        turno === 'TODOS' ||
        usuario.turno === turno;

      return (
        atendeBusca &&
        atendeSituacao &&
        atendeTurno
      );
    });
  }, [usuarios, busca, situacao, turno]);

  const totalAtivos = useMemo(
    () =>
      usuarios.filter(
        (usuario) => usuario.situacao === 'ATIVO',
      ).length,
    [usuarios],
  );

  const totalInativos = useMemo(
    () =>
      usuarios.filter(
        (usuario) => usuario.situacao === 'INATIVO',
      ).length,
    [usuarios],
  );

  const totalManha = useMemo(
    () =>
      usuarios.filter(
        (usuario) =>
          usuario.situacao === 'ATIVO' &&
          usuario.turno === 'MANHÃ',
      ).length,
    [usuarios],
  );

  const totalTarde = useMemo(
    () =>
      usuarios.filter(
        (usuario) =>
          usuario.situacao === 'ATIVO' &&
          usuario.turno === 'TARDE',
      ).length,
    [usuarios],
  );

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
            Consulte e acompanhe os usuários atendidos pelo CIAPI.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setNovoUsuarioAberto(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/10 transition hover:bg-blue-600"
        >
          <UserPlus size={18} />
          Novo Usuário
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total de Usuários"
          value={usuarios.length}
          helper="Cadastros disponíveis"
          icon={Users}
          iconClass="border-blue-500/20 bg-blue-500/10 text-blue-400"
        />

        <KpiCard
          label="Usuários Ativos"
          value={totalAtivos}
          helper="Em acompanhamento"
          icon={UserCheck}
          iconClass="border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
        />

        <KpiCard
          label="Turno da Manhã"
          value={totalManha}
          helper="Usuários ativos"
          icon={Sun}
          iconClass="border-amber-500/20 bg-amber-500/10 text-amber-400"
        />

        <KpiCard
          label="Turno da Tarde"
          value={totalTarde}
          helper="Usuários ativos"
          icon={Sunset}
          iconClass="border-orange-500/20 bg-orange-500/10 text-orange-400"
        />

        <KpiCard
          label="Usuários Inativos"
          value={totalInativos}
          helper="Cadastros inativos"
          icon={UserX}
          iconClass="border-rose-500/20 bg-rose-500/10 text-rose-400"
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
                className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
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
                setSituacao(
                  e.target.value as
                    | 'TODOS'
                    | SituacaoUsuario,
                )
              }
              className="h-11 w-full rounded-xl border border-border-dark bg-slate-800/60 px-3 text-sm text-slate-200 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">Todos</option>
              <option value="ATIVO">Ativos</option>
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
                setTurno(
                  e.target.value as
                    | 'TODOS'
                    | 'MANHÃ'
                    | 'TARDE',
                )
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

        {carregando ? (
          <LoadingState />
        ) : erro ? (
          <ErrorState
            mensagem={erro}
            onRetry={carregarUsuarios}
          />
        ) : usuariosFiltrados.length > 0 ? (
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
                <UsuarioRow
                  key={usuario.id}
                  usuario={usuario}
                />
              ))}
            </div>

            <div className="divide-y divide-border-dark lg:hidden">
              {usuariosFiltrados.map((usuario) => (
                <UsuarioCard
                  key={usuario.id}
                  usuario={usuario}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </section>

      <NovoUsuarioModal
        aberto={novoUsuarioAberto}
        onClose={() => setNovoUsuarioAberto(false)}
        onSalvo={(usuario) => {
          setNovoUsuarioAberto(false);

          setUsuarios((atuais) =>
            [...atuais, usuario].sort((a, b) =>
              a.nome.localeCompare(b.nome, 'pt-BR'),
            ),
          );
        }}
      />
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

function UsuarioRow({
  usuario,
}: {
  usuario: SaeUsuarioResumo;
}) {
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
          {usuario.idade != null && (
            <span>{usuario.idade} anos</span>
          )}

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
        {usuario.telefonePrincipal || '—'}
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

function UsuarioCard({
  usuario,
}: {
  usuario: SaeUsuarioResumo;
}) {
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
          <IdCard
            size={14}
            className="text-slate-600"
          />
          {usuario.turno || 'Turno não informado'}
        </div>

        <div className="flex items-center gap-2">
          <Phone
            size={14}
            className="text-slate-600"
          />
          {usuario.telefonePrincipal || 'Sem telefone'}
        </div>

        <div className="flex items-center gap-2">
          <MapPin
            size={14}
            className="text-slate-600"
          />
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

function LoadingState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="text-center">
        <Loader2
          size={28}
          className="mx-auto animate-spin text-primary"
        />

        <p className="mt-3 text-sm text-slate-400">
          Carregando usuários...
        </p>
      </div>
    </div>
  );
}

function ErrorState({
  mensagem,
  onRetry,
}: {
  mensagem: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[320px] items-center justify-center px-6 py-12 text-center">
      <div className="max-w-md">
        <AlertCircle
          size={28}
          className="mx-auto text-rose-400"
        />

        <h3 className="mt-4 font-bold text-white">
          Não foi possível carregar os usuários
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          {mensagem}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white"
        >
          Tentar novamente
        </button>
      </div>
    </div>
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
          Nenhum usuário encontrado
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Não existem registros correspondentes aos filtros selecionados.
        </p>
      </div>
    </div>
  );
}
