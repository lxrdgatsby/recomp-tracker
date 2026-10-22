import { isAdminEmail } from '../constants/admin'

export type AdminUserRow = {
  id: string
  email: string | null
  created_at?: string | null
  last_sign_in_at?: string | null
  last_active_at?: string | null
  username?: string | null
}

type PostgrestError = { message: string } | null

type ProfileQuery = PromiseLike<{ data: unknown; error: PostgrestError }> & {
  order: (
    column: string,
    options: { ascending: boolean }
  ) => PromiseLike<{ data: unknown; error: PostgrestError }>
}

export type AdminDirectoryClient = {
  rpc: (fn: 'admin_list_users') => PromiseLike<{ data: unknown; error: PostgrestError }>
  from: (table: 'profiles') => {
    select: (columns: string) => ProfileQuery
  }
}

export function adminLastActive(row: {
  last_active_at?: string | null
  last_sign_in_at?: string | null
}): string {
  const raw = row.last_active_at || row.last_sign_in_at || ''
  if (!raw) return '—'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

/** Master row is the signed-in admin, matched by email or by their own auth id. */
export function isMasterAdminRow(
  row: { id: string; email?: string | null },
  currentUserId?: string | null
): boolean {
  if (isAdminEmail(row.email)) return true
  return Boolean(currentUserId && row.id === currentUserId)
}

function asRows(data: unknown): AdminUserRow[] {
  if (!Array.isArray(data)) return []
  return data.filter(
    (row): row is AdminUserRow =>
      !!row &&
      typeof row === 'object' &&
      typeof (row as AdminUserRow).id === 'string'
  )
}

async function selectProfiles(
  client: AdminDirectoryClient,
  columns: string
): Promise<{ data: unknown; error: PostgrestError }> {
  const query = client.from('profiles').select(columns)
  return query.order('created_at', { ascending: false })
}

export async function loadAdminUsers(
  client: AdminDirectoryClient
): Promise<{ users: AdminUserRow[]; error: string | null }> {
  const rpc = await client.rpc('admin_list_users')
  if (!rpc.error) {
    return { users: asRows(rpc.data), error: null }
  }

  const rpcMessage = rpc.error.message || 'admin_list_users failed'
  const withActive = await selectProfiles(
    client,
    'id, email, username, created_at, last_active_at'
  )
  const profiles = /last_active_at/i.test(withActive.error?.message || '')
    ? await selectProfiles(client, 'id, email, username, created_at')
    : withActive

  if (profiles.error) {
    return {
      users: [],
      error: `${rpcMessage}. Profile fallback failed: ${profiles.error.message}`,
    }
  }

  return {
    users: asRows(profiles.data),
    error: `${rpcMessage}. Showing profile rows visible to this session until admin_list_users is installed.`,
  }
}
