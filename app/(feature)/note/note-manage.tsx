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
import { zodResolver } from "@hookform/resolvers/zod";
import { SerializedEditorState } from "lexical";
import { LoaderCircleIcon, Plus } from "lucide-react";
import { use, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  MeetingId: z.string(),
  Content: z.string(),
});

export default function NoteManage({
  initialContent,
}: {
  initialContent?: string;
}) {
  const [editorState, setEditorState] = useState<SerializedEditorState>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState<string>("");
  const [open, setOpen] = useState(false);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const formData = {
        MeetingId: values.MeetingId,
        Content: values.Content,
      };

      console.log(JSON.stringify(formData));
    } catch (err) {
      console.error("Error during create:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      MeetingId: "",
      Content: "",
    },
  });

  const handleModalClose = () => {
    form.reset();
    setEditorState(undefined);
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
            <FormField
              control={form.control}
              name="Content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Editor
                      editorSerializedState={editorState}
                      onSerializedChange={(value) => setEditorState(value)}
                      AiEnabled={false}
                      onHtmlChange={(value) => {
                        setContent(value);
                      }}
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
