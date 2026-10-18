import { json, serviceClient } from "../../../../lib/supabase";

/** Использование приглашения: пользователь задаёт пароль, ссылка срабатывает один раз. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { token?: unknown; password?: unknown } | null;
  const { token, password } = body ?? {};
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token) || typeof password !== "string") {
    return json(400, { error: "invalid_request" });
  }

  const admin = serviceClient();
  const peek = await admin.rpc("peek_invitation", { p_token: token });
  const invitation = (peek.data as { email: string }[] | null)?.[0];
  if (peek.error || !invitation) return json(410, { error: "invitation_invalid" });

  // Пароль хранит Supabase Auth (хеш), сюда он не пишется и не логируется.
  const created = await admin.auth.admin.createUser({ email: invitation.email, password, email_confirm: true });
  if (created.error || !created.data.user) return json(400, { error: "user_not_created" });
  const userId = created.data.user.id;

  // Атомарно: параллельный второй запрос с тем же токеном здесь получит ошибку.
  const consumed = await admin.rpc("consume_invitation", { p_token: token, p_user: userId });
  if (consumed.error) {
    await admin.auth.admin.deleteUser(userId);
    return json(410, { error: "invitation_invalid" });
  }
  return json(201, { orgId: consumed.data as string });
}
