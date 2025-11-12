export const TASK_STATUS_ORDER = ["TODO", "IN_PROGRESS", "DONE"] as const;

export type TaskStatus = (typeof TASK_STATUS_ORDER)[number];

export type SerializedTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  startTime: string | null;
  endTime: string | null;
  branchName: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  applicationId: string;
  application: {
    id: string;
    name: string;
  } | null;
  meetingNoteId: string | null;
  meetingNote?: {
    id: string;
    meeting: {
      id: string;
      title: string;
      applicationId: string;
      applicationName: string | null;
    } | null;
  } | null;
};

export type ApplicationOption = {
  id: string;
  name: string;
};

export type MeetingNoteOption = {
  id: string;
  meetingId: string;
  meetingTitle: string;
  applicationId: string;
  applicationName: string;
};

export type TaskPayload = {
  title: string;
  description: string | null;
  status: TaskStatus;
  applicationId: string;
  branchName: string | null;
  startTime: string | null;
  endTime: string | null;
  meetingNoteId: string | null;
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};
