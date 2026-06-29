/** Canonical OAuth / magic-link callback — must be allowlisted in Supabase Auth → URL Configuration. */
export function getAuthCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`
}