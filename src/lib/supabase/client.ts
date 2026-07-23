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
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : undefined;

  return await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo,
      scopes: 'profile_nickname profile_image',
      queryParams: {
        scope: 'profile_nickname profile_image',
      },
    },
  });
}

export async function signOut() {
  return await supabase.auth.signOut();
}
