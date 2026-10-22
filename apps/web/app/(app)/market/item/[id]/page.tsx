import { ArrowLeftIcon, StatusTag, TrendChart } from "@tp/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Kpis, marketKit } from "../../../../../components/market";
import { loadMarket, periodDays } from "../../../../../lib/market";
import { prefs } from "../../../../../lib/prefs";
import { requireUser } from "../../../../../lib/session";

export default async function MarketItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await requireUser(`/market/item/${id}`);
  const { t, locale } = await prefs();
  const { items, niches } = await loadMarket(db);
  const item = items.find((i) => i.id === id);
  if (!item) notFound();
  const niche = niches.find((n) => n.id === item.categoryId);
  const k = marketKit(t, locale);
  const currency = item.currency ?? "RUB";
  const date = (d: string) => new Date(d).toLocaleDateString(locale === "en" ? "en-US" : "ru-RU");
  const daily = item.daily ?? {};
  const days = Math.max(daily.sales?.length ?? 0, daily.price?.length ?? 0);
  const unitQuery = "sell=wildberries&buy=all&country=RU&cur=RUB&x=3&metric=priceToCost&m=wildberries";

  return (
    <div className="flex flex-col gap-8">
      <Link href={niche ? `/market/${niche.id}` : "/market"} className="inline-flex items-center gap-1 text-sm font-medium text-action-soft-ink underline-offset-2 hover:underline">
        <ArrowLeftIcon className="size-3.5" />
        {niche ? niche.name : t("market.back")}
      </Link>

      <div className="grid gap-6 md:grid-cols-[minmax(0,280px)_1fr]">
        <div className="relative aspect-[3/4] overflow-hidden rounded-panel border border-line bg-sunken">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="size-full object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-subtle">{t("market.noImage")}</span>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{item.title}</h1>
              <p className="mt-1 text-base text-muted">
                {[item.brand, item.seller, `${t("market.article")} ${item.externalId}`].filter(Boolean).join(" · ")}
              </p>
            </div>
            {item.synthetic ? <StatusTag tone="info">{t("market.synthetic")}</StatusTag> : null}
          </div>
          <div className="text-2xl font-semibold tabular-nums">{k.money(item.price, currency)}</div>
          <div className="text-base text-muted">{k.rating(item.rating, item.reviews)}</div>
          <Kpis
            items={[
              { label: t("market.salesMonth"), value: k.count(item.sales) },
              { label: t("market.revenueMonth"), value: k.money(item.revenue, currency) },
              { label: t("market.stock"), value: k.count(item.stock) },
              { label: t("market.reviewsLabel"), value: k.count(item.reviews) },
            ]}
          />
          <p className="text-sm text-muted">
            {t("market.provenance", { source: t(`market.source.${item.sourceId === "mpstats" ? "mpstats" : "other"}`), from: date(item.periodStart), to: date(item.periodEnd), fetched: date(item.fetchedAt) })}
          </p>
          {item.url ? (
            <a href={item.url} target="_blank" rel="noreferrer" className="text-base font-medium text-action-soft-ink underline-offset-2 hover:underline">
              {t("market.openWb")}
            </a>
          ) : null}
        </div>
      </div>

      {days > 1 ? (
        <TrendChart
          title={t("market.trend.title")}
          dates={periodDays(item.periodStart, days)}
          sales={daily.sales ?? []}
          prices={daily.price ?? []}
          salesLabel={t("market.trend.sales")}
          priceLabel={t("market.trend.price")}
          currency={currency}
          locale={locale}
        />
      ) : null}

      <section aria-labelledby="unit-h" className="flex flex-col gap-2 rounded-panel border border-line bg-surface p-5">
        <h2 id="unit-h" className="text-lg font-semibold">
          {t("market.unit.title")}
        </h2>
        {item.sourceProductId ? (
          <>
            <p className="text-base text-muted">{t("market.unit.matched")}</p>
            <Link href={`/products/${item.sourceProductId}?${unitQuery}`} className="text-base font-medium text-action-soft-ink underline-offset-2 hover:underline">
              {t("market.unit.open")}
            </Link>
          </>
        ) : (
          <p className="max-w-[70ch] text-base text-muted">{t("market.unit.none")}</p>
        )}
      </section>
    </div>
  );
}
