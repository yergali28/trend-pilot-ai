import type { SVGProps } from "react";

// Авторские иконки 16×16, обводка 1.5, наследуют цвет текста.
type P = SVGProps<SVGSVGElement>;
const base = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const CheckIcon = (p: P) => (
  <svg {...base} {...p}><path d="M3.5 8.5l3 3 6-7" /></svg>
);
export const MinusIcon = (p: P) => (
  <svg {...base} {...p}><path d="M4 8h8" /></svg>
);
export const ChevronDownIcon = (p: P) => (
  <svg {...base} {...p}><path d="M4.5 6.5L8 10l3.5-3.5" /></svg>
);
export const SortIcon = (p: P) => (
  <svg {...base} {...p}><path d="M5.5 6L8 3.5 10.5 6M5.5 10L8 12.5 10.5 10" /></svg>
);
export const InfoIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="8" cy="8" r="6" /><path d="M8 7.25v3.5M8 5.25v.01" /></svg>
);
export const AlertIcon = (p: P) => (
  <svg {...base} {...p}><path d="M8 2.5l6 10.5H2L8 2.5z" /><path d="M8 6.5v3M8 11.25v.01" /></svg>
);
export const RiskIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="8" cy="8" r="6" /><path d="M5.75 5.75l4.5 4.5M10.25 5.75l-4.5 4.5" /></svg>
);
export const PlugOffIcon = (p: P) => (
  <svg {...base} {...p}><path d="M6 2.5v2.5M10 2.5v2.5M4.5 5h7v2.5a3.5 3.5 0 01-7 0V5zM8 11v2.5M2.5 2.5l11 11" /></svg>
);
export const DotIcon = (p: P) => (
  <svg {...base} {...p} stroke="none" fill="currentColor"><circle cx="8" cy="8" r="4" /></svg>
);
export const RingIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="8" cy="8" r="3.5" strokeDasharray="2 1.6" /></svg>
);
export const ArrowLeftIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12.5 8h-9M7 4.5L3.5 8 7 11.5" /></svg>
);
