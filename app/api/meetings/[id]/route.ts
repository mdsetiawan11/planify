import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { baseMeetingSchema, getSession, serializeMeeting } from "../shared";
import { normalizeCalendarColor } from "@/components/calendar/calendar-tailwind-classes";

const updateMeetingSchema = baseMeetingSchema
  .refine((value) => !value.startAt || value.endAt, {
    message: "End time is required when updating the start time",
    path: ["endAt"],
  })
  .refine((value) => !value.endAt || value.startAt, {
    message: "Start time is required when updating the end time",
    path: ["startAt"],
  });

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.meeting.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    include: {
      application: {
        select: { id: true, name: true },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Meeting not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const parsed = updateMeetingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const startAt = data.startAt ? new Date(data.startAt) : existing.startAt;
  const endAt = data.endAt ? new Date(data.endAt) : existing.endAt;

  if (startAt > endAt) {
    return NextResponse.json(
      { message: "End time must be after start time" },
      { status: 400 }
    );
  }

  const meetingDate = data.meetingDate
    ? new Date(data.meetingDate)
    : existing.meetingDate ?? startAt;

  const color = data.color
    ? normalizeCalendarColor(data.color)
    : normalizeCalendarColor(existing.color);

  const updated = await prisma.meeting.update({
    where: { id: existing.id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined
        ? { description: data.description ?? null }
        : {}),
      startAt,
      endAt,
      meetingDate,
      color,
      ...(data.applicationId ? { applicationId: data.applicationId } : {}),
    },
    include: {
      application: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(serializeMeeting(updated));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.meeting.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "Meeting not found" }, { status: 404 });
  }

  await prisma.meeting.update({
    where: { id: existing.id },
    data: {
      deletedAt: new Date(),
      deletedBy: session.user.id,
    },
  });

  return NextResponse.json({ message: "Success" }, { status: 200 });
}
