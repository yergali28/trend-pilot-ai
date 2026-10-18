"use client";

import { Button, SelectField, StatusTag, TextField } from "@tp/ui";
import { useActionState } from "react";
import { translator, type Locale, type MessageKey } from "../../../../lib/i18n";
import { addReference, type ReferenceState } from "../actions";
import type { RefField } from "./config";

const inputType = { text: "text", number: "number", rate: "number", date: "date", datetime: "datetime-local", url: "url" } as const;

export function ReferenceForm({ locale, table, fields }: { locale: Locale; table: string; fields: RefField[] }) {
  const t = translator(locale);
  const [state, action, pending] = useActionState<ReferenceState, FormData>(addReference, {});
  const label = (f: RefField) => t(`ref.field.${f.name}` as MessageKey) + (f.required ? "" : ` (${t("ref.optional")})`);
  return (
    <form action={action} key={table} className="flex flex-col gap-4">
      <input type="hidden" name="table" value={table} />
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) =>
          f.type === "select" ? (
            <SelectField key={f.name} label={label(f)} name={f.name} options={(f.options ?? []).map((o) => ({ value: o, label: t(`ref.opt.${o}` as MessageKey) }))} />
          ) : (
            <TextField key={f.name} label={label(f)} name={f.name} type={inputType[f.type]} step="any" required={f.required} {...(f.type === "rate" ? { hint: t("ref.rateHint"), suffix: "%" } : {})} />
          ),
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" loading={pending} loadingLabel={t("admin.saving")}>
          {t("ref.add")}
        </Button>
        {state.ok ? <StatusTag tone="info">{t("ref.added")}</StatusTag> : null}
        {state.error ? <StatusTag tone="risk">{t(`ref.error.${state.error}` as MessageKey)}</StatusTag> : null}
      </div>
    </form>
  );
}
