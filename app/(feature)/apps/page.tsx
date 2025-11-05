import prisma from "@/lib/prisma";

import AppManage from "./app-manage";
import { authClient } from "@/lib/auth-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return (
      <p className="text-sm text-muted-foreground">
        You must be signed in to manage applications.
      </p>
    );
  }

  const applications = await prisma.application.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return <AppManage initialData={applications} userId={session.user.id} />;
}
