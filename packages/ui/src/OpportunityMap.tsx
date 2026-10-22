import { formatNumber, type Locale } from "./format";

export interface OpportunityPoint {
  id: string;
  label: string;
  /** Продаж в месяц. */
  x: number;
  /** Метрика подбора (кратность или ROI). */
  y: number;
  /** Вес точки, например число подходящих товаров категории. */
  weight?: number;
  href: string;
}

export interface OpportunityMapProps {
  points: OpportunityPoint[];
  /** Порог метрики из параметров подбора. */
  target: number;
  title: string;
  xLabel: string;
  yLabel: string;
  /** Подпись зоны «продаётся выше медианы и метрика не ниже порога». */
  hotLabel: string;
  formatY: (v: number) => string;
  pointTitle: (p: OpportunityPoint) => string;
  locale: Locale;
  /** Сколько лучших точек зоны подписать на графике. */
  labelTop?: number;
}

const W = 800;
const H = 380;
const PAD = { l: 56, r: 24, t: 20, b: 44 };

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

/**
 * Карта возможностей: спрос (продаж в месяц, логарифмическая шкала) против метрики подбора.
 * Правый верхний угол — продаётся выше медианы выборки и метрика не ниже порога. Таблица рядом остаётся
 * полным текстовым эквивалентом: график — обзор, точки — ссылки.
 */
