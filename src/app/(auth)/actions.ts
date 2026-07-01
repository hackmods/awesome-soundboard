"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { createUser, getUserByEmail } from "@/lib/db/queries";
import { newId } from "@/lib/storage/files";
import { migrate } from "@/lib/db/migrate";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1).max(50),
});

export async function registerAction(formData: FormData): Promise<void> {
  await migrate();

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    throw new Error("Invalid form data.");
  }

  const existing = await getUserByEmail(parsed.data.email);
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await createUser({
    id: newId(),
    email: parsed.data.email,
    passwordHash,
    displayName: parsed.data.displayName,
  });

  redirect("/login?registered=1");
}
