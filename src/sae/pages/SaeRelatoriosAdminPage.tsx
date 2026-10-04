import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FilterX,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
} from 'lucide-react';

import {
  saeAdministrativoService,
  type SaeAdminDocumento,
  type SaeAdminUsuario,
} from '../services/saeAdministrativoService';
import { saeDocumentosService } from '../services/saeDocumentosService';
import { saeAgendamentosService } from '../services/saeAgendamentosService';
import type { SaeAgendamentoResumo } from '../types/saeAgendamento';

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const escapeCsv = (value: unknown) => {
  const text = String(value ?? '').replace(/"/g, '""');
  return `"${text}"`;
};

const baixarCsv = (
  filename: string,
  headers: string[],
  rows: unknown[][],
) => {
  const content =
    '\uFEFF' +
    [
      headers.map(escapeCsv).join(';'),
      ...rows.map((row) => row.map(escapeCsv).join(';')),
    ].join('\r\n');

  const blob = new Blob([content], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  a.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const isAtivo = (situacao: string) => {
  const valor = normalize(situacao);

  return (
    valor === 'ativo' ||
    valor === 'usuario ativo' ||
    valor === 'usuário ativo' ||
    valor.includes('ativo')
  ) && !valor.includes('inativo');
};

const PAGE_SIZE = 12;

export default function SaeRelatoriosAdminPage() {
  const [usuarios, setUsuarios] = useState<SaeAdminUsuario[]>([]);
  const [documentos, setDocumentos] = useState<SaeAdminDocumento[]>([]);
  const [agendamentos, setAgendamentos] = useState<SaeAgendamentoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [busca, setBusca] = useState('');
  const [bairro, setBairro] = useState('');
  const [sexo, setSexo] = useState('TODOS');
  const [turno, setTurno] = useState('TODOS');

  // Regra principal: a tela trabalha com usuários ativos.
  // Inativos só entram quando o administrador habilita explicitamente.
  const [incluirInativos, setIncluirInativos] = useState(false);

  const [idadeMin, setIdadeMin] = useState('');
  const [idadeMax, setIdadeMax] = useState('');

  const [profissionalId, setProfissionalId] = useState('TODOS');
  const [statusDocumento, setStatusDocumento] = useState('TODOS');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const [filtrosAvancados, setFiltrosAvancados] = useState(false);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    Promise.all([
      saeAdministrativoService.listarUsuarios(),
      saeAdministrativoService.listarDocumentos(),
      saeAgendamentosService.listar(),
    ])
      .then(([users, docs, appointments]) => {
        setUsuarios(users);
        setDocumentos(docs);
        setAgendamentos(appointments);
      })
      .catch((error) =>
        setErro(
          error instanceof Error
            ? error.message
            : 'Falha ao carregar os relatórios.',
        ),
      )
      .finally(() => setCarregando(false));
  }, []);

  const bairros = useMemo(
    () =>
      Array.from(
        new Set(
          usuarios
            .map((item) => item.bairro)
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [usuarios],
  );

  const sexos = useMemo(
    () =>
      Array.from(
        new Set(
          usuarios
            .map((item) => item.sexo)
            .filter(Boolean),
        ),
      ).sort(),
    [usuarios],
  );

  const turnos = useMemo(
    () =>
      Array.from(
        new Set(
          usuarios
            .map((item) => item.turno)
            .filter(Boolean),
        ),
      ).sort(),
    [usuarios],
  );

  const profissionais = useMemo(() => {
    const map = new Map<string, string>();

    documentos.forEach((doc) => {
      if (doc.profissionalId) {
        map.set(doc.profissionalId, doc.profissionalNome);
      }
    });

    return Array.from(map.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [documentos]);

  const filtrados = useMemo(() => {
    const termo = normalize(busca);
    const bairroDigitado = normalize(bairro);
    const min = idadeMin ? Number(idadeMin) : null;
    const max = idadeMax ? Number(idadeMax) : null;

    return usuarios.filter((item) => {
      if (!incluirInativos && !isAtivo(item.situacao)) {
        return false;
      }

      if (
        termo &&
        ![
          item.nome,
          item.prontuario,
          item.bairro,
          item.telefone,
        ].some((value) =>
          normalize(value).includes(termo),
        )
      ) {
        return false;
      }

      if (
        bairroDigitado &&
        !normalize(item.bairro).includes(bairroDigitado)
      ) {
        return false;
      }

      if (
        sexo !== 'TODOS' &&
        item.sexo !== sexo
      ) {
        return false;
      }

      if (
        turno !== 'TODOS' &&
        item.turno !== turno
      ) {
        return false;
      }

      if (
        min !== null &&
        (item.idade === null || item.idade < min)
      ) {
        return false;
      }

      if (
        max !== null &&
        (item.idade === null || item.idade > max)
      ) {
        return false;
      }

      return true;
    });
  }, [
    usuarios,
    busca,
    bairro,
    sexo,
    turno,
    incluirInativos,
    idadeMin,
    idadeMax,
  ]);

  const idsFiltrados = useMemo(
    () => new Set(filtrados.map((item) => item.id)),
    [filtrados],
  );

  const docsFiltrados = useMemo(
    () =>
      documentos.filter((doc) => {
        if (!idsFiltrados.has(doc.usuarioId)) {
          return false;
        }

        if (
          profissionalId !== 'TODOS' &&
          doc.profissionalId !== profissionalId
        ) {
          return false;
        }

        if (
          statusDocumento !== 'TODOS' &&
          doc.status !== statusDocumento
        ) {
          return false;
        }

        const data = (doc.createdAt || '').slice(0, 10);

        if (dataInicio && data < dataInicio) {
          return false;
        }

        if (dataFim && data > dataFim) {
          return false;
        }

        return true;
      }),
    [
      documentos,
      idsFiltrados,
      profissionalId,
      statusDocumento,
      dataInicio,
      dataFim,
    ],
  );

  const idadeMedia = useMemo(() => {
    const ages = filtrados
      .map((u) => u.idade)
      .filter(
        (v): v is number =>
          typeof v === 'number' &&
          Number.isFinite(v),
      );

    if (!ages.length) {
      return 0;
    }

    return Math.round(
      ages.reduce((a, b) => a + b, 0) /
        ages.length,
    );
  }, [filtrados]);

  const faixas = useMemo(() => {
    const result = [
      { label: 'Até 59', total: 0 },
      { label: '60–69', total: 0 },
      { label: '70–79', total: 0 },
      { label: '80–89', total: 0 },
      { label: '90+', total: 0 },
    ];

    filtrados.forEach((u) => {
      const i = u.idade ?? -1;

      if (i < 0) return;
      if (i <= 59) result[0].total++;
      else if (i <= 69) result[1].total++;
      else if (i <= 79) result[2].total++;
      else if (i <= 89) result[3].total++;
      else result[4].total++;
    });

    return result;
  }, [filtrados]);

  const porBairro = useMemo(() => {
    const map = new Map<string, number>();

    filtrados.forEach((u) => {
      const key = u.bairro || 'Não informado';
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([label, total]) => ({ label, total }))
      .sort(
        (a, b) =>
          b.total - a.total ||
          a.label.localeCompare(b.label, 'pt-BR'),
      )
      .slice(0, 12);
  }, [filtrados]);

  const historicoAgendamentos = useMemo(() => {
    const mapa = new Map<string, number>();

    agendamentos.forEach((agendamento) => {
      // Quando o agendamento pertence a um usuário cadastrado,
      // respeita os mesmos filtros da página de relatórios.
      if (
        agendamento.usuarioId &&
        !idsFiltrados.has(agendamento.usuarioId)
      ) {
        return;
      }

      const data = String(agendamento.data || '').slice(0, 10);

      if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return;
      }

      const [ano, mes] = data.split('-');
      const chave = `${ano}-${mes}`;

      mapa.set(
        chave,
        (mapa.get(chave) || 0) + 1,
      );
    });

    const nomesMeses = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];

    return Array.from(mapa.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12)
      .map(([chave, total]) => {
        const [ano, mes] = chave.split('-');
        const indiceMes = Number(mes) - 1;

        return {
          label: `${nomesMeses[indiceMes] || mes}/${ano}`,
          total,
        };
      });
  }, [agendamentos, idsFiltrados]);

  const totalAgendamentosFiltrados = useMemo(
    () =>
      historicoAgendamentos.reduce(
        (total, item) => total + item.total,
        0,
      ),
    [historicoAgendamentos],
  );

  const relatoriosPorProfissional = useMemo(() => {
    const map = new Map<string, number>();

    docsFiltrados.forEach((doc) => {
      const key =
        doc.profissionalNome ||
        'Não informado';

      map.set(
        key,
        (map.get(key) || 0) + 1,
      );
    });

    return Array.from(map.entries())
      .map(([label, total]) => ({
        label,
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [docsFiltrados]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(filtrados.length / PAGE_SIZE),
  );

  const usuariosPagina = useMemo(() => {
    const inicio = (pagina - 1) * PAGE_SIZE;

    return filtrados.slice(
      inicio,
      inicio + PAGE_SIZE,
    );
  }, [filtrados, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [
    busca,
    bairro,
    sexo,
    turno,
    incluirInativos,
    idadeMin,
    idadeMax,
  ]);

  useEffect(() => {
    if (pagina > totalPaginas) {
      setPagina(totalPaginas);
    }
  }, [pagina, totalPaginas]);

  const limpar = () => {
    setBusca('');
    setBairro('');
    setSexo('TODOS');
    setTurno('TODOS');
    setIncluirInativos(false);
    setIdadeMin('');
    setIdadeMax('');
    setProfissionalId('TODOS');
    setStatusDocumento('TODOS');
    setDataInicio('');
    setDataFim('');
    setPagina(1);
  };

  const exportar = () => {
    const reportsByUser = new Map<string, number>();

    docsFiltrados.forEach((doc) => {
      reportsByUser.set(
        doc.usuarioId,
        (reportsByUser.get(doc.usuarioId) || 0) + 1,
      );
    });

    baixarCsv(
      `sae-usuarios-filtrados-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      [
        'PRONTUÁRIO',
        'NOME',
        'IDADE',
        'SEXO',
        'BAIRRO',
        'TURNO',
        'SITUAÇÃO',
        'TELEFONE',
        'ENDEREÇO',
        'RELATÓRIOS',
      ],
      filtrados.map((u) => [
        u.prontuario,
        u.nome,
        u.idade ?? '',
        u.sexo,
        u.bairro,
        u.turno,
        u.situacao,
        u.telefone,
        u.endereco,
        reportsByUser.get(u.id) || 0,
      ]),
    );
  };

  if (carregando) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="app-surface overflow-hidden border-primary/10 bg-gradient-to-br from-card-dark via-card-dark to-blue-950/25 p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              SAE Administrativo
            </p>

            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              Relatórios consolidados
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              A visão principal considera usuários ativos. Use “Incluir inativos” somente quando precisar pesquisar registros históricos.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                Ativos por padrão
              </span>
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
                Filtros dinâmicos
              </span>
              <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300">
                Exportação CSV
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:flex">
            <button
              type="button"
              onClick={exportar}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-5 text-sm font-bold text-white shadow-lg shadow-blue-500/15 transition hover:brightness-110"
            >
              <Download size={17} />
              Baixar dados filtrados
            </button>
          </div>
        </div>
      </section>

      {erro && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />
          {erro}
        </div>
      )}

      <section className="app-surface overflow-hidden border-blue-500/15 bg-gradient-to-br from-card-dark via-card-dark to-blue-950/15 shadow-lg shadow-blue-950/10">
        <div className="border-b border-border-dark p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <label className="min-w-0 flex-1 space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.13em] text-slate-400">
                Busca
              </span>

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  value={busca}
                  onChange={(e) =>
                    setBusca(e.target.value)
                  }
                  placeholder="Nome, prontuário, bairro..."
                  className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 pl-10 pr-3 text-sm text-white outline-none focus:border-primary/40"
                />
              </div>
            </label>

            <label className="min-w-0 flex-1 space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.13em] text-slate-400">
                Bairro
              </span>

              <input
                value={bairro}
                onChange={(e) =>
                  setBairro(e.target.value)
                }
                list="sae-bairros"
                placeholder="Digite, por exemplo: Pricumã"
                className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white outline-none focus:border-primary/40"
              />

              <datalist id="sae-bairros">
                {bairros.map((item) => (
                  <option
                    key={item}
                    value={item}
                  />
                ))}
              </datalist>
            </label>

            <button
              type="button"
              onClick={() =>
                setFiltrosAvancados(
                  (value) => !value,
                )
              }
              className={[
                'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition',
                filtrosAvancados
                  ? 'border-blue-400/40 bg-blue-500/15 text-blue-200 shadow-sm shadow-blue-500/10'
                  : 'border-border-dark text-slate-300 hover:border-blue-400/20 hover:bg-blue-500/5',
              ].join(' ')}
            >
              <SlidersHorizontal size={16} />
              Mais filtros
            </button>

            <button
              type="button"
              onClick={limpar}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-dark px-4 text-sm font-bold text-slate-300 transition hover:border-rose-400/20 hover:bg-rose-500/5 hover:text-rose-200"
            >
              <FilterX size={16} />
              Limpar
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">
              Sexo
            </span>

            <Segmented
              value={sexo}
              onChange={setSexo}
              options={[
                { value: 'TODOS', label: 'Todos' },
                ...sexos.map((value) => ({
                  value,
                  label: value,
                })),
              ]}
            />

            <span className="hidden h-7 w-px bg-border-dark lg:block" />

            <span className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">
              Turno
            </span>

            <Segmented
              value={turno}
              onChange={setTurno}
              options={[
                { value: 'TODOS', label: 'Todos' },
                ...turnos.map((value) => ({
                  value,
                  label: value,
                })),
              ]}
            />

            <label className="ml-auto inline-flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border border-amber-400/25 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-3 text-xs font-bold text-amber-200 transition hover:border-amber-400/40">
              <input
                type="checkbox"
                checked={incluirInativos}
                onChange={(e) =>
                  setIncluirInativos(
                    e.target.checked,
                  )
                }
                className="h-4 w-4 accent-amber-500"
              />
              Incluir inativos
            </label>
          </div>

          {filtrosAvancados && (
            <div className="space-y-4 rounded-2xl border border-blue-500/15 bg-gradient-to-br from-slate-900/35 to-blue-950/10 p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="rounded-2xl border border-border-dark bg-slate-950/25 p-4 lg:col-span-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-300">
                    Faixa de idade
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Filter label="Mínima">
                      <input
                        type="number"
                        min="0"
                        placeholder="Ex.: 60"
                        value={idadeMin}
                        onChange={(e) => setIdadeMin(e.target.value)}
                        className="input-admin"
                      />
                    </Filter>

                    <Filter label="Máxima">
                      <input
                        type="number"
                        min="0"
                        placeholder="Ex.: 79"
                        value={idadeMax}
                        onChange={(e) => setIdadeMax(e.target.value)}
                        className="input-admin"
                      />
                    </Filter>
                  </div>
                </div>

                <div className="rounded-2xl border border-border-dark bg-slate-950/25 p-4 lg:col-span-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                    Produção profissional
                  </p>

                  <div className="mt-3">
                    <Filter label="Profissional / relatório">
                      <select
                        value={profissionalId}
                        onChange={(e) => setProfissionalId(e.target.value)}
                        className="input-admin"
                      >
                        <option value="TODOS">Todos os profissionais</option>

                        {profissionais.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome}
                          </option>
                        ))}
                      </select>
                    </Filter>
                  </div>
                </div>

                <div className="rounded-2xl border border-border-dark bg-slate-950/25 p-4 lg:col-span-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-300">
                    Status do relatório
                  </p>

                  <div className="mt-3">
                    <Segmented
                      value={statusDocumento}
                      onChange={setStatusDocumento}
                      compact
                      options={[
                        { value: 'TODOS', label: 'Todos' },
                        { value: 'RASCUNHO', label: 'Rascunho' },
                        { value: 'FINALIZADO', label: 'Finalizado' },
                        { value: 'ASSINADO', label: 'Assinado' },
                      ]}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border-dark bg-slate-950/25 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">
                      Período de emissão
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Filter label="Data inicial">
                        <input
                          type="date"
                          value={dataInicio}
                          onChange={(e) => setDataInicio(e.target.value)}
                          className="input-admin"
                        />
                      </Filter>

                      <Filter label="Data final">
                        <input
                          type="date"
                          value={dataFim}
                          onChange={(e) => setDataFim(e.target.value)}
                          className="input-admin"
                        />
                      </Filter>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border-dark bg-slate-900/40 px-4 py-3 text-xs leading-5 text-slate-400 lg:max-w-[260px]">
                    Use o período somente quando quiser analisar a produção dos relatórios em uma data específica.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi
          label="Usuários"
          value={filtrados.length}
          icon={Users}
        />

        <Kpi
          label="Idade média"
          value={idadeMedia}
          icon={BarChart3}
          suffix=" anos"
        />

        <Kpi
          label="Relatórios"
          value={docsFiltrados.length}
          icon={FileText}
        />

        <Kpi
          label="Agendamentos"
          value={totalAgendamentosFiltrados}
          icon={CalendarDays}
        />

        <Kpi
          label="Bairros"
          value={
            new Set(
              filtrados
                .map((u) => u.bairro)
                .filter(Boolean),
            ).size
          }
          icon={MapPin}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Distribution
          title="Faixa etária"
          items={faixas}
          total={filtrados.length}
        />

        <Distribution
          title="Principais bairros"
          items={porBairro}
          total={filtrados.length}
        />

        <Distribution
          title="Histórico de agendamentos"
          items={historicoAgendamentos}
          total={Math.max(totalAgendamentosFiltrados, 1)}
        />

        <Distribution
          title="Relatórios por profissional"
          items={relatoriosPorProfissional}
          total={docsFiltrados.length}
        />
      </div>

      <section className="app-surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border-dark p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-bold text-white">
              Usuários filtrados
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Visualização compacta. O download contém todos os {filtrados.length} registro(s) encontrados.
            </p>
          </div>

          <div className="rounded-xl border border-border-dark bg-slate-900/30 px-3 py-2 text-xs text-slate-400">
            Página {pagina} de {totalPaginas}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 sm:p-5">
          {usuariosPagina.map((u) => (
            <article
              key={u.id}
              className="rounded-2xl border border-border-dark bg-gradient-to-br from-slate-900/35 to-blue-950/10 p-4 transition hover:border-blue-400/25 hover:from-slate-900/50 hover:to-blue-950/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-white">
                    {u.nome}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Prontuário {u.prontuario || '—'}
                  </p>
                </div>

                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold text-violet-200">
                  {u.idade ?? '—'} anos
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <MiniInfo
                  label="Bairro"
                  value={u.bairro || 'Não informado'}
                />
                <MiniInfo
                  label="Sexo"
                  value={u.sexo || '—'}
                />
                <MiniInfo
                  label="Turno"
                  value={u.turno || '—'}
                />
                <MiniInfo
                  label="Situação"
                  value={u.situacao || '—'}
                />
              </div>
            </article>
          ))}

          {!usuariosPagina.length && (
            <div className="col-span-full rounded-2xl border border-dashed border-border-dark p-10 text-center text-sm text-slate-500">
              Nenhum usuário encontrado com esses filtros.
            </div>
          )}
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between border-t border-border-dark px-4 py-4 sm:px-5">
            <button
              type="button"
              disabled={pagina <= 1}
              onClick={() =>
                setPagina((value) =>
                  Math.max(1, value - 1),
                )
              }
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border-dark px-3 text-xs font-bold text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              Anterior
            </button>

            <span className="text-xs text-slate-500">
              {filtrados.length} usuário(s)
            </span>

            <button
              type="button"
              disabled={pagina >= totalPaginas}
              onClick={() =>
                setPagina((value) =>
                  Math.min(
                    totalPaginas,
                    value + 1,
                  ),
                )
              }
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border-dark px-3 text-xs font-bold text-slate-300 disabled:opacity-40"
            >
              Próxima
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </section>

      <section className="app-surface overflow-hidden">
        <div className="border-b border-border-dark p-4 sm:p-5">
          <h2 className="font-bold text-white">
            Relatórios dos profissionais
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Visualize a produção e baixe o documento produzido ou o arquivo assinado.
          </p>
        </div>

        <div className="divide-y divide-border-dark">
          {docsFiltrados
            .slice(0, 100)
            .map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-semibold text-white">
                    {doc.titulo}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {doc.profissionalNome} •{' '}
                    {doc.usuarioNome} • Pront.{' '}
                    {doc.prontuario || '—'} •{' '}
                    {doc.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() =>
                      saeDocumentosService
                        .baixarDocx(
                          doc.id,
                          doc.titulo,
                        )
                        .catch((e) =>
                          setErro(e.message),
                        )
                    }
                    className="min-h-10 rounded-xl border border-primary/20 bg-primary/10 px-3 text-xs font-bold text-blue-200"
                  >
                    Word
                  </button>

                  {doc.status === 'ASSINADO' && (
                    <button
                      type="button"
                      onClick={() =>
                        saeDocumentosService
                          .baixarAssinado(doc.id)
                          .catch((e) =>
                            setErro(e.message),
                          )
                      }
                      className="min-h-10 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-200"
                    >
                      Assinado
                    </button>
                  )}
                </div>
              </div>
            ))}

          {!docsFiltrados.length && (
            <div className="p-8 text-center text-sm text-slate-500">
              Nenhum relatório para os filtros selecionados.
            </div>
          )}
        </div>
      </section>

      <style>{`
        .input-admin {
          height: 44px;
          width: 100%;
          border-radius: 12px;
          border: 1px solid #26344a;
          background: rgba(15, 23, 42, .5);
          padding: 0 12px;
          font-size: 14px;
          color: #fff;
          outline: none;
        }
      `}</style>
    </div>
  );
}

function Filter({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.13em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function Segmented({
  value,
  onChange,
  options,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        'flex flex-wrap gap-1.5 rounded-xl border border-border-dark bg-slate-950/30 p-1',
        compact ? 'w-full' : '',
      ].join(' ')}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() =>
            onChange(option.value)
          }
          className={[
            'min-h-8 rounded-lg px-3 text-xs font-bold transition',
            compact ? 'flex-1' : '',
            value === option.value
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white',
          ].join(' ')}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  suffix = '',
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  suffix?: string;
}) {
  const tone =
    label === 'Usuários'
      ? 'border-blue-500/20 from-blue-500/10 to-blue-950/10 text-blue-300'
      : label === 'Idade média'
        ? 'border-violet-500/20 from-violet-500/10 to-violet-950/10 text-violet-300'
        : label === 'Relatórios'
          ? 'border-emerald-500/20 from-emerald-500/10 to-emerald-950/10 text-emerald-300'
          : 'border-amber-500/20 from-amber-500/10 to-amber-950/10 text-amber-300';

  return (
    <div className={`app-surface border bg-gradient-to-br p-4 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {value}
            {suffix}
          </p>
        </div>

        <div className="rounded-xl border border-current/10 bg-white/[0.03] p-2.5">
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function Distribution({
  title,
  items,
  total,
}: {
  title: string;
  items: Array<{
    label: string;
    total: number;
  }>;
  total: number;
}) {
  const accent =
    title === 'Faixa etária'
      ? 'from-violet-500/10 to-transparent border-violet-500/15'
      : title === 'Principais bairros'
        ? 'from-cyan-500/10 to-transparent border-cyan-500/15'
        : 'from-emerald-500/10 to-transparent border-emerald-500/15';

  return (
    <section className={`app-surface border bg-gradient-to-br p-4 sm:p-5 ${accent}`}>
      <h3 className="font-bold text-white">
        {title}
      </h3>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => {
            const pct = total
              ? Math.round(
                  (item.total / total) * 100,
                )
              : 0;

            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-slate-300">
                    {item.label}
                  </span>

                  <strong className="text-white">
                    {item.total}
                  </strong>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"
                    style={{
                      width: `${Math.max(
                        pct,
                        item.total ? 4 : 0,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">
            Sem dados.
          </p>
        )}
      </div>
    </section>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-medium text-slate-300">
        {value}
      </p>
    </div>
  );
}
