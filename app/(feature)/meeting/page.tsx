import { headers } from "next/headers";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import MeetingCalendarClient from "./meeting-calendar-client";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <p className="text-sm text-muted-foreground">
        You must be signed in to manage meetings.
      </p>
    );
  }

  const [meetings, applications] = await Promise.all([
    prisma.meeting.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null,
      },
      include: {
        application: {
          select: { id: true, name: true },
        },
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.application.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null,
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedMeetings = meetings.map((meeting) => ({
    id: meeting.id,
    title: meeting.title,
    description: meeting.description,
    meetingDate: meeting.meetingDate
      ? meeting.meetingDate.toISOString()
      : null,
    startAt: meeting.startAt.toISOString(),
    endAt: meeting.endAt.toISOString(),
    color: meeting.color,
    applicationId: meeting.applicationId,
    application: meeting.application
      ? { id: meeting.application.id, name: meeting.application.name }
      : null,
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString(),
  }));

  const serializedApplications = applications.map((application) => ({
    id: application.id,
    name: application.name,
  }));

  return (
    <MeetingCalendarClient
      initialMeetings={serializedMeetings}
      applications={serializedApplications}
    />
  );
}
