"use client";

import { useEffect, useState } from "react";

/** Закреплённая навигация по разделам: текущий раздел отмечен aria-current. */
export function SectionNav({ label, items }: { label: string; items: { id: string; title: string }[] }) {
  const [current, setCurrent] = useState(items[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setCurrent(visible.target.id);
      },
      { rootMargin: "-64px 0px -60% 0px" },
    );
    for (const { id } of items) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label={label} className="sticky top-0 z-20 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 py-2 text-sm sm:px-6 lg:flex-wrap lg:overflow-visible">
        {items.map(({ id, title }) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={current === id ? "location" : undefined}
            className={`shrink-0 rounded-control px-2.5 py-1.5 outline-none pointer-coarse:py-3 focus-visible:outline-2 focus-visible:outline-focus ${
              current === id ? "bg-action-soft font-medium text-action-soft-ink" : "text-muted hover:bg-sunken hover:text-ink"
            }`}
          >
            {title}
          </a>
        ))}
      </div>
    </nav>
  );
}
