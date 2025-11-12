import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import type { Prisma } from "@/app/generated/prisma/client";

export const getSession = async () => {
  const result = await auth.api.getSession({
    headers: await headers(),
  });
  return result ?? null;
};

export const taskStatusValues = ["TODO", "IN_PROGRESS", "DONE"] as const;
export type TaskStatusValue = (typeof taskStatusValues)[number];
export const isTaskStatus = (value: string): value is TaskStatusValue =>
  taskStatusValues.includes(value as TaskStatusValue);
export const taskStatusSchema = z.enum(taskStatusValues);

const optionalDateSchema = z.union([z.string().datetime(), z.null()]).optional();

export const baseTaskSchema = z
  .object({
    title: z
      .string({ error: "Title is required" })
      .trim()
      .max(255, "Title must be 255 characters or less")
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be 2000 characters or less")
      .optional()
      .nullable(),
    status: taskStatusSchema.optional(),
    startTime: optionalDateSchema,
    endTime: optionalDateSchema,
    branchName: z
      .string()
      .trim()
      .max(120, "Branch name must be 120 characters or less")
      .optional()
      .nullable(),
    applicationId: z
      .string({ error: "Application is required" })
      .trim()
      .min(1, "Application is required")
      .optional(),
    meetingNoteId: z
      .string()
      .trim()
      .min(1, "Meeting note is required when provided")
      .optional()
      .nullable(),
  })
  .refine(
    (value) => {
      if (!value.startTime || !value.endTime) {
        return true;
      }
      return new Date(value.startTime) <= new Date(value.endTime);
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const createTaskSchema = baseTaskSchema.safeExtend({
  title: baseTaskSchema.shape.title.pipe(z.string()),
  applicationId: baseTaskSchema.shape.applicationId.pipe(z.string()),
});

export const updateTaskSchema = baseTaskSchema;

export const taskInclude = {
  application: {
    select: {
      id: true,
      name: true,
    },
  },
  meetingNote: {
    select: {
      id: true,
      meeting: {
        select: {
          id: true,
          applicationId: true,
          application: {
            select: {
              id: true,
              name: true,
            },
          },
          title: true,
        },
      },
    },
  },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: typeof taskInclude;
}>;

export const serializeTask = (task: TaskWithRelations) => ({
  id: task.id,
  title: task.title,
  description: task.description,
  status: task.status,
  startTime: task.startTime?.toISOString() ?? null,
  endTime: task.endTime?.toISOString() ?? null,
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
            applicationId: task.meetingNote.meeting.applicationId,
            application: task.meetingNote.meeting.application
              ? {
                  id: task.meetingNote.meeting.application.id,
                  name: task.meetingNote.meeting.application.name,
                }
              : null,
            title: task.meetingNote.meeting.title,
          }
        : null,
    }
    : null,
});
