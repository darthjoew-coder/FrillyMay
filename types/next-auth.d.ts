import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      status?: 'pending' | 'approved' | 'denied'
      isAdmin?: boolean
      dbId?: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    status?: string
    isAdmin?: boolean
    dbId?: string
  }
}
