"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IApplication } from "@/types/app-interface";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Plus } from "lucide-react";

const applicationFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or less")
    .optional(),
  techStack: z
    .string()
    .trim()
    .max(255, "Tech stack must be 255 characters or less")
    .optional(),
  repositoryUrl: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) =>
        !value || value.length === 0 || /^https?:\/\/\S+$/i.test(value),
      { message: "Enter a valid URL" }
    ),
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

const defaultValues: ApplicationFormValues = {
  name: "",
  description: "",
  techStack: "",
  repositoryUrl: "",
};

export default function AppManage({
  initialData,
  userId,
}: {
  initialData: IApplication[];
  userId: string;
}) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialData);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IApplication | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues,
  });

  const activeApplication = useMemo(
    () => applications.find((app) => app.id === activeId) ?? null,
    [activeId, applications]
  );

  const fieldIds = {
    name: "application-name",
    description: "application-description",
    techStack: "application-tech-stack",
    repositoryUrl: "application-repository-url",
  };

  const parseJson = (text: string) => {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const mutate = async (input: RequestInfo, init?: RequestInit) => {
    const res = await fetch(input, init);
    const text = await res.text();

    if (!res.ok) {
      const error = parseJson(text);
      throw new Error(error?.message ?? "Failed to update application");
    }

    return parseJson(text);
  };

  const resetForm = () => {
    setActiveId(null);
    setDialogMode("create");
    form.reset(defaultValues);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleDeleteOpenChange = (open: boolean) => {
    setDeleteOpen(open);
    if (!open) {
      setDeleteTarget(null);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (app: IApplication) => {
    setDialogMode("edit");
    setActiveId(app.id);
    form.reset({
      name: app.name,
      description: app.description ?? "",
      techStack: app.techStack ?? "",
      repositoryUrl: app.repositoryUrl ?? "",
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (app: IApplication) => {
    setDeleteTarget(app);
    setDeleteOpen(true);
  };

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      name: values.name,
      description: values.description ? values.description : null,
      techStack: values.techStack ? values.techStack : null,
      repositoryUrl: values.repositoryUrl ? values.repositoryUrl : null,
      userId,
    };

    startTransition(async () => {
      try {
        if (dialogMode === "edit" && activeId) {
          const updated = (await mutate(`/api/apps/${activeId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })) as IApplication | null;

          if (updated) {
            setApplications((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            );
          }
        } else {
          const created = (await mutate("/api/apps", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })) as IApplication | null;

          if (created) {
            setApplications((prev) => [created, ...prev]);
          }
        }

        handleDialogChange(false);
        router.refresh();
      } catch (error) {
        console.error(error);
      }
    });
  });

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await mutate(`/api/apps/${id}`, { method: "DELETE" });
        setApplications((prev) => prev.filter((item) => item.id !== id));
        if (activeId === id) {
          resetForm();
        }
        handleDeleteOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error(error);
      }
    });
  };

  const isEdit = dialogMode === "edit";
  const dialogTitle = isEdit ? "Edit Application" : "Add Application";
  const dialogDescription = isEdit
    ? `Update the details for ${activeApplication?.name ?? "this application"}.`
    : "Fill in the details to add a new application.";

  return (
    <>
      <section className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Your Applications</h2>
            <p className="text-sm text-muted-foreground">
              Add, update, or remove applications you’re tracking.
            </p>
          </div>
          <Button type="button" size="sm" onClick={openCreateDialog}>
            <Plus className="size-4" />
            New Application
          </Button>
        </header>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                No applications yet. Create your first one to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {applications.map((app) => {
              const techItems = (app.techStack ?? "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);

              return (
                <Card key={app.id}>
                  <CardHeader className="gap-1">
                    <CardTitle className="text-base">{app.name}</CardTitle>
                    {app.description && (
                      <CardDescription>{app.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {techItems.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium text-foreground">
                          Tech stack
                        </span>
                        {techItems.map((item, index) => (
                          <Badge
                            key={`${app.id}-tech-${index}`}
                            variant="secondary"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {app.repositoryUrl && (
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium text-foreground">
                          Repository
                        </span>
                        <Button
                          asChild
                          variant="link"
                          size="sm"
                          className="h-auto px-0"
                        >
                          <a
                            href={app.repositoryUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {app.repositoryUrl}
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(app)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(app)}
                    >
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogDescription>{dialogDescription}</DialogDescription>
              </DialogHeader>

              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel htmlFor={fieldIds.name}>Name *</FieldLabel>
                      <FieldContent>
                        <FormControl>
                          <Input
                            id={fieldIds.name}
                            placeholder="Application name"
                            {...field}
                          />
                        </FormControl>
                        <FieldError errors={[fieldState.error]} />
                      </FieldContent>
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel htmlFor={fieldIds.description}>
                        Description
                      </FieldLabel>
                      <FieldContent>
                        <FormControl>
                          <Textarea
                            id={fieldIds.description}
                            placeholder="Short description"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FieldDescription>
                          Optional – keep it under 1000 characters.
                        </FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </FieldContent>
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="techStack"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel htmlFor={fieldIds.techStack}>
                        Tech Stack
                      </FieldLabel>
                      <FieldContent>
                        <FormControl>
                          <Input
                            id={fieldIds.techStack}
                            placeholder="e.g. Next.js, Prisma, PostgreSQL"
                            {...field}
                          />
                        </FormControl>
                        <FieldDescription>
                          Separate entries with commas (optional).
                        </FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </FieldContent>
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="repositoryUrl"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel htmlFor={fieldIds.repositoryUrl}>
                        Repository URL
                      </FieldLabel>
                      <FieldContent>
                        <FormControl>
                          <Input
                            id={fieldIds.repositoryUrl}
                            type="url"
                            placeholder="https://github.com/..."
                            {...field}
                          />
                        </FormControl>
                        <FieldDescription>
                          Optional – provide a public repository link.
                        </FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </FieldContent>
                    </Field>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isEdit ? "Update Application" : "Create Application"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={handleDeleteOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently remove ${deleteTarget.name} and its related records.`
                : "This will permanently remove the selected application."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              disabled={isPending || !deleteTarget}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
