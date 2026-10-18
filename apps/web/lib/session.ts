import { redirect } from "next/navigation";
import { serverClient, serviceClient } from "./supabase";

export async function currentUser() {
  const db = await serverClient();
  const { data } = await db.auth.getUser();
  return data.user ? { db, user: data.user } : null;
}

/** Страница только для вошедших: настоящая проверка на сервере (proxy.ts лишь перенаправляет). */
export async function requireUser(next = "/") {
  const s = await currentUser();
  if (!s) redirect(`/login?next=${encodeURIComponent(next)}`);
  return s;
}

export async function isPlatformAdmin(userId: string) {
  const { data } = await serviceClient().from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}

export async function requireAdmin() {
  const s = await requireUser("/admin");
  if (!(await isPlatformAdmin(s.user.id))) redirect("/");
  return s;
}

/** Безопасный внутренний путь для возврата после входа (без открытых редиректов). */
export const safeNext = (v: unknown) => (typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/");
