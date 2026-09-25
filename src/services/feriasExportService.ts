import { API_BASE_URL } from '../config/api';
import { supabase } from '../lib/supabaseClient';

export type ExportFormato = 'DOCX' | 'PDF' | 'CSV';
export type ExportCategoria = string;
export type ExportStatus = 'TODOS' | 'ATIVO' | 'INATIVO';
export type ExportTipoExtracao =
  | 'TODOS_SERVIDORES'
  | 'COM_FERIAS'
  | 'NO_MES'
  | 'PLANEJAMENTO_ANUAL'
  | 'APENAS_1_PERIODO'
  | 'APENAS_2_PERIODO'
  | 'APENAS_3_PERIODO';
export type ExportOrdenacao = 'NOME' | 'MATRICULA' | 'CATEGORIA' | 'SETOR';

export interface FeriasExportRowInput {
  id?: string;
  servidorId?: string;
  servidorNome?: string;
  nome?: string;
  cpf?: string;
  matricula?: string;
  categoria?: string;
  setor?: string;
  statusServidor?: string;
  inicio?: string;
  fim?: string;
  ano?: number;
  slot?: number;
}

export interface FeriasExportServidorInput {
  id?: string;
  nome?: string;
  cpf?: string;
  matricula?: string;
  categoria?: string;
  setor?: string;
  status?: string;
}

export interface ExportFeriasFilters {
  formato: ExportFormato;
  mes: number | 'TODOS';
  ano: number;
  categoria: ExportCategoria;
  setor: string;
  status: ExportStatus;
  tipoExtracao: ExportTipoExtracao;
  ordenacao: ExportOrdenacao;
}

export interface FeriasExportPreview {
  sections: Array<{
    categoria: string;
    servidores: FeriasExportServidorInput[];
  }>;
  totalLinhas: number;
  totalComFerias: number;
  totalSemFerias: number;
}

