import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { startReminderRuntime } from '../lib/reminders'
import { startWeighInReminderRuntime } from '../utils/weighInReminders'

function scrollToToday() {
  window.setTimeout(() => {
    document.getElementById('today')?.scrollIntoView({ behavior: 'smooth' })
  }, 200)
}

export function useReminderRuntime(enabled: boolean) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!enabled) return
    const stopShots = startReminderRuntime()
    const stopWeighIn = startWeighInReminderRuntime()

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'PEPTIDETRACKER_REMINDER_CLICK') return
      const url = typeof event.data?.url === 'string' ? event.data.url : ''
      if (url.includes('/app/progress')) {
        navigate('/app/progress')
        return
      }
      navigate('/app')
      scrollToToday()
    }

    navigator.serviceWorker?.addEventListener('message', onMessage)
    return () => {
      stopShots()
      stopWeighIn()
      navigator.serviceWorker?.removeEventListener('message', onMessage)
    }
  }, [enabled, navigate])
}
