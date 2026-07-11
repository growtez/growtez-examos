import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Get the subdomain (e.g. admin.localhost:3000 -> admin)
  const currentHost = hostname.split(':')[0]; // remove port
  const subdomain = currentHost.split('.')[0];

  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: req.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: req.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh session
  const { data: { session } } = await supabase.auth.getSession();

  // Extract role
  const role = session?.user?.user_metadata?.role || (session?.user?.email === 'growtezexamos@gmail.com' ? 'super_admin' : 'student');

  // Bypass subdomain rewrite for internal Next.js assets, API routes, and static files
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/register') ||
    url.pathname.includes('.')
  ) {
    return response;
  }

  // Route based on subdomain
  if (subdomain === 'admin') {
    // Login page is always accessible
    if (url.pathname === '/login' || url.pathname.startsWith('/api/auth')) {
      return NextResponse.rewrite(new URL(url.pathname === '/login' ? `/admin-login` : url.pathname, req.url), { headers: response.headers });
    }

    // Protect super-admin routes (ensure user has super_admin role)
    if (!session || role !== 'super_admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.rewrite(
      new URL(`/super-admin${url.pathname === '/' ? '' : url.pathname}`, req.url),
      { headers: response.headers }
    );
  } else if (subdomain === 'school') {
    // Login page is always accessible
    if (url.pathname === '/login' || url.pathname.startsWith('/api/auth')) {
      return NextResponse.rewrite(new URL(`/login`, req.url), { headers: response.headers });
    }

    // Protect school-admin routes (ensure user has school_admin or teacher role)
    if (!session || (role !== 'school_admin' && role !== 'teacher')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.rewrite(
      new URL(`/school-admin${url.pathname === '/' ? '' : url.pathname}`, req.url),
      { headers: response.headers }
    );
  }

  // Default — allow login and other pages
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
