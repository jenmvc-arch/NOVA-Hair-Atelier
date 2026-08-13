import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

/**
 * Helper to upload a file to Supabase Storage.
 * If Supabase is configured, uploads to specified bucket and returns public URL.
 * Fallback to standard base64 data URL if Supabase is not configured or fails.
 */
export async function uploadFileToStorage(
  file: File,
  bucketName: string = 'app-assets'
): Promise<string> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await client.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.warn('Supabase storage upload error:', error.message);
      } else if (data) {
        const { data: publicUrlData } = client.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Failed uploading to Supabase Storage, falling back:', err);
    }
  }

  // Fallback to Data URL for client side storage / preview if Supabase is not connected
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}
