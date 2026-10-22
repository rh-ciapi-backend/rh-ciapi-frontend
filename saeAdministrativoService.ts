import { supabase } from '../../lib/supabaseClient';

export type SaeAdminUsuario = {
  id: string;
  prontuario: string;
  nome: string;
  sexo: string;
  nacionalidade: string;
  dataNascimento: string;
  idade: number | null;
  turno: string;
  situacao: string;
  endereco: string;
  bairro: string;
  telefone: string;
};

export type SaeAdminDocumento = {
  id: string;
  usuarioId: string;
  profissionalId: string;
  servicoId: string;
  titulo: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  profissionalNome: string;
  servicoNome: string;
  usuarioNome: string;
  prontuario: string;
};

export type SaeAdminAtendimento = {
  id: string;
  usuarioId: string;
  profissionalId: string;
  servicoId: string;
  data: string;
  observacao: string;
  usuarioNome: string;
  prontuario: string;
  profissionalNome: string;
  servicoNome: string;
};

export type SaeAdminSinalVital = {
  id: string;
  usuarioId: string;
  data: string;
  usuarioNome: string;
  prontuario: string;
  valores: Array<{ label: string; value: string }>;
};

const safeString = (value: unknown) => String(value ?? '').trim();

const firstValue = (row: any, keys: string[]) => {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== null && value !== undefined && safeString(value)) {
      return value;
    }
  }
  return '';
};

const dataSomente = (row: any) =>
  safeString(
    firstValue(row, [
      'data',
      'data_atendimento',
      'atendido_em',
      'data_registro',
      'created_at',
    ]),
  ).slice(0, 10);

async function listarTodos(table: string, select = '*') {
  const PAGE = 1000;
  const rows: any[] = [];
  let start = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(start, start + PAGE - 1);

    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE) break;
    start += PAGE;
  }

  return rows;
}

