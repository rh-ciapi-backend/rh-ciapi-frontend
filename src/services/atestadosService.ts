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

const formatSyncError = (sync: FrequenciaSyncResult, fallback: string) => {
  if (sync.conflitos.length) {
    return `Conflito com frequência:\n${sync.conflitos
      .map((item) => `${item.data} - ${item.descricao}`)
      .join('\n')}`;
  }

  if (sync.avisos.length) {
    return sync.avisos.join('\n');
  }

  return fallback;
};

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
  servidor_nome: String(input.servidorNome || '').trim(),
  matricula: String(input.matricula || '').trim(),
  setor: String(input.setor || '').trim(),
  categoria: String(input.categoria || '').trim(),
  tipo: input.tipo,
  data_emissao: input.dataEmissao || null,
  data_inicio: input.dataInicio,
  data_fim: input.dataFim,
  dias: Number(input.dias || 0),
  cid: String(input.cid || '').trim(),
  observacao: String(input.observacao || '').trim(),
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
  servidor_nome: String(item.servidorNome || '').trim(),
  matricula: String(item.matricula || '').trim(),
  setor: String(item.setor || '').trim(),
  categoria: String(item.categoria || '').trim(),
  tipo: item.tipo,
  data_emissao: item.dataEmissao || null,
  data_inicio: item.dataInicio,
  data_fim: item.dataFim,
  dias: Number(item.dias || 0),
  cid: String(item.cid || '').trim(),
  observacao: String(item.observacao || '').trim(),
  status: item.status,
  arquivo_nome: item.arquivoNome || '',
  arquivo_url: item.arquivoUrl || '',
  arquivo_path: item.arquivoPath || '',
  arquivo_tipo: item.arquivoTipo || '',
  arquivo_tamanho: Number(item.arquivoTamanho || 0),
  lancar_na_frequencia: Boolean(item.lancarNaFrequencia),
  considerar_dias_uteis: Boolean(item.considerarDiasUteis),
});

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

      (otherAtestados || []).forEach((row: { id?: string; servidor_nome?: string | null }) => {
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

        if (!error && Array.isArray(data) && data.length) {
          data.forEach((item: { tipo?: string | null }) => {
            const tipo = String(item?.tipo ?? '').toUpperCase();
            if (tipo && tipo !== 'ATESTADO') {
              conflicts.push({
                data: date,
                origem: table === 'faltas' ? 'FALTAS' : 'FREQUENCIA',
                descricao: `Já existe ocorrência "${item?.tipo ?? ''}" nesta data.`,
              });
            }
          });
          break;
        }
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

        if (!error && Array.isArray(data) && data.length) {
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
      avisos: ['Conflitos encontrados ao lançar na frequência.'],
    };
  }

  const ocorrenciasPayload = dates.map((date) => ({
    atestado_id: atestado.id,
    cpf: normalizeCpf(atestado.cpf),
    data: date,
    tipo: 'ATESTADO',
    descricao: atestado.observacao || `Atestado ${atestado.tipo}`,
    origem: 'ATESTADO',
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
      }

      if (table === 'faltas') {
        const fallbackPayload = dates.map((date) => ({
          atestado_id: atestado.id,
          cpf: normalizeCpf(atestado.cpf),
          data: date,
          tipo: 'ATESTADO',
          observacao: atestado.observacao || `Atestado ${atestado.tipo}`,
          turno: 'INTEGRAL',
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
      }
    } catch {
      continue;
    }
  }

  return {
    ok: false,
    conflitos: [],
    avisos: ['Não foi possível sincronizar com a frequência.'],
  };
};

const removeFromFrequencia = async (atestadoId: string) => {
  for (const table of FREQUENCIA_TABLE_CANDIDATES) {
    try {
      const { error } = await supabase.from(table).delete().eq('atestado_id', atestadoId);
      if (!error) return true;
    } catch {
      continue;
    }
  }
  return false;
};

const restorePreviousState = async (id: string, previous: Atestado) => {
  await supabase.from(TABLE_ATESTADOS).update(mapAtestadoToInsert(previous)).eq('id', id);
  await removeFromFrequencia(id);
  if (previous.lancarNaFrequencia) {
    await syncToFrequencia(previous);
  }
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

    return (data || []).map(mapRowToAtestado);
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
          } catch {}
        }
        throw new Error(getErrorMessage(error, 'Falha ao salvar atestado.'));
      }

      const atestado = mapRowToAtestado(data);

      if (!atestado.lancarNaFrequencia) {
        return {
          ok: true,
          data: atestado,
          message: 'Atestado salvo com sucesso.',
        };
      }

      const sync = await syncToFrequencia(atestado);

      if (!sync.ok) {
        await supabase.from(TABLE_ATESTADOS).delete().eq('id', atestado.id);

        if (uploadedPath) {
          try {
            await this.removerArquivo(uploadedPath);
          } catch {}
        }

        throw new Error(formatSyncError(sync, 'Falha ao integrar com frequência.'));
      }

      return {
        ok: true,
        data: atestado,
        message: 'Atestado salvo com sucesso.',
        warning: sync.avisos[0],
      };
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
          } catch {}
        }
        throw new Error(getErrorMessage(error, 'Falha ao atualizar atestado.'));
      }

      const atualizado = mapRowToAtestado(data);

      await removeFromFrequencia(id);

      if (atualizado.lancarNaFrequencia) {
        const sync = await syncToFrequencia(atualizado);

        if (!sync.ok) {
          await restorePreviousState(id, atual);

          if (uploadedPath) {
            try {
              await this.removerArquivo(uploadedPath);
            } catch {}
          }

          throw new Error(formatSyncError(sync, 'Falha ao integrar com frequência.'));
        }
      }

      if (newUpload && oldFilePath && oldFilePath !== newUpload.arquivoPath) {
        try {
          await this.removerArquivo(oldFilePath);
        } catch {}
      }

      return {
        ok: true,
        data: atualizado,
        message: 'Atestado atualizado com sucesso.',
      };
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
        // não quebra a exclusão do registro se a limpeza do storage falhar
      }
    }
  },
};

export default atestadosService;
