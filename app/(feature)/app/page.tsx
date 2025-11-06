import prisma from "@/lib/prisma";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AppManage from "./app-manage";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect(`/auth/signin?callbackUrl=/app`);
  }

  const applications = await prisma.application.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return <AppManage initialData={applications} userId={session.user.id} />;
}
