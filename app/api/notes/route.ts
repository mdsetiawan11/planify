import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/api-utils";

const createNoteSchema = z.object({
  meetingId: z.string().trim().min(1, "Meeting ID is required"),
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().trim().min(1, "Content is required"),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const applications = await prisma.application.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const appIds = applications.map((e) => e.id);

  const meetings = await prisma.meeting.findMany({
    where: { applicationId: { in: appIds } },
  });

  const meetingsIds = meetings.map((e) => e.id);
  const meetingNote = await prisma.meetingNote.findMany({
    where: { meetingId: { in: meetingsIds } },
    include: {
      meeting: {
        include: {
          application: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(meetingNote);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { meetingId, title, content } = parsed.data;

  // Verify meeting belongs to user's application
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: meetingId,
      application: {
        userId: session.user.id,
      },
    },
  });

  if (!meeting) {
    return NextResponse.json(
      { message: "Meeting not found or unauthorized" },
      { status: 404 }
    );
  }

  const note = await prisma.meetingNote.create({
    data: {
      meetingId,
      title,
      content,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
