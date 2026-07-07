"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const signupSchema = z.object({
  username: z.string().min(3),
  name: z.string().min(2),
  password: z.string().min(6),
});

export async function login(prevState: any, formData: FormData) {
  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: "Datos inválidos" };
  }

  const { username, password } = result.data;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: "Credenciales incorrectas" };
  }

  // Create session
  const expires = new Date(Date.now() + 120 * 60 * 1000); // 2 hours
  const session = await encrypt({ user: { id: user.id, username: user.username, name: user.name, role: user.role }, expires });

  // Save in cookie
  (await cookies()).set("session", session, { 
    expires, 
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });

  redirect("/dashboard");
}

export async function signup(prevState: any, formData: FormData) {
  const result = signupSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { error: "Datos inválidos" };
  }

  const { username, name, password } = result.data;

  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (existing) {
    return { error: "El usuario ya existe" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      name,
      password: hashedPassword,
    },
  });

  // Create session
  const expires = new Date(Date.now() + 120 * 60 * 1000); // 2 hours
  const session = await encrypt({ user: { id: user.id, username: user.username, name: user.name, role: user.role }, expires });

  (await cookies()).set("session", session, { 
    expires, 
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });

  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", { expires: new Date(0) });
  cookieStore.set("selectedBusinessId", "", { expires: new Date(0) });
  redirect("/login");
}
