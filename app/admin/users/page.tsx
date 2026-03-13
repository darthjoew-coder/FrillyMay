'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDate } from '@/lib/utils'

interface DBUser {
  _id: string
  email: string
  name?: string
  image?: string
  status: 'pending' | 'approved' | 'denied'
  isAdmin: boolean
  lastLoginAt?: string
  createdAt: string
}

const STATUS_TABS = ['pending', 'approved', 'denied', 'all'] as const
type Tab = (typeof STATUS_TABS)[number]

const badgeVariant: Record<string, 'yellow' | 'green' | 'red' | 'gray'> = {
  pending: 'yellow',
  approved: 'green',
  denied: 'red',
}

export default function UserAccessPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<DBUser[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Guard: only admins
  useEffect(() => {
    if (authStatus === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/dashboard')
    }
  }, [authStatus, session, router])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/users?status=${tab}`)
    const data = await res.json()
    setUsers(data.data || [])
    setLoading(false)
  }, [tab])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function updateStatus(userId: string, status: 'approved' | 'denied' | 'pending') {
    setActionLoading(userId)
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setActionLoading(null)
    fetchUsers()
  }

  const pendingCount = users.filter(u => u.status === 'pending').length

  return (
    <>
      <TopBar
        title="User Access"
        subtitle="Manage who can access Frilly May Farms"
      />
      <PageWrapper>
        {/* Status tabs */}
        <div className="flex gap-1 mb-6">
          {STATUS_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors capitalize ${
                tab === t
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
              }`}
            >
              {t}
              {t === 'pending' && pendingCount > 0 && tab !== 'pending' && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : users.length === 0 ? (
          <Card>
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-sm">No {tab === 'all' ? '' : tab} users</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {users.map(user => (
              <Card key={user._id} padding="sm">
                <div className="flex items-center justify-between gap-4">
                  {/* User info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                      {user.image ? (
                        <Image src={user.image} alt={user.name || ''} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold text-sm">
                          {(user.name || user.email)[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {user.name || 'Unknown'}
                        </p>
                        {user.isAdmin && (
                          <span className="text-xs bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-full">Admin</span>
                        )}
                        <Badge variant={badgeVariant[user.status] || 'gray'}>
                          {user.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Requested {formatDate(user.createdAt)}
                        {user.lastLoginAt && ` · Last login ${formatDate(user.lastLoginAt)}`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {!user.isAdmin && (
                    <div className="flex gap-2 shrink-0">
                      {user.status !== 'approved' && (
                        <button
                          onClick={() => updateStatus(user._id, 'approved')}
                          disabled={actionLoading === user._id}
                          className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user._id ? '…' : 'Approve'}
                        </button>
                      )}
                      {user.status === 'approved' && (
                        <button
                          onClick={() => updateStatus(user._id, 'denied')}
                          disabled={actionLoading === user._id}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-md border border-gray-300 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user._id ? '…' : 'Revoke'}
                        </button>
                      )}
                      {user.status !== 'denied' && user.status !== 'approved' && (
                        <button
                          onClick={() => updateStatus(user._id, 'denied')}
                          disabled={actionLoading === user._id}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-md border border-red-200 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user._id ? '…' : 'Deny'}
                        </button>
                      )}
                      {user.status === 'denied' && (
                        <button
                          onClick={() => updateStatus(user._id, 'denied')}
                          disabled
                          className="px-3 py-1.5 bg-red-50 text-red-400 text-xs font-medium rounded-md border border-red-200 opacity-50 cursor-not-allowed"
                        >
                          Denied
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageWrapper>
    </>
  )
}
