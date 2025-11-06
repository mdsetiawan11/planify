import type { Dispatch, SetStateAction } from 'react'

import type { CalendarColor } from './calendar-tailwind-classes'

export type CalendarApplication = {
  id: string
  name: string
}

export type CalendarEvent = {
  id: string
  title: string
  color: CalendarColor
  start: Date
  end: Date
  description?: string | null
  applicationId: string
  applicationName?: string | null
  meetingDate?: Date | null
  createdAt?: Date | null
  updatedAt?: Date | null
}

export type CalendarEventInput = {
  title: string
  start: Date
  end: Date
  color: CalendarColor
  applicationId: string
  description?: string | null
}

export type CalendarProps = {
  events: CalendarEvent[]
  setEvents: Dispatch<SetStateAction<CalendarEvent[]>>
  mode: Mode
  setMode: (mode: Mode) => void
  date: Date
  setDate: (date: Date) => void
  calendarIconIsToday?: boolean
  applications: CalendarApplication[]
  isLoading?: boolean
  createEvent: (input: CalendarEventInput) => Promise<CalendarEvent | void>
  updateEvent: (
    id: string,
    input: CalendarEventInput
  ) => Promise<CalendarEvent | void>
  deleteEvent: (id: string) => Promise<void>
}

export type CalendarContextType = CalendarProps & {
  newEventDialogOpen: boolean
  setNewEventDialogOpen: (open: boolean) => void
  manageEventDialogOpen: boolean
  setManageEventDialogOpen: (open: boolean) => void
  selectedEvent: CalendarEvent | null
  setSelectedEvent: (event: CalendarEvent | null) => void
}

export const calendarModes = ['day', 'week', 'month'] as const
export type Mode = (typeof calendarModes)[number]
