import { API_BASE_URL } from '../config/api';
import { MapaFilters, MapaPreviewResponse } from '../types/mapas';

function normalizeArrayPayload(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.registros)) return payload.registros;
  if (Array.isArray(payload?.linhas)) return payload.linhas;
  return [];
}

function normalizePreviewResponse(payload: any, filtros: MapaFilters): MapaPreviewResponse {
  const linhas = normalizeArrayPayload(payload?.linhas ? payload : payload?.data ? payload.data : payload).map((item: any, index: number) => ({
    ordem: Number(item?.ordem ?? index + 1),
    matricula: String(item?.matricula ?? item?.matriculaServidor ?? '').trim(),
    matriculaSigrh: String(item?.matriculaSigrh ?? item?.matricula_sigrh ?? '').trim(),
    nomeCompleto: String(item?.nomeCompleto ?? item?.nome_completo ?? item?.nome ?? 'NÃO INFORMADO').trim(),
    cpf: String(item?.cpf ?? '').trim(),
    cargo: String(item?.cargo ?? 'NÃO INFORMADO').trim(),
    categoria: String(item?.categoria ?? 'NÃO INFORMADO').trim(),
    setor: String(item?.setor ?? 'NÃO INFORMADO').trim(),
    lotacao: String(item?.lotacao ?? '').trim(),
    lotacaoInterna: String(item?.lotacaoInterna ?? item?.lotacao_interna ?? '').trim(),
    frequenciaTexto: String(item?.frequenciaTexto ?? item?.frequencia_texto ?? item?.frequencia ?? 'INTEGRAL').trim(),
    faltas: String(item?.faltas ?? '-').trim(),
    observacao: String(item?.observacao ?? '').trim(),
    dataInicioSetor: String(item?.dataInicioSetor ?? item?.data_inicio_setor ?? '').trim(),
    cargaHoraria: String(item?.cargaHoraria ?? item?.carga_horaria ?? '').trim(),
    status: String(item?.status ?? '').trim(),
    tipoLayout: item?.tipoLayout ?? item?.tipo_layout ?? payload?.layout ?? 'setrabes_simples',
    inconsistencias: Array.isArray(item?.inconsistencias) ? item.inconsistencias : [],
  }));

  return {
    ok: Boolean(payload?.ok ?? true),
    layout: payload?.layout ?? filtros.layout ?? 'setrabes_simples',
    filtros,
    stats: {
      totalServidores: Number(payload?.stats?.totalServidores ?? linhas.length),
      totalPendencias: Number(payload?.stats?.totalPendencias ?? payload?.diagnostics?.totalComPendenciaGrave ?? 0),
      totalComObservacao: Number(payload?.stats?.totalComObservacao ?? payload?.diagnostics?.totalComObservacao ?? 0),
      totalAptosExportacao: Number(payload?.stats?.totalAptosExportacao ?? Math.max(0, linhas.length - (payload?.diagnostics?.totalComPendenciaGrave ?? 0))),
    },
    diagnostics: {
      totalRegistros: Number(payload?.diagnostics?.totalRegistros ?? linhas.length),
      totalComCpfAusente: Number(payload?.diagnostics?.totalComCpfAusente ?? 0),
      totalComMatriculaAusente: Number(payload?.diagnostics?.totalComMatriculaAusente ?? 0),
      totalComCargoAusente: Number(payload?.diagnostics?.totalComCargoAusente ?? 0),
      totalComDuplicidadeCpf: Number(payload?.diagnostics?.totalComDuplicidadeCpf ?? 0),
      totalComDuplicidadeMatricula: Number(payload?.diagnostics?.totalComDuplicidadeMatricula ?? 0),
      totalComObservacao: Number(payload?.diagnostics?.totalComObservacao ?? 0),
      totalComObservacaoLonga: Number(payload?.diagnostics?.totalComObservacaoLonga ?? 0),
      totalComPendenciaGrave: Number(payload?.diagnostics?.totalComPendenciaGrave ?? 0),
      paginasPrevistas: Number(payload?.diagnostics?.paginasPrevistas ?? 1),
      registrosInvalidos: Array.isArray(payload?.diagnostics?.registrosInvalidos) ? payload.diagnostics.registrosInvalidos : [],
      alertas: Array.isArray(payload?.diagnostics?.alertas) ? payload.diagnostics.alertas : [],
      sugestoes: Array.isArray(payload?.diagnostics?.sugestoes) ? payload.diagnostics.sugestoes : [],
    },
    linhas,
  };
}

async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  let payload: any = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { ok: false, message: text || 'Resposta inválida do servidor.' };
  }

  if (!response.ok) {
    throw new Error(payload?.message || 'Falha ao processar a requisição do mapa.');
  }

  return payload;
}

async function downloadFile(path: string, body: Record<string, any>, defaultName: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Falha ao exportar arquivo do mapa.');
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^\"]+)"?/i);
  const fileName = match?.[1] || defaultName;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const mapasService = {
  async listarPreview(filtros: MapaFilters): Promise<MapaPreviewResponse> {
    const params = new URLSearchParams({
      mes: String(filtros.mes),
      ano: String(filtros.ano),
      categoria: filtros.categoria || '',
      setor: filtros.setor || '',
      status: filtros.status || 'ATIVO',
      layout: filtros.layout || 'automatico',
      modoExportacao: filtros.modoExportacao || 'arquivo_unico',
    });

    const payload = await requestJson(`/api/mapas/preview?${params.toString()}`);
    return normalizePreviewResponse(payload, filtros);
  },

  async validar(filtros: MapaFilters): Promise<MapaPreviewResponse> {
    const payload = await requestJson('/api/mapas/validar', {
      method: 'POST',
      body: JSON.stringify(filtros),
    });
    return normalizePreviewResponse(payload, filtros);
  },

  async exportarDocx(filtros: MapaFilters) {
    await downloadFile('/api/mapas/exportar/docx', filtros, `mapa_${filtros.ano}_${filtros.mes}.docx`);
  },

  async exportarPdf(filtros: MapaFilters) {
    await downloadFile('/api/mapas/exportar/pdf', filtros, `mapa_${filtros.ano}_${filtros.mes}.pdf`);
  },

  async exportarZip(filtros: MapaFilters) {
    await downloadFile('/api/mapas/exportar/zip', filtros, `mapa_${filtros.ano}_${filtros.mes}.zip`);
  },
};
