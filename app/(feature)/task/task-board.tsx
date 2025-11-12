"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  GitBranch,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanOverlay,
  type KanbanMoveEvent,
} from "@/components/ui/kanban";

import TaskFormDialog from "./task-form-dialog";
import type {
  ApplicationOption,
  MeetingNoteOption,
  SerializedTask,
  TaskPayload,
  TaskStatus,
} from "./task-types";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "./task-types";

type TaskBoardProps = {
  initialTasks: SerializedTask[];
  applications: ApplicationOption[];
  meetingNotes: MeetingNoteOption[];
};

const statusAccent: Record<TaskStatus, string> = {
  TODO: "border-t-4 border-dashed border-slate-300 dark:border-slate-600",
  IN_PROGRESS:
    "border-t-4 border-dashed border-amber-400 dark:border-amber-500",
  DONE: "border-t-4 border-dashed border-emerald-400 dark:border-emerald-500",
};

const statusBadgeVariant: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-900 dark:bg-slate-900/60 dark:text-slate-100",
  IN_PROGRESS:
    "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
  DONE: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
};

const statusFilterOptions: Array<{ label: string; value: TaskStatus | "all" }> =
  [
    { label: "All statuses", value: "all" },
    ...TASK_STATUS_ORDER.map((status) => ({
      label: TASK_STATUS_LABELS[status],
      value: status,
    })),
  ];

type FilterState = {
  search: string;
  applicationId: string;
  status: TaskStatus | "all";
};

const defaultFilters: FilterState = {
  search: "",
  applicationId: "all",
  status: "all",
};

type JsonError = {
  message?: string;
};