export function OpportunityMap({
  points,
  target,
  title,
  xLabel,
  yLabel,
  hotLabel,
  formatY,
  pointTitle,
  locale,
  labelTop = 4,
}: OpportunityMapProps) {
  const pts = points.filter((p) => p.x > 0 && Number.isFinite(p.y));
  if (pts.length < 2) return null;

  const xs = pts.map((p) => p.x);
  const [x0, x1] = [
    Math.log10(Math.min(...xs) * 0.8),
    Math.log10(Math.max(...xs) * 1.25),
  ];
  const yMax = Math.max(...pts.map((p) => p.y), target) * 1.12;
  // Ось Y от ближайшего целого ниже минимума (с порогом), а не от нуля: точки не жмутся к верху.
  const yMin = Math.max(
    0,
    Math.floor(Math.min(target, ...pts.map((p) => p.y)) - 1),
  );
  const sx = (v: number) =>
    PAD.l + ((Math.log10(v) - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const sy = (v: number) =>
    H - PAD.b - ((v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);
  const split = median(xs);
  const hot = (p: OpportunityPoint) => p.x >= split && p.y >= target;
  const maxW = Math.max(...pts.map((p) => p.weight ?? 1));
  const r = (p: OpportunityPoint) =>
    p.weight === undefined ? 6 : 5 + 9 * Math.sqrt(p.weight / maxW);

  // Деления по степеням 10 и их половинам внутри диапазона.
  const ticks = [
    1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000,
  ].filter((v) => Math.log10(v) >= x0 && Math.log10(v) <= x1);
  const yStep = yMax > 20 ? 10 : yMax > 8 ? 2 : 1;
  const yTicks = Array.from(
    { length: Math.floor(yMax / yStep) + 1 },
    (_, i) => i * yStep,
  ).filter((v) => v >= yMin);
  // Подписи лучших точек зоны; подпись, которая налезла бы на уже поставленную, пропускается.
  const placed: { x: number; y: number }[] = [];
  const labelled = new Set<string>();
  for (const p of pts
    .filter(hot)
    .sort((a, b) => b.y * Math.log10(b.x) - a.y * Math.log10(a.x))) {
    if (labelled.size >= labelTop) break;
    const at = { x: sx(p.x), y: sy(p.y) };
    if (
      placed.some(
        (q) => Math.abs(q.y - at.y) < 18 && Math.abs(q.x - at.x) < 200,
      )
    )
      continue;
    placed.push(at);
    labelled.add(p.id);
  }

  return (
    <figure className="flex flex-col gap-2 rounded-panel border border-line bg-surface p-4">
      <figcaption className="text-sm font-medium text-muted">
        {title}
      </figcaption>
      {/* На узком экране график прокручивается внутри карточки, чтобы подписи не мельчали. */}
      <div className="-mx-4 overflow-x-auto px-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[640px]"
          role="img"
          aria-label={title}
        >
          <rect
            x={sx(split)}
            y={PAD.t}
            width={W - PAD.r - sx(split)}
            height={sy(target) - PAD.t}
            fill="var(--tp-x2-bg)"
            opacity={0.55}
          />
          <text
            x={W - PAD.r - 8}
            y={sy(target) - 10}
            textAnchor="end"
            className="fill-[var(--tp-x2-text)] text-[13px] font-semibold"
          >
            {hotLabel}
          </text>

          {yTicks.map((v) => (
            <g key={`y${v}`}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={sy(v)}
                y2={sy(v)}
                stroke="var(--tp-line)"
              />
              <text
                x={PAD.l - 8}
                y={sy(v) + 4}
                textAnchor="end"
                className="fill-[var(--tp-text-subtle)] text-[12px] tabular-nums"
              >
                {formatY(v)}
              </text>
            </g>
          ))}
          {ticks.map((v) => (
            <g key={`x${v}`}>
              <line
                x1={sx(v)}
                x2={sx(v)}
                y1={PAD.t}
                y2={H - PAD.b}
                stroke="var(--tp-line)"
                strokeDasharray="2 4"
              />
              <text
                x={sx(v)}
                y={H - PAD.b + 18}
                textAnchor="middle"
                className="fill-[var(--tp-text-subtle)] text-[12px] tabular-nums"
              >
                {formatNumber(v, locale, 0)}
              </text>
            </g>
          ))}
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={sy(target)}
            y2={sy(target)}
            stroke="var(--tp-chart-line)"
            strokeDasharray="6 4"
          />
          <line
            x1={sx(split)}
            x2={sx(split)}
            y1={PAD.t}
            y2={H - PAD.b}
            stroke="var(--tp-chart-line)"
            strokeDasharray="6 4"
          />
          <text
            x={(PAD.l + W - PAD.r) / 2}
            y={H - 6}
            textAnchor="middle"
            className="fill-[var(--tp-text-muted)] text-[12px]"
          >
            {xLabel}
          </text>
          <text
            transform={`translate(14 ${(PAD.t + H - PAD.b) / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-[var(--tp-text-muted)] text-[12px]"
          >
            {yLabel}
          </text>

          {[...pts]
            .sort((a, b) => Number(hot(a)) - Number(hot(b)))
            .map((p) => (
              <a
                key={p.id}
                href={p.href}
                className="outline-none [&:focus-visible>circle]:stroke-[var(--tp-focus)] [&:focus-visible>circle]:stroke-[3px]"
              >
                <title>{pointTitle(p)}</title>
                <circle
                  cx={sx(p.x)}
                  cy={sy(p.y)}
                  r={r(p)}
                  fill={
                    hot(p)
                      ? "var(--tp-chart-result)"
                      : p.y >= target
                        ? "var(--tp-x3-bg)"
                        : "var(--tp-chart-decrease)"
                  }
                  stroke="var(--tp-surface)"
                  strokeWidth={1.5}
                />
                {labelled.has(p.id) ? (
                  <text
                    x={sx(p.x) - r(p) - 4}
                    y={sy(p.y) + 4}
                    textAnchor="end"
                    className="fill-[var(--tp-text)] text-[12px] font-medium"
                    paintOrder="stroke"
                    stroke="var(--tp-surface)"
                    strokeWidth={4}
                  >
                    {p.label.length > 28 ? `${p.label.slice(0, 27)}…` : p.label}
                  </text>
                ) : null}
              </a>
            ))}
        </svg>
      </div>
    </figure>
  );
}
