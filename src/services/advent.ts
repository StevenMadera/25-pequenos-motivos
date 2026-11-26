import { supabase } from './supabase'
import type { AdventCalendarResponse } from '../types/advent'

export async function getAdventCalendar(): Promise<AdventCalendarResponse> {
  const { data, error } = await supabase.functions.invoke(
    'get-advent-content',
    {
      method: 'GET',
    },
  )

  if (error) {
    throw new Error(
      error.message || 'No fue posible conectar con el calendario.',
    )
  }

  if (
    !data ||
    !Array.isArray(data.days) ||
    typeof data.serverDate !== 'string'
  ) {
    throw new Error('El servidor devolvió una respuesta inválida.')
  }

  return data as AdventCalendarResponse
}