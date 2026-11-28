
import { supabase } from './supabase'

export type TrackedEvent =
  | 'calendar_view'
  | 'gift_open'
  | 'gift_close'
  | 'trap_open'
  | 'trap_wait_click'
  | 'trap_escape_attempt'
  | 'trap_escape_hover'
  | 'trap_video_play'
  | 'trap_sound_enabled'
  | 'trap_sound_muted'
  | 'trap_close'

export interface AnalyticsMetadata {
  interaction?: string
  durationSeconds?: number
  attemptNumber?: number
}

interface AnalyticsPayload {
  action: 'start' | 'heartbeat' | 'event' | 'exit'
  sessionId: string
  deviceType?: string
  browserFamily?: string
  referrer?: string
  eventName?: TrackedEvent
  dayId?: number
  metadata?: AnalyticsMetadata
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
    console.error(
      'No se pudo registrar la analítica:',
      error.message,
    )
  }
}
