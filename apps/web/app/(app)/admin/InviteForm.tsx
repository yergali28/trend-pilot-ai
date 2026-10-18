"use client";

import { Button, SelectField, StatusTag, TextField } from "@tp/ui";
import { useActionState, useState } from "react";
import { translator, type Locale } from "../../../lib/i18n";
import { createInvite, type InviteState } from "./actions";

export function InviteForm({ locale, orgs }: { locale: Locale; orgs: { id: string; name: string }[] }) {
  const t = translator(locale);
  const [state, action, pending] = useActionState<InviteState, FormData>(createInvite, {});
  const [copied, setCopied] = useState<string | null>(null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField label={t("admin.invite.org")} name="orgId" options={orgs.map((o) => ({ value: o.id, label: o.name }))} />
        <TextField label={t("login.email")} name="email" type="email" required />
        <SelectField label={t("admin.invite.role")} name="role" defaultValue="member" options={(["owner", "member", "viewer"] as const).map((r) => ({ value: r, label: t(`role.${r}`) }))} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending} loadingLabel={t("admin.invite.creating")} disabled={orgs.length === 0}>
          {t("admin.invite.submit")}
        </Button>
        {state.error ? <StatusTag tone="risk">{t(`admin.invite.error.${state.error}`)}</StatusTag> : null}
      </div>
      {state.link ? (
        <div className="flex flex-col gap-2 border-y border-line py-4">
          <p className="text-sm font-medium text-ink">{t("admin.invite.link")}</p>
          <code data-testid="invite-link" className="select-all break-all text-sm text-ink">
            {state.link}
          </code>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(state.link!).then(() => setCopied(state.link!))}>
              {t("admin.invite.copy")}
            </Button>
            <span role="status">{copied === state.link ? <StatusTag tone="info">{t("admin.invite.copied")}</StatusTag> : null}</span>
          </div>
          <p className="text-sm text-muted">{t("admin.invite.once")}</p>
        </div>
      ) : null}
    </form>
  );
}
