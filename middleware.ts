import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token

    if (token?.status === 'pending') {
      return NextResponse.redirect(new URL('/access-pending', req.url))
    }
    if (token?.status === 'denied') {
      return NextResponse.redirect(new URL('/access-denied', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/animals/:path*',
    '/health/:path*',
    '/feeding/:path*',
    '/breeding/:path*',
    '/admin/:path*',
  ],
}
