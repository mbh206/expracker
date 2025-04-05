import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
	const token = await getToken({ req: request });
	const isAuthenticated = !!token;

	// Get the pathname of the request
	const path = request.nextUrl.pathname;

	// Define public paths that don't require authentication
	const isPublicPath =
		path === '/auth/signin' ||
		path === '/auth/signup' ||
		path === '/auth/error' ||
		path === '/auth/forgot-password' ||
		path === '/auth/reset-password';

	// API routes should be handled separately
	if (path.startsWith('/api/')) {
		return NextResponse.next();
	}

	// Static files and images should pass through
	if (
		path.startsWith('/_next/') ||
		path.startsWith('/images/') ||
		path.includes('favicon.ico')
	) {
		return NextResponse.next();
	}

	// Redirect authenticated users away from auth pages
	if (isAuthenticated && isPublicPath) {
		return NextResponse.redirect(new URL('/', request.url));
	}

	// Redirect unauthenticated users to sign in
	if (!isAuthenticated && !isPublicPath) {
		return NextResponse.redirect(new URL('/auth/signin', request.url));
	}

	return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