const formatDateRange = (start: string | null, end: string | null) => {
  if (!start && !end) return null;
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${formatter.format(startDate)} \u2014 ${formatter.format(endDate)}`;
  }

  if (start) {
    return `Starts ${formatter.format(new Date(start))}`;
  }

  return `Ends ${formatter.format(new Date(end!))}`;
};

export default function TaskBoard({
  initialTasks,
  applications,
  meetingNotes,
}: TaskBoardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<SerializedTask[]>(initialTasks);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [activeTask, setActiveTask] = useState<SerializedTask | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SerializedTask | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const mutate = useCallback(
    async <TResponse,>(input: RequestInfo | URL, init?: RequestInit) => {
      const response = await fetch(input, {
        cache: "no-store",
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      });

      const text = await response.text();
      let data: (TResponse & JsonError) | null = null;

      if (text) {
        try {
          data = JSON.parse(text) as TResponse & JsonError;
        } catch {
          data = null;
        }
      }

      if (!response.ok) {
        const message =
          (data as JsonError | null)?.message ??
          `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      return data as TResponse;
    },
    []
  );

  const filteredTasks = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (
        filters.applicationId !== "all" &&
        task.applicationId !== filters.applicationId
      ) {
        return false;
      }
      if (filters.status !== "all" && task.status !== filters.status) {
        return false;
      }
      if (!query) return true;

      const haystack = [
        task.title,
        task.description,
        task.branchName,
        task.application?.name,
        task.meetingNote?.meeting?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [tasks, filters]);

  const kanbanColumns = useMemo<Record<TaskStatus, SerializedTask[]>>(() => {
    const next: Record<TaskStatus, SerializedTask[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    };

    filteredTasks.forEach((task) => {
      next[task.status].push(task);
    });

    return next;
  }, [filteredTasks]);

  const taskLookup = useMemo(() => {
    return new Map(tasks.map((task) => [task.id, task]));
  }, [tasks]);

  const dragDisabled =
    filters.search.trim().length > 0 ||
    filters.applicationId !== "all" ||
    filters.status !== "all";

  const resetDialog = () => {
    setActiveTask(null);
    setDialogMode("create");
  };

  const openCreateDialog = () => {
    resetDialog();
    setDialogOpen(true);
  };

  const openEditDialog = (task: SerializedTask) => {
    setActiveTask(task);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleStatusChange = useCallback(
    (taskId: string, status: TaskStatus) => {
      setError(null);
      startTransition(() => {
        mutate<SerializedTask>(`/api/tasks/${taskId}`, {
          method: "PUT",
          body: JSON.stringify({ status }),
        })
          .then((updated) => {
            setTasks((prev) =>
              prev.map((task) => (task.id === taskId ? updated : task))
            );
            router.refresh();
          })
          .catch((err) => setError(err.message));
      });
    },
    [mutate, router]
  );

  const handleSave = async (payload: TaskPayload) => {
    setError(null);

    if (dialogMode === "create") {
      const created = await mutate<SerializedTask>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTasks((prev) => [created, ...prev]);
    } else if (activeTask) {
      const updated = await mutate<SerializedTask>(
        `/api/tasks/${activeTask.id}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );
      setTasks((prev) =>
        prev.map((task) => (task.id === updated.id ? updated : task))
      );
    }

    setDialogOpen(false);
    setActiveTask(null);
    router.refresh();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    startTransition(() => {
      mutate(`/api/tasks/${deleteTarget.id}`, {
        method: "DELETE",
      })
        .then(() => {
          setTasks((prev) =>
            prev.filter((task) => task.id !== deleteTarget.id)
          );
          setDeleteOpen(false);
          setDeleteTarget(null);
          router.refresh();
        })
        .catch((err) => setError(err.message));
    });
  };

  const handleDialogSubmit = (payload: TaskPayload) =>
    new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await handleSave(payload);
          resolve();
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to save task";
          setError(message);
          reject(err);
        }
      });
    });

  const handleKanbanValueChange = useCallback(
    (nextColumns: Record<string, SerializedTask[]>) => {
      if (dragDisabled) return;
      setTasks((prev) => {
        const prevMap = new Map(prev.map((task) => [task.id, task]));
        const updated: SerializedTask[] = [];
        const visited = new Set<string>();

        TASK_STATUS_ORDER.forEach((status) => {
          const columnTasks = (nextColumns[status] ?? []) as SerializedTask[];
          columnTasks.forEach((task) => {
            const source = prevMap.get(task.id) ?? task;
            updated.push({
              ...source,
              status,
            });
            visited.add(task.id);
          });
        });

        prev.forEach((task) => {
          if (!visited.has(task.id)) {
            updated.push(task);
          }
        });

        return updated;
      });
    },
    [dragDisabled]
  );

  const handleKanbanMove = useCallback(
    (details: KanbanMoveEvent) => {
      if (dragDisabled) return;
      const { activeContainer, overContainer } = details;
      if (!overContainer || activeContainer === overContainer) {
        return;
      }

      if (!TASK_STATUS_ORDER.includes(overContainer as TaskStatus)) {
        return;
      }

      const taskId = String(details.event.active.id);
      handleStatusChange(taskId, overContainer as TaskStatus);
    },
    [dragDisabled, handleStatusChange]
  );

  return (
    <>
      <section className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Tasks</h1>
            <p className="text-sm text-muted-foreground">
              Plan, track, and deliver work tied to your applications.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New task
          </Button>
        </header>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, branch..."
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              className="pl-10"
            />
          </div>

          <Select
            value={filters.applicationId}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, applicationId: value }))
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All applications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All applications</SelectItem>
              {applications.map((app) => (
                <SelectItem key={app.id} value={app.id}>
                  {app.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                status: value as TaskStatus | "all",
              }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {statusFilterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {dragDisabled ? (
          <p className="text-xs text-muted-foreground">
            Drag & drop is disabled while filters are applied.
          </p>
        ) : null}

        <Kanban
          value={kanbanColumns}
          onValueChange={handleKanbanValueChange}
          getItemValue={(item) => item.id}
          onMove={handleKanbanMove}
        >
          <KanbanBoard className="gap-4 md:grid-cols-3">
            {TASK_STATUS_ORDER.map((status) => (
              <KanbanColumn key={status} value={status} disabled={dragDisabled}>
                <div
                  className={cn(
                    "flex h-full flex-col rounded-2xl border bg-card p-4 shadow-sm",
                    statusAccent[status]
                  )}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        {TASK_STATUS_LABELS[status]}
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        {kanbanColumns[status].length} task
                        {kanbanColumns[status].length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Badge className={statusBadgeVariant[status]}>
                      {TASK_STATUS_LABELS[status]}
                    </Badge>
                  </div>

                  <KanbanColumnContent
                    value={status}
                    className="mt-4 flex-1 space-y-3"
                  >
                    {kanbanColumns[status].length === 0 ? (
                      <Card className="border-dashed bg-muted/40">
                        <CardContent className="py-6 text-center text-sm text-muted-foreground">
                          No tasks in this column yet.
                        </CardContent>
                      </Card>
                    ) : (
                      kanbanColumns[status].map((task) => (
                        <KanbanItem
                          key={task.id}
                          value={task.id}
                          disabled={dragDisabled}
                        >
                          <TaskCard
                            task={task}
                            onEdit={() => openEditDialog(task)}
                            onDelete={() => {
                              setDeleteTarget(task);
                              setDeleteOpen(true);
                            }}
                            isBusy={isPending}
                          />
                        </KanbanItem>
                      ))
                    )}
                  </KanbanColumnContent>
                </div>
              </KanbanColumn>
            ))}
          </KanbanBoard>

          <KanbanOverlay>
            {({ value, variant }) => {
              if (variant === "item") {
                const task = taskLookup.get(String(value));
                if (!task) return null;
                return (
                  <TaskCard
                    task={task}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    isBusy
                    readOnly
                  />
                );
              }
              return null;
            }}
          </KanbanOverlay>
        </Kanban>
      </section>

      <TaskFormDialog
        mode={dialogMode}
        open={dialogOpen}
        onOpenChange={(openState) => {
          if (!openState) {
            resetDialog();
          }
          setDialogOpen(openState);
        }}
        applications={applications}
        meetingNotes={meetingNotes}
        initialTask={activeTask}
        onSubmit={handleDialogSubmit}
        isSubmitting={isPending}
      />

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. We will soft-delete{" "}
              <span className="font-medium">
                {deleteTarget?.title ?? "this task"}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type TaskCardProps = {
  task: SerializedTask;
  onEdit: () => void;
  onDelete: () => void;
  isBusy: boolean;
  readOnly?: boolean;
};

function TaskCard({
  task,
  onEdit,
  onDelete,
  isBusy,
  readOnly = false,
}: TaskCardProps) {
  const schedule = formatDateRange(task.startTime, task.endTime);
  const actionDisabled = isBusy || readOnly;

  return (
    <Card className="border border-border/60 shadow-none">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{task.title}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {task.application?.name ?? "Unassigned app"}
            </p>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onEdit}
                disabled={actionDisabled}
                aria-label="Edit task"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={onDelete}
                disabled={actionDisabled}
                aria-label="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm">
        {task.description ? (
          <p className="line-clamp-3 text-muted-foreground">
            {task.description}
          </p>
        ) : null}

        {task.branchName ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <GitBranch className="h-4 w-4" />
            <span>{task.branchName}</span>
          </div>
        ) : null}

        {schedule ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            <span>{schedule}</span>
          </div>
        ) : null}

        {task.meetingNote?.meeting ? (
          <p className="text-xs text-muted-foreground">
            Linked note:{" "}
            <span className="font-medium">
              {task.meetingNote.meeting.title}
            </span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
