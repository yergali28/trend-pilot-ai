---
target: /design UI-kit
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/yergalizhakhan/WebProjects/trend-pilot-ai/apps/web/app/design/page.tsx"
target_fingerprint: "sha256:4d928abd46e1563ab9588f4db5070b26d51ec323db8dc3678eca1622daf01b14"
target_path: /Users/yergalizhakhan/WebProjects/trend-pilot-ai/apps/web/app/design/page.tsx
timestamp: 2026-10-18T12-24-52Z
slug: app-design-page-tsx
closed: true
---
Method: dual-agent (A: design review subagent · B: detector subagent)

## Design Health Score: 27/40 (Acceptable)
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Section nav has no current-section state, not sticky on a 4200px page |
| 2 | Match System / Real World | 3 | "Landed cost", "waterfall", "ROI" untranslated for novices |
| 3 | User Control and Freedom | 3 | Theme/lang as reversible URL links |
| 4 | Consistency and Standards | 3 | Action blue used on spacing bars and sparklines; ≈ shown in card but not table |
| 5 | Error Prevention | 2 | Loss row (−40 ₸, 1,3x) looks neutral; disabled export without reason |
| 6 | Recognition Rather Than Recall | 3 | Swatches lack hex and contrast; button states uncaptioned |
| 7 | Flexibility and Efficiency | 2 | Only anchor links |
| 8 | Aesthetic and Minimalist Design | 3 | Clean; type specimen repeats one line for xl and lg |
| 9 | Error Recovery | 3 | Inline field error, empty state with action |
| 10 | Help and Documentation | 2 | ≈ and «нет данных» have no visible explanation |

## Design Specificity
Product-specific through content (multiple scale, honest no-data, coverage, source statuses with reasons, waterfall with scenarios); visual skin is Stripe-lite by contract. Detector: 0 anti-patterns in source and live (light, dark, kk); 1 advisory em-dash-overuse = false positive (token names `--tp-*`).

## Priority Issues
- [P1] Specimens not labelled for approval (button variants/states, no hover/focus specimen) → clarify
- [P1] Palette not approvable: no hex/contrast; three near-identical greys; white ok swatch → colorize
- [P2] Risk state missing in table: negative profit row neutral → polish
- [P2] Action blue used without meaning (spacing bars, sparklines) → quieter
- [P3] Long-page navigation weak (wraps, not sticky, no current state) → layout

## Persona red flags
Owner: font change Inter→Golos not recorded; no hex to forward. Novice: jargon, ≈ without legend. Power user: no sticky first column on mobile table, sparkline without value.

## Minor
Card leaves dead right column; tabular block lacks negative/no-data; tax 0 ₸ draws a stray tick; demo marker missing on table.
