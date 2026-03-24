import React, { useMemo } from 'react';
import { Cake, CalendarDays, Gift, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import type { Servidor } from '../../types';

type BirthdayPanelProps = {
  servidores: Servidor[];
  isLoading?: boolean;
};

type BirthdayItem = {
  id: string;
  nome: string;
  setor: string;
  categoria: string;
  fotoUrl: string;
  dataNascimentoOriginal: string;
  dataFormatada: string;
  diasRestantes: number;
  proximoAniversario: Date;
  idadeQueVaiCompletar: number | null;
  badge: string;
  initials: string;
};

const safeString = (value: unknown) => String(value ?? '').trim();

const normalizeStatus = (value: unknown) => safeString(value).toUpperCase();

const getNomeServidor = (servidor: Partial<Servidor>) =>
  safeString(
    servidor.nomeCompleto ||
      servidor.nome ||
      (servidor as any)?.nome_completo ||
      (servidor as any)?.servidor_nome ||
      'Servidor sem nome',
  );

const getDataNascimento = (servidor: Partial<Servidor>) =>
  safeString(
    servidor.dataNascimento ||
      (servidor as any)?.data_nascimento ||
      servidor.aniversario ||
      (servidor as any)?.nascimento,
  );

const getFotoUrl = (servidor: Partial<Servidor>) =>
  safeString(
    (servidor as any)?.fotoUrl ||
      (servidor as any)?.foto_url ||
      (servidor as any)?.foto ||
      (servidor as any)?.avatar ||
      '',
  );

const getInitials = (name: string) => {
  const parts = safeString(name)
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return 'SV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
};

const toLocalDate = (value: string): Date | null => {
  const raw = safeString(value);
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const brMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const diffDays = (from: Date, to: Date) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay);
};

const formatBirthday = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);

const getUpcomingBirthday = (birthDate: Date, baseDate: Date) => {
  const currentYear = baseDate.getFullYear();
  let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());

  if (startOfDay(nextBirthday).getTime() < startOfDay(baseDate).getTime()) {
    nextBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
  }

  return nextBirthday;
};

const getAgeTurning = (birthDate: Date, nextBirthday: Date) => {
  const age = nextBirthday.getFullYear() - birthDate.getFullYear();
  return Number.isFinite(age) && age >= 0 ? age : null;
};

const getBadge = (daysRestantes: number) => {
  if (daysRestantes <= 0) return 'Hoje';
  if (daysRestantes === 1) return 'Amanhã';
  return `Em ${daysRestantes} dias`;
};

const summaryCardClass =
  'rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur-sm';

const BirthdayAvatar = ({ nome, fotoUrl }: { nome: string; fotoUrl?: string }) => {
  const initials = getInitials(nome);

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nome}
        className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/10"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 text-sm font-semibold text-white ring-1 ring-white/10">
      {initials}
    </div>
  );
};

const EmptyState = () => (
  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
      <Gift className="h-7 w-7 text-slate-300" />
    </div>
    <h3 className="text-base font-semibold text-white">Nenhum aniversariante próximo</h3>
    <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
      Não há aniversariantes para hoje nem para os próximos 7 dias entre os servidores ativos com
      data de nascimento cadastrada.
    </p>
  </div>
);

