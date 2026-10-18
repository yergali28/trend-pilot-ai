import { Button, EmptyState, TextField } from "@tp/ui";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MIN_PASSWORD, acceptInvitation, isToken, peekInvitation } from "../../../../lib/invitations";
import { prefs } from "../../../../lib/prefs";
import { serverClient } from "../../../../lib/supabase";

async function setPassword(form: FormData) {
  "use server";
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  if (password.length < MIN_PASSWORD) redirect(`/invite/${token}?error=short`);
  if (password !== String(form.get("confirm") ?? "")) redirect(`/invite/${token}?error=mismatch`);
  const r = await acceptInvitation(token, password);
  if (!r.ok) redirect(`/invite/${token}?error=${r.error}`);
  const db = await serverClient();
  await db.auth.signInWithPassword({ email: r.email, password });
  redirect("/");
}

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const { error } = await searchParams;
  const { t } = await prefs();
  const email = isToken(token) ? await peekInvitation(token) : null;

  if (!email) {
    return (
      <EmptyState
        title={t("invite.invalid.title")}
        text={t("invite.invalid.text")}
        action={
          <Link href="/login" className="text-base font-medium text-action-soft-ink underline">
            {t("invite.toLogin")}
          </Link>
        }
      />
    );
  }

  const errorText = error === "short" ? t("invite.error.short", { min: MIN_PASSWORD }) : error === "mismatch" ? t("invite.error.mismatch") : error ? t("invite.error.failed") : undefined;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-md font-semibold text-ink">{t("app.title")}</p>
        <h1 className="mt-4 text-xl font-semibold">{t("invite.title")}</h1>
        <p className="mt-1 text-base text-muted">{t("invite.lead", { email })}</p>
      </div>
      <form action={setPassword} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <TextField label={t("invite.password")} hint={t("invite.password.hint", { min: MIN_PASSWORD })} name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required />
        <TextField label={t("invite.confirm")} name="confirm" type="password" autoComplete="new-password" required {...(errorText ? { error: errorText } : {})} />
        <Button type="submit">{t("invite.submit")}</Button>
      </form>
    </div>
  );
}