export const saeAdministrativoService = {
  async listarUsuarios(): Promise<SaeAdminUsuario[]> {
    const rows = await listarTodos(
      'sae_usuarios_resumo',
      [
        'id',
        'prontuario',
        'nome',
        'sexo',
        'nacionalidade',
        'data_nascimento',
        'idade',
        'turno',
        'situacao_cadastral',
        'endereco_original',
        'bairro',
        'telefone_principal',
      ].join(','),
    );

    return rows.map((row) => ({
      id: safeString(row.id),
      prontuario: safeString(row.prontuario),
      nome: safeString(row.nome),
      sexo: safeString(row.sexo),
      nacionalidade: safeString(row.nacionalidade),
      dataNascimento: safeString(row.data_nascimento),
      idade:
        row.idade === null || row.idade === undefined || row.idade === ''
          ? null
          : Number(row.idade),
      turno: safeString(row.turno),
      situacao: safeString(row.situacao_cadastral),
      endereco: safeString(row.endereco_original),
      bairro: safeString(row.bairro),
      telefone: safeString(row.telefone_principal),
    }));
  },

  async listarDocumentos(): Promise<SaeAdminDocumento[]> {
    const [documentos, profissionais, servicos, usuarios] = await Promise.all([
      listarTodos(
        'sae_documentos',
        'id,usuario_id,profissional_id,servico_id,titulo,status,created_at,updated_at',
      ),
      listarTodos('sae_profissionais', 'id,nome'),
      listarTodos('sae_servicos', 'id,nome,sigla'),
      listarTodos('sae_usuarios_resumo', 'id,prontuario,nome'),
    ]);

    const prof = new Map(
      profissionais.map((item) => [safeString(item.id), safeString(item.nome)]),
    );
    const serv = new Map(
      servicos.map((item) => [
        safeString(item.id),
        safeString(item.nome) || safeString(item.sigla),
      ]),
    );
    const users = new Map(
      usuarios.map((item) => [
        safeString(item.id),
        {
          nome: safeString(item.nome),
          prontuario: safeString(item.prontuario),
        },
      ]),
    );

    return documentos.map((row) => {
      const usuario = users.get(safeString(row.usuario_id));
      return {
        id: safeString(row.id),
        usuarioId: safeString(row.usuario_id),
        profissionalId: safeString(row.profissional_id),
        servicoId: safeString(row.servico_id),
        titulo: safeString(row.titulo),
        status: safeString(row.status),
        createdAt: safeString(row.created_at),
        updatedAt: safeString(row.updated_at),
        profissionalNome: prof.get(safeString(row.profissional_id)) || 'Não informado',
        servicoNome: serv.get(safeString(row.servico_id)) || 'Não informado',
        usuarioNome: usuario?.nome || 'Não informado',
        prontuario: usuario?.prontuario || '',
      };
    });
  },

  async listarAtendimentos(): Promise<SaeAdminAtendimento[]> {
    const [atendimentos, profissionais, servicos, usuarios] = await Promise.all([
      listarTodos('sae_atendimentos', '*'),
      listarTodos('sae_profissionais', 'id,nome'),
      listarTodos('sae_servicos', 'id,nome,sigla'),
      listarTodos('sae_usuarios_resumo', 'id,prontuario,nome'),
    ]);

    const prof = new Map(
      profissionais.map((item) => [safeString(item.id), safeString(item.nome)]),
    );
    const serv = new Map(
      servicos.map((item) => [
        safeString(item.id),
        safeString(item.nome) || safeString(item.sigla),
      ]),
    );
    const users = new Map(
      usuarios.map((item) => [
        safeString(item.id),
        { nome: safeString(item.nome), prontuario: safeString(item.prontuario) },
      ]),
    );

    return atendimentos
      .map((row) => {
        const usuario = users.get(safeString(row.usuario_id));
        return {
          id: safeString(row.id),
          usuarioId: safeString(row.usuario_id),
          profissionalId: safeString(row.profissional_id),
          servicoId: safeString(row.servico_id),
          data: dataSomente(row),
          observacao: safeString(
            firstValue(row, ['observacao', 'evolucao', 'descricao', 'registro']),
          ),
          usuarioNome:
            usuario?.nome ||
            safeString(firstValue(row, ['usuario_nome', 'nome_usuario'])) ||
            'Não informado',
          prontuario: usuario?.prontuario || '',
          profissionalNome:
            prof.get(safeString(row.profissional_id)) || 'Não informado',
          servicoNome: serv.get(safeString(row.servico_id)) || 'Não informado',
        };
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  },

  async listarSinaisVitais(): Promise<SaeAdminSinalVital[]> {
    const [sinais, usuarios] = await Promise.all([
      listarTodos('sae_sinais_vitais', '*'),
      listarTodos('sae_usuarios_resumo', 'id,prontuario,nome'),
    ]);

    const users = new Map(
      usuarios.map((item) => [
        safeString(item.id),
        { nome: safeString(item.nome), prontuario: safeString(item.prontuario) },
      ]),
    );

    const specs = [
      ['Pressão', ['pressao_arterial', 'pressao', 'pa']],
      ['FC', ['frequencia_cardiaca', 'fc', 'pulso']],
      ['Temperatura', ['temperatura', 'temp']],
      ['Saturação', ['saturacao', 'spo2', 'saturacao_oxigenio']],
      ['Glicemia', ['glicemia', 'hgt']],
      ['Peso', ['peso']],
      ['Altura', ['altura']],
    ] as const;

    return sinais
      .map((row) => {
        const usuario = users.get(safeString(row.usuario_id));
        const valores = specs
          .map(([label, keys]) => ({
            label,
            value: safeString(firstValue(row, [...keys])),
          }))
          .filter((item) => item.value);

        return {
          id: safeString(row.id),
          usuarioId: safeString(row.usuario_id),
          data: dataSomente(row),
          usuarioNome: usuario?.nome || 'Não informado',
          prontuario: usuario?.prontuario || '',
          valores,
        };
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  },
};

export default saeAdministrativoService;
