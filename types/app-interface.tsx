// ================================
// 🔷 PRISMA INTERFACES (Prefix: I)
// ================================

export interface IUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  accounts?: IAccount[];
  sessions?: ISession[];
  applications?: IApplication[];
  meetings?: IMeeting[];
  tasks?: ITask[];
}

export interface ISession {
  id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId: string;
  user?: IUser;
}

export interface IAccount {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  idToken?: string | null;
  accessTokenExpiresAt?: Date | null;
  refreshTokenExpiresAt?: Date | null;
  scope?: string | null;
  password?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: IUser;
}

export interface IVerification {
  id: string;
  identifier: string;
  value: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ======================================
// 💾 DEVFLOW WORKFLOW DATABASE STRUCTURE
// ======================================

export interface IApplication {
  id: string;
  name: string;
  description?: string | null;
  techStack?: string | null;
  repositoryUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user?: IUser;
  meetings?: IMeeting[];
  tasks?: ITask[];
}

export interface IMeeting {
  id: string;
  title: string;
  description?: string | null;
  meetingDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  startAt: Date;
  endAt: Date;
  color: string;
  userId: string;
  user?: IUser;
  applicationId: string;
  application?: IApplication;
  notes?: IMeetingNote[];
}

export interface IMeetingNote {
  id: string;
  title: string;
  content: string;
  isConverted: boolean;
  createdAt: Date;
  meetingId: string;
  meeting?: IMeeting;
  tasks?: ITask[];
}

export interface ITask {
  id: string;
  title: string;
  description?: string | null;
  status: ITaskStatus;
  startTime?: Date | null;
  endTime?: Date | null;
  branchName?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user?: IUser;
  applicationId: string;
  application?: IApplication;
  meetingNoteId?: string | null;
  meetingNote?: IMeetingNote | null;
  timeLogs?: ITimeLog[];
}

export interface ITimeLog {
  id: string;
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  createdAt: Date;
  taskId: string;
  task?: ITask;
}

// ========================
// ENUMS
// ========================
export enum ITaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

export enum IDiagramType {
  FLOWCHART = "FLOWCHART",
  DFD = "DFD",
  ERD = "ERD",
  OTHER = "OTHER",
}
