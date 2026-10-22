import { SourceStatus } from "@tp/ui";
import { loadSources } from "../../../../lib/catalog";
import { prefs } from "../../../../lib/prefs";
import { serverClient } from "../../../../lib/supabase";
import { SourceRow } from "./SourceRow";


export default async function AdminSourcesPage() {
  const { t, locale } = await prefs();
  const sources = await loadSources(await serverClient());
  const date = new Intl.DateTimeFormat(locale === "kk" ? "kk-KZ" : locale === "en" ? "en-GB" : "ru-RU", { dateStyle: "medium", timeStyle: "short" });

  return (
    <section aria-labelledby="sources-h" className="flex flex-col gap-4">
      <div>
        <h2 id="sources-h" className="text-xl font-semibold">
          {t("admin.sources.title")}
        </h2>
        <p className="mt-1 max-w-[65ch] text-base text-muted">{t("admin.sources.lead")}</p>
      </div>
      <ul className="flex flex-col divide-y divide-line rounded-panel border border-line bg-surface">
        {sources.map((s) => (
          <li key={s.id} className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-center">
            <div className="flex flex-col gap-1">
              <SourceStatus name={s.name} state={s.status} stateLabel={t(`sourceStatus.${s.status}`)} {...(s.statusReason ? { reason: s.statusReason } : {})} />
              <p className="pl-6 text-sm text-subtle">
                {t(`role.source.${s.role}`)} · {t(`mode.${s.mode as "replay"}`)} · {s.lastSuccessAt ? t("admin.sources.lastSuccess", { date: date.format(new Date(s.lastSuccessAt)) }) : t("admin.sources.never")}
              </p>
              {s.checkedAt ? <p className="pl-6 text-sm text-subtle">{t("admin.sources.checked", { date: new Intl.DateTimeFormat(locale === "kk" ? "kk-KZ" : locale === "en" ? "en-GB" : "ru-RU", { dateStyle: "medium" }).format(new Date(s.checkedAt)) })}</p> : null}
              {s.provides ? <p className="max-w-[65ch] pl-6 text-sm text-muted">{t("admin.sources.provides", { text: s.provides })}</p> : null}
              {s.limitations ? <p className="max-w-[65ch] pl-6 text-sm text-muted">{t("admin.sources.limitations", { text: s.limitations })}</p> : null}
            </div>
            <SourceRow locale={locale} id={s.id} status={s.status} reason={s.statusReason} />
          </li>
        ))}
      </ul>
    </section>
  );
}
