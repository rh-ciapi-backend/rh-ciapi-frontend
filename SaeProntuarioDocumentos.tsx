import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileCheck2,
  FilePlus2,
  FileText,
  Loader2,
  Paperclip,
  Save,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import {
  saeDocumentosService,
  type SaeDocumentoProntuario,
  type SaeModeloDocumento,
} from '../../services/saeDocumentosService';

type Props = {
  usuarioId: string;
  compact?: boolean;
};

type EditorState = {
  documento: SaeDocumentoProntuario;
  modelo: SaeModeloDocumento;
} | null;

const statusStyle: Record<string, string> = {
  RASCUNHO: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  FINALIZADO: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
  ASSINADO: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
};

export default function SaeProntuarioDocumentos({ usuarioId, compact = false }: Props) {
  const [documentos, setDocumentos] = useState<SaeDocumentoProntuario[]>([]);
  const [modelos, setModelos] = useState<SaeModeloDocumento[]>([]);
  const [podeCriar, setPodeCriar] = useState(false);
  const [profissionalNome, setProfissionalNome] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [editor, setEditor] = useState<EditorState>(null);
  const [novoModeloId, setNovoModeloId] = useState('');
  const [novoAberto, setNovoAberto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTarget, setUploadTarget] = useState<SaeDocumentoProntuario | null>(null);

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro('');
      const [contexto, lista] = await Promise.all([
        saeDocumentosService.contexto(),
        saeDocumentosService.listarUsuario(usuarioId),
      ]);
      setModelos(contexto.modelos || []);
      setPodeCriar(Boolean(contexto.podeCriar));
      setProfissionalNome(contexto.profissional?.nome || '');
      setDocumentos(lista.documentos || []);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar os documentos.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [usuarioId]);

  useEffect(() => {
    if (!sucesso) return;
    const timer = window.setTimeout(() => setSucesso(''), 3500);
    return () => window.clearTimeout(timer);
  }, [sucesso]);

  const modeloById = useMemo(
    () => new Map(modelos.map((item) => [item.id, item])),
    [modelos],
  );

  const iniciar = async () => {
    if (!novoModeloId) {
      setErro('Selecione um modelo.');
      return;
    }
    try {
      setSalvando(true);
      setErro('');
      const response = await saeDocumentosService.criar(usuarioId, novoModeloId);
      setNovoAberto(false);
      setNovoModeloId('');
      setEditor({
        documento: response.documento,
        modelo: response.modelo,
      });
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível iniciar o documento.');
    } finally {
      setSalvando(false);
    }
  };

  const abrirEdicao = (documento: SaeDocumentoProntuario) => {
    const modelo = modeloById.get(documento.modeloId);
    if (!modelo) {
      setErro('O modelo deste documento não está disponível para o profissional logado.');
      return;
    }
    setEditor({ documento, modelo });
  };

  const atualizarCampo = (name: string, value: string) => {
    setEditor((prev) =>
      prev
        ? {
            ...prev,
            documento: {
              ...prev.documento,
              dados: { ...prev.documento.dados, [name]: value },
            },
          }
        : prev,
    );
  };

  const salvar = async (finalizar = false) => {
    if (!editor) return;
    try {
      setSalvando(true);
      setErro('');
      const response = await saeDocumentosService.salvar(editor.documento.id, {
        titulo: editor.documento.titulo,
        dados: editor.documento.dados,
        status: finalizar ? 'FINALIZADO' : 'RASCUNHO',
      });
      setEditor((prev) =>
        prev ? { ...prev, documento: response.documento } : prev,
      );
      setSucesso(finalizar ? 'Documento finalizado.' : 'Rascunho salvo.');
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const uploadAssinado = async (file?: File) => {
    if (!file || !uploadTarget) return;
    try {
      setSalvando(true);
      setErro('');
      await saeDocumentosService.anexarAssinado(uploadTarget.id, file);
      setSucesso('Documento assinado anexado ao prontuário.');
      setUploadTarget(null);
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível anexar o documento.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSalvando(false);
    }
  };

  const excluirDocumento = async (documento: SaeDocumentoProntuario) => {
    if (documento.status === 'ASSINADO') {
      setErro('Documento assinado não pode ser excluído do prontuário.');
      return;
    }

    const confirmado = window.confirm(
      `Excluir "${documento.titulo}"? Esta ação não poderá ser desfeita.`,
    );

    if (!confirmado) return;

    try {
      setSalvando(true);
      setErro('');
      await saeDocumentosService.excluir(documento.id);
      setSucesso('Relatório excluído.');
      if (editor?.documento.id === documento.id) {
        setEditor(null);
      }
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível excluir o relatório.');
    } finally {
      setSalvando(false);
    }
  };


  return (
    <section className={compact ? 'space-y-4' : 'space-y-5'}>
      <div className="flex flex-col gap-3 rounded-2xl border border-border-dark bg-card-dark p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <FileText size={18} />
            <span className="text-xs font-bold uppercase tracking-[0.16em]">
              Documentos do prontuário
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {profissionalNome
              ? `Profissional vinculado: ${profissionalNome}.`
              : 'Visualização administrativa dos documentos.'}
          </p>
        </div>

        {podeCriar && modelos.length > 0 && (
          <button
            type="button"
            onClick={() => setNovoAberto(true)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-hover sm:w-auto"
          >
            <FilePlus2 size={17} />
            Novo documento
          </button>
        )}
      </div>

      {erro && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {sucesso && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{sucesso}</span>
        </div>
      )}

      {carregando ? (
        <div className="flex min-h-48 items-center justify-center rounded-2xl border border-border-dark bg-card-dark">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : documentos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-dark bg-card-dark px-6 py-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 font-semibold text-slate-300">Nenhum documento no prontuário.</p>
          <p className="mt-1 text-sm text-slate-500">
            O primeiro relatório criado pelo profissional aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documentos.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border-dark bg-card-dark p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-white">{item.titulo}</h3>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                        statusStyle[item.status] || statusStyle.RASCUNHO
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{item.servicoNome || item.servicoSigla || 'Serviço'}</span>
                    <span>{item.profissionalNome || 'Profissional não identificado'}</span>
                    {item.createdAt && (
                      <span>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                    )}
                    {item.arquivoAssinadoNome && <span>Assinado anexado</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                  {item.status !== 'ASSINADO' && modeloById.has(item.modeloId) && (
                    <button
                      type="button"
                      onClick={() => abrirEdicao(item)}
                      className="min-h-10 rounded-xl border border-border-dark px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                    >
                      Preencher
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      saeDocumentosService
                        .baixarDocx(item.id, item.titulo)
                        .catch((error) => setErro(error.message))
                    }
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-bold text-blue-200 hover:bg-primary/15"
                  >
                    <Download size={15} />
                    Word
                  </button>

                  {item.status !== 'ASSINADO' && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadTarget(item);
                        window.setTimeout(() => fileInputRef.current?.click(), 0);
                      }}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/15"
                    >
                      <Paperclip size={15} />
                      Anexar assinado
                    </button>
                  )}

                  {item.status !== 'ASSINADO' && (
                    <button
                      type="button"
                      onClick={() => excluirDocumento(item)}
                      disabled={salvando}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-500/15 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      Excluir
                    </button>
                  )}

                  {item.status === 'ASSINADO' && (
                    <button
                      type="button"
                      onClick={() =>
                        saeDocumentosService
                          .baixarAssinado(item.id)
                          .catch((error) => setErro(error.message))
                      }
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/15"
                    >
                      <FileCheck2 size={15} />
                      Assinado
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(event) => uploadAssinado(event.target.files?.[0])}
      />

      <AnimatePresence>
        {novoAberto && (
          <Modal onClose={() => setNovoAberto(false)} title="Novo documento">
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-400">
                Selecione um modelo compatível com os serviços vinculados ao seu cadastro profissional.
              </p>
              <select
                value={novoModeloId}
                onChange={(event) => setNovoModeloId(event.target.value)}
                className="h-11 w-full rounded-xl border border-border-dark bg-slate-900/50 px-3 text-sm text-white outline-none focus:border-primary/40"
              >
                <option value="">Selecione o modelo</option>
                {modelos.map((modelo) => (
                  <option key={modelo.id} value={modelo.id}>
                    {modelo.nome}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-1 gap-2 sm:flex sm:justify-end">
                <button
                  type="button"
                  onClick={() => setNovoAberto(false)}
                  className="min-h-11 rounded-xl border border-border-dark px-4 text-sm font-bold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={iniciar}
                  disabled={salvando}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <FilePlus2 size={16} />}
                  Iniciar
                </button>
              </div>
            </div>
          </Modal>
        )}

        {editor && (
          <EditorModal
            editor={editor}
            salvando={salvando}
            onClose={() => setEditor(null)}
            onCampo={atualizarCampo}
            onSalvar={() => salvar(false)}
            onFinalizar={() => salvar(true)}
            onDownload={() =>
              saeDocumentosService
                .baixarDocx(editor.documento.id, editor.documento.titulo)
                .catch((error) => setErro(error.message))
            }
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        className="flex max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-border-dark bg-card-dark shadow-2xl sm:max-h-[92vh] sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border-dark px-4 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function EditorModal({
  editor,
  salvando,
  onClose,
  onCampo,
  onSalvar,
  onFinalizar,
  onDownload,
}: {
  editor: NonNullable<EditorState>;
  salvando: boolean;
  onClose: () => void;
  onCampo: (name: string, value: any) => void;
  onSalvar: () => void;
  onFinalizar: () => void;
  onDownload: () => void;
}) {
  const sections = useMemo(() => {
    const map = new Map<string, typeof editor.modelo.campos>();

    for (const campo of editor.modelo.campos) {
      const section = campo.section || 'Dados gerais';
      const list = map.get(section) || [];
      list.push(campo);
      map.set(section, list);
    }

    return Array.from(map.entries());
  }, [editor.modelo.campos]);

  const [aba, setAba] = useState(0);

  useEffect(() => {
    setAba(0);
  }, [editor.documento.id]);

  const totalAbas = Math.max(sections.length, 1);
  const atual = sections[Math.min(aba, totalAbas - 1)] || ['Dados gerais', []];
  const [section, fields] = atual;

  const preenchidos = editor.modelo.campos.filter((campo) => {
    const value = editor.documento.dados?.[campo.name];
    if (Array.isArray(value)) return value.length > 0;
    return String(value ?? '').trim().length > 0;
  }).length;

  const progresso = editor.modelo.campos.length
    ? Math.round((preenchidos / editor.modelo.campos.length) * 100)
    : 0;

  return (
    <Modal title={editor.documento.titulo} onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-border-dark bg-slate-900/25 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Preenchimento da ficha
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {section}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-primary">
                {progresso}% preenchido
              </span>
              <span className="rounded-full border border-border-dark bg-slate-950/30 px-3 py-1.5 text-[10px] font-bold text-slate-400">
                {aba + 1} / {totalAbas}
              </span>
            </div>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        <div className="responsive-scroll -mx-1 px-1">
          <div className="flex min-w-max gap-2 pb-1">
            {sections.map(([nome], index) => (
              <button
                key={nome}
                type="button"
                onClick={() => setAba(index)}
                className={[
                  'min-h-10 rounded-xl border px-4 text-xs font-bold transition',
                  index === aba
                    ? 'border-primary/40 bg-primary text-white shadow-lg shadow-blue-500/10'
                    : 'border-border-dark bg-slate-900/30 text-slate-400 hover:border-primary/20 hover:text-white',
                ].join(' ')}
              >
                {index + 1}. {nome}
              </button>
            ))}
          </div>
        </div>

        <fieldset className="rounded-2xl border border-border-dark bg-slate-900/25 p-4 sm:p-5">
          <legend className="px-2 text-sm font-bold text-primary">
            {section}
          </legend>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {fields.map((campo) => {
              const value = String(editor.documento.dados?.[campo.name] ?? '');
              const full = campo.type === 'textarea';

              return (
                <label
                  key={campo.name}
                  className={full ? 'space-y-2 md:col-span-2' : 'space-y-2'}
                >
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    {campo.label}
                  </span>

                  {campo.type === 'textarea' ? (
                    <textarea
                      rows={5}
                      value={value}
                      placeholder={campo.placeholder}
                      onChange={(event) => onCampo(campo.name, event.target.value)}
                      className="w-full rounded-xl border border-border-dark bg-[#0b1220] px-3 py-3 text-sm text-white outline-none focus:border-primary/40"
                    />
                  ) : campo.type === 'multiselect' ? (
                    <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-3">
                      {(campo.options || []).map((option) => {
                        const selected = Array.isArray(editor.documento.dados?.[campo.name])
                          ? editor.documento.dados[campo.name].includes(option)
                          : String(editor.documento.dados?.[campo.name] || '')
                              .split(',')
                              .map((item: string) => item.trim())
                              .filter(Boolean)
                              .includes(option);

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              const atual = Array.isArray(editor.documento.dados?.[campo.name])
                                ? [...editor.documento.dados[campo.name]]
                                : String(editor.documento.dados?.[campo.name] || '')
                                    .split(',')
                                    .map((item: string) => item.trim())
                                    .filter(Boolean);

                              const proximo = selected
                                ? atual.filter((item: string) => item !== option)
                                : [...atual, option];

                              onCampo(campo.name, proximo as any);
                            }}
                            className={[
                              'min-h-11 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition',
                              selected
                                ? 'border-primary/40 bg-primary/10 text-blue-100'
                                : 'border-border-dark bg-[#0b1220] text-slate-400 hover:border-primary/20',
                            ].join(' ')}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  ) : campo.type === 'select' ? (
                    <select
                      value={value}
                      onChange={(event) => onCampo(campo.name, event.target.value)}
                      className="h-11 w-full rounded-xl border border-border-dark bg-[#0b1220] px-3 text-sm text-white outline-none focus:border-primary/40"
                    >
                      <option value="">Selecione</option>
                      {(campo.options || []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={campo.type === 'date' ? 'date' : 'text'}
                      value={value}
                      placeholder={campo.placeholder}
                      onChange={(event) => onCampo(campo.name, event.target.value)}
                      className="h-11 w-full rounded-xl border border-border-dark bg-[#0b1220] px-3 text-sm text-white outline-none focus:border-primary/40"
                    />
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={aba === 0}
            onClick={() => setAba((value) => Math.max(0, value - 1))}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-dark px-4 text-sm font-bold text-slate-300 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          {aba < totalAbas - 1 ? (
            <button
              type="button"
              onClick={() => setAba((value) => Math.min(totalAbas - 1, value + 1))}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white"
            >
              Próxima etapa
              <ChevronRight size={16} />
            </button>
          ) : (
            <div className="text-center text-xs font-semibold text-emerald-300 sm:text-right">
              Última etapa da ficha
            </div>
          )}
        </div>

        <div className="sticky bottom-0 -mx-4 grid grid-cols-1 gap-2 border-t border-border-dark bg-card-dark/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:flex sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-dark px-4 text-sm font-bold text-slate-300"
          >
            <Download size={16} />
            Baixar Word
          </button>

          <button
            type="button"
            onClick={onSalvar}
            disabled={salvando}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-bold text-blue-200 disabled:opacity-60"
          >
            <Save size={16} />
            Salvar rascunho
          </button>

          <button
            type="button"
            onClick={onFinalizar}
            disabled={salvando}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white disabled:opacity-60"
          >
            {salvando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Finalizar
          </button>
        </div>
      </div>
    </Modal>
  );
}
