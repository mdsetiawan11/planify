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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ message: "Name is required" }, { status: 400 });
  }

  const param = await params;

  const updated = await prisma.application.update({
    where: {
      id: param.id,
      userId: session.user.id,
    },
    data: {
      name: body.name,
      description: body.description ?? null,
      techStack: body.techStack ?? null,
      repositoryUrl: body.repositoryUrl ?? null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const param = await params;
  await prisma.application.update({
    where: {
      id: param.id,
    },
    data: { deletedAt: new Date(), deletedBy: session.user.id },
  });

  return NextResponse.json({ message: "Success" }, { status: 200 });
}
