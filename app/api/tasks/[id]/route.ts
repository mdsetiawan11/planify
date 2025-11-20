import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import {
  getSession,
  serializeTask,
  taskInclude,
  updateTaskSchema,
} from "../shared";

const normalizeDate = (value?: string | null) =>
  value ? new Date(value) : null;
const normalizeText = (value?: string | null) => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = (await params) ?? {};
  if (!id) {
    return NextResponse.json({ message: "Task id is required" }, { status: 400 });
  }

  const existing = await prisma.task.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    include: taskInclude,
  });

  if (!existing) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (
    data.title === undefined &&
    data.description === undefined &&
    data.status === undefined &&
    data.startTime === undefined &&
    data.endTime === undefined &&
    data.branchName === undefined &&
    data.applicationId === undefined &&
    data.meetingNoteId === undefined
  ) {
    return NextResponse.json(
      { message: "Nothing to update" },
      { status: 400 }
    );
  }

  const nextStart =
    data.startTime === undefined ? existing.startTime : normalizeDate(data.startTime);
  const nextEnd =
    data.endTime === undefined ? existing.endTime : normalizeDate(data.endTime);

  if (nextStart && nextEnd && nextStart > nextEnd) {
    return NextResponse.json(
      { message: "End time must be after start time" },
      { status: 400 }
    );
  }

  const targetApplicationId = data.applicationId ?? existing.applicationId;

  if (data.applicationId) {
    const ownsApplication = await prisma.application.findFirst({
      where: {
        id: data.applicationId,
        userId: session.user.id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!ownsApplication) {
      return NextResponse.json(
        { message: "Application not found" },
        { status: 404 }
      );
    }

    if (
      existing.meetingNote?.meeting?.applicationId &&
      existing.meetingNote.meeting.applicationId !== data.applicationId &&
      data.meetingNoteId === undefined
    ) {
      return NextResponse.json(
        {
          message:
            "The linked meeting note belongs to a different application. Either detach it or pick a matching note.",
        },
        { status: 400 }
      );
    }
  }

  if (data.meetingNoteId !== undefined) {
    if (data.meetingNoteId === null) {
      // allow clearing the note link
    } else {
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
        meetingNote.meeting.applicationId !== targetApplicationId
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
  }

  const updated = await prisma.task.update({
    where: { id: existing.id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined
        ? { description: normalizeText(data.description) }
        : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.startTime !== undefined ? { startTime: nextStart } : {}),
      ...(data.endTime !== undefined ? { endTime: nextEnd } : {}),
      ...(data.branchName !== undefined
        ? { branchName: normalizeText(data.branchName) }
        : {}),
      ...(data.applicationId ? { applicationId: data.applicationId } : {}),
      ...(data.meetingNoteId !== undefined
        ? { meetingNoteId: data.meetingNoteId ?? null }
        : {}),
    },
    include: taskInclude,
  });

  return NextResponse.json(serializeTask(updated));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = (await params) ?? {};
  if (!id) {
    return NextResponse.json({ message: "Task id is required" }, { status: 400 });
  }

  const existing = await prisma.task.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  await prisma.task.update({
    where: { id: existing.id },
    data: {
      deletedAt: new Date(),
      deletedBy: session.user.id,
    },
  });

  return NextResponse.json({ message: "Success" }, { status: 200 });
}
