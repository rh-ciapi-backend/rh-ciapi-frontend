import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { requerimentosService } from '../services/requerimentosService';
import RequerimentosPage from './RequerimentosPage';

export default function ServidorRequerimentoPortal({ perfil }: { perfil: string | null }) {
  const { session, signOut } = useAuth();
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const acesso = params.get('acesso') || '';

  if (session && perfil === 'SERVIDOR_LIMITADO') {
    return (
      <div className="min-h-screen bg-[#0b1220] px-4 py-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between border-b border-[#26344a] pb-4">
            <strong>CIAPI · Requerimentos</strong>
            <button type="button" onClick={() => void signOut()} className="rounded-lg border border-[#26344a] px-3 py-2 text-sm">Sair</button>
          </div>
          <RequerimentosPage modoServidor />
        </div>
      </div>
    );
  }

  if (session) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0b1220] p-4 text-white"><div className="rounded-xl bg-[#172033] p-6">Este acesso é exclusivo do servidor. <button onClick={() => void signOut()} className="ml-2 text-blue-300">Sair</button></div></div>;
  }

  const entrar = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      if (!acesso) throw new Error('Abra o link individual enviado pelo RH.');
      await requerimentosService.entrarPortal(cpf, senha, acesso);
      setSenha('');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1220] p-4 text-slate-200">
      <form onSubmit={entrar} className="w-full max-w-md space-y-5 rounded-2xl border border-[#26344a] bg-[#172033] p-6">
        <div><h1 className="text-xl font-semibold text-white">Requerimento do servidor</h1><p className="mt-1 text-sm text-slate-400">Entre para preencher sua solicitação.</p></div>
        <label className="block text-sm">CPF
          <input type="text" inputMode="numeric" autoComplete="username" value={cpf} onChange={(e) => setCpf(e.target.value)} required maxLength={14} className="mt-1 block w-full rounded-lg border border-[#26344a] bg-[#0b1220] p-3 text-white" placeholder="000.000.000-00" />
        </label>
        <label className="block text-sm">Senha inicial (5 primeiros dígitos do CPF)
          <input type="password" inputMode="numeric" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required maxLength={5} className="mt-1 block w-full rounded-lg border border-[#26344a] bg-[#0b1220] p-3 text-white" />
        </label>
        {erro && <p role="alert" className="text-sm text-rose-300">{erro}</p>}
        <button disabled={enviando || !acesso} className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white disabled:opacity-50">{enviando ? 'Entrando...' : 'Entrar'}</button>
        {!acesso && <p className="text-xs text-slate-400">Peça seu link individual ao RH.</p>}
      </form>
    </div>
  );
}
