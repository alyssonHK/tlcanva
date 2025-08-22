import { UploadedFile } from '../types';
import { supabase } from '../contexts/supabaseClient';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const UPLOAD_URL = `${BACKEND_URL}/api/upload`;
const DELETE_URL = `${BACKEND_URL}/api/files`;

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);

  // Obter token do localStorage
    // Obter token do Supabase (sempre atualizado)
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
  
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers,
    });

    const result = await response.json();

    if (!response.ok) {
      // Se for erro de autenticação, redirecionar para login
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.reload();
      }
      throw new Error(result.message || 'File upload failed');
    }

 // The backend returns a relative URL, prepend the current origin for external use
    const fullUrl = new URL(result.url, window.location.origin).href;
    
    return { ...result, url: fullUrl };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

export async function deleteFile(filename: string): Promise<void> {
  // Obter token do localStorage
    // Obter token do Supabase (sempre atualizado)
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${DELETE_URL}/${filename}`, {
      method: 'DELETE',
      headers,
    });

    const result = await response.json();

    if (!response.ok) {
      // Se for erro de autenticação, redirecionar para login
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.reload();
      }
      throw new Error(result.message || 'File deletion failed');
    }
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}
