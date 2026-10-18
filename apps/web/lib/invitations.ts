import { serviceClient } from "./supabase";

export type AcceptResult = { ok: true; orgId: string; email: string } | { ok: false; error: "invalid_request" | "invitation_invalid" | "user_not_created" };

/** Минимальная длина пароля при установке по приглашению. */
export const MIN_PASSWORD = 8;

export const isToken = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{64}$/.test(v);

/** Email действующего приглашения (без использования) или null. */
export async function peekInvitation(token: string) {
  const { data, error } = await serviceClient().rpc("peek_invitation", { p_token: token });
  const row = (data as { email: string }[] | null)?.[0];
  return error || !row ? null : row.email;
}

/** Использование приглашения: создаёт пользователя с паролем, ссылка срабатывает один раз. */
export async function acceptInvitation(token: unknown, password: unknown): Promise<AcceptResult> {
  if (!isToken(token) || typeof password !== "string") return { ok: false, error: "invalid_request" };
  const email = await peekInvitation(token);
  if (!email) return { ok: false, error: "invitation_invalid" };

  const admin = serviceClient();
  // Пароль хранит Supabase Auth (хеш), сюда он не пишется и не логируется.
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) return { ok: false, error: "user_not_created" };
  const userId = created.data.user.id;

  // Атомарно: параллельный второй запрос с тем же токеном здесь получит ошибку.
  const consumed = await admin.rpc("consume_invitation", { p_token: token, p_user: userId });
  if (consumed.error) {
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: "invitation_invalid" };
  }
  return { ok: true, orgId: consumed.data as string, email };
}
