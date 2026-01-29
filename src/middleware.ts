import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware that forces the app into admin-only mode when
// NEXT_PUBLIC_ADMIN_ONLY is set to '1' or 'true'. When enabled,
// any request that is not already targeting `/admin`, `/api`,
// `_next` or an asset will be redirected to `/admin`.
export function middleware(req: NextRequest) {
  const adminOnly =
    process.env.NEXT_PUBLIC_ADMIN_ONLY === '1' ||
    process.env.NEXT_PUBLIC_ADMIN_ONLY === 'true';

  if (!adminOnly) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Allow direct access to admin and API and static assets
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Redirect any other request to /admin
  const url = req.nextUrl.clone();
  url.pathname = '/admin';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: '/:path*',
};
