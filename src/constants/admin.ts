/** Master admin — email must match Supabase auth user for admin UI + RLS policy. */
export const ADMIN_EMAIL = 'itsgatsby@protonmail.com'

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()
}
