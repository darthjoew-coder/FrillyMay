'use client'
import { useState } from 'react'
import Sidebar from './Sidebar'

export default function NavLayout() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden bg-amber-950 text-amber-100 p-2 rounded-lg shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Backdrop — mobile only */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <Sidebar mobileOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
