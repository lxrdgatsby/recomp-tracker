import { describe, expect, it, vi } from 'vitest'
import {
  adminLastActive,
  isMasterAdminRow,
  loadAdminUsers,
  type AdminDirectoryClient,
} from './adminUsers'

const MASTER = 'itsgatsby@protonmail.com'

function client(opts: {
  rpcData?: unknown
  rpcError?: string | null
  profiles?: unknown
  profileError?: string | null
  missingLastActive?: boolean
}): { client: AdminDirectoryClient; calls: string[] } {
  const calls: string[] = []
  const profileResult = (columns: string) => {
    calls.push(`select:${columns}`)
    if (opts.missingLastActive && columns.includes('last_active_at')) {
      return {
        data: null,
        error: { message: 'column profiles.last_active_at does not exist' },
      }
    }
    return {
      data: opts.profiles ?? [],
      error: opts.profileError ? { message: opts.profileError } : null,
    }
  }
  return {
    calls,
    client: {
      rpc: async () => {
        calls.push('rpc:admin_list_users')
        if (opts.rpcError) return { data: null, error: { message: opts.rpcError } }
        return { data: opts.rpcData ?? [], error: null }
      },
      from: (table) => {
        calls.push(`from:${table}`)
        return {
          select: (columns: string) => {
            const result = profileResult(columns)
            const query = Object.assign(Promise.resolve(result), {
              order: () => {
                calls.push('order:created_at')
                return Promise.resolve(result)
              },
              eq: (column: string, value: string) => {
                calls.push(`eq:${column}:${value}`)
                return Promise.resolve(result)
              },
            })
            return query as unknown as ReturnType<
              ReturnType<AdminDirectoryClient['from']>['select']
            >
          },
        }
      },
    },
  }
}

describe('admin user directory', () => {
  it('uses admin_list_users for the full signup list', async () => {
    const rows = [
      { id: 'master', email: MASTER, created_at: '2026-08-01T00:00:00Z' },
      { id: 'new-user', email: 'new@example.com', created_at: '2026-10-01T00:00:00Z' },
    ]
    const harness = client({ rpcData: rows })
    const loaded = await loadAdminUsers(harness.client)
    expect(loaded.error).toBeNull()
    expect(loaded.users).toEqual(rows)
    expect(harness.calls).toEqual(['rpc:admin_list_users'])
    expect(harness.calls.some((call) => call.startsWith('eq:'))).toBe(false)
  })

  it('shows the RPC error and falls back to profiles without filtering to auth.uid()', async () => {
    const harness = client({
      rpcError: 'Could not find the function public.admin_list_users',
      missingLastActive: true,
      profiles: [{ id: 'master', email: MASTER, created_at: '2026-08-01' }],
    })
    const loaded = await loadAdminUsers(harness.client)
    expect(loaded.error).toMatch(/admin_list_users/)
    expect(loaded.error).toMatch(/profile rows visible to this session/)
    expect(loaded.users.map((row) => row.id)).toEqual(['master'])
    expect(harness.calls).toContain('from:profiles')
    expect(harness.calls.some((call) => call.includes('last_active_at'))).toBe(true)
    expect(harness.calls).toContain('select:id, email, username, created_at')
    expect(harness.calls.some((call) => call.startsWith('eq:'))).toBe(false)
  })

  it('prefers last_active_at, then last sign-in, then a dash', () => {
    expect(adminLastActive({ last_active_at: null, last_sign_in_at: null })).toBe('—')
    expect(adminLastActive({})).toBe('—')
    const active = adminLastActive({
      last_active_at: '2026-10-21T18:00:00.000Z',
      last_sign_in_at: '2026-10-01T18:00:00.000Z',
    })
    const signedIn = adminLastActive({
      last_active_at: null,
      last_sign_in_at: '2026-10-01T18:00:00.000Z',
    })
    expect(active).not.toBe('—')
    expect(signedIn).not.toBe('—')
    expect(active).not.toBe(signedIn)
  })

  it('refuses to mark the master row deletable', () => {
    expect(isMasterAdminRow({ id: 'master', email: MASTER }, 'master')).toBe(true)
    expect(isMasterAdminRow({ id: 'master', email: null }, 'master')).toBe(true)
    expect(isMasterAdminRow({ id: 'new-user', email: 'new@example.com' }, 'master')).toBe(
      false
    )
  })
})

describe('last active heartbeat', () => {
  it('upserts last_active_at and retries without that column', async () => {
    const upsert = vi
      .fn()
      .mockResolvedValueOnce({
        error: { message: 'column profiles.last_active_at does not exist' },
      })
      .mockResolvedValueOnce({ error: null })
    vi.resetModules()
    vi.doMock('./supabase', () => ({
      supabase: {
        from: () => ({ upsert }),
      },
    }))
    const { touchLastActive } = await import('./profileService')
    await expect(touchLastActive('user-1', 'new@example.com')).resolves.toBeUndefined()
    expect(upsert).toHaveBeenCalledTimes(2)
    expect(upsert.mock.calls[0][0]).toMatchObject({
      id: 'user-1',
      email: 'new@example.com',
    })
    expect(upsert.mock.calls[0][0].last_active_at).toEqual(expect.any(String))
    expect(upsert.mock.calls[1][0]).toEqual({
      id: 'user-1',
      email: 'new@example.com',
    })
    vi.doUnmock('./supabase')
  })
})
