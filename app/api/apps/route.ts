import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

const getSession = async () => {
  const result = await auth.api.getSession({
    headers: await headers(),
  });
  return result ?? null;
};

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const applications = await prisma.application.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ message: "Name is required" }, { status: 400 });
  }

  const application = await prisma.application.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      techStack: body.techStack ?? null,
      repositoryUrl: body.repositoryUrl ?? null,
      userId: session.user.id,
    },
  });

  return NextResponse.json(application, { status: 201 });
}
