import { Button, DataTable, EmptyState, TextField, type Column } from "@tp/ui";
import { prefs } from "../../../lib/prefs";
import { serviceClient } from "../../../lib/supabase";
import { createOrganization } from "./actions";
import { InviteForm } from "./InviteForm";

type Org = { id: string; name: string; created_at: string; memberships: { count: number }[] };

export default async function AdminOrgsPage() {
  const { t, locale } = await prefs();
  const { data } = await serviceClient().from("organizations").select("id, name, created_at, memberships(count)").order("created_at", { ascending: false });
  const orgs = (data ?? []) as Org[];
  const date = new Intl.DateTimeFormat(locale === "kk" ? "kk-KZ" : locale === "en" ? "en-GB" : "ru-RU", { dateStyle: "medium" });

  const columns: Column<Org>[] = [
    { key: "name", header: t("admin.orgs.name"), render: (o) => <span className="font-medium text-ink">{o.name}</span> },
    { key: "members", header: t("admin.orgs.members"), align: "end", render: (o) => o.memberships[0]?.count ?? 0 },
    { key: "created", header: t("admin.orgs.created"), align: "end", render: (o) => date.format(new Date(o.created_at)) },
  ];

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section aria-labelledby="orgs-h" className="flex flex-col gap-4">
        <h2 id="orgs-h" className="text-xl font-semibold">
          {t("admin.orgs.title")}
        </h2>
        {orgs.length > 0 ? <DataTable columns={columns} rows={orgs} rowKey={(o) => o.id} caption={t("admin.orgs.title")} /> : <EmptyState title={t("admin.orgs.empty.title")} text={t("admin.orgs.empty.text")} />}
      </section>
      <div className="flex flex-col gap-10">
        <section aria-labelledby="org-new-h" className="flex flex-col gap-4">
          <h2 id="org-new-h" className="text-md font-semibold">
            {t("admin.orgs.new")}
          </h2>
          <form action={createOrganization} className="flex flex-col gap-3">
            <TextField label={t("admin.orgs.name")} name="name" required />
            <div>
              <Button type="submit" variant="secondary">
                {t("admin.orgs.create")}
              </Button>
            </div>
          </form>
        </section>
        <section aria-labelledby="invite-h" className="flex flex-col gap-4">
          <div>
            <h2 id="invite-h" className="text-md font-semibold">
              {t("admin.invite.title")}
            </h2>
            <p className="mt-1 text-sm text-muted">{t("admin.invite.lead")}</p>
          </div>
          <InviteForm locale={locale} orgs={orgs.map((o) => ({ id: o.id, name: o.name }))} />
        </section>
      </div>
    </div>
  );
}