const BirthdayPanel: React.FC<BirthdayPanelProps> = ({ servidores, isLoading = false }) => {
  const { proximos, totalHoje, totalMes } = useMemo(() => {
    const today = startOfDay(new Date());
    const currentMonth = today.getMonth();

    const normalized: BirthdayItem[] = (Array.isArray(servidores) ? servidores : [])
      .filter((servidor) => normalizeStatus(servidor?.status) === 'ATIVO')
      .map((servidor) => {
        const nome = getNomeServidor(servidor);
        const dataNascimento = getDataNascimento(servidor);
        const setor = safeString(servidor?.setor) || 'Setor não informado';
        const categoria = safeString(servidor?.categoria) || 'Categoria não informada';
        const fotoUrl = getFotoUrl(servidor);
        const birthDate = toLocalDate(dataNascimento);

        if (!birthDate) return null;

        const proximoAniversario = getUpcomingBirthday(birthDate, today);
        const diasRestantes = diffDays(today, proximoAniversario);

        return {
          id:
            safeString(servidor?.id) ||
            safeString(servidor?.cpf) ||
            safeString(servidor?.matricula) ||
            `${nome}-${dataNascimento}`,
          nome,
          setor,
          categoria,
          fotoUrl,
          dataNascimentoOriginal: dataNascimento,
          dataFormatada: formatBirthday(proximoAniversario),
          diasRestantes,
          proximoAniversario,
          idadeQueVaiCompletar: getAgeTurning(birthDate, proximoAniversario),
          badge: getBadge(diasRestantes),
          initials: getInitials(nome),
        } satisfies BirthdayItem;
      })
      .filter(Boolean as unknown as (value: BirthdayItem | null) => value is BirthdayItem)
      .sort((a, b) => {
        if (a.diasRestantes !== b.diasRestantes) return a.diasRestantes - b.diasRestantes;
        return a.nome.localeCompare(b.nome, 'pt-BR');
      });

    const proximos = normalized.filter((item) => item.diasRestantes >= 0 && item.diasRestantes <= 7);
    const totalHoje = normalized.filter((item) => item.diasRestantes === 0).length;
    const totalMes = normalized.filter(
      (item) => item.proximoAniversario.getMonth() === currentMonth || toLocalDate(item.dataNascimentoOriginal)?.getMonth() === currentMonth,
    ).length;

    return { proximos, totalHoje, totalMes };
  }, [servidores]);

  return (
    <section className="rounded-3xl border border-white/10 bg-card-dark/90 p-6 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            Painel institucional
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 via-fuchsia-500/20 to-amber-400/20 ring-1 ring-white/10">
              <Cake className="h-6 w-6 text-pink-300" />
            </div>

            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">Aniversariantes</h2>
              <p className="mt-1 text-sm text-slate-400">
                Servidores ativos com aniversário hoje e nos próximos 7 dias.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[320px] lg:max-w-[360px]">
          <div className={summaryCardClass}>
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <Gift className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-[0.18em]">Hoje</span>
            </div>
            <div className="text-2xl font-bold text-white">{totalHoje}</div>
            <div className="mt-1 text-xs text-slate-500">
              {totalHoje === 1 ? 'aniversariante no dia' : 'aniversariantes no dia'}
            </div>
          </div>

          <div className={summaryCardClass}>
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <CalendarDays className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-[0.18em]">Neste mês</span>
            </div>
            <div className="text-2xl font-bold text-white">{totalMes}</div>
            <div className="mt-1 text-xs text-slate-500">
              {totalMes === 1 ? 'aniversariante no mês' : 'aniversariantes no mês'}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10" />
                <div className="flex-1">
                  <div className="h-4 w-40 rounded bg-white/10" />
                  <div className="mt-3 h-3 w-28 rounded bg-white/10" />
                </div>
                <div className="h-8 w-20 rounded-full bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : proximos.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {proximos.map((item, index) => {
            const isToday = item.diasRestantes === 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: index * 0.03 }}
                className={`group rounded-2xl border p-4 transition-all duration-300 ${
                  isToday
                    ? 'border-pink-400/30 bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-transparent shadow-[0_12px_40px_-20px_rgba(244,114,182,0.45)]'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <BirthdayAvatar nome={item.nome} fotoUrl={item.fotoUrl} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="truncate text-sm font-semibold text-white">{item.nome}</h3>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-300">
                        {item.dataFormatada}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                      <span>{item.setor}</span>
                      <span className="text-slate-600">•</span>
                      <span>{item.categoria}</span>
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      {item.idadeQueVaiCompletar !== null
                        ? `Completará ${item.idadeQueVaiCompletar} ${
                            item.idadeQueVaiCompletar === 1 ? 'ano' : 'anos'
                          }`
                        : 'Idade não disponível'}
                    </div>
                  </div>

                  <div
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      isToday
                        ? 'bg-pink-500/15 text-pink-300 ring-1 ring-pink-400/20'
                        : item.diasRestantes === 1
                          ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20'
                          : 'bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-400/10'
                    }`}
                  >
                    {item.badge}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default BirthdayPanel;
