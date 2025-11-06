"use client";
import Calendar from "@/components/calendar/calendar";
import { CalendarEvent, Mode } from "@/components/calendar/calendar-types";
import { generateMockEvents } from "@/lib/mock-calendar-events";
import { useState } from "react";

export default function Page() {
  const [events, setEvents] = useState<CalendarEvent[]>(generateMockEvents());
  const [mode, setMode] = useState<Mode>("month");
  const [date, setDate] = useState<Date>(new Date());

  return (
    <Calendar
      events={events}
      setEvents={setEvents}
      mode={mode}
      setMode={setMode}
      date={date}
      setDate={setDate}
    />
  );
}
