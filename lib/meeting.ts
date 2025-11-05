import { Application, Meeting, User } from "@/app/generated/prisma/client";
import type {
  IEvent,
  ICalendarApplication,
  IUser,
} from "@/components/interfaces";
import type { TEventColor } from "@/components/types";

export type MeetingWithRelations = Meeting & {
  application: Pick<Application, "id" | "name">;
  user: Pick<User, "id" | "name" | "image">;
};

const COLORS: TEventColor[] = [
  "blue",
  "green",
  "red",
  "yellow",
  "purple",
  "orange",
];

const normaliseColor = (color?: string | null): TEventColor => {
  const candidate = (color ?? "blue").toLowerCase() as TEventColor;
  return COLORS.includes(candidate) ? candidate : "blue";
};

const toUser = (user: MeetingWithRelations["user"]): IUser => ({
  id: user.id,
  name: user.name ?? "Unknown",
  picturePath: user.image ?? null,
});

const toApplication = (
  application: MeetingWithRelations["application"]
): ICalendarApplication => ({
  id: application.id,
  name: application.name,
});

export const meetingToEvent = (meeting: MeetingWithRelations): IEvent => ({
  id: meeting.id,
  title: meeting.title,
  description: meeting.description ?? "",
  startDate: meeting.startAt.toISOString(),
  endDate: meeting.endAt.toISOString(),
  color: normaliseColor(meeting.color),
  applicationId: meeting.applicationId,
  application: toApplication(meeting.application),
  user: toUser(meeting.user),
});
