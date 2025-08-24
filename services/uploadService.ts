import { UploadedFile } from '../types';
import { supabase } from '../contexts/supabaseClient';

// Função para obter o usuário logado (Supabase)
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
// const UPLOAD_URL = `${BACKEND_URL}/api/upload`;
// const DELETE_URL = `${BACKEND_URL}/api/files`;


// Função para sanitizar nomes de arquivos para uso seguro no Supabase Storage
function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[^\w.\-]+/g, '-') // Substitui tudo que não for letra, número, underline, ponto ou hífen por '-'
    .replace(/-+/g, '-') // Troca múltiplos '-' por um só
    .replace(/^-+|-+$/g, '') // Remove '-' do início/fim
    .toLowerCase();
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');

  const sanitizedFileName = sanitizeFileName(file.name);
  // Salva o arquivo na pasta do usuário
  const filePath = `${user.id}/${Date.now()}-${sanitizedFileName}`;
  const { data, error } = await supabase.storage.from('uploads').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    throw new Error(error.message);
  }
  // Gerar URL pública
  const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
  return {
    url: publicUrlData.publicUrl,
    name: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

export async function deleteFile(filename: string): Promise<void> {
  // Obter token do localStorage
    // Obter token do Supabase (sempre atualizado)
  // Remove arquivo do Supabase Storage
  const { error } = await supabase.storage.from('uploads').remove([filename]);
  if (error) {
    throw new Error(error.message);
  }
}
