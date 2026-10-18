import { NavLinks } from "../../../components/NavLinks";
import type { ReactNode } from "react";
import { prefs } from "../../../lib/prefs";
import { requireAdmin } from "../../../lib/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const { t } = await prefs();
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">{t("admin.title")}</h1>
        <NavLinks
          label={t("admin.title")}
          className="-mx-1 border-b border-line pb-2"
          links={[
            { href: "/admin", text: t("admin.tab.orgs") },
            { href: "/admin/sources", text: t("admin.tab.sources") },
            { href: "/admin/references", text: t("admin.tab.references") },
          ]}
        />
      </div>
      {children}
    </div>
  );
}
