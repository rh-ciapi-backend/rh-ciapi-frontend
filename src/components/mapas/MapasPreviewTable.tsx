import React, { useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import { LinhaMapa, TipoLayoutMapa } from '../../types/mapas';

interface Props {
  linhas: LinhaMapa[];
  layout: TipoLayoutMapa;
  onObservationChange?: (rowIndex: number, value: string) => void;
}

export function MapasPreviewTable({ linhas, layout, onObservationChange }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftObservation, setDraftObservation] = useState('');

  const startEdit = (index: number, currentValue: string) => {
    setEditingIndex(index);
    setDraftObservation(currentValue || '');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setDraftObservation('');
  };

  const saveEdit = (index: number) => {
    onObservationChange?.(index, draftObservation);
    setEditingIndex(null);
    setDraftObservation('');
  };

  const renderObservationCell = (linha: LinhaMapa, index: number) => {
    const isEditing = editingIndex === index;

    if (isEditing) {
      return (
        <div className="min-w-[280px] space-y-2">
          <textarea
            value={draftObservation}
            onChange={(e) => setDraftObservation(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-cyan-400/20 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => saveEdit(index)}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950"
            >
              <Save size={14} />
              Salvar
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white"
            >
              <X size={14} />
              Cancelar
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-w-[240px] space-y-2">
        <p className="whitespace-pre-wrap break-words text-slate-300">
          {linha.observacao || '—'}
        </p>
        <button
          type="button"
          onClick={() => startEdit(index, linha.observacao || '')}
          className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-white/10"
        >
          <Edit3 size={14} />
          Editar observação
        </button>
      </div>
    );
  };

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

  const renderRow = (linha: LinhaMapa, index: number) => {
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
        <tr key={`${linha.matricula}-${linha.ordem}`} className="border-t border-white/10 align-top">
          <td className="px-4 py-3">{linha.ordem}</td>
          <td className="px-4 py-3">{linha.matricula || '—'}</td>
          <td className="px-4 py-3">{linha.matriculaSigrh || '—'}</td>
          <td className="px-4 py-3 text-white">{linha.nomeCompleto}</td>
          <td className="px-4 py-3">{linha.cpf || '—'}</td>
          <td className="px-4 py-3">{linha.cargo || '—'}</td>
          <td className="px-4 py-3">{linha.frequenciaTexto || '—'}</td>
          <td className="px-4 py-3">{linha.faltas || '—'}</td>
          <td className="px-4 py-3">{renderObservationCell(linha, index)}</td>
        </tr>
      );
    }

    return (
      <tr key={`${linha.matricula}-${linha.ordem}`} className="border-t border-white/10 align-top">
        <td className="px-4 py-3">{linha.ordem}</td>
        <td className="px-4 py-3">{linha.matricula || '—'}</td>
        <td className="px-4 py-3 text-white">{linha.nomeCompleto}</td>
        <td className="px-4 py-3">{linha.cpf || '—'}</td>
        <td className="px-4 py-3">{linha.cargo || '—'}</td>
        <td className="px-4 py-3">{linha.frequenciaTexto || '—'}</td>
        <td className="px-4 py-3">{linha.faltas || '—'}</td>
        <td className="px-4 py-3">{renderObservationCell(linha, index)}</td>
      </tr>
    );
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl">
      <div className="border-b border-white/10 px-5 py-4">
        <h3 className="text-lg font-bold text-white">Pré-visualização do mapa</h3>
        <p className="mt-1 text-sm text-slate-400">
          A tabela se adapta automaticamente ao layout selecionado e permite editar observações antes da exportação.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-400">
            {renderHead()}
          </thead>
          <tbody>
            {linhas.length ? (
              linhas.map((linha, index) => renderRow(linha, index))
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                  Nenhum registro encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
