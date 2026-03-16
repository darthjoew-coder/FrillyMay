import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token as {
      status?: string
      isAdmin?: boolean
    } | null

    const status = token?.status
    const isAdmin = token?.isAdmin

    // Block pending/denied users from all protected routes
    if (status === 'pending' || status === 'denied') {
      // Return 403 for API calls
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Access denied. Awaiting approval.' }, { status: 403 })
      }
      // Redirect page requests to status pages
      const dest = status === 'pending' ? '/access-pending' : '/access-denied'
      return NextResponse.redirect(new URL(dest, req.url))
    }

    // Block non-admins from admin UI
    if (pathname.startsWith('/admin') && !isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Block non-admins from admin API
    if (pathname.startsWith('/api/admin') && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|api/auth|api/mobile|login|access-pending|access-denied).*)',
  ],
}
