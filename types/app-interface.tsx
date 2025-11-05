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
  applicationDocs?: IApplicationDoc[];
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
  applicationDocs?: IApplicationDoc[];
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

export interface IApplicationDoc {
  id: string;
  description?: string | null;
  purpose?: string | null;
  techStack?: string | null;
  createdAt: Date;
  updatedAt: Date;
  applicationId: string;
  application?: IApplication;
  userId: string;
  user?: IUser;
  diagrams?: IDiagram[];
  modules?: IModuleDoc[];
  notes?: INoteDoc[];
}

export interface IDiagram {
  id: string;
  type: IDiagramType;
  title: string;
  fileUrl?: string | null;
  diagramData?: any;
  version: number;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  appDocId: string;
  appDoc?: IApplicationDoc;
}

export interface IModuleDoc {
  id: string;
  name: string;
  description?: string | null;
  relatedTaskIds: string[];
  createdAt: Date;
  updatedAt: Date;
  appDocId: string;
  appDoc?: IApplicationDoc;
}

export interface INoteDoc {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  appDocId: string;
  appDoc?: IApplicationDoc;
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
