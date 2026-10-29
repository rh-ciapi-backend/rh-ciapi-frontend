import { supabase } from '../lib/supabaseClient';
const BUCKET = 'servidores-fotos';
const validTypes = ['image/jpeg','image/png','image/webp'];
export async function uploadServidorFoto(servidorId: string, file: File): Promise<string> {
  if (!validTypes.includes(file.type) || file.size > 3*1024*1024 || file.size === 0) throw new Error('Use JPG, PNG ou WebP até 3 MB.');
  const ext: Record<string,string> = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
  const path = `${encodeURIComponent(servidorId)}/${crypto.randomUUID()}.${ext[file.type]}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {contentType:file.type, upsert:false});
  if (error) throw new Error(error.message);
  return path;
}
export async function signedServidorFotoUrl(path: string): Promise<string> {
  const {data,error} = await supabase.storage.from(BUCKET).createSignedUrl(path,3600);
  if(error || !data?.signedUrl) throw new Error(error?.message || 'Não foi possível abrir a foto.');
  return data.signedUrl;
}
export const servidoresFotoService = {
  async vincular(id: string, path: string) {
    const {error} = await supabase.from('servidores').update({foto_path:path}).eq('servidor',id);
    if(error) throw new Error(error.message);
  }
};
