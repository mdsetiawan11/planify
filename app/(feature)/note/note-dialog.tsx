"use client";

import { Editor } from "@/components/blocks/editor-md/editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { IMeeting, IMeetingNote } from "@/types/app-interface";
import { zodResolver } from "@hookform/resolvers/zod";
import { SerializedEditorState } from "lexical";
import { Edit, LoaderCircleIcon, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { file, z } from "zod";
import { fetchMeetings } from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  MeetingId: z.string().min(1, "Please select a meeting"),
  Title: z.string(),
  Content: z.string(),
});

export default function NoteDialog({
  userId,
  mode,
  note,
}: {
  userId: string;
  mode: string;
  note?: IMeetingNote;
}) {
  console.log(note);
  const [editorState, setEditorState] = useState<SerializedEditorState>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState<string>("");
  const [open, setOpen] = useState(false);

  // ✅ React Query untuk meetings
  const {
    data: meeting = [],
    isLoading: loadMeeting,
    isError,
    refetch,
  } = useQuery<IMeeting[]>({
    queryKey: ["meetings", userId],
    queryFn: fetchMeetings,
    enabled: !!userId && open,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      MeetingId: mode === "create" ? "" : note?.meetingId || "",
      Title: mode === "create" ? "" : note?.title || "",
      Content: mode === "create" ? "" : note?.content || "",
    },
  });

  // ✅ Initialize editor state when in edit mode
  useEffect(() => {
    if (mode === "edit" && note && open) {
      form.reset({
        MeetingId: note.meetingId || "",
        Title: note.title || "",
        Content: note.content || "",
      });

      setContent(note.content || "");

      // If note.content is a serialized editor state, parse it
      // Otherwise, you might need to convert HTML to editor state
      try {
        if (note.content) {
          // If your content is stored as serialized editor state JSON
          const parsed = JSON.parse(note.content);
          setEditorState(parsed);
        }
      } catch (e) {
        // If it's HTML or plain text, set it directly
        setContent(note.content || "");
      }
    }
  }, [mode, note, open, form]);

  const queryClient = useQueryClient();

  const createMeetingNote = async (data: {
    MeetingId: string;
    Title: string;
    Content: string;
  }) => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Failed to create meeting note");
    }

    return res.json();
  };

  const mutation = useMutation({
    mutationFn: createMeetingNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetingNotes"] });
      setOpen(false);
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const formData = {
        MeetingId: values.MeetingId,
        Title: values.Title,
        Content: content,
      };
      await mutation.mutateAsync(formData);
    } catch (err) {
      console.error("Error during create:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    form.reset();
    setEditorState(undefined);
    setContent("");
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isSubmitting) {
          setOpen(isOpen);
          if (!isOpen) handleModalClose();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default">
          {mode === "create" ? (
            <>
              <Plus /> New Note
            </>
          ) : (
            <>
              <Edit /> Edit
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-7xl max-h-screen"
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Note" : "Edit Note"}
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* ✅ Meeting Selection */}
            <FormField
              control={form.control}
              name="MeetingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting</FormLabel>
                  <FormControl>
                    {loadMeeting ? (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <LoaderCircleIcon className="animate-spin mr-2" />{" "}
                        Loading meetings...
                      </div>
                    ) : isError ? (
                      <div className="text-red-500 text-sm">
                        Failed to load meetings.{" "}
                        <Button
                          type="button"
                          variant="link"
                          className="p-0"
                          onClick={() => refetch()}
                        >
                          Retry
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-[500px]">
                          <SelectValue placeholder="Select Meeting" />
                        </SelectTrigger>
                        <SelectContent>
                          {meeting.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              <span className="flex items-center gap-2 text-xs">
                                {item.title} ({item.application?.name})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="Content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ✅ Note Editor */}
            <FormField
              control={form.control}
              name="Content"
              render={() => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Editor
                      editorSerializedState={editorState}
                      onSerializedChange={(value) => setEditorState(value)}
                      AiEnabled={false}
                      onHtmlChange={(value) => setContent(value)}
                      initialContent={mode == "edit" ? note?.content : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  size="sm"
                >
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={isSubmitting} size="sm">
                {isSubmitting && (
                  <LoaderCircleIcon className="animate-spin mr-2" />
                )}
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
