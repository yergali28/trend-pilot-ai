import { DataTable, EmptyState, type Column } from "@tp/ui";
import Link from "next/link";
import type { MessageKey } from "../../../../lib/i18n";
import { prefs } from "../../../../lib/prefs";
import { serviceClient } from "../../../../lib/supabase";
import { REFERENCES, REFERENCE_TABLES, type ReferenceTable } from "./config";
import { ReferenceForm } from "./ReferenceForm";

type Cell = string | number | null | Record<string, unknown>;
type Row = Record<string, Cell> & { __key: string };

export default async function AdminReferencesPage({ searchParams }: { searchParams: Promise<{ table?: string }> }) {
  const sp = await searchParams;
  const table: ReferenceTable = (REFERENCE_TABLES as string[]).includes(sp.table ?? "") ? (sp.table as ReferenceTable) : "fee_rules";
  const { t, locale } = await prefs();
  const config = REFERENCES[table];
  const { data } = await serviceClient().from(table).select("*").order("fetched_at", { ascending: false }).limit(50);
  const rows = (data ?? []).map((r, i) => ({ ...r, __key: String(r.id ?? i) })) as Row[];
  const counts = await Promise.all(REFERENCE_TABLES.map(async (tb) => [tb, (await serviceClient().from(tb).select("*", { count: "exact", head: true })).count ?? 0] as const));

  const fieldOf = (c: string) => config.fields.find((f) => f.name === c);
  const pct = new Intl.NumberFormat(locale === "kk" ? "kk-KZ" : locale === "en" ? "en-US" : "ru-RU", { style: "percent", maximumFractionDigits: 2 });
  const numFmt = new Intl.NumberFormat(locale === "kk" ? "kk-KZ" : locale === "en" ? "en-US" : "ru-RU", { maximumFractionDigits: 4 });
  const dateFmt = new Intl.DateTimeFormat(locale === "kk" ? "kk-KZ" : locale === "en" ? "en-GB" : "ru-RU", { dateStyle: "medium" });
  const show = (c: string, v: Cell) => {
    if (v === null) return "";
    // Условие тарифа: склад и единица (первый / дополнительный литр).
    if (typeof v === "object") return [v.warehouse, v.unit ? t(`ref.unit.${String(v.unit)}` as MessageKey) : null].filter(Boolean).join(" · ");
    const f = fieldOf(c);
    if (f?.type === "rate") return pct.format(Number(v));
    if (f?.type === "number") return numFmt.format(Number(v));
    if (f?.type === "select") return t(`ref.opt.${v}` as MessageKey);
    return String(v);
  };
  // Происхождение видно в таблице: ссылка на источник и дата получения (раздел 5.1).
  // Сразу после площадки, чтобы не уходить за горизонтальную прокрутку в широких таблицах.
  const [first, ...rest] = config.columns.map((c) => ({ key: c, header: t(`ref.field.${c}` as MessageKey), ...(["rate", "number"].includes(fieldOf(c)?.type ?? "") ? { align: "end" as const } : {}), render: (r: Row) => show(c, r[c] ?? null) }));
  const columns: Column<Row>[] = [
    first!,
    {
      key: "source_url",
      header: t("ref.field.source_url"),
      render: (r: Row) => {
        const url = r.source_url ? String(r.source_url) : "";
        return url ? (
          <a href={url} target="_blank" rel="noreferrer" className="text-action-soft-ink underline underline-offset-2">
            {URL.canParse(url) ? new URL(url).hostname : url}
          </a>
        ) : null;
      },
    },
    { key: "fetched_at", header: t("ref.field.fetched_at"), render: (r: Row) => (r.fetched_at ? dateFmt.format(new Date(String(r.fetched_at))) : "") },
    ...rest,
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold">{t("admin.references.title")}</h2>
        <p className="mt-1 max-w-[65ch] text-base text-muted">{t("admin.references.lead")}</p>
      </div>
      <nav aria-label={t("admin.references.title")} className="-mx-1 flex flex-wrap gap-1">
        {counts.map(([tb, n]) => (
          <Link
            key={tb}
            href={`/admin/references?table=${tb}`}
            aria-current={tb === table ? "page" : undefined}
            className={`rounded-control px-3 py-1.5 text-base outline-none pointer-coarse:py-3 focus-visible:outline-2 focus-visible:outline-focus ${tb === table ? "bg-action-soft font-medium text-action-soft-ink" : "text-muted hover:bg-sunken hover:text-ink"}`}
          >
            {t(`ref.table.${tb}`)} <span className="tabular-nums text-subtle">{numFmt.format(n)}</span>
          </Link>
        ))}
      </nav>
      <div className="flex flex-col gap-12">
        <section aria-labelledby="ref-list-h" className="flex flex-col gap-4">
          <h3 id="ref-list-h" className="text-md font-semibold">
            {t(`ref.table.${table}`)}
          </h3>
          {rows.length > 0 ? <DataTable columns={columns} rows={rows} rowKey={(r) => r.__key} caption={t(`ref.table.${table}`)} /> : <EmptyState title={t("admin.references.empty.title")} text={t("admin.references.empty.text")} />}
        </section>
        <section aria-labelledby="ref-add-h" className="flex max-w-3xl flex-col gap-4">
          <h3 id="ref-add-h" className="text-md font-semibold">
            {t("ref.addTitle")}
          </h3>
          <ReferenceForm locale={locale} table={table} fields={config.fields} />
        </section>
      </div>
    </div>
  );
}
