/** Works in secure and non-secure contexts (e.g. LAN http:// on mobile). */
export function generateId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    /* fall through */
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}