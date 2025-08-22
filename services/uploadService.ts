import { UploadedFile } from '../types';
import { supabase } from '../contexts/supabaseClient';

// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
// const UPLOAD_URL = `${BACKEND_URL}/api/upload`;
// const DELETE_URL = `${BACKEND_URL}/api/files`;

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);

  // Obter token do localStorage
    // Obter token do Supabase (sempre atualizado)
  // Upload direto para o Supabase Storage
  const fileExt = file.name.split('.').pop();
  const filePath = `${Date.now()}-${file.name}`;
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
