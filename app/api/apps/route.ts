import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/api-utils";

const createAppSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional().nullable(),
  techStack: z.string().trim().optional().nullable(),
  repositoryUrl: z.string().trim().optional().nullable(),
});

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

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const parsed = createAppSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const application = await prisma.application.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      techStack: data.techStack ?? null,
      repositoryUrl: data.repositoryUrl ?? null,
      userId: session.user.id,
    },
  });

  return NextResponse.json(application, { status: 201 });
}
