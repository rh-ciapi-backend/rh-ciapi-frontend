import React, { useEffect, useMemo, useState } from 'react';
import { MapasHero } from '../components/mapas/MapasHero';
import { MapasStats } from '../components/mapas/MapasStats';
import { MapasFilters } from '../components/mapas/MapasFilters';
import { MapasDiagnostics } from '../components/mapas/MapasDiagnostics';
import { MapasPreviewTable } from '../components/mapas/MapasPreviewTable';
import { MapasExportActions } from '../components/mapas/MapasExportActions';
import { mapasService } from '../services/mapasService';
import { MapaFilters, MapaPreviewResponse } from '../types/mapas';

const CATEGORIAS_CANONICAS = [
  'EFETIVO SESAU',
  'SELETIVO SESAU',
  'EFETIVO SETRABES',
  'SELETIVO SETRABES',
  'FEDERAIS SETRABES',
  'COMISSIONADOS',
];

const SETORES_PADRAO = [
  'CENTRO DE REFERÊNCIA DO IDOSO – MELHOR IDADE/SETRABES',
  'CIAPI',
  'SAE/SAÚDE',
];

const initialFilters: MapaFilters = {
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear(),
  categoria: '',
  setor: '',
  status: 'ATIVO',
  layout: 'automatico',
  modoExportacao: 'arquivo_unico',
};

const emptyPreview: MapaPreviewResponse = {
  ok: true,
  layout: 'setrabes_simples',
  filtros: initialFilters,
  stats: {
    totalServidores: 0,
    totalPendencias: 0,
    totalComObservacao: 0,
    totalAptosExportacao: 0,
  },
  diagnostics: {
    totalRegistros: 0,
    totalComCpfAusente: 0,
    totalComMatriculaAusente: 0,
    totalComCargoAusente: 0,
    totalComDuplicidadeCpf: 0,
    totalComDuplicidadeMatricula: 0,
    totalComObservacao: 0,
    totalComObservacaoLonga: 0,
    totalComPendenciaGrave: 0,
    paginasPrevistas: 0,
    registrosInvalidos: [],
    alertas: [],
    sugestoes: [],
  },
  linhas: [],
};

export default function MapasPage() {
  const [filters, setFilters] = useState<MapaFilters>(initialFilters);
  const [preview, setPreview] = useState<MapaPreviewResponse>(emptyPreview);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categorias = useMemo(() => CATEGORIAS_CANONICAS, []);
  const setores = useMemo(() => SETORES_PADRAO, []);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mapasService.listarPreview(filters);
      setPreview(data);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar a pré-visualização do mapa.');
    } finally {
      setLoading(false);
    }
  };

  const validateData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mapasService.validar(filters);
      setPreview(data);
    } catch (err: any) {
      setError(err?.message || 'Erro ao validar os dados do mapa.');
    } finally {
      setLoading(false);
    }
  };

  const runExport = async (type: 'docx' | 'pdf' | 'zip') => {
    try {
      setExporting(true);
      setError(null);
      if (type === 'docx') await mapasService.exportarDocx(filters);
      if (type === 'pdf') await mapasService.exportarPdf(filters);
      if (type === 'zip') await mapasService.exportarZip(filters);
    } catch (err: any) {
      setError(err?.message || 'Erro ao exportar mapa.');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, []);

  return (
    <div className="space-y-6">
      <MapasHero />

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <MapasStats stats={preview.stats} />

      <MapasFilters
        filters={filters}
        categorias={categorias}
        setores={setores}
        onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        onRefresh={loadPreview}
      />

      <MapasExportActions
        isBusy={loading || exporting}
        onValidate={validateData}
        onDocx={() => runExport('docx')}
        onPdf={() => runExport('pdf')}
        onZip={() => runExport('zip')}
      />

      <MapasDiagnostics diagnostics={preview.diagnostics} />

      <div className="relative">
        {(loading || exporting) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-950/60 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          </div>
        )}
        <MapasPreviewTable linhas={preview.linhas} layout={preview.layout} />
      </div>
    </div>
  );
}
