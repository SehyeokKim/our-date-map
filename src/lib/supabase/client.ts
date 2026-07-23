import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

if (supabaseUrl.endsWith('/rest/v1/')) {
  supabaseUrl = supabaseUrl.slice(0, -9);
} else if (supabaseUrl.endsWith('/rest/v1')) {
  supabaseUrl = supabaseUrl.slice(0, -8);
}

if (supabaseUrl.endsWith('/')) {
  supabaseUrl = supabaseUrl.slice(0, -1);
}

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

export const supabase = createClient();

export async function signInWithKakao() {
  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const redirectTo = `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo,
      scopes: 'profile_nickname profile_image',
      queryParams: {
        scope: 'profile_nickname profile_image',
      },
    },
  });

  if (error) {
    console.error('Kakao OAuth error:', error);
    return { data, error };
  }

  if (data?.url) {
    window.location.href = data.url;
  }

  return { data, error };
}

export async function signOut() {
  return await supabase.auth.signOut();
}
