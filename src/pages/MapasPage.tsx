import React, { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, FileText, ShieldCheck } from 'lucide-react';
import { MapasHero } from '../components/mapas/MapasHero';
import { MapasStats } from '../components/mapas/MapasStats';
import { MapasFilters } from '../components/mapas/MapasFilters';
import { MapasDiagnostics } from '../components/mapas/MapasDiagnostics';
import { MapasPreviewTable } from '../components/mapas/MapasPreviewTable';
import { MapasExportActions } from '../components/mapas/MapasExportActions';
import { mapasService } from '../services/mapasService';
import { LinhaMapa, MapaFilters, MapaPreviewResponse } from '../types/mapas';

type TabMapa = 'resumo' | 'preview' | 'diagnostico';

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
  const [activeTab, setActiveTab] = useState<TabMapa>('resumo');

  const categorias = useMemo(() => CATEGORIAS_CANONICAS, []);
  const setores = useMemo(() => SETORES_PADRAO, []);

  const mergePreview = (data: MapaPreviewResponse, linhasOverride?: LinhaMapa[]) => {
    setPreview({
      ...data,
      linhas: linhasOverride || data.linhas || [],
    });
  };

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mapasService.listarPreview(filters);
      mergePreview(data);
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
      mergePreview(data, preview.linhas.length ? preview.linhas : data.linhas);
      setActiveTab('diagnostico');
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

  const handleObservationChange = (rowIndex: number, value: string) => {
    setPreview((prev) => {
      const linhas = [...prev.linhas];
      const target = linhas[rowIndex];
      if (!target) return prev;

      linhas[rowIndex] = {
        ...target,
        observacao: value,
      };

      return {
        ...prev,
        linhas,
        stats: {
          ...prev.stats,
          totalComObservacao: linhas.filter((item) => String(item.observacao || '').trim()).length,
        },
      };
    });
  };

  useEffect(() => {
    loadPreview();
  }, []);

  const tabs = [
    { key: 'resumo' as TabMapa, label: 'Resumo', icon: LayoutDashboard },
    { key: 'preview' as TabMapa, label: 'Pré-visualização', icon: FileText },
    { key: 'diagnostico' as TabMapa, label: 'Diagnóstico e exportação', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <MapasHero />

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-2 shadow-xl">
        <div className="flex flex-wrap gap-2">
          {tabs.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={[
                  'inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition',
                  active
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white',
                ].join(' ')}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {(activeTab === 'resumo' || activeTab === 'preview' || activeTab === 'diagnostico') && (
        <>
          <MapasStats stats={preview.stats} />

          <MapasFilters
            filters={filters}
            categorias={categorias}
            setores={setores}
            onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
            onRefresh={loadPreview}
          />
        </>
      )}

      {activeTab === 'resumo' && (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white">Painel executivo</h3>
            <p className="mt-1 text-sm text-slate-400">
              Visão geral do mapa mensal com foco em quantidade, pendências e observações.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Layout resolvido</p>
                <p className="mt-2 text-base font-semibold text-white">{preview.layout}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Páginas previstas</p>
                <p className="mt-2 text-base font-semibold text-white">{preview.diagnostics.paginasPrevistas}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Registros inválidos</p>
                <p className="mt-2 text-base font-semibold text-white">{preview.diagnostics.registrosInvalidos.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Observações editáveis</p>
                <p className="mt-2 text-base font-semibold text-white">Sim, na aba de pré-visualização</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white">Ações rápidas</h3>
            <p className="mt-1 text-sm text-slate-400">
              Valide os dados e gere o documento oficial do mapa.
            </p>

            <div className="mt-6">
              <MapasExportActions
                isBusy={loading || exporting}
                onValidate={validateData}
                onDocx={() => runExport('docx')}
                onPdf={() => runExport('pdf')}
                onZip={() => runExport('zip')}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="relative">
          {(loading || exporting) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-950/60 backdrop-blur-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            </div>
          )}
          <MapasPreviewTable
            linhas={preview.linhas}
            layout={preview.layout}
            onObservationChange={handleObservationChange}
          />
        </div>
      )}

      {activeTab === 'diagnostico' && (
        <div className="space-y-6">
          <MapasExportActions
            isBusy={loading || exporting}
            onValidate={validateData}
            onDocx={() => runExport('docx')}
            onPdf={() => runExport('pdf')}
            onZip={() => runExport('zip')}
          />

          <MapasDiagnostics diagnostics={preview.diagnostics} />
        </div>
      )}
    </div>
  );
}
