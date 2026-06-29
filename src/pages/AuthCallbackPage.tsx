import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (!supabase) {
      navigate('/setup', { replace: true })
      return
    }

    const client = supabase

    const finish = async () => {
      const queryError =
        searchParams.get('error_description') ?? searchParams.get('error')
      if (queryError) {
        navigate(`/login?error=${encodeURIComponent(queryError)}`, { replace: true })
        return
      }

      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, '')
      )
      const hashError =
        hashParams.get('error_description') ?? hashParams.get('error')
      if (hashError) {
        navigate(`/login?error=${encodeURIComponent(hashError)}`, { replace: true })
        return
      }

      const code = searchParams.get('code')
      if (code) {
        const { error } = await client.auth.exchangeCodeForSession(code)
        if (error) {
          navigate(`/login?error=${encodeURIComponent(error.message)}`, {
            replace: true,
          })
          return
        }
        navigate('/app', { replace: true })
        return
      }

      const { data, error } = await client.auth.getSession()
      if (error) {
        navigate(`/login?error=${encodeURIComponent(error.message)}`, {
          replace: true,
        })
        return
      }

      if (data.session) {
        navigate('/app', { replace: true })
        return
      }

      navigate(
        `/login?error=${encodeURIComponent(
          'Sign-in link expired or invalid. Request a new magic link.'
        )}`,
        { replace: true }
      )
    }

    void finish()
  }, [navigate, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="text-slate-400">Signing you in…</p>
      </div>
    </div>
  )
}