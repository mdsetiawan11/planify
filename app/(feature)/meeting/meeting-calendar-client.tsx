"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Calendar from "@/components/calendar/calendar";
import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarApplication,
  Mode,
} from "@/components/calendar/calendar-types";
import { normalizeCalendarColor } from "@/components/calendar/calendar-tailwind-classes";

type SerializedApplication = CalendarApplication;

type SerializedMeeting = {
  id: string;
  title: string;
  description: string | null;
  meetingDate: string | null;
  startAt: string;
  endAt: string;
  color: string;
  applicationId: string;
  application: SerializedApplication | null;
  createdAt: string;
  updatedAt: string;
};

type MeetingCalendarClientProps = {
  initialMeetings: SerializedMeeting[];
  applications: SerializedApplication[];
};

type JsonError = {
  message?: string;
};

const sortEvents = (events: CalendarEvent[]) =>
  [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

const toCalendarEvent = (meeting: SerializedMeeting): CalendarEvent => ({
  id: meeting.id,
  title: meeting.title,
  description: meeting.description,
  meetingDate: meeting.meetingDate ? new Date(meeting.meetingDate) : null,
  start: new Date(meeting.startAt),
  end: new Date(meeting.endAt),
  color: normalizeCalendarColor(meeting.color),
  applicationId: meeting.applicationId,
  applicationName: meeting.application?.name ?? null,
  createdAt: new Date(meeting.createdAt),
  updatedAt: new Date(meeting.updatedAt),
});

async function fetchJson<TResponse>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<TResponse> {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let data: (TResponse & JsonError) | null = null;

  if (text) {
    try {
      data = JSON.parse(text) as TResponse & JsonError;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      (data as JsonError | null)?.message ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as TResponse;
}

export default function MeetingCalendarClient({
  initialMeetings,
  applications,
}: MeetingCalendarClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>(() =>
    sortEvents(initialMeetings.map(toCalendarEvent))
  );
  const [mode, setMode] = useState<Mode>("month");
  const [date, setDate] = useState<Date>(new Date());

  const applicationOptions = useMemo<CalendarApplication[]>(
    () => applications.map((app) => ({ id: app.id, name: app.name })),
    [applications]
  );

  const createEvent = useCallback(
    async (input: CalendarEventInput) => {
      const payload = {
        title: input.title,
        description: input.description ?? null,
        startAt: input.start.toISOString(),
        endAt: input.end.toISOString(),
        color: input.color,
        applicationId: input.applicationId,
      };

      const created = await fetchJson<SerializedMeeting>("/api/meetings", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const event = toCalendarEvent(created);
      setEvents((prev) => sortEvents([...prev, event]));
      router.refresh();
      return event;
    },
    [router]
  );

  const updateEvent = useCallback(
    async (id: string, input: CalendarEventInput) => {
      const payload = {
        title: input.title,
        description: input.description ?? null,
        startAt: input.start.toISOString(),
        endAt: input.end.toISOString(),
        color: input.color,
        applicationId: input.applicationId,
      };

      const updated = await fetchJson<SerializedMeeting>(`/api/meetings/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const event = toCalendarEvent(updated);
      setEvents((prev) =>
        sortEvents(prev.map((existing) => (existing.id === id ? event : existing)))
      );
      router.refresh();
      return event;
    },
    [router]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      await fetchJson(`/api/meetings/${id}`, {
        method: "DELETE",
      });

      setEvents((prev) => prev.filter((event) => event.id !== id));
      router.refresh();
    },
    [router]
  );

  return (
    <Calendar
      events={events}
      setEvents={setEvents}
      mode={mode}
      setMode={setMode}
      date={date}
      setDate={setDate}
      applications={applicationOptions}
      isLoading={false}
      createEvent={createEvent}
      updateEvent={updateEvent}
      deleteEvent={deleteEvent}
    />
  );
}
