import { CalendarContext } from './calendar-context'
import type { CalendarEvent, CalendarProps } from './calendar-types'
import { useState } from 'react'
import CalendarNewEventDialog from './dialog/calendar-new-event-dialog'
import CalendarManageEventDialog from './dialog/calendar-manage-event-dialog'

export default function CalendarProvider({
  children,
  ...props
}: CalendarProps & { children: React.ReactNode }) {
  const {
    events,
    setEvents,
    mode,
    setMode,
    date,
    setDate,
    calendarIconIsToday = true,
    applications,
    isLoading = false,
    createEvent,
    updateEvent,
    deleteEvent,
  } = props

  const [newEventDialogOpen, setNewEventDialogOpen] = useState(false)
  const [manageEventDialogOpen, setManageEventDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  return (
    <CalendarContext.Provider
      value={{
        events,
        setEvents,
        mode,
        setMode,
        date,
        setDate,
        calendarIconIsToday,
        applications,
        isLoading,
        createEvent,
        updateEvent,
        deleteEvent,
        newEventDialogOpen,
        setNewEventDialogOpen,
        manageEventDialogOpen,
        setManageEventDialogOpen,
        selectedEvent,
        setSelectedEvent,
      }}
    >
      <CalendarNewEventDialog />
      <CalendarManageEventDialog />
      {children}
    </CalendarContext.Provider>
  )
}
