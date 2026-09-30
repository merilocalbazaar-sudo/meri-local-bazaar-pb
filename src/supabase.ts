import { createClient } from '@supabase/supabase-js';

// Normalizes any Supabase URL, handling bare project IDs, missing schemas, or protocol prefixes
export function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return 'https://nnytbwjnhmhusrbfycju.supabase.co';
  }
  const clean = rawUrl.trim().replace(/^["']|["']$/g, '');
  if (!clean) {
    return 'https://nnytbwjnhmhusrbfycju.supabase.co';
  }
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  if (clean.includes('.supabase.co')) {
    return `https://${clean}`;
  }
  return `https://${clean}.supabase.co`;
}

const rawEnvUrl =
  (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process?.env?.VITE_SUPABASE_URL) ||
  'https://nnytbwjnhmhusrbfycju.supabase.co';

export const SUPABASE_URL = normalizeSupabaseUrl(rawEnvUrl);

const rawEnvKey =
  (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process?.env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_LiilPJx72MCRVpSkc6b_UQ_NAP7EZLT';

export const SUPABASE_ANON_KEY = String(rawEnvKey).trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Check if Supabase connection and tables are accessible
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  tablesExist: boolean;
  message: string;
}> {
  try {
    const { data, error } = await supabase.from('settings').select('*').limit(1);
    if (!error) {
      return { connected: true, tablesExist: true, message: 'Supabase connected and schema ready.' };
    }
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      return {
        connected: true,
        tablesExist: false,
        message: 'Connected to Supabase project. PostgreSQL schema tables need initialization.',
      };
    }
    return {
      connected: false,
      tablesExist: false,
      message: error.message || 'Error connecting to Supabase.',
    };
  } catch (err: any) {
    return {
      connected: false,
      tablesExist: false,
      message: err?.message || 'Network error connecting to Supabase.',
    };
  }
}

// Upload file/image to Supabase Storage (e.g. product-images, shop-assets, delivery-docs)
export async function uploadToSupabaseStorage(
  bucket: string,
  filePath: string,
  file: File | Blob
): Promise<{ url: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      upsert: true,
    });
    if (error) {
      console.warn('Supabase storage upload notice:', error.message);
      return { url: null, error: error.message };
    }
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err?.message || 'Upload failed' };
  }
}
