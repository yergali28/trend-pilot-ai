import { Button, TextField } from "@tp/ui";
import { redirect } from "next/navigation";
import { prefs } from "../../../lib/prefs";
import { safeNext } from "../../../lib/session";
import { serverClient } from "../../../lib/supabase";

async function signIn(form: FormData) {
  "use server";
  const next = safeNext(form.get("next"));
  const db = await serverClient();
  const { error } = await db.auth.signInWithPassword({ email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") });
  if (error) redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const { t } = await prefs();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-md font-semibold text-ink">{t("app.title")}</p>
        <h1 className="mt-4 text-xl font-semibold">{t("login.title")}</h1>
        <p className="mt-1 text-base text-muted">{t("login.lead")}</p>
      </div>
      <form action={signIn} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={safeNext(sp.next)} />
        <TextField label={t("login.email")} name="email" type="email" autoComplete="email" required />
        <TextField label={t("login.password")} name="password" type="password" autoComplete="current-password" required {...(sp.error ? { error: t("login.error") } : {})} />
        <Button type="submit">{t("login.submit")}</Button>
      </form>
    </div>
  );
}
