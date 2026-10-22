import { Link } from 'react-router-dom'
import { isAdminEmail } from '../../constants/admin'

/** Profile entry to /admin. Rendered only for the master account. */
export function AdminProfileLink({
  email,
}: {
  email: string | null | undefined
}) {
  if (!isAdminEmail(email)) return null
  return (
    <Link
      to="/admin"
      className="mt-3 inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 text-sm font-medium text-emerald-300"
    >
      Admin
    </Link>
  )
}
