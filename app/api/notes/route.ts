import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const getSession = async () => {
  const result = await auth.api.getSession({
    headers: await headers(),
  });
  return result ?? null;
};

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

  const meeting = await prisma.meetingNote.create({
    data: {
      meetingId: body.MeetingId,
      title: body.Title,
      content: body.Content,
    },
  });

  return NextResponse.json(meeting, { status: 201 });
}
