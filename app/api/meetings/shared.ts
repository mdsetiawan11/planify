import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  normalizeCalendarColor,
  isCalendarColor,
  type CalendarColor,
} from "@/components/calendar/calendar-tailwind-classes";
import type { Prisma } from "@/app/generated/prisma/client";

export const getSession = async () => {
  const result = await auth.api.getSession({
    headers: await headers(),
  });
  return result ?? null;
};

export type MeetingWithApplication = Prisma.MeetingGetPayload<{
  include: {
    application: {
      select: { id: true; name: true };
    };
  };
}>;

export const serializeMeeting = (meeting: MeetingWithApplication) => ({
  id: meeting.id,
  title: meeting.title,
  description: meeting.description,
  meetingDate: meeting.meetingDate?.toISOString() ?? null,
  startAt: meeting.startAt.toISOString(),
  endAt: meeting.endAt.toISOString(),
  color: normalizeCalendarColor(meeting.color) as CalendarColor,
  userId: meeting.userId,
  applicationId: meeting.applicationId,
  application: meeting.application
    ? {
        id: meeting.application.id,
        name: meeting.application.name,
      }
    : null,
  createdAt: meeting.createdAt.toISOString(),
  updatedAt: meeting.updatedAt.toISOString(),
});

export const baseMeetingSchema = z
  .object({
    title: z
      .string({ error: "Title is required" })
      .trim()
      .min(1, "Title is required")
      .optional(),
    description: z
      .string()
      .transform((value) => value.trim())
      .optional()
      .nullable(),
    startAt: z
      .string({ error: "Start time is required" })
      .datetime()
      .optional(),
    endAt: z.string({ error: "End time is required" }).datetime().optional(),
    color: z
      .string()
      .refine(
        (value) => !value || isCalendarColor(value.toLowerCase()),
        "Invalid color"
      )
      .optional(),
    applicationId: z
      .string({ error: "Application is required" })
      .trim()
      .min(1, "Application is required")
      .optional(),
    meetingDate: z.string().datetime().optional(),
  })
  .refine(
    (value) =>
      !value.startAt ||
      !value.endAt ||
      new Date(value.startAt) <= new Date(value.endAt),
    {
      message: "End time must be after start time",
      path: ["endAt"],
    }
  );

export const createMeetingSchema = baseMeetingSchema.safeExtend({
  title: baseMeetingSchema.shape.title.pipe(z.string()),
  startAt: baseMeetingSchema.shape.startAt.pipe(z.string()),
  endAt: baseMeetingSchema.shape.endAt.pipe(z.string()),
  applicationId: baseMeetingSchema.shape.applicationId.pipe(z.string()),
});

export const parseDateFilter = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
