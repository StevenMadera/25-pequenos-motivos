import { useCallback, useEffect, useRef } from 'react'
import {
  sendAnalytics,
  type TrackedEvent,
} from '../services/analytics'

function getDeviceType(): string {
  const userAgent = navigator.userAgent

  if (/iPad|Tablet/i.test(userAgent)) {
    return 'tablet'
  }

  if (/Mobi|Android|iPhone|iPod/i.test(userAgent)) {
    return 'mobile'
  }

  return 'desktop'
}

function getBrowserFamily(): string {
  const ua = navigator.userAgent

  if (/Edg\//i.test(ua)) return 'Edge'
  if (/OPR\//i.test(ua)) return 'Opera'
  if (/Chrome\//i.test(ua)) return 'Chrome'
  if (/Firefox\//i.test(ua)) return 'Firefox'
  if (/Safari\//i.test(ua)) return 'Safari'

  return 'Other'
}

export default function useAnalytics() {
  const sessionId = useRef<string | null>(null)

  useEffect(() => {
    let id = sessionStorage.getItem('advent_session_id')

    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem('advent_session_id', id)
    }

    sessionId.current = id

    void sendAnalytics({
      action: 'start',
      sessionId: id,
      deviceType: getDeviceType(),
      browserFamily: getBrowserFamily(),
      referrer: document.referrer,
    })

    const heartbeat = () => {
      if (document.visibilityState !== 'visible') return

      void sendAnalytics({
        action: 'heartbeat',
        sessionId: id,
      })
    }

    const interval = window.setInterval(heartbeat, 30000)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        heartbeat()
      }
    }

    const handlePageHide = () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-advent-analytics`

      void fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'exit',
          sessionId: id,
        }),
        keepalive: true,
      })
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [])

  const track = useCallback(
    (eventName: TrackedEvent, dayId?: number) => {
      if (!sessionId.current) return

      void sendAnalytics({
        action: 'event',
        sessionId: sessionId.current,
        eventName,
        dayId,
      })
    },
    [],
  )

  return { track }
}