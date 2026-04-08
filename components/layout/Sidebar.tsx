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
  { href: '/customers', label: 'Customers', icon: '👥' },
  { href: 'https://lively-beach-0462fae0f.6.azurestaticapps.net/', label: 'Mobile Receipts', icon: '📱' },
]

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
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
    <aside className={`
      fixed md:sticky top-0 inset-y-0 left-0 z-40
      w-60 shrink-0 bg-amber-950 text-amber-50 flex flex-col h-screen
      transition-transform duration-200 ease-in-out
      ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      {/* Logo + mobile close button */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-amber-800">
        <div className="relative w-40 h-28 mx-auto">
          <Image
            src="/logo.png"
            alt="Frilly May Farms"
            fill
            className="object-contain brightness-0 invert"
            priority
          />
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-3 right-3 text-amber-400 hover:text-amber-100 p-1"
          aria-label="Close navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(item => {
          const isExternal = item.href.startsWith('http')
          const isActive = !isExternal && (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
          const className = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? 'bg-green-700 text-white'
              : 'text-amber-200 hover:bg-amber-800 hover:text-white'
          }`
          return isExternal ? (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className={className}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </a>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={className}
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
              onClick={onClose}
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
