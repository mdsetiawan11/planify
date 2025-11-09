"use client";

import { IMeetingNote } from "@/types/app-interface";
import NoteDialog from "./note-dialog";

export default function NoteManage({
  initialData,
  userId,
}: {
  initialData?: IMeetingNote[];
  userId: string;
}) {
  return (
    <>
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
      </section>
    </>
  );
}
