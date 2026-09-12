import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ADMIN_EMAIL, isAdminEmail } from '../constants/admin'
import { supabase } from '../lib/supabase'

export default function Admin() {
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    void checkAdminAccess()
  }, [])

  useEffect(() => {
    const term = search.toLowerCase()
    const filtered = users.filter(
      (u) =>
        u.email?.toLowerCase().includes(term) ||
        u.id?.toLowerCase().includes(term)
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

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setUsers(data || [])
      setFilteredUsers(data || [])
    }

    setLoading(false)
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!supabase) return

    if (
      !confirm(
        `Are you sure you want to permanently delete ${email || userId}? This cannot be undone.`
      )
    ) {
      return
    }

    // Note: For production you should use a Supabase Edge Function
    // with the service role key for deleting users.
    // This is a simplified client-side approach.

    const { error } = await supabase.from('profiles').delete().eq('id', userId)

    if (error) {
      alert('Error deleting user: ' + error.message)
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      alert('User deleted successfully')
    }
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
      {/* Header — sticky for mobile */}
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

      {/* Stats */}
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

      {/* Search */}
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

      {/* Users List */}
      <div className="px-4 sm:px-6">
        <h2 className="mb-4 font-medium">All Registered Users</h2>

        {loading ? (
          <p className="text-gray-400">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-gray-400">No users found.</p>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-base font-medium sm:text-lg">
                      {user.email || 'No email'}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      Joined:{' '}
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : '—'}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      Last active:{' '}
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleString()
                        : user.updated_at
                          ? new Date(user.updated_at).toLocaleString()
                          : 'Never'}
                    </div>
                    <div className="mt-1 break-all text-xs text-gray-500">
                      ID: {String(user.id).slice(0, 12)}...
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void handleDeleteUser(user.id, user.email || '')
                    }
                    className="min-h-11 w-full shrink-0 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/20 active:bg-red-500/25 sm:w-auto"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
