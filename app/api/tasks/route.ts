import { NextResponse } from "next/server";
import type { Prisma } from "@/app/generated/prisma/client";

import prisma from "@/lib/prisma";
import {
  createTaskSchema,
  getSession,
  isTaskStatus,
  serializeTask,
  taskInclude,
} from "./shared";

const normalizeDate = (value?: string | null) =>
  value ? new Date(value) : null;
const normalizeText = (value?: string | null) => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const applicationId = searchParams.get("applicationId");
  const search = searchParams.get("search");

  const filters: Prisma.TaskWhereInput[] = [
    { userId: session.user.id },
    { deletedAt: null },
  ];

  if (status && isTaskStatus(status)) {
    filters.push({ status });
  }

  if (applicationId) {
    filters.push({ applicationId });
  }

  if (search) {
    filters.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { branchName: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const tasks = await prisma.task.findMany({
    where: { AND: filters },
    include: taskInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks.map(serializeTask));
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

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const application = await prisma.application.findFirst({
    where: {
      id: data.applicationId,
      userId: session.user.id,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!application) {
    return NextResponse.json(
      { message: "Application not found" },
      { status: 404 }
    );
  }

  if (data.meetingNoteId) {
    const meetingNote = await prisma.meetingNote.findFirst({
      where: {
        id: data.meetingNoteId,
        meeting: {
          application: {
            userId: session.user.id,
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        meeting: {
          select: { applicationId: true },
        },
      },
    });

    if (!meetingNote) {
      return NextResponse.json(
        { message: "Meeting note not found" },
        { status: 404 }
      );
    }

    if (
      meetingNote.meeting?.applicationId &&
      meetingNote.meeting.applicationId !== data.applicationId
    ) {
      return NextResponse.json(
        {
          message:
            "Meeting note must belong to the same application as the task",
        },
        { status: 400 }
      );
    }
  }

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: normalizeText(data.description),
      status: data.status ?? "TODO",
      startTime: normalizeDate(data.startTime),
      endTime: normalizeDate(data.endTime),
      branchName: normalizeText(data.branchName),
      userId: session.user.id,
      applicationId: data.applicationId,
      meetingNoteId: data.meetingNoteId ?? null,
    },
    include: taskInclude,
  });

  return NextResponse.json(serializeTask(task), { status: 201 });
}
