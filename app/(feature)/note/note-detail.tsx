import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IMeetingNote } from "@/types/app-interface";
import { formatDate } from "date-fns";
import { Eye, Folder, Badge, Calendar } from "lucide-react";

export default function NoteDetail({ note }: { note: IMeetingNote }) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          Detail
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Note Details</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        {/* Note Content */}
        <div
          className="prose prose-sm max-w-none dark:prose-invert prose-headings:mt-4 prose-headings:mb-3 prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-li:my-1"
          dangerouslySetInnerHTML={{
            __html: note.content,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
