import { useCallback, useEffect, useState } from 'react'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  )
}

function isIOSDevice(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(isStandalone)
  const [isIOS] = useState(isIOSDevice)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    const onInstallable = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const onInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onInstallable)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallable)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const canInstall = !!deferredPrompt && !isInstalled
  const canShowIOSGuide = isIOS && !isInstalled

  const install = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsInstalled(true)
      }
      return
    }
    if (canShowIOSGuide) {
      setShowIOSGuide(true)
    }
  }, [deferredPrompt, canShowIOSGuide])

  return {
    canInstall,
    canShowIOSGuide,
    isInstalled,
    isIOS,
    showIOSGuide,
    setShowIOSGuide,
    install,
  }
}