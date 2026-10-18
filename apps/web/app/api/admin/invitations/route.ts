import { json, userClient } from "../../../../lib/supabase";

// ponytail: срок жизни ссылки 72 часа выбран без решения владельца (3.7 «ограниченный срок»); вынести в настройки.
const INVITATION_TTL = "72 hours";
const ROLES = new Set(["owner", "member", "viewer"]);

/** Создание приглашения администратором платформы. Права проверяет функция базы create_invitation. */
export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return json(401, { error: "unauthorized" });

  const body = (await req.json().catch(() => null)) as { orgId?: unknown; email?: unknown; role?: unknown } | null;
  const { orgId, email, role } = body ?? {};
  if (typeof orgId !== "string" || typeof email !== "string" || !email.includes("@") || typeof role !== "string" || !ROLES.has(role)) {
    return json(400, { error: "invalid_request" });
  }

  const { data, error } = await userClient(token).rpc("create_invitation", {
    p_org: orgId,
    p_email: email,
    p_role: role,
    p_ttl: INVITATION_TTL,
  });
  if (error) return json(error.code === "42501" ? 403 : 400, { error: error.code === "42501" ? "forbidden" : "invalid_request" });

  // Токен показывается один раз: в базе хранится только его хеш.
  return json(201, { invitePath: `/invite/${data as string}` });
}
