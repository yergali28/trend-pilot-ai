"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Ссылки навигации с активным состоянием и aria-current по текущему пути. */
export function NavLinks({ label, links, exactRoot = true, className = "" }: { label: string; links: { href: string; text: string }[]; exactRoot?: boolean; className?: string }) {
  const path = usePathname();
  const active = (href: string) => (href === "/" || (exactRoot && href === links[0]?.href) ? path === href : path === href || path.startsWith(`${href}/`));
  return (
    <nav aria-label={label} className={`flex flex-wrap items-center gap-1 ${className}`}>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={active(l.href) ? "page" : undefined}
          className={`rounded-control px-2.5 py-1.5 text-base outline-none pointer-coarse:py-3 focus-visible:outline-2 focus-visible:outline-focus ${active(l.href) ? "bg-action-soft font-medium text-action-soft-ink" : "text-muted hover:bg-sunken hover:text-ink"}`}
        >
          {l.text}
        </Link>
      ))}
    </nav>
  );
}
