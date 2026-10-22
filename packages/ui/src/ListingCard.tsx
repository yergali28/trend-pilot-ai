import type { ReactNode } from "react";

export interface ListingCardProps {
  href: string;
  title: string;
  imageUrl: string | null;
  /** Подпись вместо фото, когда провайдер его не дал. */
  noImageLabel: string;
  brand: string | null;
  price: ReactNode;
  facts: { label: string; value: ReactNode }[];
  rating: ReactNode;
  badge?: ReactNode;
}

/** Карточка товара рынка: фото, цена крупно, факты периода; вся карточка — ссылка на страницу товара. */
export function ListingCard({ href, title, imageUrl, noImageLabel, brand, price, facts, rating, badge }: ListingCardProps) {
  return (
    <a
      href={href}
      className="group flex flex-col overflow-hidden rounded-panel border border-line bg-surface outline-none transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-focus"
    >
      <div className="relative aspect-[3/4] bg-sunken">
        {/* Внешние фото площадки — обычный img, без оптимизатора Next. */}
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-subtle">{noImageLabel}</span>
        )}
        {badge ? <span className="absolute left-2 top-2">{badge}</span> : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="text-lg font-semibold tabular-nums text-ink">{price}</div>
        <h3 className="line-clamp-2 text-base text-ink group-hover:text-action-soft-ink">{title}</h3>
        {brand ? <p className="text-sm text-subtle">{brand}</p> : null}
        <div className="text-sm text-muted">{rating}</div>
        <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1 border-t border-line pt-2">
          {facts.map((f) => (
            <div key={f.label} className="flex flex-col">
              <dt className="text-xs text-subtle">{f.label}</dt>
              <dd className="text-sm font-semibold tabular-nums text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </a>
  );
}
