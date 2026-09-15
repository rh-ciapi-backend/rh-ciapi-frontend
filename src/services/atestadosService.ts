import { supabase } from '../lib/supabaseClient';
import type {
  Atestado,
  AtestadoInput,
  AtestadoOperationResult,
  AtestadoUploadResult,
  FrequenciaConflict,
  FrequenciaSyncResult,
} from '../types';

const TABLE_ATESTADOS = 'atestados';
const STORAGE_BUCKET_ATESTADOS = 'atestados';

const MAX_ATESTADO_FILE_SIZE_MB = 3;
const MAX_ATESTADO_FILE_SIZE_BYTES = MAX_ATESTADO_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_ATESTADO_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const;

const FREQUENCIA_TABLE_CANDIDATES = ['frequencia_ocorrencias', 'faltas'] as const;
const FERIAS_TABLE_CANDIDATES = ['ferias'] as const;

type DbAtestadoRow = {
  id: string;
  cpf: string | null;
  servidor_nome: string | null;
  matricula: string | null;
  setor: string | null;
  categoria: string | null;
  tipo: string | null;
  data_emissao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  dias: number | null;
  cid: string | null;
  observacao: string | null;
  status: string | null;
  arquivo_nome: string | null;
  arquivo_url: string | null;
  arquivo_path: string | null;
  arquivo_tipo: string | null;
  arquivo_tamanho: number | null;
  lancar_na_frequencia: boolean | null;
  considerar_dias_uteis: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

const normalizeCpf = (value: string) => String(value || '').replace(/\D/g, '');

const formatCpf = (value: string) => {
  const digits = normalizeCpf(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
};

const safeText = (value: unknown) => String(value ?? '').trim();

const slugifyFileName = (value: string) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
};

const buildAtestadoStoragePath = (cpf: string, fileName: string, dateBase?: string) => {
  const baseDate = dateBase ? new Date(`${dateBase}T00:00:00`) : new Date();
  const year = String(baseDate.getFullYear());
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const cpfDigits = normalizeCpf(cpf);
  const safeFileName = slugifyFileName(fileName);
  const stamp = Date.now();
  return `${year}/${month}/${cpfDigits}/${stamp}-${safeFileName}`;
};

const validateAtestadoFile = (file: File | null) => {
  if (!file) return { valid: true as const };

  const mimeValid = ALLOWED_ATESTADO_FILE_TYPES.includes(
    file.type as (typeof ALLOWED_ATESTADO_FILE_TYPES)[number],
  );
  const lowerName = file.name.toLowerCase();
  const extensionValid =
    lowerName.endsWith('.pdf') ||
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.png');

  if (!mimeValid && !extensionValid) {
    return {
      valid: false as const,
      error: 'Formato inválido. Envie apenas PDF, JPG, JPEG ou PNG.',
    };
  }

  if (file.size > MAX_ATESTADO_FILE_SIZE_BYTES) {
    return {
      valid: false as const,
      error: `O arquivo excede o limite de ${MAX_ATESTADO_FILE_SIZE_MB} MB.`,
    };
  }

  return { valid: true as const };
};

const enumerateDates = (start: string, end: string, onlyBusinessDays: boolean) => {
  if (!start || !end) return [] as string[];

  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return [];
  if (endDate < startDate) return [];

  const result: string[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const day = cursor.getDay();
    if (!onlyBusinessDays || (day !== 0 && day !== 6)) {
      result.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === 'object' &&
    error &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
};

const buildAvisos = (...parts: Array<string | null | undefined>) =>
  parts.map((part) => safeText(part)).filter(Boolean);

const mapRowToAtestado = (row: Partial<DbAtestadoRow>): Atestado => ({
  id: String(row.id ?? ''),
  cpf: formatCpf(String(row.cpf ?? '')),
  servidorNome: String(row.servidor_nome ?? ''),
  matricula: String(row.matricula ?? ''),
  setor: String(row.setor ?? ''),
  categoria: String(row.categoria ?? ''),
  tipo: (row.tipo ?? 'MÉDICO') as Atestado['tipo'],
  dataEmissao: String(row.data_emissao ?? ''),
  dataInicio: String(row.data_inicio ?? ''),
  dataFim: String(row.data_fim ?? ''),
  dias: Number(row.dias ?? 0),
  cid: String(row.cid ?? ''),
  observacao: String(row.observacao ?? ''),
  status: (row.status ?? 'PENDENTE') as Atestado['status'],
  arquivoNome: String(row.arquivo_nome ?? ''),
  arquivoUrl: String(row.arquivo_url ?? ''),
  arquivoPath: String(row.arquivo_path ?? ''),
  arquivoTipo: String(row.arquivo_tipo ?? ''),
  arquivoTamanho: Number(row.arquivo_tamanho ?? 0),
  lancarNaFrequencia: Boolean(row.lancar_na_frequencia),
  considerarDiasUteis: Boolean(row.considerar_dias_uteis),
  criadoEm: String(row.criado_em ?? ''),
  atualizadoEm: String(row.atualizado_em ?? ''),
});

const mapInputToInsert = (input: AtestadoInput, fileMeta?: Partial<AtestadoUploadResult>) => ({
  cpf: normalizeCpf(input.cpf),
  servidor_nome: safeText(input.servidorNome),
  matricula: safeText(input.matricula),
  setor: safeText(input.setor),
  categoria: safeText(input.categoria),
  tipo: input.tipo,
  data_emissao: input.dataEmissao || null,
  data_inicio: input.dataInicio,
  data_fim: input.dataFim,
  dias: Number(input.dias || 0),
  cid: safeText(input.cid),
  observacao: safeText(input.observacao),
  status: input.status,
  arquivo_nome: fileMeta?.arquivoNome ?? input.arquivoAtualNome ?? '',
  arquivo_url: fileMeta?.arquivoUrl ?? input.arquivoAtualUrl ?? '',
  arquivo_path: fileMeta?.arquivoPath ?? input.arquivoAtualPath ?? '',
  arquivo_tipo: fileMeta?.arquivoTipo ?? input.arquivoAtualTipo ?? '',
  arquivo_tamanho: fileMeta?.arquivoTamanho ?? input.arquivoAtualTamanho ?? 0,
  lancar_na_frequencia: Boolean(input.lancarNaFrequencia),
  considerar_dias_uteis: Boolean(input.considerarDiasUteis),
});

const mapAtestadoToInsert = (item: Atestado) => ({
  cpf: normalizeCpf(item.cpf),
  servidor_nome: safeText(item.servidorNome),
  matricula: safeText(item.matricula),
  setor: safeText(item.setor),
  categoria: safeText(item.categoria),
  tipo: item.tipo,
  data_emissao: item.dataEmissao || null,
  data_inicio: item.dataInicio,
  data_fim: item.dataFim,
  dias: Number(item.dias || 0),
  cid: safeText(item.cid),
  observacao: safeText(item.observacao),
  status: item.status,
  arquivo_nome: item.arquivoNome || '',
  arquivo_url: item.arquivoUrl || '',
  arquivo_path: item.arquivoPath || '',
  arquivo_tipo: item.arquivoTipo || '',
  arquivo_tamanho: Number(item.arquivoTamanho || 0),
  lancar_na_frequencia: Boolean(item.lancarNaFrequencia),
  considerar_dias_uteis: Boolean(item.considerarDiasUteis),
});

const parseMaybeArray = (value: unknown) => (Array.isArray(value) ? value : []);

const isMissingTableError = (error: unknown) => {
  const message = getErrorMessage(error, '').toLowerCase();
  return (
    message.includes('could not find the table') ||
    message.includes('relation') ||
    message.includes('does not exist') ||
    message.includes('schema cache')
  );
};

const formatConflictMessage = (conflicts: FrequenciaConflict[]) => {
  if (!conflicts.length) return 'Não foi possível sincronizar com a frequência.';

  const grouped = conflicts
    .map((item) => `${item.data} - ${item.descricao}`)
    .join('\n');

  return `Conflitos encontrados ao sincronizar com a frequência:\n${grouped}`;
};

const buildSyncWarningMessage = (sync: FrequenciaSyncResult) => {
  const avisos = Array.isArray(sync.avisos) ? sync.avisos.filter(Boolean) : [];
  const conflitos = Array.isArray(sync.conflitos) ? sync.conflitos : [];

  if (conflitos.length) {
    return formatConflictMessage(conflitos);
  }

  if (avisos.length) {
    return avisos.join('\n');
  }

  return 'Não foi possível sincronizar com a frequência.';
};

const queryFrequencyConflicts = async (
  cpf: string,
  dates: string[],
  atestadoId?: string,
): Promise<FrequenciaConflict[]> => {
  const conflicts: FrequenciaConflict[] = [];
  const cpfDigits = normalizeCpf(cpf);

  if (!cpfDigits || !dates.length) return conflicts;

  for (const date of dates) {
    try {
      const { data: otherAtestados } = await supabase
        .from(TABLE_ATESTADOS)
        .select('id, data_inicio, data_fim, servidor_nome')
        .eq('cpf', cpfDigits)
        .lte('data_inicio', date)
        .gte('data_fim', date);

      parseMaybeArray(otherAtestados).forEach((row: { id?: string; servidor_nome?: string | null }) => {
        if (!atestadoId || row.id !== atestadoId) {
          conflicts.push({
            data: date,
            origem: 'ATESTADO',
            descricao: `Outro atestado já cobre esta data${row.servidor_nome ? ` (${row.servidor_nome})` : ''}.`,
          });
        }
      });
    } catch {
      // segue
    }

    for (const table of FREQUENCIA_TABLE_CANDIDATES) {
      try {
        const { data, error } = await supabase.from(table).select('*').eq('cpf', cpfDigits).eq('data', date);

        if (error) {
          if (!isMissingTableError(error)) {
            conflicts.push({
              data: date,
              origem: table === 'faltas' ? 'FALTAS' : 'FREQUENCIA',
              descricao: `Erro ao consultar a tabela ${table}.`,
            });
          }
          continue;
        }

        const rows = parseMaybeArray(data);
        if (!rows.length) continue;

        rows.forEach((item: Record<string, unknown>) => {
          const tipo = safeText(item.tipo).toUpperCase();
          const itemAtestadoId = safeText(item.atestado_id);
          if (itemAtestadoId && atestadoId && itemAtestadoId === atestadoId) return;
          if (tipo && tipo !== 'ATESTADO') {
            conflicts.push({
              data: date,
              origem: table === 'faltas' ? 'FALTAS' : 'FREQUENCIA',
              descricao: `Já existe ocorrência "${safeText(item.tipo)}" nesta data.`,
            });
          }
        });
        break;
      } catch {
        continue;
      }
    }

    for (const table of FERIAS_TABLE_CANDIDATES) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('cpf', cpfDigits)
          .lte('data_inicio', date)
          .gte('data_fim', date);

        if (!error && parseMaybeArray(data).length) {
          conflicts.push({
            data: date,
            origem: 'FERIAS',
            descricao: 'Existe férias registradas para esta data.',
          });
          break;
        }
      } catch {
        continue;
      }
    }
  }

  return conflicts;
};

const syncToFrequencia = async (atestado: Atestado): Promise<FrequenciaSyncResult> => {
  const dates = enumerateDates(
    atestado.dataInicio,
    atestado.dataFim,
    atestado.considerarDiasUteis,
  );

  if (!dates.length) {
    return { ok: true, conflitos: [], avisos: [] };
  }

  const conflitos = await queryFrequencyConflicts(atestado.cpf, dates, atestado.id);
  if (conflitos.length) {
    return {
      ok: false,
      conflitos,
      avisos: ['O atestado foi salvo, mas há conflitos no período informado para a frequência.'],
    };
  }

  const ocorrenciasPayload = dates.map((date) => ({
    atestado_id: atestado.id,
    cpf: normalizeCpf(atestado.cpf),
    nome_servidor: safeText(atestado.servidorNome),
    servidor_nome: safeText(atestado.servidorNome),
    data: date,
    data_inicio: atestado.dataInicio,
    data_fim: atestado.dataFim,
    dias: Number(atestado.dias || 0),
    tipo: 'ATESTADO',
    descricao: safeText(atestado.observacao) || `Atestado ${atestado.tipo}`,
    observacao: safeText(atestado.observacao) || `Atestado ${atestado.tipo}`,
    origem: 'ATESTADO',
    categoria: safeText(atestado.categoria),
    setor: safeText(atestado.setor),
    matricula: safeText(atestado.matricula),
    considerar_dias_uteis: atestado.considerarDiasUteis,
  }));

  for (const table of FREQUENCIA_TABLE_CANDIDATES) {
    try {
      if (table === 'frequencia_ocorrencias') {
        const { error } = await supabase.from(table).upsert(ocorrenciasPayload, {
          onConflict: 'cpf,data,tipo',
          ignoreDuplicates: false,
        });

        if (!error) {
          return { ok: true, conflitos: [], avisos: [] };
        }

        if (!isMissingTableError(error)) {
          return {
            ok: false,
            conflitos: [],
            avisos: [`Erro ao gravar na tabela ${table}: ${getErrorMessage(error, 'falha desconhecida')}`],
          };
        }
      }

      if (table === 'faltas') {
        const fallbackPayload = dates.map((date) => ({
          atestado_id: atestado.id,
          cpf: normalizeCpf(atestado.cpf),
          nome_servidor: safeText(atestado.servidorNome),
          servidor_nome: safeText(atestado.servidorNome),
          data: date,
          tipo: 'ATESTADO',
          observacao: safeText(atestado.observacao) || `Atestado ${atestado.tipo}`,
          descricao: safeText(atestado.observacao) || `Atestado ${atestado.tipo}`,
          turno: 'INTEGRAL',
          setor: safeText(atestado.setor),
          categoria: safeText(atestado.categoria),
          matricula: safeText(atestado.matricula),
          dias: Number(atestado.dias || 0),
        }));

        const { error } = await supabase.from(table).upsert(fallbackPayload, {
          onConflict: 'cpf,data,tipo',
          ignoreDuplicates: false,
        });

        if (!error) {
          return {
            ok: true,
            conflitos: [],
            avisos: ['Lançamento realizado usando a tabela fallback de frequência.'],
          };
        }

        if (!isMissingTableError(error)) {
          return {
            ok: false,
            conflitos: [],
            avisos: [`Erro ao gravar na tabela ${table}: ${getErrorMessage(error, 'falha desconhecida')}`],
          };
        }
      }
    } catch (error) {
      if (!isMissingTableError(error)) {
        return {
          ok: false,
          conflitos: [],
          avisos: [getErrorMessage(error, `Erro ao sincronizar com ${table}.`)],
        };
      }
    }
  }

  return {
    ok: false,
    conflitos: [],
    avisos: ['Nenhuma tabela de frequência disponível para sincronização.'],
  };
};

const removeFromFrequencia = async (atestadoId: string): Promise<{ ok: boolean; warning?: string }> => {
  const warnings: string[] = [];
  let success = false;

  for (const table of FREQUENCIA_TABLE_CANDIDATES) {
    try {
      const { error } = await supabase.from(table).delete().eq('atestado_id', atestadoId);
      if (!error) {
        success = true;
        continue;
      }

      if (!isMissingTableError(error)) {
        warnings.push(`Falha ao limpar a integração na tabela ${table}.`);
      }
    } catch {
      warnings.push(`Falha ao limpar a integração na tabela ${table}.`);
    }
  }

  if (success) {
    return { ok: true, warning: warnings.join('\n') || undefined };
  }

  if (warnings.length) {
    return { ok: false, warning: warnings.join('\n') };
  }

  return {
    ok: false,
    warning: 'Nenhuma tabela de frequência disponível para remover a integração.',
  };
};

const maybeAttachWarning = (
  base: AtestadoOperationResult,
  warning?: string,
): AtestadoOperationResult => {
  const cleanWarning = safeText(warning);
  if (!cleanWarning) return base;
  return { ...base, warning: cleanWarning };
};

export const atestadosService = {
  async listar(): Promise<Atestado[]> {
    const { data, error } = await supabase
      .from(TABLE_ATESTADOS)
      .select('*')
      .order('data_inicio', { ascending: false })
      .order('criado_em', { ascending: false });

    if (error) {
      throw new Error(getErrorMessage(error, 'Falha ao listar atestados.'));
    }

    return parseMaybeArray(data).map(mapRowToAtestado);
  },

  async obterPorId(id: string): Promise<Atestado | null> {
    const { data, error } = await supabase
      .from(TABLE_ATESTADOS)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(getErrorMessage(error, 'Falha ao obter o atestado.'));
    }

    return data ? mapRowToAtestado(data) : null;
  },

  async uploadArquivo(cpf: string, file: File, dateBase?: string): Promise<AtestadoUploadResult> {
    const validation = validateAtestadoFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const path = buildAtestadoStoragePath(cpf, file.name, dateBase);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET_ATESTADOS)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      });

    if (error) {
      throw new Error(getErrorMessage(error, 'Falha ao enviar arquivo para o Storage.'));
    }

    const signed = await supabase.storage
      .from(STORAGE_BUCKET_ATESTADOS)
      .createSignedUrl(path, 60 * 10);

    return {
      arquivoNome: file.name,
      arquivoPath: path,
      arquivoTipo: file.type || 'application/octet-stream',
      arquivoTamanho: file.size,
      arquivoUrl: signed.data?.signedUrl || '',
    };
  },

  async removerArquivo(path: string): Promise<void> {
    if (!path) return;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET_ATESTADOS)
      .remove([path]);

    if (error) {
      throw new Error(getErrorMessage(error, 'Falha ao remover arquivo do Storage.'));
    }
  },

  async obterUrlArquivo(path: string): Promise<string> {
    if (!path) {
      throw new Error('Arquivo não encontrado.');
    }

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET_ATESTADOS)
      .createSignedUrl(path, 60 * 10);

    if (error || !data?.signedUrl) {
      throw new Error(getErrorMessage(error, 'Falha ao gerar URL de download do arquivo.'));
    }

    return data.signedUrl;
  },

  async baixarArquivo(path: string): Promise<void> {
    const url = await this.obterUrlArquivo(path);
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  async adicionar(input: AtestadoInput): Promise<AtestadoOperationResult> {
    let uploadedPath = '';

    try {
      let fileMeta: Partial<AtestadoUploadResult> | undefined;

      if (input.arquivo) {
        fileMeta = await this.uploadArquivo(input.cpf, input.arquivo, input.dataInicio);
        uploadedPath = fileMeta.arquivoPath || '';
      }

      const payload = mapInputToInsert(input, fileMeta);

      const { data, error } = await supabase
        .from(TABLE_ATESTADOS)
        .insert(payload)
        .select('*')
        .single();

      if (error || !data) {
        if (uploadedPath) {
          try {
            await this.removerArquivo(uploadedPath);
          } catch {
            // não mascara o erro principal
          }
        }
        throw new Error(getErrorMessage(error, 'Falha ao salvar atestado.'));
      }

      const atestado = mapRowToAtestado(data);
      const baseResult: AtestadoOperationResult = {
        ok: true,
        data: atestado,
        message: 'Atestado salvo com sucesso.',
      };

      if (!atestado.lancarNaFrequencia) {
        return baseResult;
      }

      const sync = await syncToFrequencia(atestado);
      if (!sync.ok) {
        return maybeAttachWarning(baseResult, buildSyncWarningMessage(sync));
      }

      return maybeAttachWarning(baseResult, buildAvisos(...sync.avisos).join('\n'));
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Falha ao adicionar atestado.'));
    }
  },

  async editar(id: string, input: AtestadoInput): Promise<AtestadoOperationResult> {
    const atual = await this.obterPorId(id);

    if (!atual) {
      throw new Error('Atestado não encontrado para edição.');
    }

    let newUpload: Partial<AtestadoUploadResult> | undefined;
    let uploadedPath = '';
    const oldFilePath = atual.arquivoPath;

    try {
      if (input.arquivo) {
        newUpload = await this.uploadArquivo(input.cpf, input.arquivo, input.dataInicio);
        uploadedPath = newUpload.arquivoPath || '';
      }

      const payload = mapInputToInsert(input, newUpload);

      const { data, error } = await supabase
        .from(TABLE_ATESTADOS)
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error || !data) {
        if (uploadedPath) {
          try {
            await this.removerArquivo(uploadedPath);
          } catch {
            // não mascara o erro principal
          }
        }
        throw new Error(getErrorMessage(error, 'Falha ao atualizar atestado.'));
      }

      const atualizado = mapRowToAtestado(data);
      const cleanupResult = await removeFromFrequencia(id);
      const warnings: string[] = [];

      if (cleanupResult.warning) {
        warnings.push(cleanupResult.warning);
      }

      if (atualizado.lancarNaFrequencia) {
        const sync = await syncToFrequencia(atualizado);
        if (!sync.ok) {
          warnings.push(buildSyncWarningMessage(sync));
        } else if (sync.avisos.length) {
          warnings.push(...sync.avisos);
        }
      }

      if (newUpload && oldFilePath && oldFilePath !== newUpload.arquivoPath) {
        try {
          await this.removerArquivo(oldFilePath);
        } catch {
          warnings.push('O atestado foi atualizado, mas o arquivo anterior não pôde ser removido do Storage.');
        }
      }

      const baseResult: AtestadoOperationResult = {
        ok: true,
        data: atualizado,
        message: 'Atestado atualizado com sucesso.',
      };

      return maybeAttachWarning(baseResult, buildAvisos(...warnings).join('\n'));
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Falha ao editar atestado.'));
    }
  },

  async excluir(id: string): Promise<void> {
    const atual = await this.obterPorId(id);
    if (!atual) return;

    await removeFromFrequencia(id);

    const { error } = await supabase
      .from(TABLE_ATESTADOS)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(getErrorMessage(error, 'Falha ao excluir atestado.'));
    }

    if (atual.arquivoPath) {
      try {
        await this.removerArquivo(atual.arquivoPath);
      } catch {
        // não quebra a exclusão principal
      }
    }
  },

  async resincronizarFrequencia(id: string): Promise<AtestadoOperationResult> {
    const atual = await this.obterPorId(id);

    if (!atual) {
      throw new Error('Atestado não encontrado para sincronização.');
    }

    const cleanup = await removeFromFrequencia(id);
    const sync = atual.lancarNaFrequencia
      ? await syncToFrequencia(atual)
      : { ok: true, conflitos: [], avisos: [] };

    const warnings = buildAvisos(cleanup.warning, sync.ok ? sync.avisos.join('\n') : buildSyncWarningMessage(sync));

    return maybeAttachWarning(
      {
        ok: true,
        data: atual,
        message: sync.ok
          ? 'Sincronização com frequência concluída.'
          : 'Atestado localizado, mas houve falha na sincronização com frequência.',
      },
      warnings.join('\n'),
    );
  },
};

export default atestadosService;
