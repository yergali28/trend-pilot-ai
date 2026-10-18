"use client";

import { useState } from "react";
import { CheckIcon, PlugOffIcon } from "./icons";

export interface MarketplaceOption {
  id: string;
  label: string;
  active: boolean;
  /** Почему площадка недоступна (для неактивных). */
  reason?: string;
}

export interface MarketplacePickerProps {
  legend: string;
  allLabel: string;
  /** Шаблон из i18n с подстановками {selected} и {available}. */
  summary: string;
  options: MarketplaceOption[];
}

/**
 * Мультивыбор площадок с режимом «Все»: «Все» включает только активные источники.
 * Неактивная площадка видна серой с причиной и не выбирается.
 */
export function MarketplacePicker({ legend, allLabel, summary, options }: MarketplacePickerProps) {
  const activeIds = options.filter((o) => o.active).map((o) => o.id);
  const [all, setAll] = useState(true);
  const [picked, setPicked] = useState<Set<string>>(new Set(activeIds));
  const selected = all ? new Set(activeIds) : picked;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
    setAll(next.size === activeIds.length);
  };

  const box = "flex size-4 shrink-0 items-center justify-center rounded-[4px] border";
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        <label className={`flex h-9 pointer-coarse:h-11 cursor-pointer items-center gap-2 rounded-control border px-3 text-base has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${all ? "border-action bg-action-soft text-action-soft-ink" : "border-line-strong bg-surface text-ink"}`}>
          <input
            type="checkbox"
            className="sr-only"
            checked={all}
            onChange={() => {
              setAll(!all);
              setPicked(new Set(all ? [] : activeIds));
            }}
          />
          <span className={`${box} ${all ? "border-action bg-action text-on-action" : "border-line-strong"}`}>{all ? <CheckIcon className="size-3" /> : null}</span>
          {allLabel}
        </label>
        {options.map((o) => {
          const on = o.active && selected.has(o.id);
          return (
            <label
              key={o.id}
              className={`flex h-9 pointer-coarse:h-11 items-center gap-2 rounded-control border px-3 text-base has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                !o.active ? "cursor-not-allowed border-dashed border-line-strong bg-offline-soft text-offline" : on ? "cursor-pointer border-action bg-action-soft text-action-soft-ink" : "cursor-pointer border-line-strong bg-surface text-ink"
              }`}
            >
              <input type="checkbox" className="sr-only" checked={on} disabled={!o.active} onChange={() => toggle(o.id)} aria-describedby={o.reason ? `${o.id}-reason` : undefined} />
              {o.active ? (
                <span className={`${box} ${on ? "border-action bg-action text-on-action" : "border-line-strong"}`}>{on ? <CheckIcon className="size-3" /> : null}</span>
              ) : (
                <PlugOffIcon />
              )}
              {o.label}
              {o.reason ? (
                <span id={`${o.id}-reason`} className="text-sm">
                  · {o.reason}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      <p className="text-sm text-subtle" aria-live="polite">
        {summary.replace("{selected}", String(selected.size)).replace("{available}", String(activeIds.length))}
      </p>
    </fieldset>
  );
}
