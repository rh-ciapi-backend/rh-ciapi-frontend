import { supabase } from '../lib/supabaseClient';

export type TipoHistorico = 'OBSERVACAO' | 'ATESTADO' | 'FALTA';
export type OcorrenciaServidor = { id: string; matricula: string; nome_servidor: string; competencia_ano: number; competencia_mes: number; data_evento: string; tipo: TipoHistorico; turno: 'T1'|'T2'|'AMBOS'|null; descricao: string; criado_em: string; criado_por: string|null };
type Nova = Pick<OcorrenciaServidor, 'matricula'|'nome_servidor'|'competencia_ano'|'competencia_mes'|'data_evento'|'tipo'|'turno'|'descricao'>;
const tabela = 'ciapi_historico_ocorrencias';
function erroMensagem(error: {message:string}) { return error.message.includes('row-level security') ? 'Sem permissão para registrar ocorrências. Verifique seu acesso RH MASTER.' : error.message; }
export const historicoServidorService = {
 async listarPorCompetencia(ano:number,mes:number):Promise<OcorrenciaServidor[]> {
  const {data,error}=await supabase.from(tabela).select('*').eq('competencia_ano',ano).eq('competencia_mes',mes).order('data_evento',{ascending:false});
  if(error)throw new Error(erroMensagem(error)); return (data||[]) as OcorrenciaServidor[];
 },
 async listarPorMatricula(matricula:string):Promise<OcorrenciaServidor[]> {
  const key=matricula.replace(/\D/g,'');
  const {data,error}=await supabase.from(tabela).select('*').eq('matricula',key).order('data_evento',{ascending:false}).limit(500);
  if(error)throw new Error(erroMensagem(error)); return (data||[]) as OcorrenciaServidor[];
 },
 async criar(entrada:Nova):Promise<void> {
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)throw new Error('Faça login no Supabase Auth para registrar a ocorrência.');
  const payload={...entrada,matricula:entrada.matricula.replace(/\D/g,''),criado_por:user.id};
  const {error}=await supabase.from(tabela).insert(payload);
  if(error)throw new Error(erroMensagem(error));
 }
};
