import { ArrowLeftIcon, RankChart, formatNumber, formatPercent } from "@tp/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Kpis, ListingGrid, marketKit } from "../../../../components/market";
import { MARKET_NAMES, loadMarket } from "../../../../lib/market";
import { prefs } from "../../../../lib/prefs";
import { requireUser } from "../../../../lib/session";

export default async function NichePage({ params }: { params: Promise<{ niche: string }> }) {
  const { niche: id } = await params;
  const { db } = await requireUser(`/market/${id}`);
  const { t, locale } = await prefs();
  const { items, niches } = await loadMarket(db);
  const niche = niches.find((n) => n.id === id);
  if (!niche) notFound();
  const its = items.filter((i) => i.categoryId === id);
  const k = marketKit(t, locale);
  const market = MARKET_NAMES[niche.marketplace as keyof typeof MARKET_NAMES] ?? niche.marketplace;
  const currency = its[0]?.currency ?? "RUB";
  const money = (v: number | null) => k.money(v, currency);
  // Без выручки (Kaspi) мера — число отзывов.
  const byReviews = its.every((i) => i.revenue === null);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={niche.marketplace === "wildberries" ? "/market" : `/market?mp=${niche.marketplace}`} className="inline-flex items-center gap-1 text-sm font-medium text-action-soft-ink underline-offset-2 hover:underline">
          <ArrowLeftIcon className="size-3.5" />
          {t("market.back", { market })}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{niche.name}</h1>
      </div>

      <Kpis
        items={[
          byReviews ? { label: t("market.reviewsLabel"), value: k.count(niche.reviews) } : { label: t("market.revenueMonth"), value: money(niche.revenue) },
          { label: t("market.salesMonth"), value: k.count(byReviews ? null : niche.sales) },
          { label: t("market.col.medianPrice"), value: money(niche.medianPrice) },
          { label: t("market.col.top3"), value: niche.top3Share === null ? k.nd : formatPercent(niche.top3Share, locale) },
        ]}
      />

      <RankChart
        title={t(byReviews ? "market.rank.itemsReviews" : "market.rank.items")}
        valueLabel={t(byReviews ? "market.reviewsLabel" : "market.revenueMonth")}
        {...(byReviews ? {} : { currency })}
        locale={locale}
        items={its.slice(0, 10).flatMap((i) =>
          (byReviews ? i.reviews : i.revenue) === null
            ? []
            : [
                {
                  id: i.id,
                  label: i.title.length > 34 ? `${i.title.slice(0, 33)}…` : i.title,
                  value: (byReviews ? i.reviews : i.revenue)!,
                  href: `/market/item/${i.id}`,
                  details: [[t("market.salesMonth"), i.sales === null ? k.nd : formatNumber(i.sales, locale, 0)]] as [string, string][],
                },
              ],
        )}
      />

      <section aria-labelledby="items-h" className="flex flex-col gap-4">
        <h2 id="items-h" className="text-xl font-semibold">
          {t("market.items", { n: its.length })}
        </h2>
        <ListingGrid items={its} t={t} locale={locale} />
      </section>
    </div>
  );
}
