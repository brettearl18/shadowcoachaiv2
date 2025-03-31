import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase-admin';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. _next/static (static files)
     * 2. _next/image (image optimization files)
     * 3. favicon.ico (favicon file)
     * 4. public folder
     * 5. API routes during testing
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
};

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

// Role-based path patterns
const PATH_ROLE_PATTERNS = {
  admin: /^\/admin/,
  coach: /^\/coach/,
  client: /^\/client/,
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Get the Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return redirectToLogin(request);
  }

  try {
    // Verify the token
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get user's role from custom claims
    const role = decodedToken.role as 'admin' | 'coach' | 'client';

    // Check if user has access to the path
    if (!hasPathAccess(pathname, role)) {
      return redirectToRole(role);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Auth error:', error);
    return redirectToLogin(request);
  }
}

function hasPathAccess(pathname: string, role?: string): boolean {
  if (!role) return false;

  // Admins have access to everything
  if (role === 'admin') return true;

  // Check if the path matches the user's role pattern
  return PATH_ROLE_PATTERNS[role as keyof typeof PATH_ROLE_PATTERNS]?.test(pathname) ?? false;
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?redirect=${encodeURIComponent(request.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

function redirectToRole(role: string) {
  const url = new URL('/', 'http://localhost');
  url.pathname = `/${role}`;
  return NextResponse.redirect(url);
} 