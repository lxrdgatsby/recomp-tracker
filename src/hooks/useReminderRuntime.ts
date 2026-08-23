import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { startReminderRuntime } from '../lib/reminders'

function scrollToToday() {
  window.setTimeout(() => {
    document.getElementById('today')?.scrollIntoView({ behavior: 'smooth' })
  }, 200)
}

export function useReminderRuntime(enabled: boolean) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!enabled) return
    const stop = startReminderRuntime()

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'PEPTIDETRACKER_REMINDER_CLICK') return
      navigate('/app')
      scrollToToday()
    }

    navigator.serviceWorker?.addEventListener('message', onMessage)
    return () => {
      stop()
      navigator.serviceWorker?.removeEventListener('message', onMessage)
    }
  }, [enabled, navigate])
}
