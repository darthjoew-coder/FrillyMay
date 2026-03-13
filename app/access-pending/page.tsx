'use client'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'

export default function AccessPendingPage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-950">
      <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-6 w-full max-w-md mx-4 text-center">
        <div className="relative w-40 h-28">
          <Image src="/logo.png" alt="Frilly May Farms" fill className="object-contain" priority />
        </div>

        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">⏳</span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-900">Awaiting Approval</h1>
          <p className="text-sm text-gray-500 mt-2">
            Hi <span className="font-medium text-gray-700">{session?.user?.name}</span>, your request to access Frilly May Farms has been submitted.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            The admin will review and approve your access shortly.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 w-full">
          <p className="text-xs text-amber-700">
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
