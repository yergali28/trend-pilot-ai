import { ArrowLeftIcon, RankChart, formatNumber, formatPercent } from "@tp/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Kpis, ListingGrid, marketKit } from "../../../../components/market";
import { loadMarket } from "../../../../lib/market";
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/market" className="inline-flex items-center gap-1 text-sm font-medium text-action-soft-ink underline-offset-2 hover:underline">
          <ArrowLeftIcon className="size-3.5" />
          {t("market.back")}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{niche.name}</h1>
      </div>

      <Kpis
        items={[
          { label: t("market.revenueMonth"), value: k.money(niche.revenue) },
          { label: t("market.salesMonth"), value: k.count(niche.sales) },
          { label: t("market.col.medianPrice"), value: k.money(niche.medianPrice) },
          { label: t("market.col.top3"), value: niche.top3Share === null ? k.nd : formatPercent(niche.top3Share, locale) },
        ]}
      />

      <RankChart
        title={t("market.rank.items")}
        valueLabel={t("market.revenueMonth")}
        currency="RUB"
        locale={locale}
        items={its.slice(0, 10).flatMap((i) =>
          i.revenue === null
            ? []
            : [
                {
                  id: i.id,
                  label: i.title.length > 34 ? `${i.title.slice(0, 33)}…` : i.title,
                  value: i.revenue,
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
