export type AdventDayState =
  | 'locked'
  | 'pending'
  | 'available'

export interface AdventDayContent {
  title?: string
  message?: string
  detail?: string
  closing?: string
}

export interface PublicAdventDay {
  id: number
  unlockDate: string
  state: AdventDayState
  content?: AdventDayContent
}

export interface AdventCalendarResponse {
  serverDate: string
  timezone: string
  calendarStart: string
  calendarEnd: string
  days: PublicAdventDay[]
}