import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, AlertCircle, Loader2, Search, UserPlus, Users } from 'lucide-react';
import { saeUsuariosService } from '../services/saeUsuariosService';
import NovoUsuarioModal from '../components/usuarios/NovoUsuarioModal';
import type { SaeUsuarioResumo, SituacaoUsuario } from '../types/saeUsuario';

interface Props {
  onAbrirUsuario: (usuarioId: string) => void;
  situacaoInicial?: SituacaoUsuario | 'TODOS';
  modo?: 'pesquisa' | 'inativos' | 'novo';
}

const normalizar = (valor: unknown) => String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export default function SaeUsuariosPage({ onAbrirUsuario, situacaoInicial = 'TODOS', modo = 'pesquisa' }: Props) {
  const [usuarios, setUsuarios] = useState<SaeUsuarioResumo[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [novoAberto, setNovoAberto] = useState(modo === 'novo');

  useEffect(() => {
    let valido = true;
    setCarregando(true);
    setErro(null);
    saeUsuariosService.listar(situacaoInicial === 'TODOS' ? undefined : { situacao: situacaoInicial })
      .then((dados) => { if (valido) setUsuarios(dados); })
      .catch((falha) => { if (valido) setErro(falha instanceof Error ? falha.message : 'Falha ao consultar usuários.'); })
      .finally(() => { if (valido) setCarregando(false); });
    return () => { valido = false; };
  }, [situacaoInicial]);

  useEffect(() => setBusca(''), [situacaoInicial]);

  const encontrados = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo) return [];
    return usuarios.filter((item) => normalizar(item.nome).includes(termo) || normalizar(item.prontuario).includes(termo))
      .slice(0, 100);
  }, [usuarios, busca]);

  const titulo = modo === 'novo' ? 'Novo usuário' : situacaoInicial === 'INATIVO' ? 'Consultar usuários inativos' : 'Pesquisar usuário';
  if (modo === 'novo') return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-bold text-slate-900">Novo usuário</h1>
      <p className="mt-2 text-sm text-slate-600">Preencha o cadastro no formulário existente.</p>
      <button type="button" onClick={() => setNovoAberto(true)} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Abrir formulário de cadastro</button>
      <NovoUsuarioModal aberto={novoAberto} onClose={() => setNovoAberto(false)} onSalvo={(usuario) => { setNovoAberto(false); onAbrirUsuario(usuario.id); }} />
    </section>
  );
  return (
    <section className="mx-auto w-full max-w-5xl space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">CIAPI • Serviço de Atenção Especializada</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{titulo}</h1>
        <p className="mt-2 text-sm text-slate-600">Pesquise pelo nome ou número do prontuário. Selecione um resultado para abrir a ficha completa na área de trabalho.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm font-semibold text-slate-700">
            Consultar usuário
            <span className="relative mt-2 block">
              <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input autoFocus value={busca} onChange={(event) => setBusca(event.target.value)}
                placeholder="Digite o nome ou o prontuário..." aria-label="Pesquisar usuários"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </span>
          </label>
          {modo === 'pesquisa' && <button type="button" onClick={() => setNovoAberto(true)} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"><UserPlus size={18}/> Novo usuário</button>}
        </div>
        <p className="mt-3 text-xs text-slate-500">{carregando ? 'Carregando cadastros...' : `${usuarios.length} cadastros ${situacaoInicial === 'ATIVO' ? 'ativos' : 'inativos'} disponíveis para consulta`}</p>
      </div>

      {erro && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18}/>{erro}</div>}
      {carregando ? <div className="flex items-center justify-center gap-2 p-12 text-slate-500"><Loader2 className="animate-spin"/> Carregando...</div>
        : !busca.trim() ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-5 py-14 text-center text-slate-500"><Users size={32} className="mx-auto mb-3 text-blue-400"/>Digite um nome para localizar o prontuário.</div>
        : <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Resultados da consulta</h2><p className="mt-1 text-xs text-slate-500">{encontrados.length} resultado(s){encontrados.length === 100 ? ' (exibindo os primeiros 100)' : ''}</p></div>
          {encontrados.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Nenhum usuário localizado com esse nome ou prontuário.</p>
          : <div className="divide-y divide-slate-100">{encontrados.map((usuario) => <button type="button" key={usuario.id} onClick={() => onAbrirUsuario(usuario.id)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-blue-50 focus:bg-blue-50"><span className="min-w-0"><span className="block truncate font-semibold text-slate-900">{usuario.nome}</span><span className="mt-1 block text-xs text-slate-500">Prontuário {usuario.prontuario || '—'}{usuario.idade != null ? ` • ${usuario.idade} anos` : ''}{usuario.turno ? ` • ${usuario.turno}` : ''}</span></span><ArrowRight size={18} className="shrink-0 text-blue-600"/></button>)}</div>}
        </section>}
      <NovoUsuarioModal aberto={novoAberto} onClose={() => setNovoAberto(false)} onSalvo={(usuario) => { setNovoAberto(false); onAbrirUsuario(usuario.id); }} />
    </section>
  );
}
