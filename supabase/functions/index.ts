import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

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

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Método no permitido.' }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Configuración del servidor incompleta.')
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    )

    // Obtener la configuración del calendario.
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('timezone, calendar_start, calendar_end')
      .eq('id', true)
      .single()

    if (settingsError || !settings) {
      throw new Error('No fue posible consultar la configuración.')
    }

    const timezone = settings.timezone || 'America/Bogota'
    const serverDate = getDateInTimezone(timezone)

    // Obtener los días sin permitir que el navegador controle su disponibilidad.
    const { data: days, error: daysError } = await supabase
      .from('advent_days')
      .select('id, unlock_date, content, is_published')
      .order('id', { ascending: true })

    if (daysError || !days) {
      throw new Error('No fue posible consultar el calendario.')
    }

    const publicDays = days.map((day) => {
      const isUnlocked = day.unlock_date <= serverDate

      if (!isUnlocked) {
        return {
          id: day.id,
          unlockDate: day.unlock_date,
          state: 'locked',
        }
      }

      if (!day.is_published) {
        return {
          id: day.id,
          unlockDate: day.unlock_date,
          state: 'pending',
        }
      }

      return {
        id: day.id,
        unlockDate: day.unlock_date,
        state: 'available',
        content: day.content,
      }
    })

    return jsonResponse({
      serverDate,
      timezone,
      calendarStart: settings.calendar_start,
      calendarEnd: settings.calendar_end,
      days: publicDays,
    })
  } catch (error) {
    console.error('get-advent-content:', error)

    return jsonResponse(
      { error: 'No fue posible cargar el calendario.' },
      500,
    )
  }
})