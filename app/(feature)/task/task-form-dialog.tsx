"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, FileText, GitBranch, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  ApplicationOption,
  MeetingNoteOption,
  SerializedTask,
  TaskPayload,
  TaskStatus,
} from "./task-types";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "./task-types";

const formSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(255, "Title must be 255 characters or less"),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be 2000 characters or less")
      .optional()
      .nullable(),
    applicationId: z.string().trim().min(1, "Application is required"),
    status: z.enum(TASK_STATUS_ORDER),
    branchName: z
      .string()
      .trim()
      .max(120, "Branch name must be 120 characters or less")
      .optional()
      .nullable(),
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    meetingNoteId: z.string().trim().optional().nullable(),
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

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  title: "",
  description: "",
  applicationId: "",
  status: "TODO",
  branchName: "",
  startTime: "",
  endTime: "",
  meetingNoteId: null,
};

type TaskFormDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applications: ApplicationOption[];
  meetingNotes: MeetingNoteOption[];
  initialTask: SerializedTask | null;
  onSubmit: (values: TaskPayload) => Promise<void>;
  isSubmitting?: boolean;
};

const toDateInputValue = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - tzOffset * 60000);
  return local.toISOString().slice(0, 16);
};

const toIsoString = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const NO_MEETING_NOTE_VALUE = "__NO_NOTE__";

export default function TaskFormDialog({
  mode,
  open,
  onOpenChange,
  applications,
  meetingNotes,
  initialTask,
  onSubmit,
  isSubmitting = false,
}: TaskFormDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      form.reset({
        title: initialTask?.title ?? "",
        description: initialTask?.description ?? "",
        applicationId: initialTask?.applicationId ?? "",
        status: (initialTask?.status ?? "TODO") as TaskStatus,
        branchName: initialTask?.branchName ?? "",
        startTime: toDateInputValue(initialTask?.startTime ?? null),
        endTime: toDateInputValue(initialTask?.endTime ?? null),
        meetingNoteId: initialTask?.meetingNoteId ?? null,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [open, initialTask, form]);

  const selectedApplicationId = useWatch({
    control: form.control,
    name: "applicationId",
  });
  const availableNotes = useMemo(
    () =>
      meetingNotes.filter(
        (note) =>
          !!selectedApplicationId &&
          note.applicationId === selectedApplicationId
      ),
    [meetingNotes, selectedApplicationId]
  );

  useEffect(() => {
    if (!selectedApplicationId) {
      form.setValue("meetingNoteId", null);
      return;
    }

    const currentNoteId = form.getValues("meetingNoteId");
    if (
      currentNoteId &&
      !meetingNotes.some(
        (note) =>
          note.id === currentNoteId &&
          note.applicationId === selectedApplicationId
      )
    ) {
      form.setValue("meetingNoteId", null);
    }
  }, [selectedApplicationId, meetingNotes, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    const payload: TaskPayload = {
      title: values.title,
      description: values.description?.length ? values.description : null,
      applicationId: values.applicationId,
      status: values.status,
      branchName: values.branchName?.length ? values.branchName : null,
      startTime: toIsoString(values.startTime),
      endTime: toIsoString(values.endTime),
      meetingNoteId: values.meetingNoteId ?? null,
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save task";
      setSubmitError(message);
      throw error;
    }
  });

  const disableSubmit =
    isSubmitting || form.formState.isSubmitting || !applications.length;

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Task" : "Edit Task"}
          </DialogTitle>
          <DialogDescription>
            Capture the task details, schedule, and linked meeting note.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel htmlFor="task-title">Title</FieldLabel>
                      <FieldContent>
                        <FormControl>
                          <Input
                            id="task-title"
                            placeholder="Implement onboarding flow"
                            {...field}
                          />
                        </FormControl>
                        <FieldDescription>
                          Keep it short and action oriented.
                        </FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </FieldContent>
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="applicationId"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>Application</FieldLabel>
                      <FieldContent>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={!applications.length}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select application" />
                            </SelectTrigger>
                            <SelectContent>
                              {applications.map((app) => (
                                <SelectItem key={app.id} value={app.id}>
                                  {app.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FieldDescription>
                          Tasks stay within a single application.
                        </FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </FieldContent>
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>Status</FieldLabel>
                      <FieldContent>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {TASK_STATUS_ORDER.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {TASK_STATUS_LABELS[status]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FieldError errors={[fieldState.error]} />
                      </FieldContent>
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="branchName"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel htmlFor="branch-name">
                        Branch name (optional)
                      </FieldLabel>
                      <FieldContent>
                        <FormControl>
                          <Input
                            id="branch-name"
                            placeholder="feature/task-tracker"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FieldDescription className="flex items-center gap-2">
                          <GitBranch className="h-3.5 w-3.5" />
                          Track the associated feature branch.
                        </FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </FieldContent>
                    </Field>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <FormItem>
                  <Field>
                    <FieldLabel htmlFor="task-description">
                      Description
                    </FieldLabel>
                    <FieldContent>
                      <FormControl>
                        <Textarea
                          id="task-description"
                          placeholder="Outline the scope, acceptance criteria, or any open questions."
                          rows={4}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FieldError errors={[fieldState.error]} />
                    </FieldContent>
                  </Field>
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel htmlFor="task-start">
                        Planned start
                      </FieldLabel>
                      <FieldContent>
                        <FormControl>
                          <Input
                            id="task-start"
                            type="datetime-local"
                            value={field.value ?? ""}
                            onChange={(event) =>
                              field.onChange(event.target.value)
                            }
                          />
                        </FormControl>
                        <FieldDescription className="flex items-center gap-2">
                          <CalendarClock className="h-3.5 w-3.5" />
                          Optional schedule indicator.
                        </FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </FieldContent>
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel htmlFor="task-end">Target finish</FieldLabel>
                      <FieldContent>
                        <FormControl>
                          <Input
                            id="task-end"
                            type="datetime-local"
                            value={field.value ?? ""}
                            onChange={(event) =>
                              field.onChange(event.target.value)
                            }
                          />
                        </FormControl>
                        <FieldError errors={[fieldState.error]} />
                      </FieldContent>
                    </Field>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="meetingNoteId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <Field>
                    <FieldLabel>Meeting note</FieldLabel>
                    <FieldContent>
                      <FormControl>
                        <Select
                          value={field.value ?? NO_MEETING_NOTE_VALUE}
                          onValueChange={(value) =>
                            field.onChange(
                              value === NO_MEETING_NOTE_VALUE ? null : value
                            )
                          }
                          disabled={!selectedApplicationId}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                selectedApplicationId
                                  ? "Link a note (optional)"
                                  : "Select an application first"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NO_MEETING_NOTE_VALUE}>
                              No note
                            </SelectItem>
                            {availableNotes.map((note) => (
                              <SelectItem key={note.id} value={note.id}>
                                {note.meetingTitle} · {note.applicationName}
                              </SelectItem>
                            ))}
                            {!availableNotes.length && selectedApplicationId ? (
                              <SelectItem value="__no-notes__" disabled>
                                No meeting notes for this application yet.
                              </SelectItem>
                            ) : null}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FieldDescription className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" />
                        Optional link back to the original discussion.
                      </FieldDescription>
                      <FieldError errors={[fieldState.error]} />
                    </FieldContent>
                  </Field>
                </FormItem>
              )}
            />

            {submitError ? (
              <p className="text-sm font-medium text-destructive">
                {submitError}
              </p>
            ) : null}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={disableSubmit}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={disableSubmit}>
                {(isSubmitting || form.formState.isSubmitting) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "create" ? "Create task" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
