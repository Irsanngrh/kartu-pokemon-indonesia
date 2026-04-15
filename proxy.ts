import { NextResponse, type NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { auth } from '@/auth';

// Rate limiter — only initialized when Upstash credentials are present
const isRedisConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

const ratelimit = isRedisConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, '10 s'),
      analytics: false,
    })
  : null;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to all Server Action POST requests
  const isServerAction =
    request.method === 'POST' && request.headers.has('next-action');

  if (isServerAction && ratelimit) {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    try {
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return new NextResponse(
          JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch {
      // If Redis is unavailable, allow the request to proceed (fail-open)
    }
  }

  const session = await auth();
  const user = session?.user ?? null;

  // Protect /admin route — redirect unauthenticated or non-admin users
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const isAdmin = user.isAdmin === true;
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Only /decks/build requires authentication.
  // /decks (dashboard) is accessible to all, showing a login prompt for unauthenticated users.
  // /decks/[id] is public for deck sharing.
  const isProtectedRoute = pathname.startsWith('/decks/build');

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
