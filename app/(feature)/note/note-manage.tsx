"use client";

import { IMeetingNote } from "@/types/app-interface";
import {
  Calendar,
  FileText,
  Folder,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import NoteDialog from "./note-dialog";
import NoteDetail from "./note-detail";

export default function NoteManage({
  initialData,
  userId,
}: {
  initialData?: IMeetingNote[];
  userId: string;
}) {
  const [expandedMeetings, setExpandedMeetings] = useState<Set<string>>(
    new Set()
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleMeeting = (meetingId: string) => {
    setExpandedMeetings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(meetingId)) {
        newSet.delete(meetingId);
      } else {
        newSet.add(meetingId);
      }
      return newSet;
    });
  };

  // Group notes by meeting
  const groupedNotes =
    initialData?.reduce((acc, note) => {
      const meetingId = note.meetingId;
      if (!acc[meetingId]) {
        acc[meetingId] = [];
      }
      acc[meetingId].push(note);
      return acc;
    }, {} as Record<string, IMeetingNote[]>) || {};

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Your Meeting Notes</h2>
          <p className="text-sm text-muted-foreground">
            Add, update, or remove your notes.
          </p>
        </div>
        <NoteDialog userId={userId} mode="create" />
      </header>

      <div className="space-y-4">
        {Object.keys(groupedNotes).length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No meeting notes yet. Create your first note to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedNotes).map(([meetingId, notes]) => {
            const meeting = notes[0]?.meeting;
            const isExpanded = expandedMeetings.has(meetingId);

            return (
              <Card key={meetingId} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer  transition-colors"
                  onClick={() => toggleMeeting(meetingId)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      {/* Application Info */}
                      {meeting?.application && (
                        <div className="flex items-center gap-2 text-sm">
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {meeting.application.name}
                          </span>
                          {meeting.application.techStack && (
                            <Badge variant="secondary" className="text-xs">
                              {meeting.application.techStack}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Meeting Info */}
                      {meeting && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium text-foreground">
                            {meeting.title}
                          </span>
                          {meeting.startAt && (
                            <>
                              <span>•</span>
                              <span>
                                {formatDate(meeting.startAt)} at{" "}
                                {formatTime(meeting.startAt)}
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {meeting?.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {meeting.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {notes.length} {notes.length === 1 ? "note" : "notes"}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4 pt-0">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="border-l-2 border-muted pl-4"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Created {formatDate(note.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <NoteDetail note={note} />
                            <NoteDialog
                              mode="edit"
                              userId={userId}
                              note={note}
                            />
                          </div>
                        </div>
                        <div
                          className="rounded-md bg-muted/50 p-4 prose prose-sm max-w-none dark:prose-invert prose-headings:mt-3 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: note.content }}
                        />
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </section>
  );
}
