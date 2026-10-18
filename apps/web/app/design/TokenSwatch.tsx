"use client";

import { PlugOffIcon } from "@tp/ui";
import { useEffect, useRef, useState } from "react";

// Относительная яркость и контраст по WCAG 2.x для показа на странице UI-kit.
function luminance(hex: string) {
  const raw = hex.replace("#", "");
  // Сборщик CSS может сократить #ffffff до #fff.
  const v = raw.length === 3 ? raw.replace(/./g, "$&$&") : raw;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(v.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

export interface TokenSwatchProps {
  label: string;
  token: string;
  /** Переменная заливки образца. */
  fill: string;
  /** Переменная текста на заливке: тогда показывается контраст. */
  ink?: string;
  /** Форма, которой статус отличается кроме цвета. */
  form?: "dashed" | "plug";
  contrastLabel: string;
}

/** Образец токена: заливка, hex в текущей теме и контраст текста на ней. */
export function TokenSwatch({ label, token, fill, ink, form, contrastLabel }: TokenSwatchProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [info, setInfo] = useState<{ hex: string; ratio?: string } | null>(null);

  useEffect(() => {
    const css = getComputedStyle(ref.current!);
    const hex = css.getPropertyValue(fill).trim();
    const inkHex = ink ? css.getPropertyValue(ink).trim() : "";
    setInfo({ hex, ...(inkHex ? { ratio: contrast(hex, inkHex).toFixed(1) } : {}) });
  }, [fill, ink]);

  return (
    <div className="flex items-center gap-3">
      <span
        ref={ref}
        className={`flex size-10 shrink-0 items-center justify-center rounded-control border text-sm font-semibold ${form === "dashed" ? "border-dashed border-nodata-line" : "border-line"}`}
        style={{ background: `var(${fill})`, color: ink ? `var(${ink})` : undefined }}
      >
        {form === "plug" ? <PlugOffIcon /> : ink ? "Aa" : null}
      </span>
      <span className="min-w-0">
        <span className="block text-base text-ink">{label}</span>
        <code className="block truncate text-sm text-subtle">{token}</code>
        {info ? (
          <code className="block text-sm text-subtle">
            {info.hex}
            {info.ratio ? ` · ${contrastLabel.replace("{ratio}", info.ratio)}` : null}
          </code>
        ) : null}
      </span>
    </div>
  );
}
