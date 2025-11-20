import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { z } from "zod";

export const getSession = async () => {
  const result = await auth.api.getSession({
    headers: await headers(),
  });
  return result ?? null;
};

export const idSchema = z.string().trim().min(1, "ID is required");
