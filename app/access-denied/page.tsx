'use client'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'

export default function AccessDeniedPage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-950">
      <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-6 w-full max-w-md mx-4 text-center">
        <div className="relative w-40 h-28">
          <Image src="/logo.png" alt="Frilly May Farms" fill className="object-contain" priority />
        </div>

        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">🚫</span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-sm text-gray-500 mt-2">
            Your access to Frilly May Farms has been denied.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Please contact the farm administrator if you believe this is a mistake.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 w-full">
          <p className="text-xs text-red-700">
            Signed in as <span className="font-semibold">{session?.user?.email}</span>
          </p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
