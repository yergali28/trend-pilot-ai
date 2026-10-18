import type { ReactNode } from "react";

export interface Fact {
  label: string;
  value: ReactNode;
}

export interface ProductCardProps {
  title: string;
  meta: ReactNode;
  badge: ReactNode;
  facts: Fact[];
  children?: ReactNode;
  whyLabel: string;
  why: ReactNode;
}

/** Карточка товара: факты с выравниванием по разряду, раскрытие «Почему так?» нативным details. */
export function ProductCard({ title, meta, badge, facts, children, whyLabel, why }: ProductCardProps) {
  return (
    <article className="flex flex-col gap-5 rounded-panel border border-line bg-surface p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <div className="mt-1 text-sm text-subtle">{meta}</div>
        </div>
        {badge}
      </header>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="flex flex-col gap-0.5">
            <dt className="text-sm text-subtle">{f.label}</dt>
            <dd className="text-md font-semibold tabular-nums text-ink">{f.value}</dd>
          </div>
        ))}
      </dl>
      {children}
      <details className="group border-t border-line pt-4">
        <summary className="cursor-pointer list-none text-base font-medium text-action-soft-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
          {whyLabel}
        </summary>
        <div className="mt-3 text-base text-muted">{why}</div>
      </details>
    </article>
  );
}
