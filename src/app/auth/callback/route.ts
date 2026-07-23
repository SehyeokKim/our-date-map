import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const providerError = searchParams.get('error');
  const providerErrorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/';

  console.log('[Auth Callback] Incoming callback request:', {
    hasCode: Boolean(code),
    providerError,
    providerErrorDescription,
    origin,
    url: request.url,
  });

  if (providerError) {
    console.error('[Auth Callback] OAuth Provider Error:', providerError, providerErrorDescription);
    const errorRedirectUrl = new URL(origin);
    errorRedirectUrl.searchParams.set('auth_error', providerError);
    if (providerErrorDescription) {
      errorRedirectUrl.searchParams.set('error_description', providerErrorDescription);
    }
    return NextResponse.redirect(errorRedirectUrl.toString());
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (err) {
              console.warn('[Auth Callback] Failed setting auth cookie:', err);
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log('[Auth Callback] Successfully exchanged code for session. User ID:', data.user?.id);
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    console.error('[Auth Callback] Exchange code for session failed:', {
      message: error.message,
      status: error.status,
      name: error.name,
    });

    const errorRedirectUrl = new URL(origin);
    errorRedirectUrl.searchParams.set('auth_error', error.message || 'exchange_failed');
    return NextResponse.redirect(errorRedirectUrl.toString());
  }

  console.error('[Auth Callback] Request missing authorization code parameter');
  return NextResponse.redirect(`${origin}/?auth_error=missing_code`);
}
