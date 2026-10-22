import { DataTable, EmptyState, RankChart, StatusTag, formatNumber, formatPercent, type Column } from "@tp/ui";
import Link from "next/link";
import { Kpis, ListingGrid, marketKit } from "../../../components/market";
import { demoEnabled } from "../../../lib/catalog";
import { loadMarket, type Niche } from "../../../lib/market";
import { prefs } from "../../../lib/prefs";
import { requireUser } from "../../../lib/session";

export default async function MarketPage() {
  const { db } = await requireUser("/market");
  const { t, locale } = await prefs();
  const { items, niches } = await loadMarket(db);
  const k = marketKit(t, locale);

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">{t("market.title")}</h1>
        <EmptyState title={t("market.empty.title")} text={t("market.empty.text")} />
      </div>
    );
  }

  const latest = items.reduce((a, b) => (a.fetchedAt > b.fetchedAt ? a : b));
  const synthetic = items.some((i) => i.synthetic);
  const date = (d: string) => new Date(d).toLocaleDateString(locale === "en" ? "en-US" : "ru-RU");

  const columns: Column<Niche>[] = [
    {
      key: "name",
      header: t("market.col.niche"),
      wrap: true,
      render: (n) => (
        <Link href={`/market/${n.id}`} className="font-medium text-action-soft-ink underline-offset-2 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-focus">
          {n.name}
        </Link>
      ),
    },
    { key: "revenue", header: t("market.revenueMonth"), align: "end", sort: "descending", render: (n) => k.money(n.revenue) },
    { key: "sales", header: t("market.salesMonth"), align: "end", from: "sm", render: (n) => k.count(n.sales) },
    { key: "items", header: t("market.col.items"), align: "end", from: "md", render: (n) => n.items },
    { key: "price", header: t("market.col.medianPrice"), align: "end", from: "md", render: (n) => k.money(n.medianPrice) },
    { key: "rating", header: t("market.col.rating"), align: "end", from: "lg", render: (n) => (n.avgRating === null ? k.nd : formatNumber(n.avgRating, locale, 1)) },
    { key: "top3", header: t("market.col.top3"), align: "end", from: "lg", render: (n) => (n.top3Share === null ? k.nd : formatPercent(n.top3Share, locale)) },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("market.title")}</h1>
          <p className="mt-2 max-w-[70ch] text-base text-muted">
            {t("market.lead", { source: t(`market.source.${latest.sourceId === "mpstats" ? "mpstats" : "other"}`), from: date(latest.periodStart), to: date(latest.periodEnd), fetched: date(latest.fetchedAt) })}
          </p>
        </div>
        {synthetic && !demoEnabled() ? <StatusTag tone="info">{t("demo.badge")}</StatusTag> : null}
      </div>

      <Kpis
        items={[
          { label: t("market.kpi.niches"), value: niches.length },
          { label: t("market.kpi.items"), value: items.length },
          { label: t("market.revenueMonth"), value: k.money(niches.reduce((s, n) => s + n.revenue, 0)) },
          { label: t("market.salesMonth"), value: k.count(niches.reduce((s, n) => s + n.sales, 0)) },
        ]}
      />

      <section aria-labelledby="niches-h" className="flex flex-col gap-4">
        <h2 id="niches-h" className="text-xl font-semibold">
          {t("market.niches")}
        </h2>
        <RankChart
          title={t("market.rank.title")}
          valueLabel={t("market.revenueMonth")}
          currency="RUB"
          locale={locale}
          items={niches.slice(0, 15).map((n) => ({
            id: n.id,
            label: n.name,
            value: n.revenue,
            href: `/market/${n.id}`,
            details: [
              [t("market.salesMonth"), formatNumber(n.sales, locale, 0)],
              [t("market.col.items"), String(n.items)],
              [t("market.col.top3"), n.top3Share === null ? k.nd : formatPercent(n.top3Share, locale)],
            ],
          }))}
        />
        <DataTable columns={columns} rows={niches} rowKey={(n) => n.id} caption={t("market.niches")} />
        <p className="text-sm text-muted">{t("market.legend")}</p>
      </section>

      <section aria-labelledby="leaders-h" className="flex flex-col gap-4">
        <h2 id="leaders-h" className="text-xl font-semibold">
          {t("market.leaders")}
        </h2>
        <ListingGrid items={items.slice(0, 15)} t={t} locale={locale} />
      </section>
    </div>
  );
}