export const feriasExportLabels = {
  categorias: [
    'TODOS',
    'EFETIVO SESAU',
    'SELETIVO SESAU',
    'EFETIVO SETRABES',
    'SELETIVO SETRABES',
    'FEDERAIS SETRABES',
    'COMISSIONADOS',
  ],
  meses: [
    'Todos os meses',
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  tiposExtracao: {
    TODOS_SERVIDORES: 'Todos os servidores',
    COM_FERIAS: 'Somente servidores com férias cadastradas',
    NO_MES: 'Somente servidores com férias no mês selecionado',
    PLANEJAMENTO_ANUAL: 'Planejamento anual completo',
    APENAS_1_PERIODO: 'Apenas 1º período',
    APENAS_2_PERIODO: 'Apenas 2º período',
    APENAS_3_PERIODO: 'Apenas 3º período',
  } as Record<ExportTipoExtracao, string>,
  ordenacao: {
    NOME: 'Nome A-Z',
    MATRICULA: 'Matrícula',
    CATEGORIA: 'Categoria',
    SETOR: 'Setor',
  } as Record<ExportOrdenacao, string>,
};

const BASE_URL = String(API_BASE_URL || '').replace(/\/+$/, '');
const EXPORT_URL = `${BASE_URL}/api/ferias/exportar`;

const texto = (value: unknown) => String(value ?? '').trim();
const chave = (value: unknown) => texto(value).toLocaleUpperCase('pt-BR');

export function getDefaultFeriasExportFilters(
  ano = new Date().getFullYear(),
): ExportFeriasFilters {
  return {
    formato: 'DOCX',
    mes: 'TODOS',
    ano,
    categoria: 'TODOS',
    setor: 'TODOS',
    status: 'ATIVO',
    tipoExtracao: 'TODOS_SERVIDORES',
    ordenacao: 'NOME',
  };
}

function correspondeServidor(
  registro: FeriasExportRowInput,
  servidor: FeriasExportServidorInput,
): boolean {
  const cpfRegistro = texto(registro.cpf).replace(/\D/g, '');
  const cpfServidor = texto(servidor.cpf).replace(/\D/g, '');

  if (cpfRegistro && cpfServidor && cpfRegistro === cpfServidor) return true;

  if (
    registro.servidorId &&
    servidor.id &&
    texto(registro.servidorId) === texto(servidor.id)
  ) {
    return true;
  }

  return Boolean(
    registro.servidorNome &&
      servidor.nome &&
      chave(registro.servidorNome) === chave(servidor.nome),
  );
}

function registroNoPeriodo(
  registro: FeriasExportRowInput,
  filtros: ExportFeriasFilters,
): boolean {
  const inicio = texto(registro.inicio);
  const fim = texto(registro.fim || registro.inicio);

  if (!inicio) return Number(registro.ano) === filtros.ano;

  const primeiroDiaAno = `${filtros.ano}-01-01`;
  const ultimoDiaAno = `${filtros.ano}-12-31`;

  if (inicio > ultimoDiaAno || fim < primeiroDiaAno) return false;

  if (filtros.mes === 'TODOS') return true;

  const mes = String(filtros.mes).padStart(2, '0');
  const primeiroDiaMes = `${filtros.ano}-${mes}-01`;
  const ultimoDiaMes = `${filtros.ano}-${mes}-31`;

  return inicio <= ultimoDiaMes && fim >= primeiroDiaMes;
}

export function buildFeriasExportData(
  filtros: ExportFeriasFilters,
  registros: FeriasExportRowInput[] = [],
  servidores: FeriasExportServidorInput[] = [],
): FeriasExportPreview {
  const listaServidores = Array.isArray(servidores) ? servidores : [];
  const listaRegistros = Array.isArray(registros) ? registros : [];

  const filtrados = listaServidores
    .filter((servidor) => {
      if (filtros.status !== 'TODOS' && chave(servidor.status) !== filtros.status) {
        return false;
      }

      if (filtros.categoria !== 'TODOS' && chave(servidor.categoria) !== chave(filtros.categoria)) {
        return false;
      }

      if (filtros.setor !== 'TODOS' && chave(servidor.setor) !== chave(filtros.setor)) {
        return false;
      }

      return true;
    })
    .map((servidor) => {
      const registrosServidor = listaRegistros.filter((registro) =>
        correspondeServidor(registro, servidor),
      );

      const registrosNoPeriodo = registrosServidor.filter((registro) =>
        registroNoPeriodo(registro, filtros),
      );

      return { servidor, registrosServidor, registrosNoPeriodo };
    })
    .filter(({ registrosServidor, registrosNoPeriodo }) => {
      switch (filtros.tipoExtracao) {
        case 'COM_FERIAS':
          return registrosServidor.length > 0;
        case 'NO_MES':
          return registrosNoPeriodo.length > 0;
        case 'APENAS_1_PERIODO':
          return registrosNoPeriodo.some((registro) => Number(registro.slot) === 1);
        case 'APENAS_2_PERIODO':
          return registrosNoPeriodo.some((registro) => Number(registro.slot) === 2);
        case 'APENAS_3_PERIODO':
          return registrosNoPeriodo.some((registro) => Number(registro.slot) === 3);
        default:
          return true;
      }
    });

  const campoOrdenacao: keyof FeriasExportServidorInput = {
    NOME: 'nome',
    MATRICULA: 'matricula',
    CATEGORIA: 'categoria',
    SETOR: 'setor',
  }[filtros.ordenacao] as keyof FeriasExportServidorInput;

  filtrados.sort((a, b) =>
    texto(a.servidor[campoOrdenacao]).localeCompare(
      texto(b.servidor[campoOrdenacao]),
      'pt-BR',
    ),
  );

  const grupos = new Map<string, FeriasExportServidorInput[]>();

  for (const { servidor } of filtrados) {
    const categoria = texto(servidor.categoria) || 'Sem categoria';
    const grupo = grupos.get(categoria) || [];
    grupo.push(servidor);
    grupos.set(categoria, grupo);
  }

  const totalComFerias = filtrados.filter(
    ({ registrosServidor }) => registrosServidor.length > 0,
  ).length;

  return {
    sections: Array.from(grupos, ([categoria, servidoresDoGrupo]) => ({
      categoria,
      servidores: servidoresDoGrupo,
    })),
    totalLinhas: filtrados.length,
    totalComFerias,
    totalSemFerias: filtrados.length - totalComFerias,
  };
}

function resolveFilename(response: Response, fallback: string): string {
  const disposition = response.headers.get('content-disposition') || '';
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const simple = disposition.match(/filename="?([^";]+)"?/i);
  const raw = utf8?.[1] || simple?.[1] || fallback;

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function parseError(response: Response): Promise<string> {
  const body = await response.text();

  try {
    const json = JSON.parse(body);
    return texto(json?.details || json?.error || json?.message) ||
      `Falha na exportação (${response.status}).`;
  } catch {
    return body || `Falha na exportação (${response.status}).`;
  }
}

export async function exportFeriasFile(
  filters: ExportFeriasFilters,
): Promise<{ filename: string }> {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;

  const token = data.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

  const response = await fetch(EXPORT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(filters),
  });

  if (!response.ok) throw new Error(await parseError(response));

  const blob = await response.blob();
  const filename = resolveFilename(
    response,
    `ferias_${filters.ano}.${filters.formato.toLowerCase()}`,
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  return { filename };
}

export const exportarFerias = exportFeriasFile;

const feriasExportService = {
  exportFeriasFile,
  exportarFerias,
  buildFeriasExportData,
  getDefaultFeriasExportFilters,
  feriasExportLabels,
};

export default feriasExportService;
