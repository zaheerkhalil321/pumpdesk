import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { guardRoute, MFA_PATH } from '@/lib/auth/guard';

// Refreshes the session cookie and sends logged-out visitors to /login.
// A password-only (aal1) session is sent to the code screen until it passes the code step.
// /api/notifications/run is left out: the database calls it with a bearer secret, not a login.
// This is not security: pages and actions check again (architecture 4.2).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();

  const decision = guardRoute(request.nextUrl.pathname, data?.claims);
  if (decision !== 'allow') {
    const url = request.nextUrl.clone();
    url.pathname = decision === 'login' ? '/login' : MFA_PATH;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!api/notifications/run|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
