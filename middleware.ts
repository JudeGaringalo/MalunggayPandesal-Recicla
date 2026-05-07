import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if our temporary scan cookie exists
  const hasValidScan = request.cookies.has('scan_in_progress');

  // Debug log: This will print in your VS Code terminal (where npm run dev is running)
  console.log('Middleware checked path:', request.nextUrl.pathname, '| Has cookie:', hasValidScan);

  // If they are trying to access /information without the cookie, redirect them
  if (request.nextUrl.pathname.startsWith('/information') && !hasValidScan) {
    return NextResponse.redirect(new URL('/scan', request.url));
  }

  // Allow the request to proceed normally
  return NextResponse.next();
}

// Ensure it matches exactly /information AND any sub-paths
export const config = {
  matcher: ['/information', '/information/:path*'],
};