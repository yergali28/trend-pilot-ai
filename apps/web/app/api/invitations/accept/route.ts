import { acceptInvitation } from "../../../../lib/invitations";
import { json } from "../../../../lib/supabase";

const status = { invalid_request: 400, user_not_created: 400, invitation_invalid: 410 } as const;

/** Использование приглашения: пользователь задаёт пароль, ссылка срабатывает один раз. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { token?: unknown; password?: unknown } | null;
  const r = await acceptInvitation(body?.token, body?.password);
  return r.ok ? json(201, { orgId: r.orgId }) : json(status[r.error], { error: r.error });
}
