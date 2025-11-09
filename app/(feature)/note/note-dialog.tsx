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
import { IMeeting } from "@/types/app-interface";
import { zodResolver } from "@hookform/resolvers/zod";
import { SerializedEditorState } from "lexical";
import { LoaderCircleIcon, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { fetchMeetings } from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

const formSchema = z.object({
  MeetingId: z.string().min(1, "Please select a meeting"),
  Content: z.string(),
});

export default function NoteDialog({
  userId,
  mode,
}: {
  userId: string;
  mode: string;
}) {
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
    enabled: !!userId && open, // hanya fetch saat modal terbuka
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      MeetingId: "",
      Content: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const formData = {
        MeetingId: values.MeetingId,
        Content: content,
      };

      console.log("Submitted:", JSON.stringify(formData));
      // TODO: Kirim ke API
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
          <Plus /> New Note
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-7xl max-h-screen"
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Create Note</DialogTitle>
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
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="Select Meeting" />
                        </SelectTrigger>
                        <SelectContent>
                          {meeting.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              <span className="flex items-center gap-2 text-xs">
                                {item.title}
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
