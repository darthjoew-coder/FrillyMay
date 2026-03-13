import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { connectDB } from './db'
import { User } from '@/models/User'

export const ADMIN_EMAIL = 'darthjoew@gmail.com'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 0, // Refresh JWT on every request so status changes propagate
  },
  callbacks: {
    async signIn({ user }) {
      try {
        await connectDB()
        const existing = await User.findOne({ email: user.email })
        const isAdmin = user.email === ADMIN_EMAIL
        if (!existing) {
          await User.create({
            email: user.email,
            name: user.name,
            image: user.image,
            status: isAdmin ? 'approved' : 'pending',
            isAdmin,
            lastLoginAt: new Date(),
          })
        } else {
          await User.findByIdAndUpdate(existing._id, {
            name: user.name,
            image: user.image,
            lastLoginAt: new Date(),
          })
        }
        return true
      } catch (err) {
        console.error('Auth signIn error:', err)
        return false
      }
    },

    async jwt({ token }) {
      // Always fetch fresh status from DB so approve/deny takes effect immediately
      try {
        await connectDB()
        const dbUser = await User.findOne({ email: token.email }).lean() as {
          _id: { toString(): string }
          status: string
          isAdmin: boolean
        } | null
        if (dbUser) {
          token.status = dbUser.status
          token.isAdmin = dbUser.isAdmin
          token.dbId = dbUser._id.toString()
        }
      } catch {
        // Keep existing token values on DB error
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.status = token.status as 'pending' | 'approved' | 'denied'
        session.user.isAdmin = token.isAdmin
        session.user.dbId = token.dbId
      }
      return session
    },
  },
}
