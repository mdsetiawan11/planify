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
import { ScrollArea } from "@/components/ui/scroll-area";
import { SerializedEditorState } from "lexical";
import { Plus } from "lucide-react";
import { use, useState } from "react";

export const initialValue = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Hello World 🚀",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
} as unknown as SerializedEditorState;

export default function NoteManage({
  initialContent,
}: {
  initialContent?: string;
}) {
  const [editorState, setEditorState] =
    useState<SerializedEditorState>(initialValue);

  const [content, setContent] = useState<string>("");

  const onSubmit = async () => {
    console.log(content);
  };

  return (
    <Dialog>
      <form action={onSubmit}>
        <DialogTrigger asChild>
          <Button variant="default">
            <Plus /> New Note
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-7xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Create Note</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>

          <Editor
            editorSerializedState={editorState}
            onSerializedChange={(value) => setEditorState(value)}
            AiEnabled={false}
            onHtmlChange={(value) => {
              setContent(value);
            }}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
