import { createClient } from '@supabase/supabase-js';

export type AutoridadeAssinatura = { nome: string; matricula: string; cargo: string };
export type AssinaturasFrequencia = { gerente: AutoridadeAssinatura; secretario: AutoridadeAssinatura };
export const ASSINATURAS_INICIAIS: AssinaturasFrequencia = {
  gerente: {nome:'RAIMUNDA ARTEMES FREITAS DAS NEVES',matricula:'0164392-4-02',cargo:'Gerente do Centro Integrado de Atenção à Pessoa Idosa'},
  secretario: {nome:'',matricula:'',cargo:'Secretário(a) de Estado'}
};
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY;
const client=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}}):null;
const table='ciapi_config_assinaturas_frequencia';
function getClient(){if(!client)throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para salvar os responsáveis.');return client;}
export async function carregarAssinaturas():Promise<AssinaturasFrequencia>{
  const {data,error}=await getClient().from(table).select('gerente_nome,gerente_matricula,gerente_cargo,secretario_nome,secretario_matricula,secretario_cargo').eq('id',1).maybeSingle();
  if(error)throw new Error(`Não foi possível consultar responsáveis: ${error.message}`);
  if(!data)return ASSINATURAS_INICIAIS;
  return {gerente:{nome:data.gerente_nome||'',matricula:data.gerente_matricula||'',cargo:data.gerente_cargo||''},secretario:{nome:data.secretario_nome||'',matricula:data.secretario_matricula||'',cargo:data.secretario_cargo||''}};
}
export async function salvarAssinaturas(a:AssinaturasFrequencia):Promise<void>{
  const {error}=await getClient().from(table).upsert({id:1,gerente_nome:a.gerente.nome.trim(),gerente_matricula:a.gerente.matricula.trim(),gerente_cargo:a.gerente.cargo.trim(),secretario_nome:a.secretario.nome.trim(),secretario_matricula:a.secretario.matricula.trim(),secretario_cargo:a.secretario.cargo.trim(),updated_at:new Date().toISOString()},{onConflict:'id'});
  if(error)throw new Error(`Não foi possível salvar: ${error.message}`);
}
