import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { createMeetingSchema, getSession, parseDateFilter, serializeMeeting } from "./shared";
import { normalizeCalendarColor } from "@/components/calendar/calendar-tailwind-classes";
import type { Prisma } from "@/app/generated/prisma/client";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const applicationId = searchParams.get("applicationId");

  const startDate = parseDateFilter(startParam);
  const endDate = parseDateFilter(endParam);

  if ((startParam && !startDate) || (endParam && !endDate)) {
    return NextResponse.json(
      { message: "Invalid date filters" },
      { status: 400 }
    );
  }

  const filters: Prisma.MeetingWhereInput[] = [
    { userId: session.user.id },
    { deletedAt: null },
  ];

  if (applicationId) {
    filters.push({ applicationId });
  }

  if (startDate) {
    filters.push({ endAt: { gte: startDate } });
  }

  if (endDate) {
    filters.push({ startAt: { lte: endDate } });
  }

  const meetings = await prisma.meeting.findMany({
    where: { AND: filters },
    include: {
      application: {
        select: { id: true, name: true },
      },
    },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json(meetings.map(serializeMeeting));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = createMeetingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const startAt = new Date(data.startAt);
  const endAt = new Date(data.endAt);

  const meetingDate = data.meetingDate
    ? new Date(data.meetingDate)
    : new Date(startAt);

  const color = normalizeCalendarColor(data.color);

  const meeting = await prisma.meeting.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      startAt,
      endAt,
      meetingDate,
      color,
      userId: session.user.id,
      applicationId: data.applicationId,
    },
    include: {
      application: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(serializeMeeting(meeting), { status: 201 });
}
