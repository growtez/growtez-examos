import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Get the subdomain (e.g. admin.localhost:3000 -> admin)
  const currentHost = hostname.split(':')[0]; // remove port
  const subdomain = currentHost.split('.')[0];

  // Route based on subdomain
  if (subdomain === 'admin') {
    return NextResponse.rewrite(new URL(`/(super-admin)${url.pathname}`, req.url));
  } else if (subdomain === 'school') {
    return NextResponse.rewrite(new URL(`/(school-admin)${url.pathname}`, req.url));
  }

  // Default fallback (could be a landing page or 404)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
