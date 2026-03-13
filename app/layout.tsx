import type { Metadata } from 'next'
import './globals.css'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import SessionProvider from '@/components/providers/SessionProvider'
import NavLayout from '@/components/layout/NavLayout'

export const metadata: Metadata = {
  title: 'Frilly May Farms',
  description: 'Livestock management for Frilly May Farms',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className="flex min-h-screen bg-gray-50">
        <SessionProvider session={session}>
          <NavLayout />
          <main className="flex-1 flex flex-col min-h-screen overflow-auto">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  )
}
