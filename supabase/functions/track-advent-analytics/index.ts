import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const allowedEvents = [
  'page_view',
  'calendar_view',
  'gift_open',
  'gift_close',
  'heartbeat',
  'page_exit',
  'trap_open',
  'trap_wait_click',
  'trap_escape_attempt',
  'trap_escape_hover',
  'trap_video_play',
  'trap_sound_enabled',
  'trap_sound_muted',
  'trap_close',
] as const

type AnalyticsEvent = typeof allowedEvents[number]

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

function getDateInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )

  return `${values.year}-${values.month}-${values.day}`
}

function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  return value.trim().slice(0, maxLength) || null
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido.' }, 405)
  }

  try {
    const rawBody = await request.text()

    if (rawBody.length > 8000) {
      return jsonResponse({ error: 'Solicitud demasiado grande.' }, 413)
    }

    const body = JSON.parse(rawBody)

    const sessionId = body.sessionId
    const action = body.action

    if (!isValidUUID(sessionId)) {
      return jsonResponse({ error: 'Identificador de sesión inválido.' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Configuración del servidor incompleta.')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const now = new Date()
    const nowISO = now.toISOString()

    if (action === 'start') {
      const deviceType = cleanText(body.deviceType, 30)
      const browserFamily = cleanText(body.browserFamily, 40)
      const referrer = cleanText(body.referrer, 500)

      const { error } = await supabase
        .from('visitor_sessions')
        .insert({
          session_id: sessionId,
          started_at: nowISO,
          last_seen_at: nowISO,
          device_type: deviceType,
          browser_family: browserFamily,
          referrer,
        })

      if (error) {
        // Una sesión existente no debe reiniciarse.
        if (error.code === '23505') {
          return jsonResponse({ success: true, existing: true })
        }

        throw error
      }

      await supabase.from('analytics_events').insert({
        session_id: sessionId,
        event_name: 'page_view',
        metadata: {},
        occurred_at: nowISO,
      })

      return jsonResponse({ success: true })
    }

    const { data: session, error: sessionError } = await supabase
      .from('visitor_sessions')
      .select('last_seen_at, active_seconds, ended_at')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (sessionError) throw sessionError

    if (!session) {
      return jsonResponse({ error: 'Sesión no encontrada.' }, 404)
    }

    if (action === 'heartbeat') {
      if (session.ended_at) {
        return jsonResponse({ error: 'La sesión ya terminó.' }, 409)
      }

      const elapsed = Math.floor(
        (now.getTime() - new Date(session.last_seen_at).getTime()) / 1000,
      )

      // Solo contamos intervalos razonables entre latidos.
      const addedSeconds =
        elapsed > 0 && elapsed <= 90
          ? Math.min(elapsed, 45)
          : 0

      const { error: updateError } = await supabase
        .from('visitor_sessions')
        .update({
          last_seen_at: nowISO,
          active_seconds: session.active_seconds + addedSeconds,
        })
        .eq('session_id', sessionId)

      if (updateError) throw updateError

      await supabase.from('analytics_events').insert({
        session_id: sessionId,
        event_name: 'heartbeat',
        metadata: {},
        occurred_at: nowISO,
      })

      return jsonResponse({ success: true, addedSeconds })
    }

    if (action === 'exit') {
      await supabase
        .from('visitor_sessions')
        .update({
          ended_at: nowISO,
          last_seen_at: nowISO,
        })
        .eq('session_id', sessionId)
        .is('ended_at', null)

      await supabase.from('analytics_events').insert({
        session_id: sessionId,
        event_name: 'page_exit',
        metadata: {},
        occurred_at: nowISO,
      })

      return jsonResponse({ success: true })
    }

    if (action === 'event') {
      const eventName = body.eventName as AnalyticsEvent
      const dayId = body.dayId

      if (!allowedEvents.includes(eventName) ||
          eventName === 'page_view' ||
          eventName === 'heartbeat' ||
          eventName === 'page_exit') {
        return jsonResponse({ error: 'Evento no permitido.' }, 400)
      }

      if (
        dayId !== undefined &&
        (!Number.isInteger(dayId) || dayId < 1 || dayId > 25)
      ) {
        return jsonResponse({ error: 'Día inválido.' }, 400)
      }

      if (eventName === 'gift_open') {
        if (!Number.isInteger(dayId)) {
          return jsonResponse({ error: 'Falta el día del regalo.' }, 400)
        }

        const { data: settings, error: settingsError } = await supabase
          .from('app_settings')
          .select('timezone')
          .eq('id', true)
          .single()

        if (settingsError || !settings) throw settingsError

        const serverDate = getDateInTimezone(
          settings.timezone || 'America/Bogota',
        )

        const { data: day, error: dayError } = await supabase
          .from('advent_days')
          .select('unlock_date, is_published')
          .eq('id', dayId)
          .maybeSingle()

        if (dayError) throw dayError

        if (
          !day ||
          day.unlock_date > serverDate ||
          !day.is_published
        ) {
          return jsonResponse(
            { error: 'Este regalo todavía no está disponible.' },
            403,
          )
        }
      }

        const allowedTrapEvents = [
        'trap_open',
        'trap_wait_click',
        'trap_escape_attempt',
        'trap_escape_hover',
        'trap_video_play',
        'trap_sound_enabled',
        'trap_sound_muted',
        'trap_close',
        ]

        if (allowedTrapEvents.includes(eventName)) {
        if (dayId !== 1) {
            return jsonResponse(
            { error: 'Los eventos de la trampa deben pertenecer al día 1.' },
            400,
            )
        }
        }

        const rawMetadata =
        body.metadata && typeof body.metadata === 'object'
            ? body.metadata
            : {}

        const metadata = {
        interaction: cleanText(rawMetadata.interaction, 40),
        durationSeconds:
            Number.isInteger(rawMetadata.durationSeconds) &&
            rawMetadata.durationSeconds >= 0
            ? Math.min(rawMetadata.durationSeconds, 86400)
            : null,
        attemptNumber:
            Number.isInteger(rawMetadata.attemptNumber) &&
            rawMetadata.attemptNumber >= 0
            ? Math.min(rawMetadata.attemptNumber, 10000)
            : null,
        }

        const { error: eventError } = await supabase
        .from('analytics_events')
        .insert({
            session_id: sessionId,
            event_name: eventName,
            day_id: dayId ?? null,
            metadata,
            occurred_at: nowISO,
        })

        if (eventError) throw eventError

      if (eventError) throw eventError

      return jsonResponse({ success: true })
    }

    return jsonResponse({ error: 'Acción desconocida.' }, 400)
  } catch (error) {
    console.error('track-advent-analytics:', error)

    return jsonResponse(
      { error: 'No fue posible registrar la actividad.' },
      500,
    )
  }
})