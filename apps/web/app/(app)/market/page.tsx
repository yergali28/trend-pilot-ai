import { DataTable, EmptyState, RankChart, StatusTag, formatNumber, formatPercent, type Column } from "@tp/ui";
import Link from "next/link";
import { Kpis, ListingGrid, marketKit } from "../../../components/market";
import { demoEnabled } from "../../../lib/catalog";
import { MARKETS, MARKET_NAMES, asMarket, loadMarket, sourceLabel, type Niche } from "../../../lib/market";
import { prefs } from "../../../lib/prefs";
import { requireUser } from "../../../lib/session";

export default async function MarketPage({ searchParams }: { searchParams: Promise<{ all?: string; mp?: string }> }) {
  const sp = await searchParams;
  const showAll = sp.all === "1";
  const mp = asMarket(sp.mp);
  const market = MARKET_NAMES[mp];
  const base = mp === "wildberries" ? "/market" : `/market?mp=${mp}`;
  const { db } = await requireUser(base);
  const { t, locale } = await prefs();
  const { items, niches, measure } = await loadMarket(db, mp);
  const k = marketKit(t, locale);
  const byReviews = measure === "reviews";

  const tabs = (
    <nav aria-label={t("market.tabs")} className="-mx-1 flex flex-wrap gap-1">
      {MARKETS.map((m) => (
        <Link
          key={m}
          href={m === "wildberries" ? "/market" : `/market?mp=${m}`}
          aria-current={m === mp ? "page" : undefined}
          className={`rounded-control px-3 py-1.5 text-base outline-none pointer-coarse:py-3 focus-visible:outline-2 focus-visible:outline-focus ${m === mp ? "bg-action-soft font-medium text-action-soft-ink" : "text-muted hover:bg-sunken hover:text-ink"}`}
        >
          {MARKET_NAMES[m]}
        </Link>
      ))}
    </nav>
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">{t("market.title", { market })}</h1>
        {tabs}
        <EmptyState title={t("market.empty.title", { market })} text={t("market.empty.text")} />
      </div>
    );
  }

  const latest = items.reduce((a, b) => (a.fetchedAt > b.fetchedAt ? a : b));
  const synthetic = items.some((i) => i.synthetic);
  const date = (d: string) => new Date(d).toLocaleDateString(locale === "en" ? "en-US" : "ru-RU");
  const currency = latest.currency ?? "RUB";
  const money = (v: number | null) => k.money(v, currency);
  const source = sourceLabel(latest.sourceId, t);

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
    ...(byReviews
      ? [{ key: "reviews", header: t("market.reviewsLabel"), align: "end", sort: "descending", render: (n) => k.count(n.reviews) } satisfies Column<Niche>]
      : [
          { key: "revenue", header: t("market.revenueMonth"), align: "end", sort: "descending", render: (n) => money(n.revenue) } satisfies Column<Niche>,
          { key: "sales", header: t("market.salesMonth"), align: "end", from: "sm", render: (n) => k.count(n.sales) } satisfies Column<Niche>,
        ]),
    { key: "items", header: t("market.col.items"), align: "end", from: "md", render: (n) => n.items },
    { key: "price", header: t("market.col.medianPrice"), align: "end", from: "md", render: (n) => money(n.medianPrice) },
    { key: "rating", header: t("market.col.rating"), align: "end", from: "lg", render: (n) => (n.avgRating === null ? k.nd : formatNumber(n.avgRating, locale, 1)) },
    { key: "top3", header: t("market.col.top3"), align: "end", from: "lg", render: (n) => (n.top3Share === null ? k.nd : formatPercent(n.top3Share, locale)) },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("market.title", { market })}</h1>
          <p className="mt-2 max-w-[70ch] text-base text-muted">
            {byReviews
              ? t("market.leadSnapshot", { market, source, fetched: date(latest.fetchedAt) })
              : t("market.lead", { market, source, from: date(latest.periodStart), to: date(latest.periodEnd), fetched: date(latest.fetchedAt) })}
          </p>
        </div>
        {synthetic ? (!demoEnabled() ? <StatusTag tone="info">{t("demo.badge")}</StatusTag> : null) : <span className="text-sm font-medium text-[var(--tp-ok)]">{t("market.real", { source })}</span>}
      </div>

      {tabs}

      <Kpis
        items={[
          { label: t("market.kpi.niches"), value: niches.length },
          { label: t("market.kpi.items"), value: items.length },
          ...(byReviews
            ? [
                { label: t("market.reviewsLabel"), value: k.count(niches.reduce((s, n) => s + n.reviews, 0)) },
                { label: t("market.salesMonth"), value: k.count(null) },
              ]
            : [
                { label: t("market.revenueMonth"), value: money(niches.reduce((s, n) => s + n.revenue, 0)) },
                { label: t("market.salesMonth"), value: k.count(niches.reduce((s, n) => s + n.sales, 0)) },
              ]),
        ]}
      />
      {byReviews ? <p className="-mt-6 max-w-[70ch] text-sm text-muted">{t("market.noSales", { market })}</p> : null}

      <section aria-labelledby="leaders-h" className="flex flex-col gap-4">
        <h2 id="leaders-h" className="text-xl font-semibold">
          {t(byReviews ? "market.leadersReviews" : "market.leaders")}
        </h2>
        <ListingGrid items={items.slice(0, showAll ? 60 : 20)} t={t} locale={locale} />
      </section>

      <section aria-labelledby="niches-h" className="flex flex-col gap-4">
        <h2 id="niches-h" className="text-xl font-semibold">
          {t("market.niches")}
        </h2>
        <RankChart
          title={t(byReviews ? "market.rank.reviews" : "market.rank.title")}
          valueLabel={t(byReviews ? "market.reviewsLabel" : "market.revenueMonth")}
          {...(byReviews ? {} : { currency })}
          locale={locale}
          items={niches.slice(0, 15).map((n) => ({
            id: n.id,
            label: n.name,
            value: byReviews ? n.reviews : n.revenue,
            href: `/market/${n.id}`,
            details: [
              ...(byReviews ? [] : [[t("market.salesMonth"), formatNumber(n.sales, locale, 0)] as [string, string]]),
              [t("market.col.items"), String(n.items)],
              [t("market.col.top3"), n.top3Share === null ? k.nd : formatPercent(n.top3Share, locale)],
            ],
          }))}
        />
        <DataTable columns={columns} rows={showAll ? niches : niches.slice(0, 30)} rowKey={(n) => n.id} caption={t("market.niches")} />
        {niches.length > 30 ? (
          <Link href={showAll ? base : `${base}${base.includes("?") ? "&" : "?"}all=1`} className="text-base font-medium text-action-soft-ink underline-offset-2 hover:underline">
            {showAll ? t("market.showTop") : t("market.showAll", { n: niches.length })}
          </Link>
        ) : null}
        <p className="text-sm text-muted">{t(byReviews ? "market.legendReviews" : "market.legend")}</p>
      </section>

    </div>
  );
}
