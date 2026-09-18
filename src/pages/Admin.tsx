import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ADMIN_EMAIL, isAdminEmail } from '../constants/admin'
import { supabase } from '../lib/supabase'

type AdminUserRow = {
  id: string
  email: string | null
  created_at: string | null
  last_sign_in_at?: string | null
  last_active_at?: string | null
  updated_at?: string | null
  username?: string | null
}

export default function Admin() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [search, setSearch] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    void checkAdminAccess()
  }, [])

  useEffect(() => {
    const term = search.toLowerCase()
    const filtered = users.filter(
      (u) =>
        u.email?.toLowerCase().includes(term) ||
        u.id?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term)
    )
    setFilteredUsers(filtered)
  }, [search, users])

  const checkAdminAccess = async () => {
    if (!supabase) {
      navigate('/setup', { replace: true })
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !isAdminEmail(user.email)) {
      navigate('/', { replace: true })
      return
    }

    setAuthorized(true)
    void fetchUsers()
  }

  const fetchUsers = async () => {
    if (!supabase) return

    setLoading(true)
    setLoadError(null)

    const rpc = await supabase.rpc('admin_list_users')
    if (!rpc.error && Array.isArray(rpc.data)) {
      const rows = rpc.data as AdminUserRow[]
      if (rows.length > 0) {
        setUsers(rows)
        setFilteredUsers(rows)
        setLoading(false)
        return
      }
    }

    const withActive = await supabase
      .from('profiles')
      .select('id, email, created_at, last_active_at')
      .order('created_at', { ascending: false })

    let rows: AdminUserRow[] | null = null
    if (!withActive.error) {
      rows = (withActive.data || []) as AdminUserRow[]
    } else {
      const missingActive = /last_active_at/i.test(withActive.error.message || '')
      const basic = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
      if (basic.error) {
        console.error(basic.error)
        if (!missingActive) setLoadError(basic.error.message)
      } else {
        rows = (basic.data || []) as AdminUserRow[]
      }
    }

    if ((!rows || rows.length === 0) && supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        rows = [
          {
            id: user.id,
            email: user.email ?? null,
            created_at: user.created_at ?? null,
          },
        ]
      }
    }

    setUsers(rows || [])
    setFilteredUsers(rows || [])
    setLoading(false)
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!supabase) return
    if (isAdminEmail(email)) {
      alert('The master admin account cannot be deleted.')
      return
    }

    if (
      !confirm(
        `Are you sure you want to permanently delete ${email || userId}? This cannot be undone.`
      )
    ) {
      return
    }

    const { error } = await supabase.from('profiles').delete().eq('id', userId)

    if (error) {
      alert('Error deleting user: ' + error.message)
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      alert('User deleted successfully')
    }
  }

  const lastActive = (user: AdminUserRow) => {
    const raw = user.last_sign_in_at || user.last_active_at || user.updated_at
    return raw ? new Date(raw).toLocaleString() : '—'
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <p>Checking access...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-[max(6rem,env(safe-area-inset-bottom))]">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a0a]/95 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-5 backdrop-blur-md sm:px-6">
        <Link
          to="/app"
          className="mb-3 inline-flex min-h-11 items-center text-sm text-emerald-400"
        >
          ← Back to app
        </Link>
        <h1 className="text-2xl font-semibold sm:text-3xl">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">Master view • {ADMIN_EMAIL}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 py-5 sm:gap-4 sm:px-6 sm:py-6">
        <div className="rounded-2xl bg-white/5 p-4 sm:p-5">
          <div className="text-sm text-gray-400">Total Users</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-400 sm:text-3xl">
            {users.length}
          </div>
        </div>
        <div className="rounded-2xl bg-white/5 p-4 sm:p-5">
          <div className="text-sm text-gray-400">Showing</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-400 sm:text-3xl">
            {filteredUsers.length}
          </div>
        </div>
      </div>

      {loadError && users.length === 0 && (
        <div className="mx-4 mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 sm:mx-6">
          {loadError}
        </div>
      )}

      <div className="mb-5 px-4 sm:mb-6 sm:px-6">
        <input
          type="search"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="Search by email or user ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3.5 text-base text-white placeholder:text-gray-500 focus:border-emerald-500 focus:outline-none sm:px-5 sm:py-4 sm:text-sm"
        />
      </div>

      <div className="px-4 sm:px-6">
        <h2 className="mb-4 font-medium">All Registered Users</h2>

        {loading ? (
          <p className="text-gray-400">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-gray-400">No users found.</p>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const master = isAdminEmail(user.email)
              return (
                <div
                  key={user.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-base font-medium sm:text-lg">
                        {user.email || 'No email'}
                        {user.username ? (
                          <span className="ml-2 text-sm font-normal text-emerald-400">
                            @{user.username}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Joined:{' '}
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : '—'}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Last active: {lastActive(user)}
                      </div>
                      <div className="mt-1 break-all text-xs text-gray-500">
                        ID: {user.id}
                      </div>
                    </div>

                    {master ? (
                      <span className="min-h-11 shrink-0 rounded-xl border border-white/10 px-4 py-2.5 text-center text-sm text-slate-500">
                        Master
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          void handleDeleteUser(user.id, user.email || '')
                        }
                        className="min-h-11 w-full shrink-0 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/20 active:bg-red-500/25 sm:w-auto"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
