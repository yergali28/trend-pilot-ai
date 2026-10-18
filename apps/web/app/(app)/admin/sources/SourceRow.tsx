"use client";

import { Button, StatusTag } from "@tp/ui";
import { useActionState } from "react";
import { translator, type Locale } from "../../../../lib/i18n";
import { updateSource, type SourceState } from "../actions";

const STATUSES = ["active", "pending_registration", "blocked", "disabled"] as const;
const control = "h-9 rounded-control border border-line-strong bg-surface px-2 text-base text-ink outline-none pointer-coarse:h-11 focus-visible:outline-2 focus-visible:outline-focus";

export function SourceRow({ locale, id, status, reason }: { locale: Locale; id: string; status: string; reason: string | null }) {
  const t = translator(locale);
  const [state, action, pending] = useActionState<SourceState, FormData>(updateSource, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="flex flex-col gap-1 text-sm text-muted">
        {t("admin.sources.status")}
        <select name="status" defaultValue={status} className={control}>
          {STATUSES.map((st) => (
            <option key={st} value={st}>
              {t(`sourceStatus.${st}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm text-muted">
        {t("admin.sources.reason")}
        <input name="reason" defaultValue={reason ?? ""} aria-invalid={state.error === "reason" || undefined} className={`${control} ${state.error === "reason" ? "border-risk" : ""}`} />
      </label>
      <Button type="submit" variant="secondary" loading={pending} loadingLabel={t("admin.saving")}>
        {t("admin.save")}
      </Button>
      <span role="status" className="basis-full">
        {state.ok ? <StatusTag tone="info">{t("admin.saved")}</StatusTag> : null}
        {state.error ? <StatusTag tone="risk">{t(`admin.sources.error.${state.error}`)}</StatusTag> : null}
      </span>
    </form>
  );
}
