'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/animals', label: 'Animals', icon: '🐄' },
  { href: '/health', label: 'Health & Treatments', icon: '🩺' },
  { href: '/feeding', label: 'Feeding & Nutrition', icon: '🌾' },
  { href: '/breeding', label: 'Breeding', icon: '🐣' },
  { href: '/accounting', label: 'Accounting', icon: '💰' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Hide sidebar on auth pages
  if (
    pathname === '/login' ||
    pathname === '/access-pending' ||
    pathname === '/access-denied'
  ) {
    return null
  }

  return (
    <aside className="w-60 shrink-0 bg-amber-950 text-amber-50 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="flex flex-col items-center px-4 py-5 border-b border-amber-800">
        <div className="relative w-40 h-28">
          <Image
            src="/logo.png"
            alt="Frilly May Farms"
            fill
            className="object-contain brightness-0 invert"
            priority
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-700 text-white'
                  : 'text-amber-200 hover:bg-amber-800 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}

        {/* Admin-only: User Access */}
        {session?.user?.isAdmin && (
          <>
            <div className="my-2 border-t border-amber-800" />
            <Link
              href="/admin/users"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith('/admin/users')
                  ? 'bg-green-700 text-white'
                  : 'text-amber-200 hover:bg-amber-800 hover:text-white'
              }`}
            >
              <span className="text-base">👥</span>
              User Access
            </Link>
          </>
        )}
      </nav>

      {/* User info + sign out */}
      {session?.user && (
        <div className="px-3 py-3 border-t border-amber-800">
          <div className="flex items-center gap-2 mb-2 px-1">
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || ''}
                width={28}
                height={28}
                className="rounded-full"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-amber-100 truncate">{session.user.name}</p>
              <p className="text-xs text-amber-400 truncate">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full text-xs text-amber-400 hover:text-amber-200 text-left px-1 transition-colors"
          >
            Sign out →
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-amber-800">
        <p className="text-xs text-amber-500 text-center">Frilly May Farms v1.0</p>
      </div>
    </aside>
  )
}
