import { supabase } from '../lib/supabaseClient';
import {
  Atestado,
  AtestadoInput,
  AtestadoOperationResult,
  AtestadoUploadResult,
  FrequenciaConflict,
  FrequenciaSyncResult,
} from '../types/atestados';
import {
  buildAtestadoStoragePath,
  enumerateDates,
  formatCpf,
  normalizeCpf,
  validateAtestadoFile,
} from '../utils/atestados';

const TABLE_ATESTADOS = 'atestados';
const STORAGE_BUCKET_ATESTADOS = 'atestados';

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

const mapRowToAtestado = (row: Partial<DbAtestadoRow>): Atestado => ({
  id: String(row.id ?? ''),
  cpf: formatCpf(row.cpf ?? ''),
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
  servidor_nome: input.servidorNome.trim(),
  matricula: input.matricula?.trim() ?? '',
  setor: input.setor?.trim() ?? '',
  categoria: input.categoria?.trim() ?? '',
  tipo: input.tipo,
  data_emissao: input.dataEmissao || null,
  data_inicio: input.dataInicio,
  data_fim: input.dataFim,
  dias: input.dias,
  cid: input.cid?.trim() ?? '',
  observacao: input.observacao?.trim() ?? '',
  status: input.status,
  arquivo_nome: fileMeta?.arquivoNome ?? input.arquivoAtualNome ?? '',
  arquivo_url: fileMeta?.arquivoUrl ?? '',
  arquivo_path: fileMeta?.arquivoPath ?? input.arquivoAtualPath ?? '',
  arquivo_tipo: fileMeta?.arquivoTipo ?? input.arquivoAtualTipo ?? '',
  arquivo_tamanho: fileMeta?.arquivoTamanho ?? input.arquivoAtualTamanho ?? 0,
  lancar_na_frequencia: input.lancarNaFrequencia,
  considerar_dias_uteis: input.considerarDiasUteis,
});

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error && 'message' in error && typeof (error as any).message === 'string') {
    return (error as any).message;
  }
  return fallback;
};

const trySelectFromTable = async (table: string, filters: Record<string, unknown>) => {
  let query = supabase.from(table).select('*');

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query = query.eq(key, value as never);
    }
  });

  return query;
};

const tryDeleteFromTable = async (table: string, column: string, value: string) => {
  return supabase.from(table).delete().eq(column, value);
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
    const { data: otherAtestados } = await supabase
      .from(TABLE_ATESTADOS)
      .select('id, data_inicio, data_fim, servidor_nome')
      .eq('cpf', cpfDigits)
      .lte('data_inicio', date)
      .gte('data_fim', date);

    (otherAtestados || []).forEach((row: any) => {
      if (!atestadoId || row.id !== atestadoId) {
        conflicts.push({
          data: date,
          origem: 'ATESTADO',
          descricao: `Outro atestado já cobre esta data${row.servidor_nome ? ` (${row.servidor_nome})` : ''}.`,
        });
      }
    });

    for (const table of FREQUENCIA_TABLE_CANDIDATES) {
      try {
        const { data, error } = await supabase.from(table).select('*').eq('cpf', cpfDigits).eq('data', date);
        if (!error && Array.isArray(data) && data.length) {
          data.forEach((item: any) => {
            if (item?.tipo && String(item.tipo).toUpperCase() !== 'ATESTADO') {
              conflicts.push({
                data: date,
                origem: table === 'faltas' ? 'FALTAS' : 'FREQUENCIA',
                descricao: `Já existe ocorrência "${item.tipo}" nesta data.`,
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

const syncToFrequenciaOcorrencias = async (atestado: Atestado) => {
  const dates = enumerateDates(atestado.dataInicio, atestado.dataFim, atestado.considerarDiasUteis);
  if (!dates.length) {
    return { ok: true, conflitos: [], avisos: [] } as FrequenciaSyncResult;
  }

  const conflitos = await queryFrequencyConflicts(atestado.cpf, dates, atestado.id);
  if (conflitos.length) {
    return {
      ok: false,
      conflitos,
      avisos: ['Conflitos encontrados ao lançar na frequência.'],
    } as FrequenciaSyncResult;
  }

  const payload = dates.map((date) => ({
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
        const { error } = await supabase.from(table).upsert(payload, {
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
      const { error } = await tryDeleteFromTable(table, 'atestado_id', atestadoId);
      if (!error) return;
    } catch {
      continue;
    }
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
      .single();

    if (error && error.code !== 'PGRST116') {
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
    const { error } = await supabase.storage.from(STORAGE_BUCKET_ATESTADOS).upload(path, file, {
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

    const { error } = await supabase.storage.from(STORAGE_BUCKET_ATESTADOS).remove([path]);
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
        uploadedPath = fileMeta.arquivoPath;
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

      if (atestado.lancarNaFrequencia) {
        const sync = await syncToFrequenciaOcorrencias(atestado);
        if (!sync.ok) {
          await supabase.from(TABLE_ATESTADOS).delete().eq('id', atestado.id);
          if (uploadedPath) {
            try {
              await this.removerArquivo(uploadedPath);
            } catch {}
          }
          throw new Error(
            sync.conflitos.length
              ? `Conflito com frequência:\n${sync.conflitos
                  .map((item) => `${item.data} - ${item.descricao}`)
                  .join('\n')}`
              : sync.avisos.join('\n') || 'Falha ao integrar com frequência.',
          );
        }

        return {
          ok: true,
          data: atestado,
          message: 'Atestado salvo com sucesso.',
          warning: sync.avisos[0],
        };
      }

      return {
        ok: true,
        data: atestado,
        message: 'Atestado salvo com sucesso.',
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
        uploadedPath = newUpload.arquivoPath;
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

      if (atualizado.lancarNaFrequencia) {
        await removeFromFrequencia(atualizado.id);
        const sync = await syncToFrequenciaOcorrencias(atualizado);
        if (!sync.ok) {
          await supabase.from(TABLE_ATESTADOS).update(mapInputToInsert({
            ...input,
            arquivoAtualNome: atual.arquivoNome,
            arquivoAtualPath: atual.arquivoPath,
            arquivoAtualTipo: atual.arquivoTipo,
            arquivoAtualTamanho: atual.arquivoTamanho,
            arquivo: null,
          })).eq('id', id);

          if (uploadedPath) {
            try {
              await this.removerArquivo(uploadedPath);
            } catch {}
          }

          throw new Error(
            sync.conflitos.length
              ? `Conflito com frequência:\n${sync.conflitos
                  .map((item) => `${item.data} - ${item.descricao}`)
                  .join('\n')}`
              : sync.avisos.join('\n') || 'Falha ao integrar com frequência.',
          );
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
          warning: sync.avisos[0],
        };
      }

      await removeFromFrequencia(atualizado.id);

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

    const { error } = await supabase.from(TABLE_ATESTADOS).delete().eq('id', id);
    if (error) {
      throw new Error(getErrorMessage(error, 'Falha ao excluir atestado.'));
    }

    if (atual.arquivoPath) {
      try {
        await this.removerArquivo(atual.arquivoPath);
      } catch {
        // mantém exclusão do registro mesmo se a limpeza do storage falhar
      }
    }
  },
};
