import prisma from "@/lib/prisma";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import NoteManage from "./note-manage";
import { IMeetingNote } from "@/types/app-interface";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect(`/auth/signin?callbackUrl=/app`);
  }

  const notes = (await prisma.meetingNote.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      meeting: {
        include: {
          application: {},
        },
      },
    },
  })) as IMeetingNote[];

  return <NoteManage initialData={notes} userId={session.user.id} />;
}
