import { ListingCard, NoData, StatusTag, formatMoney, formatNumber, type Locale } from "@tp/ui";
import type { MessageKey } from "../lib/i18n";
import { demoEnabled } from "../lib/catalog";
import type { MarketItem } from "../lib/market";

type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** Форматтеры раздела «Рынок»: деньги, количества и рейтинг с честным «нет данных». */
export function marketKit(t: T, locale: Locale) {
  const nd = t("value.nodata");
  const money = (v: number | null, currency = "RUB") => (v === null ? <NoData label={nd} /> : formatMoney(v, currency, locale));
  const count = (v: number | null) => (v === null ? <NoData label={nd} /> : formatNumber(v, locale, 0));
  const rating = (r: number | null, reviews: number | null) =>
    r === null ? (
      <NoData label={t("market.noRating")} />
    ) : (
      <span className="inline-flex items-center gap-1 tabular-nums">
        <span aria-hidden className="text-[var(--tp-warning-line)]">★</span>
        <span className="font-medium text-ink">{formatNumber(r, locale, 1)}</span>
        {reviews !== null ? <span>· {t("market.reviews", { n: formatNumber(reviews, locale, 0) })}</span> : null}
      </span>
    );
  return { money, count, rating, nd };
}

/** Сетка карточек товаров рынка. В демо-режиме пометка в шапке; на карточке — только синтетика вне демо-режима. */
export function ListingGrid({ items, t, locale }: { items: MarketItem[]; t: T; locale: Locale }) {
  const k = marketKit(t, locale);
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((i) => (
        <li key={i.id} className="flex">
          <ListingCard
            href={`/market/item/${i.id}`}
            title={i.title}
            imageUrl={i.imageUrl}
            noImageLabel={t("market.noImage")}
            brand={i.brand}
            price={k.money(i.price, i.currency ?? "RUB")}
            rating={k.rating(i.rating, i.reviews)}
            facts={[
              { label: t("market.salesMonth"), value: k.count(i.sales) },
              { label: t("market.revenueMonth"), value: k.money(i.revenue, i.currency ?? "RUB") },
            ]}
            {...(i.synthetic && !demoEnabled() ? { badge: <StatusTag tone="info">{t("market.synthetic")}</StatusTag> } : {})}
          />
        </li>
      ))}
    </ul>
  );
}

/** Ряд ключевых цифр. */
export function Kpis({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className="flex flex-col gap-1 rounded-panel border border-line bg-surface px-4 py-3">
          <dt className="text-sm text-subtle">{i.label}</dt>
          <dd className="text-md font-semibold tabular-nums text-ink [overflow-wrap:anywhere] sm:text-xl">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
