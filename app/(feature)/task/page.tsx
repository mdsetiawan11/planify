import { headers } from "next/headers";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import TaskBoard from "./task-board";
import type {
  ApplicationOption,
  MeetingNoteOption,
  SerializedTask,
} from "./task-types";

export default async function TaskPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/auth/signin?callbackUrl=/task`);
  }

  const [tasks, applications, meetingNotes] = await Promise.all([
    prisma.task.findMany({
      where: { userId: session.user.id, deletedAt: null },
      include: {
        application: {
          select: { id: true, name: true },
        },
        meetingNote: {
          select: {
            id: true,
            meeting: {
              select: {
                id: true,
                title: true,
                applicationId: true,
                application: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.application.findMany({
      where: { userId: session.user.id, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.meetingNote.findMany({
      where: {
        meeting: {
          application: {
            userId: session.user.id,
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        meetingId: true,
        meeting: {
          select: {
            id: true,
            title: true,
            application: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const serializedTasks: SerializedTask[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    startTime: task.startTime ? task.startTime.toISOString() : null,
    endTime: task.endTime ? task.endTime.toISOString() : null,
    branchName: task.branchName,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    userId: task.userId,
    applicationId: task.applicationId,
    application: task.application
      ? { id: task.application.id, name: task.application.name }
      : null,
    meetingNoteId: task.meetingNoteId ?? null,
    meetingNote: task.meetingNote
      ? {
          id: task.meetingNote.id,
          meeting: task.meetingNote.meeting
            ? {
                id: task.meetingNote.meeting.id,
                title: task.meetingNote.meeting.title,
                applicationId: task.meetingNote.meeting.applicationId,
                applicationName:
                  task.meetingNote.meeting.application?.name ?? null,
              }
            : null,
        }
      : null,
  }));

  const serializedApplications: ApplicationOption[] = applications.map(
    (application) => ({
      id: application.id,
      name: application.name,
    })
  );

  const serializedMeetingNotes: MeetingNoteOption[] = meetingNotes
    .filter((note) => !!note.meeting)
    .map((note) => ({
      id: note.id,
      meetingId: note.meetingId,
      meetingTitle: note.meeting?.title ?? "Untitled meeting",
      applicationId: note.meeting?.application?.id ?? "",
      applicationName: note.meeting?.application?.name ?? "Unknown application",
    }))
    .filter((note) => note.applicationId);

  return (
    <TaskBoard
      initialTasks={serializedTasks}
      applications={serializedApplications}
      meetingNotes={serializedMeetingNotes}
    />
  );
}
