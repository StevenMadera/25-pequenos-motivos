import { supabase } from './supabase'

export type TrackedEvent =
  | 'calendar_view'
  | 'gift_open'
  | 'gift_close'

interface AnalyticsPayload {
  action: 'start' | 'heartbeat' | 'event' | 'exit'
  sessionId: string
  deviceType?: string
  browserFamily?: string
  referrer?: string
  eventName?: TrackedEvent
  dayId?: number
}

export async function sendAnalytics(
  payload: AnalyticsPayload,
): Promise<void> {
  const { error } = await supabase.functions.invoke(
    'track-advent-analytics',
    {
      body: payload,
    },
  )

  if (error) {
    console.error('No se pudo registrar la analítica:', error.message)
  }
}
