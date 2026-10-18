import { StatusTag } from "@tp/ui";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { NavLinks } from "../../components/NavLinks";
import { PrefsSwitch } from "../../components/PrefsSwitch";
import { demoEnabled } from "../../lib/catalog";
import { prefs } from "../../lib/prefs";
import { isPlatformAdmin, requireUser } from "../../lib/session";
import { serverClient } from "../../lib/supabase";

async function signOut() {
  "use server";
  const db = await serverClient();
  await db.auth.signOut();
  redirect("/login");
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user } = await requireUser();
  const { t, locale, theme } = await prefs();
  const admin = await isPlatformAdmin(user.id);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-8">
          <Link href="/" className="text-md font-semibold text-ink outline-none focus-visible:outline-2 focus-visible:outline-focus">
            {t("app.title")}
          </Link>
          <NavLinks label={t("nav.main")} exactRoot={false} links={[{ href: "/", text: t("nav.wizard") }, ...(admin ? [{ href: "/admin", text: t("nav.admin") }] : [])]} />
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {demoEnabled() ? <StatusTag tone="info">{t("demo.badge")}</StatusTag> : null}
            <Suspense>
              <PrefsSwitch locale={locale} theme={theme} labels={{ language: t("prefs.language"), theme: t("prefs.theme"), light: t("prefs.light"), dark: t("prefs.dark") }} />
            </Suspense>
            <span className="hidden text-sm text-muted md:inline">{user.email}</span>
            <form action={signOut}>
              <button type="submit" className="rounded-control px-2 py-1 text-sm text-action-soft-ink outline-none hover:bg-action-soft pointer-coarse:py-2.5 focus-visible:outline-2 focus-visible:outline-focus">
                {t("nav.signOut")}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
