import React from 'react';
import { LinhaMapa, TipoLayoutMapa } from '../../types/mapas';

interface Props {
  linhas: LinhaMapa[];
  layout: TipoLayoutMapa;
}

export function MapasPreviewTable({ linhas, layout }: Props) {
  const renderHead = () => {
    if (layout === 'sesau_detalhado') {
      return (
        <tr>
          <th className="px-4 py-3">Ord</th>
          <th className="px-4 py-3">Matrícula</th>
          <th className="px-4 py-3">Data início no setor</th>
          <th className="px-4 py-3">Nome</th>
          <th className="px-4 py-3">CPF</th>
          <th className="px-4 py-3">Cargo</th>
          <th className="px-4 py-3">Freq.</th>
          <th className="px-4 py-3">Lotação/Setor interno</th>
          <th className="px-4 py-3">Carga horária</th>
        </tr>
      );
    }

    if (layout === 'sesau_seletivo') {
      return (
        <tr>
          <th className="px-4 py-3">Nº</th>
          <th className="px-4 py-3">Matrícula</th>
          <th className="px-4 py-3">Matrícula SIGRH</th>
          <th className="px-4 py-3">Nome</th>
          <th className="px-4 py-3">CPF</th>
          <th className="px-4 py-3">Cargo</th>
          <th className="px-4 py-3">Frequência</th>
          <th className="px-4 py-3">Faltas</th>
          <th className="px-4 py-3">Observação</th>
        </tr>
      );
    }

    return (
      <tr>
        <th className="px-4 py-3">Nº</th>
        <th className="px-4 py-3">Matrícula</th>
        <th className="px-4 py-3">Nome do servidor</th>
        <th className="px-4 py-3">CPF</th>
        <th className="px-4 py-3">Cargo</th>
        <th className="px-4 py-3">Frequências</th>
        <th className="px-4 py-3">Faltas</th>
        <th className="px-4 py-3">Observação</th>
      </tr>
    );
  };

  const renderRow = (linha: LinhaMapa) => {
    if (layout === 'sesau_detalhado') {
      return (
        <tr key={`${linha.matricula}-${linha.ordem}`} className="border-t border-white/10">
          <td className="px-4 py-3">{linha.ordem}</td>
          <td className="px-4 py-3">{linha.matricula || '—'}</td>
          <td className="px-4 py-3">{linha.dataInicioSetor || '—'}</td>
          <td className="px-4 py-3 text-white">{linha.nomeCompleto}</td>
          <td className="px-4 py-3">{linha.cpf || '—'}</td>
          <td className="px-4 py-3">{linha.cargo || '—'}</td>
          <td className="px-4 py-3">{linha.frequenciaTexto || '—'}</td>
          <td className="px-4 py-3">{linha.lotacaoInterna || linha.setor || '—'}</td>
          <td className="px-4 py-3">{linha.cargaHoraria || '—'}</td>
        </tr>
      );
    }

    if (layout === 'sesau_seletivo') {
      return (
        <tr key={`${linha.matricula}-${linha.ordem}`} className="border-t border-white/10">
          <td className="px-4 py-3">{linha.ordem}</td>
          <td className="px-4 py-3">{linha.matricula || '—'}</td>
          <td className="px-4 py-3">{linha.matriculaSigrh || '—'}</td>
          <td className="px-4 py-3 text-white">{linha.nomeCompleto}</td>
          <td className="px-4 py-3">{linha.cpf || '—'}</td>
          <td className="px-4 py-3">{linha.cargo || '—'}</td>
          <td className="px-4 py-3">{linha.frequenciaTexto || '—'}</td>
          <td className="px-4 py-3">{linha.faltas || '—'}</td>
          <td className="px-4 py-3">{linha.observacao || '—'}</td>
        </tr>
      );
    }

    return (
      <tr key={`${linha.matricula}-${linha.ordem}`} className="border-t border-white/10">
        <td className="px-4 py-3">{linha.ordem}</td>
        <td className="px-4 py-3">{linha.matricula || '—'}</td>
        <td className="px-4 py-3 text-white">{linha.nomeCompleto}</td>
        <td className="px-4 py-3">{linha.cpf || '—'}</td>
        <td className="px-4 py-3">{linha.cargo || '—'}</td>
        <td className="px-4 py-3">{linha.frequenciaTexto || '—'}</td>
        <td className="px-4 py-3">{linha.faltas || '—'}</td>
        <td className="px-4 py-3">{linha.observacao || '—'}</td>
      </tr>
    );
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl">
      <div className="border-b border-white/10 px-5 py-4">
        <h3 className="text-lg font-bold text-white">Pré-visualização do mapa</h3>
        <p className="mt-1 text-sm text-slate-400">A tabela se adapta automaticamente ao layout selecionado.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-400">
            {renderHead()}
          </thead>
          <tbody>
            {linhas.length ? linhas.map(renderRow) : (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-500">Nenhum registro encontrado para os filtros selecionados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
